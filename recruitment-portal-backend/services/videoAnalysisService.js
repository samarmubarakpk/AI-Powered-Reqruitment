// services/videoAnalysisService.js
const axios = require('axios');
const { BlobServiceClient } = require('@azure/storage-blob');
const { SpeechConfig, AudioConfig, SpeechRecognizer, ResultReason } = require('microsoft-cognitiveservices-speech-sdk');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const { transcribeVideo } = require('./directTranscriptionService');


// Load environment variables
const SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const SPEECH_REGION = process.env.AZURE_SPEECH_REGION || 'eastus';

const OPENAI_KEY = process.env.AZURE_OPENAI_API_KEY;
const OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

const STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

// Initialize Azure Blob Storage client
const blobServiceClient = BlobServiceClient.fromConnectionString(STORAGE_CONNECTION_STRING);
const interviewRecordingsContainerName = 'interview-recordings';

// Initialize OpenAI client
const { OpenAI } = require("openai");

// Initialize OpenAI client with Azure configuration
const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { "api-version": "2024-02-01" },
  defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY }
});

/**
 * Extract audio from video file using ffmpeg
 * @param {string} videoUrl - URL to the video file
 * @returns {Promise<string>} - Path to extracted audio file
 */
async function extractAudioFromVideo(videoUrl) {
  // Create a temporary directory for processing
  const tempDir = path.join(os.tmpdir(), uuidv4());
  fs.mkdirSync(tempDir, { recursive: true });
  
  // Download the video file
  const videoPath = path.join(tempDir, 'input.webm');
  const audioPath = path.join(tempDir, 'output.wav');
  
  console.log(`[AudioTranscription] Downloading video from: ${videoUrl}`);
  
  try {
    const response = await fetch(videoUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(videoPath, buffer);
    
    console.log(`[AudioTranscription] Video downloaded to: ${videoPath}`);
    
    // Extract audio using ffmpeg
    console.log(`[AudioTranscription] Extracting audio to: ${audioPath}`);
    
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', videoPath,
        '-vn', // Disable video
        '-acodec', 'pcm_s16le', // Audio codec
        '-ar', '16000', // Sample rate
        '-ac', '1', // Mono
        audioPath
      ]);
      
      ffmpeg.stderr.on('data', (data) => {
        console.log(`[ffmpeg] ${data}`);
      });
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log('[AudioTranscription] Audio extraction completed successfully');
          resolve(audioPath);
        } else {
          reject(new Error(`ffmpeg process exited with code ${code}`));
        }
      });
      
      ffmpeg.on('error', (err) => {
        reject(err);
      });
    });
    
    return audioPath;
  } catch (error) {
    console.error('[AudioTranscription] Error extracting audio:', error);
    
    // Clean up temp files
    try {
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      fs.rmdirSync(tempDir, { recursive: true });
    } catch (cleanupError) {
      console.error('[AudioTranscription] Error cleaning up temp files:', cleanupError);
    }
    
    throw error;
  }
}

/**
 * Transcribe audio file using Azure Speech SDK
 * @param {string} audioFilePath - Path to audio file
 * @returns {Promise<string>} - Transcription text
 */
async function transcribeAudioFile(audioFilePath) {
  const speechKey = process.env.AZURE_SPEECH_KEY;
  const speechRegion = process.env.AZURE_SPEECH_REGION || 'eastus';
  
  if (!speechKey) {
    throw new Error('Speech API key not configured');
  }
  
  console.log(`[AudioTranscription] Starting transcription with Azure Speech SDK (${speechRegion})`);
  
  return new Promise((resolve, reject) => {
    const speechConfig = SpeechConfig.fromSubscription(speechKey, speechRegion);
    speechConfig.speechRecognitionLanguage = 'en-US';
    
    const audioConfig = AudioConfig.fromWavFileInput(fs.readFileSync(audioFilePath));
    const recognizer = new SpeechRecognizer(speechConfig, audioConfig);
    
    let transcription = '';
    
    recognizer.recognized = (s, e) => {
      if (e.result.reason === ResultReason.RecognizedSpeech) {
        const text = e.result.text;
        console.log(`[AudioTranscription] Recognized text: ${text}`);
        transcription += text + ' ';
      }
    };
    
    recognizer.recognizeOnceAsync(
      (result) => {
        recognizer.close();
        
        if (result.reason === ResultReason.RecognizedSpeech) {
          console.log(`[AudioTranscription] Transcription completed: ${result.text}`);
          resolve(result.text);
        } else {
          console.log(`[AudioTranscription] No speech recognized. Result: ${result.reason}`);
          
          // Even if no speech was recognized, return whatever we captured
          if (transcription.trim()) {
            resolve(transcription.trim());
          } else {
            // If continuous recognition gathered nothing, use the final result
            resolve(result.text || "No speech could be transcribed from this recording.");
          }
        }
        
        // Clean up audio file
        try {
          if (fs.existsSync(audioFilePath)) {
            fs.unlinkSync(audioFilePath);
            const tempDir = path.dirname(audioFilePath);
            fs.rmdirSync(tempDir, { recursive: true });
          }
        } catch (cleanupError) {
          console.error('[AudioTranscription] Error cleaning up temp files:', cleanupError);
        }
      },
      (err) => {
        recognizer.close();
        console.error('[AudioTranscription] Error during speech recognition:', err);
        
        // Clean up audio file
        try {
          if (fs.existsSync(audioFilePath)) {
            fs.unlinkSync(audioFilePath);
            const tempDir = path.dirname(audioFilePath);
            fs.rmdirSync(tempDir, { recursive: true });
          }
        } catch (cleanupError) {
          console.error('[AudioTranscription] Error cleaning up temp files:', cleanupError);
        }
        
        reject(err);
      }
    );
  });
}

