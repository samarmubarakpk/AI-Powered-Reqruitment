// services/videoAnalysisService.js
const axios = require('axios');
const { BlobServiceClient } = require('@azure/storage-blob');
const { SpeechConfig, AudioConfig, SpeechRecognizer } = require('microsoft-cognitiveservices-speech-sdk');
const { TextAnalyticsClient, AzureKeyCredential } = require("@azure/ai-text-analytics");
const { OpenAIClient } = require("@azure/openai");

// // Load environment variables
// const VIDEO_INDEXER_KEY = process.env.AZURE_VIDEO_INDEXER_KEY;
// const VIDEO_INDEXER_ACCOUNT_ID = process.env.AZURE_VIDEO_INDEXER_ACCOUNT_ID;
// const VIDEO_INDEXER_LOCATION = process.env.AZURE_VIDEO_INDEXER_LOCATION || 'trial';
// const VIDEO_INDEXER_API_URL = `https://api.videoindexer.ai`;

// TEMPORARY: Hardcoded values for testing
const VIDEO_INDEXER_KEY = "fb3c415154264c5ea1d35be2e1d4d6e7"; // Your primary key
const VIDEO_INDEXER_ACCOUNT_ID = "d9e57bf9-8f34-451f-9f84-027b9ee3ebeb"; // Your account ID
const VIDEO_INDEXER_LOCATION = "trial";
const VIDEO_INDEXER_API_URL = "https://api.videoindexer.ai";


const SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const SPEECH_REGION = process.env.AZURE_SPEECH_REGION || 'eastus';

const TEXT_ANALYTICS_KEY = process.env.AZURE_TEXT_ANALYTICS_KEY;
const TEXT_ANALYTICS_ENDPOINT = process.env.AZURE_TEXT_ANALYTICS_ENDPOINT;

const OPENAI_KEY = process.env.AZURE_OPENAI_API_KEY;
const OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

const STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

// Initialize Azure Blob Storage client
const blobServiceClient = BlobServiceClient.fromConnectionString(STORAGE_CONNECTION_STRING);
const interviewRecordingsContainerName = 'interview-recordings';

// Initialize Text Analytics client
const textAnalyticsClient = new TextAnalyticsClient(
  TEXT_ANALYTICS_ENDPOINT,
  new AzureKeyCredential(TEXT_ANALYTICS_KEY)
);

// Initialize OpenAI client
const { OpenAI } = require("openai");

// Initialize OpenAI client with Azure configuration - UPDATED CONFIGURATION
const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { "api-version": "2024-02-01" },  // Update to latest API version
  defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY }
});

/**
 * Get an access token for Video Indexer API
 */
async function getVideoIndexerAccessToken() {
    try {
      // Debug logs to verify environment variables
      console.log("Video Indexer Account ID:", VIDEO_INDEXER_ACCOUNT_ID);
      console.log("Video Indexer Key (exists):", !!VIDEO_INDEXER_KEY);
      console.log("Video Indexer Location:", VIDEO_INDEXER_LOCATION);
      
      // Use the exact URL structure from the documentation
      const url = `${VIDEO_INDEXER_API_URL}/auth/${VIDEO_INDEXER_LOCATION}/Accounts/${VIDEO_INDEXER_ACCOUNT_ID}/AccessToken?allowEdit=true`;
      console.log("Making request to:", url);
      
      const response = await axios.get(url, {
        headers: {
          'Ocp-Apim-Subscription-Key': VIDEO_INDEXER_KEY
        }
      });
      
      console.log("Successfully obtained access token");
      return response.data;
    } catch (error) {
      console.error('Error getting Video Indexer access token:', error.message);
      
      // Enhanced error logging
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
        console.error('Headers:', error.response.headers);
      } else if (error.request) {
        console.error('Request made but no response received');
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      throw error;
    }
  }
  

/**
 * Upload and analyze video with Azure Video Indexer
 */
