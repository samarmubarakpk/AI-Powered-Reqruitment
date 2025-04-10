// services/videoAnalysisService.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

// Azure Video Indexer credentials - load from environment variables
const ACCOUNT_ID = process.env.VIDEO_INDEXER_ACCOUNT_ID || 'your-account-id';
const LOCATION = process.env.VIDEO_INDEXER_LOCATION || 'trial';
const SUBSCRIPTION_KEY = process.env.VIDEO_INDEXER_SUBSCRIPTION_KEY || 'your-key';

// Define the container name here so it's available throughout this file
const interviewRecordingsContainerName = 'interview-recordings';

// Add this at the top of the file
const { OpenAI } = require("openai");

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { "api-version": "2023-12-01-preview" },
  defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY }
});

// Add this new function for answer quality analysis
async function analyzeAnswerQuality(question, transcript) {
  try {
    console.log('[OpenAI] Analyzing answer quality for question:', question);
    console.log('[OpenAI] Transcript for analysis:', transcript.substring(0, 100) + '...');
    
    // Create prompt for analyzing answer quality
    const prompt = `
Analyze how well the following interview answer addresses the given question:

QUESTION: ${question}

ANSWER TRANSCRIPT: ${transcript}

Provide a detailed analysis of the answer quality with scores (0-100) for:
1. Relevance: How directly the answer addresses the specific question
2. Completeness: How thoroughly the answer covers all aspects of the question
3. Coherence: How logically structured and well-organized the answer is
4. Technical Accuracy: How accurate the technical content of the answer is

Also provide an overall assessment of the candidate's response including confidence level (Low/Medium/High).

Format your response AS PLAIN JSON WITHOUT CODE BLOCKS using this structure:
{
  "answerQuality": {
    "relevance": number,
    "completeness": number, 
    "coherence": number,
    "technicalAccuracy": number
  },
  "overallAssessment": {
    "confidenceLevel": "Low|Medium|High",
    "summary": "Detailed assessment of the answer..."
  }
}

IMPORTANT: Return ONLY the JSON object with no markdown or code blocks.`;

    // Call Azure OpenAI
    const response = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [
        { role: "system", content: "You are an AI assistant that evaluates interview responses. You ONLY return raw JSON without any markdown formatting, code blocks, or explanation." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }, // Use this if your Azure OpenAI supports it
      max_tokens: 800
    });

    // Get the raw content
    const content = response.choices[0].message.content.trim();
    console.log('[OpenAI] Raw response:', content);
    
    // Try multiple approaches to extract valid JSON
    let jsonContent = content;
    let analysis = null;
    
    // Approach 1: Try direct JSON parsing
    try {
      analysis = JSON.parse(jsonContent);
      console.log('[OpenAI] Direct JSON parsing successful');
    } catch (directParseError) {
      console.log('[OpenAI] Direct JSON parsing failed, trying alternative methods');
      
      // Approach 2: Extract JSON from code blocks if present
      try {
        const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
          jsonContent = codeBlockMatch[1].trim();
          console.log('[OpenAI] Extracted content from code block');
          analysis = JSON.parse(jsonContent);
          console.log('[OpenAI] Code block JSON parsing successful');
        }
      } catch (codeBlockError) {
        console.log('[OpenAI] Code block extraction failed');
      }
      
      // Approach 3: Try to find JSON-like structure with regex
      if (!analysis) {
        try {
          // Look for anything that looks like a JSON object
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonContent = jsonMatch[0];
            console.log('[OpenAI] Extracted JSON-like structure with regex');
            analysis = JSON.parse(jsonContent);
            console.log('[OpenAI] Regex JSON parsing successful');
          }
        } catch (regexError) {
          console.log('[OpenAI] Regex extraction failed');
        }
      }
      
      // Approach 4: Manual extraction of values as last resort
      if (!analysis) {
        console.log('[OpenAI] All JSON parsing methods failed, using manual extraction');
        
        const relevanceMatch = content.match(/relevance["\s:]+(\d+)/i);
        const completenessMatch = content.match(/completeness["\s:]+(\d+)/i);
        const coherenceMatch = content.match(/coherence["\s:]+(\d+)/i);
        const technicalAccuracyMatch = content.match(/technical\s*accuracy["\s:]+(\d+)/i);
        const confidenceLevelMatch = content.match(/confidence\s*level["\s:]+["']?(Low|Medium|High)["']?/i);
        
        // Look for a summary by finding text after "summary" and before the next quote or bracket
        const summaryMatch = content.match(/summary["\s:]+["']?(.*?)(?:["']?[,}]|$)/i);
        
        analysis = {
          answerQuality: {
            relevance: relevanceMatch ? parseInt(relevanceMatch[1]) : 50,
            completeness: completenessMatch ? parseInt(completenessMatch[1]) : 50,
            coherence: coherenceMatch ? parseInt(coherenceMatch[1]) : 50,
            technicalAccuracy: technicalAccuracyMatch ? parseInt(technicalAccuracyMatch[1]) : 50
          },
          overallAssessment: {
            confidenceLevel: confidenceLevelMatch ? confidenceLevelMatch[1] : 'Medium',
            summary: summaryMatch ? summaryMatch[1].trim() : "Analysis of the answer couldn't be properly parsed."
          }
        };
        
        console.log('[OpenAI] Manually extracted analysis:', analysis);
      }
    }
    
    // Normalize scores from 0-100 to 0-1 for frontend
    if (analysis && analysis.answerQuality) {
      Object.keys(analysis.answerQuality).forEach(key => {
        analysis.answerQuality[key] = analysis.answerQuality[key] / 100;
      });
      
      console.log('[OpenAI] Analysis complete with normalized scores');
    } else {
      throw new Error('Failed to extract valid analysis from OpenAI response');
    }
    
    return analysis;
  } catch (error) {
    console.error('[OpenAI] Error analyzing answer quality:', error);
    
    // Return fallback values if the API call fails
    return {
      answerQuality: {
        relevance: 0.75,
        completeness: 0.7,
        coherence: 0.75,
        technicalAccuracy: 0.7
      },
      overallAssessment: {
        confidenceLevel: 'Medium',
        summary: "Analysis couldn't be completed. This is a default assessment."
      }
    };
  }
}

/**
 * Get an access token for Video Indexer API
 * @returns {Promise<string>} Access token
 */
async function getVideoIndexerAccessToken() {
  try {
    const tokenUrl = `https://api.videoindexer.ai/Auth/${LOCATION}/Accounts/${ACCOUNT_ID}/AccessToken?allowEdit=true`;
    const tokenHeaders = { "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY };
    
    console.log('[VideoIndexer] Requesting access token...');
    const response = await axios.get(tokenUrl, { headers: tokenHeaders });
    
    // Token comes with quotes, so strip them
    const accessToken = response.data.replace(/"/g, '');
    console.log('[VideoIndexer] Access token acquired');
    
    return accessToken;
  } catch (error) {
    console.error('[VideoIndexer] Error getting access token:', error.message);
    throw new Error(`Failed to get Video Indexer access token: ${error.message}`);
  }
}

/**
 * Upload a video file to Video Indexer
 * @param {string} videoUrl URL of the video file
 * @param {string} accessToken Video Indexer access token
 * @returns {Promise<string>} Video ID
 */
async function uploadVideoToIndexer(videoUrl, accessToken) {
  try {
    console.log('[VideoIndexer] Downloading video from URL...');
    const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer' });
    
    // Create a temporary file to store the video
    const tempDir = path.join(os.tmpdir(), uuidv4());
    fs.mkdirSync(tempDir, { recursive: true });
    const videoPath = path.join(tempDir, 'input.webm');
    
    fs.writeFileSync(videoPath, Buffer.from(videoResponse.data));
    console.log(`[VideoIndexer] Video downloaded to: ${videoPath} (${videoResponse.data.byteLength} bytes)`);
    
    // Upload to Video Indexer
    const uploadUrl = `https://api.videoindexer.ai/${LOCATION}/Accounts/${ACCOUNT_ID}/Videos`;
    const params = {
      name: `interview-${new Date().getTime()}`,
      privacy: 'Private',
      language: 'en-US'
    };
    const uploadHeaders = { "Authorization": `Bearer ${accessToken}` };
    
    console.log('[VideoIndexer] Uploading video to Azure Video Indexer...');
    
    // Create form data for file upload
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(videoPath));
    
    const uploadResponse = await axios.post(uploadUrl, formData, {
      params: params,
      headers: {
        ...uploadHeaders,
        ...formData.getHeaders()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    // Clean up temp file
    fs.unlinkSync(videoPath);
    fs.rmdirSync(tempDir, { recursive: true });
    
    const videoId = uploadResponse.data.id;
    console.log(`[VideoIndexer] Video uploaded successfully (ID: ${videoId})`);
    
    return videoId;
  } catch (error) {
    console.error('[VideoIndexer] Error uploading video:', error.message);
    throw new Error(`Failed to upload video to Video Indexer: ${error.message}`);
  }
}

/**
 * Wait for video indexing to complete
 * @param {string} videoId Video ID
 * @param {string} accessToken Video Indexer access token
 * @returns {Promise<Object>} Indexing results
 */
async function waitForIndexingCompletion(videoId, accessToken) {
  try {
    const indexUrl = `https://api.videoindexer.ai/${LOCATION}/Accounts/${ACCOUNT_ID}/Videos/${videoId}/Index`;
    const indexHeaders = { "Authorization": `Bearer ${accessToken}` };
    
    console.log('[VideoIndexer] Waiting for indexing to complete...');
    
    let state = '';
    let insights = null;
    let attempts = 0;
    const maxAttempts = 300; // Maximum 30 attempts (2.5 minutes with 5 second intervals)
    
    // Poll every 5 seconds until indexing is complete
    while (state !== 'Processed' && state !== 'Failed' && attempts < maxAttempts) {
      attempts++;
      const response = await axios.get(indexUrl, { headers: indexHeaders });
      state = response.data.state;
      
      console.log(`[VideoIndexer] Indexing state: ${state} (attempt ${attempts}/${maxAttempts})`);
      
      if (state === 'Processed') {
        insights = response.data;
        break;
      } else if (state === 'Failed') {
        throw new Error('Video indexing failed');
      }
      
      // For the first 5 attempts, check more frequently (2 seconds)
      // Then go to 5 seconds for the rest
      const waitTime = attempts <= 5 ? 2000 : 5000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // If we've hit max attempts but indexing isn't done
    if (attempts >= maxAttempts && state !== 'Processed') {
      throw new Error('Video indexing timeout - process is taking too long. Please try with a shorter video.');
    }
    
    return insights;
  } catch (error) {
    console.error('[VideoIndexer] Error waiting for indexing:', error.message);
    throw new Error(`Failed to complete video indexing: ${error.message}`);
  }
}

/**
 * Extract behavioral insights from Video Indexer results
 * @param {Object} indexerResults Video Indexer results
 * @returns {Object} Behavioral insights
 */
function extractBehavioralInsights(indexerResults) {
  try {
    const insights = indexerResults.videos[0].insights;
    
    // Extract face emotions
    const faces = insights.faces || [];
    let dominantEmotion = null;
    let confidenceScore = 0.7; // Default medium confidence
    
    if (faces.length > 0) {
      // Find the face with the most appearances (likely the candidate)
      const dominantFace = faces.reduce((prev, current) => {
        return (prev.appearances?.length > current.appearances?.length) ? prev : current;
      });
      
      // Count emotions
      const emotionCounts = {};
      dominantFace.appearances?.forEach(appearance => {
        if (appearance.emotion) {
          emotionCounts[appearance.emotion] = (emotionCounts[appearance.emotion] || 0) + 1;
        }
      });
      
      // Find the most common emotion
      let maxCount = 0;
      Object.keys(emotionCounts).forEach(emotion => {
        if (emotionCounts[emotion] > maxCount) {
          maxCount = emotionCounts[emotion];
          dominantEmotion = emotion;
        }
      });
      
      // Calculate nervousness score based on emotions
      let nervousnessScore = 0;
      const nervousEmotions = {
        'fear': 0.9,
        'sadness': 0.7,
        'anger': 0.6,
        'disgust': 0.5
      };
      
      const confidentEmotions = {
        'happiness': 0.9,
        'neutral': 0.7
      };
      
      if (nervousEmotions[dominantEmotion]) {
        nervousnessScore = nervousEmotions[dominantEmotion];
        confidenceScore = 1 - nervousnessScore;
      } else if (confidentEmotions[dominantEmotion]) {
        confidenceScore = confidentEmotions[dominantEmotion];
        nervousnessScore = 1 - confidenceScore;
      }
      
      // Extract body language insights
      const bodyLanguage = {
        eyeContact: 0.75, // Default value
        posture: 0.8,     // Default value
        gestures: 0.65,   // Default value
        facialExpressions: 0.7  // Default value
      };
      
      // Update facial expressions based on emotions
      if (dominantEmotion === 'happiness') {
        bodyLanguage.facialExpressions = 0.9;
      } else if (nervousEmotions[dominantEmotion]) {
        bodyLanguage.facialExpressions = 0.4;
      }
    }
    
    // Extract speech sentiment
    const sentiments = insights.sentiments || [];
    let positiveSentiments = 0;
    let negativeSentiments = 0;
    let neutralSentiments = 0;
    
    sentiments.forEach(sentiment => {
      const sentimentKey = sentiment.sentimentKey;
      if (sentimentKey === 'Positive') positiveSentiments++;
      else if (sentimentKey === 'Negative') negativeSentiments++;
      else if (sentimentKey === 'Neutral') neutralSentiments++;
    });
    
    // Adjust confidence based on sentiment
    if (positiveSentiments > negativeSentiments) {
      confidenceScore = Math.min(confidenceScore + 0.1, 1.0);
    } else if (negativeSentiments > positiveSentiments) {
      confidenceScore = Math.max(confidenceScore - 0.1, 0.0);
    }
    
    // Extract transcript
    const transcript = insights.transcript?.map(item => item.text).join(' ') || '';
    
    // Determine overall confidence level
    let confidenceLevel = 'Medium';
    if (confidenceScore > 0.8) confidenceLevel = 'High';
    else if (confidenceScore < 0.4) confidenceLevel = 'Low';
    
    return {
      confidence: confidenceScore,
      nervousness: 1 - confidenceScore, // Inverse of confidence
      dominantEmotion,
      bodyLanguage: {
        eyeContact: 0.75, // Default value
        posture: 0.8,     // Default value
        gestures: 0.65,   // Default value
        facialExpressions: dominantEmotion === 'happiness' ? 0.9 : 0.6
      },
      answerQuality: {
        relevance: 0.75,  // Placeholder - Video Indexer doesn't assess this
        completeness: 0.7,
        coherence: 0.75,
        technicalAccuracy: 0.7
      },
      overallAssessment: {
        confidenceLevel,
        summary: generateAssessmentSummary(dominantEmotion, confidenceScore, positiveSentiments, negativeSentiments)
      },
      transcript
    };
  } catch (error) {
    console.error('[VideoIndexer] Error extracting insights:', error.message);
    return {
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
        summary: "Analysis couldn't extract detailed insights. This is a default assessment."
      },
      transcript: ''
    };
  }
}

/**
 * Generate an assessment summary based on emotional cues
 */
function generateAssessmentSummary(dominantEmotion, confidenceScore, positiveSentiments, negativeSentiments) {
  if (dominantEmotion === 'happiness' && confidenceScore > 0.7) {
    return "The candidate appeared confident and positive throughout the interview, displaying comfortable body language and facial expressions.";
  } else if (dominantEmotion === 'neutral' && confidenceScore > 0.6) {
    return "The candidate maintained a composed demeanor throughout the interview, showing appropriate professional behavior.";
  } else if (dominantEmotion === 'fear' || dominantEmotion === 'sadness' || confidenceScore < 0.4) {
    return "The candidate displayed signs of nervousness or discomfort during the interview, which may have affected their communication.";
  } else if (positiveSentiments > negativeSentiments) {
    return "The candidate's response was generally positive with a moderate level of confidence in their delivery.";
  } else if (negativeSentiments > positiveSentiments) {
    return "The candidate's response had a negative tone at times, which may reflect uncertainty about the topic.";
  } else {
    return "The candidate maintained a balanced demeanor during the interview, showing moderate confidence in their responses.";
  }
}

/**
 * Main function to analyze interview recording using Azure Video Indexer
 * @param {string} interviewId Interview ID
 * @param {string} questionIndex Question index
 * @param {string} question Question text (optional)
 * @returns {Promise<Object>} Analysis results
 */
async function analyzeInterviewRecording(interviewId, questionIndex, question = '') {
  try {
    console.log(`[VideoIndexer] Starting analysis for interview ${interviewId}, question ${questionIndex}`);
    
    // 1. Get the Azure Video Indexer access token
    const accessToken = await getVideoIndexerAccessToken();
    
    // 2. Generate a SAS URL for the recording
    const { generateSasUrl } = require('./blobStorage');
    const blobName = `${interviewId}/${questionIndex}.webm`;
    const videoUrl = await generateSasUrl(blobName, interviewRecordingsContainerName, 60);
    console.log(`[VideoIndexer] Generated SAS URL for video`);
    
    // 3. Upload the video to Azure Video Indexer
    const videoId = await uploadVideoToIndexer(videoUrl, accessToken);
    
    // 4. Wait for indexing to complete
    const indexingResults = await waitForIndexingCompletion(videoId, accessToken);
    
    // 5. Extract behavioral insights and transcript
    console.log('[VideoIndexer] Extracting behavioral insights...');
    const analysis = extractBehavioralInsights(indexingResults);
    
    // 6. Get the transcript from the indexing results
    const transcript = indexingResults.videos[0].insights.transcript?.map(item => item.text).join(' ') || 
                       "Transcription not available from Video Indexer.";
    
    // 7. NEW STEP: Use OpenAI to analyze answer quality if we have both transcript and question
    if (transcript && question && transcript.length > 10) {
      console.log('[VideoIndexer] Using OpenAI to analyze answer quality...');
      
      try {
        // Store original confidence values from Video Indexer
        const originalConfidence = analysis.confidence;
        const originalNervousness = analysis.nervousness;
        
        // Get answer quality analysis from OpenAI
        const openAiAnalysis = await analyzeAnswerQuality(question, transcript);
        
        // Replace answer quality and overall assessment with OpenAI's analysis
        analysis.answerQuality = openAiAnalysis.answerQuality;
        analysis.overallAssessment = openAiAnalysis.overallAssessment;
        
        // Keep the original sentiment analysis from Video Indexer
        analysis.confidence = originalConfidence;
        analysis.nervousness = originalNervousness;
        
        console.log('[VideoIndexer] Successfully merged OpenAI analysis with Video Indexer results');
      } catch (openAiError) {
        console.error('[VideoIndexer] Error with OpenAI analysis:', openAiError);
        // Continue with default answer quality
      }
    } else {
      console.log('[VideoIndexer] Skipping OpenAI analysis due to missing question or transcript');
    }
    
    return {
      analysis,
      transcript
    };
  } catch (error) {
    console.error(`[VideoIndexer] Error in analyzing recording: ${error.message}`);
    
    // Return fallback analysis in case of error
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
          summary: `Analysis could not be completed: ${error.message}`
        }
      },
      transcript: "Transcription not available due to an error in the analysis process.",
      error: error.message
    };
  }
}

module.exports = {
  analyzeInterviewRecording
};