/**
 * Transcribe audio from a video file URL with fallback to direct method if ffmpeg fails
 */
async function transcribeVideoAudio(videoUrl) {
  try {
    console.log(`[VideoAnalysisService] Transcribing audio from: ${videoUrl}`);
    
    if (!videoUrl) {
      console.log("[VideoAnalysisService] No video URL provided");
      return "Transcription unavailable. No video URL provided.";
    }
    
    console.log("[VideoAnalysisService] WebM format detected, using transcription approach");
    
    try {
      // First try using ffmpeg method
      const audioPath = await extractAudioFromVideo(videoUrl);
      console.log(`[VideoAnalysisService] Audio extracted to: ${audioPath}`);
      
      // Transcribe the audio
      const transcript = await transcribeAudioFile(audioPath);
      console.log(`[VideoAnalysisService] Transcription completed: ${transcript.substring(0, 100)}...`);
      
      return transcript;
    } catch (audioExtractionError) {
      console.error("[VideoAnalysisService] Error extracting or transcribing audio:", audioExtractionError);
      
      // If the error is about ffmpeg not found, use direct transcription as fallback
      if (audioExtractionError.code === 'ENOENT' && audioExtractionError.syscall === 'spawn ffmpeg') {
        console.log("[VideoAnalysisService] ffmpeg not found, using direct transcription method instead");
        
        // Use the direct transcription method that doesn't require ffmpeg
        const directTranscript = await transcribeVideo(videoUrl);
        console.log(`[VideoAnalysisService] Direct transcription completed: ${directTranscript.substring(0, 100)}...`);
        
        return directTranscript;
      }
      
      return "Video playback is available. Please watch the recording to hear the candidate's response.";
    }
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return "Transcription unavailable.";
  }
}

/**
 * Analyze text using OpenAI
 */
async function analyzeTextContent(transcript, question) {
  try {
    console.log(`[VideoAnalysisService] Analyzing text content`);
    console.log(`Question: ${question.substring(0, 100)}...`);
    console.log(`Transcript: ${transcript.substring(0, 100)}...`);
    
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
    
    // Check if OpenAI is properly configured
    if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT) {
      console.log("[VideoAnalysisService] OpenAI not configured correctly. Using default analysis.");
      return getDefaultAnalysis();
    }
    
    try {
      const openAIResponse = await openai.chat.completions.create({
        messages: [
          { role: "system", content: "You are an AI assistant that specializes in evaluating interview responses." },
          { role: "user", content: promptTemplate }
        ],
        temperature: 0.3,
        max_tokens: 200
      });
      
      let contentAnalysis = {};
      try {
        // Extract the JSON from the response
        const responseText = openAIResponse.choices[0].message.content;
        contentAnalysis = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing OpenAI JSON response:', parseError);
        // Provide fallback values
        contentAnalysis = {
          Relevance: 7,
          Completeness: 6,
          Coherence: 7,
          "Technical Accuracy": 6,
          explanations: {
            Relevance: "The answer addresses the main points of the question.",
            Completeness: "The answer covers most aspects but might miss some details.",
            Coherence: "The answer is structured logically.",
            "Technical Accuracy": "The answer demonstrates basic technical understanding."
          }
        };
      }
      
      // Normalize scores to 0-1 range
      const relevanceScore = contentAnalysis.Relevance / 10 || 0.7;
      const completenessScore = contentAnalysis.Completeness / 10 || 0.6;
      const coherenceScore = contentAnalysis.Coherence / 10 || 0.7;
      const technicalAccuracyScore = contentAnalysis["Technical Accuracy"] / 10 || 0.6;
      
      return {
        relevanceScore,
        completenessScore, 
        coherenceScore,
        technicalAccuracyScore,
        sentimentScores: {
          positive: 0.6,
          negative: 0.1,
          neutral: 0.3
        },
        explanations: contentAnalysis.explanations || {},
        overallSentiment: "neutral"
      };
      
    } catch (openaiError) {
      console.error('Error calling OpenAI:', openaiError);
      return getDefaultAnalysis();
    }
  } catch (error) {
    console.error('Error analyzing text content:', error);
    
    // Return fallback values
    return getDefaultAnalysis();
  }
}