async function analyzeVideoWithAzure(videoUrl, interviewId, questionIndex) {
  try {
    console.log(`[VideoAnalysisService] Analyzing video at ${videoUrl}`);
    
    // Get access token
    const accessToken = await getVideoIndexerAccessToken();
    
    // Upload video to Video Indexer
    const uploadResponse = await axios.post(
      `${VIDEO_INDEXER_API_URL}/${VIDEO_INDEXER_ACCOUNT_ID}/Videos`,
      null,
      {
        params: {
          name: `interview-${interviewId}-q${questionIndex}`,
          description: `Interview ${interviewId}, Question ${questionIndex}`,
          privacy: 'Private',
          videoUrl: videoUrl,
          streamingPreset: 'Default',
          indexingPreset: 'DefaultWithFace'
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    const videoId = uploadResponse.data.id;
    console.log(`[VideoAnalysisService] Video uploaded with ID: ${videoId}`);
    
    // Wait for indexing to complete - poll the indexing status
    let isIndexed = false;
    let indexingState = '';
    let attempts = 0;
    const maxAttempts = 30; // Maximum 5 minutes (10 seconds x 30)
    
    while (!isIndexed && attempts < maxAttempts) {
      attempts++;
      
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds between checks
      
      const stateResponse = await axios.get(
        `${VIDEO_INDEXER_API_URL}/${VIDEO_INDEXER_ACCOUNT_ID}/Videos/${videoId}/Index`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      indexingState = stateResponse.data.state;
      isIndexed = indexingState === 'Processed';
      console.log(`[VideoAnalysisService] Indexing state: ${indexingState}, Attempt: ${attempts}/${maxAttempts}`);
    }
    
    if (!isIndexed) {
      throw new Error(`Video indexing did not complete within the expected time. Current state: ${indexingState}`);
    }
    
    // Get the insights
    const insightsResponse = await axios.get(
      `${VIDEO_INDEXER_API_URL}/${VIDEO_INDEXER_ACCOUNT_ID}/Videos/${videoId}/Index`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    const insights = insightsResponse.data;
    
    // Extract relevant metrics
    let confidenceScore = 0.7; // Default value
    let nervousnessScore = 0.3; // Default value
    let eyeContactScore = 0.75; // Default value
    let postureScore = 0.8; // Default value
    let gesturesScore = 0.65; // Default value
    let facialExpressionsScore = 0.7; // Default value
    
    // Process face detection insights
    if (insights.videos && insights.videos[0] && insights.videos[0].faces) {
      const faces = insights.videos[0].faces;
      if (faces.length > 0) {
        // Use primary face
        const primaryFace = faces[0];
        
        // Calculate confidence from emotional stability
        const emotions = primaryFace.emotions || [];
        const neutralAmount = emotions.find(e => e.type === 'Neutral')?.seenDurationRatio || 0.5;
        const fearAmount = emotions.find(e => e.type === 'Fear')?.seenDurationRatio || 0;
        const angerAmount = emotions.find(e => e.type === 'Anger')?.seenDurationRatio || 0;
        
        confidenceScore = Math.min(1, Math.max(0, neutralAmount - (fearAmount + angerAmount)));
        nervousnessScore = Math.min(1, Math.max(0, fearAmount * 2 + angerAmount));
        
        // Facial expressions score based on emotional variety
        facialExpressionsScore = Math.min(1, emotions.reduce((sum, emotion) => sum + emotion.seenDurationRatio, 0) / 2);
      }
    }
    
    // Process shot insights for eye contact and posture
    if (insights.videos && insights.videos[0] && insights.videos[0].insights && insights.videos[0].insights.faces) {
      const faceInsights = insights.videos[0].insights.faces;
      if (faceInsights.length > 0) {
        // Calculate eye contact based on looking at camera time
        eyeContactScore = faceInsights[0].seenDurationRatio || 0.75;
        
        // Posture can be estimated by face steadiness
        postureScore = 1 - (faceInsights[0].seenMaxInstability || 0.2);
      }
    }
    
    // Process visual content for gestures
    if (insights.videos && insights.videos[0] && insights.videos[0].insights && insights.videos[0].insights.frames) {
      const frames = insights.videos[0].insights.frames;
      
      // Count frames with significant motion as potential gestures
      const motionFrames = frames.filter(frame => frame.isKeyFrame).length;
      const totalKeyFrames = Math.max(1, frames.filter(frame => frame.isKeyFrame).length);
      
      gesturesScore = Math.min(1, Math.max(0.3, motionFrames / totalKeyFrames));
    }
    
    // Optionally store the video ID for future reference
    return {
      videoId,
      confidenceScore,
      nervousnessScore,
      eyeContactScore,
      postureScore,
      gesturesScore,
      facialExpressionsScore,
      insights: {
        summaryInsights: insights.summarizedInsights,
        transcript: insights.videos?.[0]?.insights?.transcript || []
      }
    };
  } catch (error) {
    console.error('Error analyzing video with Azure Video Indexer:', error);
    
    // Provide fallback metrics in case of failure
    return {
      confidenceScore: 0.7,
      nervousnessScore: 0.3,
      eyeContactScore: 0.75,
      postureScore: 0.8,
      gesturesScore: 0.65,
      facialExpressionsScore: 0.7,
      error: error.message,
      insights: {
        transcript: []
      }
    };
  }
}

/**
 * Transcribe audio content from a video file
 */
async function transcribeAudioFromVideo(audioUrl) {
    try {
      console.log(`[VideoAnalysisService] Transcribing audio from: ${audioUrl}`);
      
      // For WebM files, we can't use the Speech SDK directly
      // Instead, we'll use a simplified approach for now
      console.log("[VideoAnalysisService] WebM format detected, using alternative transcription approach");
      
      // If you have an OpenAI deployment with Whisper model, you can use it here
      // Otherwise, return a placeholder message
      return "Video playback is available. Please watch the recording to hear the candidate's response.";
    } catch (error) {
      console.error('Error transcribing audio:', error);
      return "Transcription unavailable.";
    }
  }

/**
 * Analyze text for sentiment, relevance, coherence, etc.
 */
async function analyzeTextContent(transcript, question) {
  try {
    console.log(`[VideoAnalysisService] Analyzing text content`);
    console.log(`Question: ${question.substring(0, 100)}...`);
    console.log(`Transcript: ${transcript.substring(0, 100)}...`);
    
    // Sentiment analysis
    const sentimentResults = await textAnalyticsClient.analyzeSentiment([transcript]);
    const sentimentResult = sentimentResults[0];
    
    // Get a relevance score using OpenAI
    const promptTemplate = `
I need to evaluate how well a candidate's answer addresses a job interview question.

Interview Question: "${question}"

Candidate's Answer: "${transcript}"

Rate the answer on a scale of 0-10 on the following criteria:
1. Relevance: How directly does the answer address the question?
2. Completeness: Does the answer fully address all aspects of the question?
3. Coherence: Is the answer well-organized and logically structured?
4. Technical Accuracy: Does the answer demonstrate appropriate technical knowledge?

Return your evaluation as a JSON object with these scores and a brief explanation for each criterion.
    `;
    
    const openAIResponse = await openaiClient.getChatCompletions(
      OPENAI_DEPLOYMENT,
      [
        { role: "system", content: "You are an AI assistant that specializes in evaluating interview responses." },
        { role: "user", content: promptTemplate }
      ],
      {
        temperature: 0.3,
        maxTokens: 800
      }
    );
    
    let contentAnalysis = {};
    try {
      // Extract the JSON from the response
      const responseText = openAIResponse.choices[0].message.content;
      contentAnalysis = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing OpenAI JSON response:', parseError);
      // Provide fallback values
      contentAnalysis = {
        relevance: 7,
        completeness: 6,
        coherence: 7,
        technicalAccuracy: 6,
        explanations: {
          relevance: "The answer addresses the main points of the question.",
          completeness: "The answer covers most aspects but might miss some details.",
          coherence: "The answer is structured logically.",
          technicalAccuracy: "The answer demonstrates basic technical understanding."
        }
      };
    }
    
    // Normalize scores to 0-1 range
    const relevanceScore = contentAnalysis.relevance / 10;
    const completenessScore = contentAnalysis.completeness / 10;
    const coherenceScore = contentAnalysis.coherence / 10;
    const technicalAccuracyScore = contentAnalysis.technicalAccuracy / 10;
    
    // Overall sentiment from Azure Text Analytics
    const positiveScore = sentimentResult.confidenceScores.positive;
    const negativeScore = sentimentResult.confidenceScores.negative;
    const neutralScore = sentimentResult.confidenceScores.neutral;
    
    return {
      relevanceScore,
      completenessScore, 
      coherenceScore,
      technicalAccuracyScore,
      sentimentScores: {
        positive: positiveScore,
        negative: negativeScore,
        neutral: neutralScore
      },
      explanations: contentAnalysis.explanations || {},
      overallSentiment: sentimentResult.sentiment
    };
  } catch (error) {
    console.error('Error analyzing text content:', error);
    
    // Return fallback values
    return {
      relevanceScore: 0.7,
      completenessScore: 0.75, 
      coherenceScore: 0.8,
      technicalAccuracyScore: 0.7,
      sentimentScores: {
        positive: 0.6,
        negative: 0.1,
        neutral: 0.3
      },
      explanations: {
        relevance: "Unable to evaluate due to an error.",
        completeness: "Unable to evaluate due to an error.",
        coherence: "Unable to evaluate due to an error.",
        technicalAccuracy: "Unable to evaluate due to an error."
      },
      overallSentiment: "neutral",
      error: error.message
    };
  }
}

/**
 * Generate an overall assessment of the interview response
 */
async function generateOverallAssessment(videoAnalysis, textAnalysis, question) {
  try {
    console.log(`[VideoAnalysisService] Generating overall assessment`);
    
    // Calculate overall confidence level
    const confidenceLevel = determineConfidenceLevel(videoAnalysis.confidenceScore, textAnalysis.coherenceScore);
    
    // Create assessment using OpenAI
    const promptTemplate = `
I need a brief assessment of a candidate's interview performance based on video and text analysis.

Interview Question: "${question}"

Body Language Analysis:
- Confidence: ${videoAnalysis.confidenceScore * 100}%
- Nervousness: ${videoAnalysis.nervousnessScore * 100}%
- Eye Contact: ${videoAnalysis.eyeContactScore * 100}%
- Posture: ${videoAnalysis.postureScore * 100}%
- Gestures: ${videoAnalysis.gesturesScore * 100}%

Answer Analysis:
- Relevance: ${textAnalysis.relevanceScore * 100}%
- Completeness: ${textAnalysis.completenessScore * 100}%
- Coherence: ${textAnalysis.coherenceScore * 100}%
- Technical Accuracy: ${textAnalysis.technicalAccuracyScore * 100}%

Please provide a concise (2-3 sentences) professional assessment of this interview response, focusing on both delivery and content.
    `;
    
    const openAIResponse = await openaiClient.getChatCompletions(
      OPENAI_DEPLOYMENT,
      [
        { role: "system", content: "You are an AI assistant that specializes in evaluating interview responses. Provide concise, helpful assessments." },
        { role: "user", content: promptTemplate }
      ],
      {
        temperature: 0.7,
        maxTokens: 200
      }
    );
    
    const summary = openAIResponse.choices[0].message.content.trim();
    
    return {
      confidenceLevel,
      summary
    };
  } catch (error) {
    console.error('Error generating overall assessment:', error);
    
    // Generate a fallback assessment without OpenAI
    const confidenceLevel = determineConfidenceLevel(videoAnalysis.confidenceScore, textAnalysis.coherenceScore);
    const coherenceDescription = textAnalysis.coherenceScore > 0.7 ? 'well-structured' : 'somewhat disorganized';
    const confidenceDescription = videoAnalysis.confidenceScore > 0.7 ? 'confident' : 'hesitant';
    const relevanceDescription = textAnalysis.relevanceScore > 0.7 ? 'highly relevant' : 'somewhat off-topic';
    
    const summary = `The candidate appeared ${confidenceDescription} during this response with ${coherenceDescription} answers that were ${relevanceDescription} to the question. ${generateAdditionalInsight(videoAnalysis, textAnalysis)}`;
    
    return {
      confidenceLevel,
      summary,
      error: error.message
    };
  }
}

// Helper function to determine confidence level
function determineConfidenceLevel(confidence, coherence) {
  const score = (confidence + coherence) / 2;
  if (score > 0.75) return 'High';
  if (score > 0.5) return 'Medium';
  return 'Low';
}

// Helper function to generate additional insight without OpenAI
function generateAdditionalInsight(videoAnalysis, textAnalysis) {
  if (videoAnalysis.nervousnessScore > 0.6 && textAnalysis.coherenceScore < 0.5) {
    return 'The candidate showed signs of significant nervousness which may have affected their ability to articulate their thoughts clearly.';
  }
  
  if (videoAnalysis.confidenceScore > 0.8 && textAnalysis.technicalAccuracyScore > 0.8) {
    return 'The candidate demonstrated strong technical knowledge combined with confident delivery.';
  }
  
  if (videoAnalysis.eyeContactScore < 0.5) {
    return 'The candidate maintained limited eye contact, which may indicate discomfort with the subject matter or general nervousness.';
  }
  
  return 'Consider reviewing the full response for additional context.';
}

/**
 * Main function to analyze interview recording
 */
async function analyzeInterviewRecording(interviewId, questionIndex, question) {
  try {
    console.log(`[VideoAnalysisService] Starting analysis for interview ${interviewId}, question ${questionIndex}`);
    
    // 1. Get the video URL from blob storage
    const containerClient = blobServiceClient.getContainerClient(interviewRecordingsContainerName);
    const blobName = `${interviewId}/${questionIndex}.webm`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Check if blob exists
    const exists = await blockBlobClient.exists();
    if (!exists) {
      throw new Error(`Recording blob not found: ${blobName}`);
    }
    
    // Generate a temporary SAS URL for the video
    const { generateSasUrl } = require('./blobStorage');
    const videoUrl = await generateSasUrl(blobName, interviewRecordingsContainerName, 60);
    
    // 2. Analyze video content with Azure Video Indexer
    const videoAnalysis = await analyzeVideoWithAzure(videoUrl, interviewId, questionIndex);
    
    // 3. Extract transcript from Video Indexer results or use Speech to Text
    let transcript = '';
    if (videoAnalysis.insights && videoAnalysis.insights.transcript && videoAnalysis.insights.transcript.length > 0) {
      // Use Video Indexer transcript if available
      transcript = videoAnalysis.insights.transcript
        .map(item => item.text)
        .join(' ');
    } else {
      // Fallback to Speech to Text if needed
      transcript = await transcribeAudioFromVideo(videoUrl);
    }
    
    // 4. Analyze text content
    const textAnalysis = await analyzeTextContent(transcript, question);
    
    // 5. Generate overall assessment
    const overallAssessment = await generateOverallAssessment(videoAnalysis, textAnalysis, question);
    
    // 6. Combine all results
    const analysisResult = {
      confidence: videoAnalysis.confidenceScore,
      nervousness: videoAnalysis.nervousnessScore,
      bodyLanguage: {
        eyeContact: videoAnalysis.eyeContactScore,
        posture: videoAnalysis.postureScore,
        gestures: videoAnalysis.gesturesScore,
        facialExpressions: videoAnalysis.facialExpressionsScore
      },
      answerQuality: {
        relevance: textAnalysis.relevanceScore,
        completeness: textAnalysis.completenessScore,
        coherence: textAnalysis.coherenceScore,
        technicalAccuracy: textAnalysis.technicalAccuracyScore
      },
      overallAssessment: overallAssessment
    };
    
    return {
      analysis: analysisResult,
      transcript: transcript
    };
  } catch (error) {
    console.error('Error in interview recording analysis:', error);
    
    // Return a fallback analysis in case of errors
    return {
      analysis: {
        confidence: 0.7,
        nervousness: 0.3,
        bodyLanguage: {
          eyeContact: 0.75,
          posture: 0.8,
          gestures: 0.65,
          facialExpressions: 0.7
        },
        answerQuality: {
          relevance: 0.75,
          completeness: 0.7,
          coherence: 0.75,
          technicalAccuracy: 0.7
        },
        overallAssessment: {
          confidenceLevel: 'Medium',
          summary: 'Unable to perform full analysis. This is a fallback assessment based on limited data.'
        }
      },
      transcript: "Transcription unavailable due to processing error.",
      error: error.message
    };
  }
}

module.exports = {
  analyzeInterviewRecording
};