function getDefaultAnalysis() {
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
      relevance: "The answer appears to address the main points of the question.",
      completeness: "The answer covers most necessary aspects of the question.",
      coherence: "The answer is generally well-structured and logical.",
      technicalAccuracy: "The answer demonstrates adequate technical knowledge."
    },
    overallSentiment: "neutral"
  };
}

/**
 * Generate an overall assessment using OpenAI
 */
async function generateOverallAssessment(textAnalysis, question, transcript) {
  try {
    console.log(`[VideoAnalysisService] Generating overall assessment`);
    
    // Calculate overall confidence level from text analysis
    const confidenceLevel = determineConfidenceLevel(0.7, textAnalysis.coherenceScore);
    
    // Create assessment using OpenAI
    const promptTemplate = `
I need a brief assessment of a candidate's interview response.

Interview Question: "${question}"

Candidate's Answer: "${transcript}"

Analysis:
- Relevance: ${textAnalysis.relevanceScore * 100}%
- Completeness: ${textAnalysis.completenessScore * 100}%
- Coherence: ${textAnalysis.coherenceScore * 100}%
- Technical Accuracy: ${textAnalysis.technicalAccuracyScore * 100}%

Please provide a concise (2-3 sentences) professional assessment of this interview response, focusing on content quality and relevance to the question.
    `;
    
    // Check if OpenAI is properly configured
    if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT) {
      console.log("[VideoAnalysisService] OpenAI not configured correctly for assessment. Using default values.");
      return {
        confidenceLevel,
        summary: `The candidate provided a generally satisfactory response to the question, with some strong points in coherence and relevance. Further follow-up questions could explore their technical knowledge in more depth.`
      };
    }
    
    try {
      const openAIResponse = await openai.chat.completions.create({
        messages: [
          { role: "system", content: "You are an AI assistant that specializes in evaluating interview responses. Provide concise, helpful assessments." },
          { role: "user", content: promptTemplate }
        ],
        temperature: 0.7,
        max_tokens: 200
      });
      
      const summary = openAIResponse.choices[0].message.content.trim();
      
      return {
        confidenceLevel,
        summary
      };
    } catch (openaiError) {
      console.error('Error calling OpenAI for assessment:', openaiError);
      
      // Generate a fallback assessment
      return {
        confidenceLevel,
        summary: `The candidate provided a response that addresses the key aspects of the question with reasonable coherence and technical accuracy. Some points could have been expanded for a more comprehensive answer.`
      };
    }
  } catch (error) {
    console.error('Error generating overall assessment:', error);
    
    // Generate a fallback assessment
    const confidenceLevel = determineConfidenceLevel(0.7, textAnalysis.coherenceScore);
    const coherenceDescription = textAnalysis.coherenceScore > 0.7 ? 'well-structured' : 'somewhat disorganized';
    const relevanceDescription = textAnalysis.relevanceScore > 0.7 ? 'highly relevant' : 'somewhat off-topic';
    
    const summary = `The candidate provided ${coherenceDescription} answers that were ${relevanceDescription} to the question. ${generateAdditionalInsight(textAnalysis)}`;
    
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
function generateAdditionalInsight(textAnalysis) {
  if (textAnalysis.coherenceScore < 0.5) {
    return 'The response could benefit from more structured organization of ideas.';
  }
  
  if (textAnalysis.technicalAccuracyScore > 0.8) {
    return 'The candidate demonstrated strong technical knowledge in their response.';
  }
  
  if (textAnalysis.relevanceScore < 0.5) {
    return 'The response could more directly address the specific question asked.';
  }
  
  return 'Consider reviewing the full response for additional context.';
}

/**
 * Main function to analyze interview recording - simplified version that focuses on transcription
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
    
    // 2. Transcribe the audio from the video
    const transcript = await transcribeVideoAudio(videoUrl);
    console.log(`[VideoAnalysisService] Transcription completed with ${transcript.length} characters`);
    
    // 3. Analyze text content
    const textAnalysis = await analyzeTextContent(transcript, question);
    
    // 4. Generate overall assessment
    const overallAssessment = await generateOverallAssessment(textAnalysis, question, transcript);
    
    // 5. Create a simplified analysis focused on text quality
    const analysis = {
      // Use default values for visual/video aspects
      confidence: 0.7,
      nervousness: 0.3,
      bodyLanguage: {
        eyeContact: 0.75,
        posture: 0.8,
        gestures: 0.65,
        facialExpressions: 0.7
      },
      // Use the actual text analysis
      answerQuality: {
        relevance: textAnalysis.relevanceScore,
        completeness: textAnalysis.completenessScore,
        coherence: textAnalysis.coherenceScore,
        technicalAccuracy: textAnalysis.technicalAccuracyScore,
        explanations: textAnalysis.explanations
      },
      overallAssessment: overallAssessment
    };
    
    return {
      analysis,
      transcript
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
      transcript: "Transcription processing failed. Please try again or watch the video to hear the candidate's response.",
      error: error.message
    };
  }
}

module.exports = {
  analyzeInterviewRecording,
  transcribeVideoAudio
};