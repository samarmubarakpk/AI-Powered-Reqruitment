// services/directTranscriptionService.js
const axios = require('axios');
const FormData = require('form-data');
const { Buffer } = require('buffer');

/**
 * Transcribe audio using Azure Speech REST API directly
 * This method avoids using ffmpeg by sending the audio directly to Azure
 * @param {string} videoUrl - URL to the video with SAS token
 * @returns {Promise<string>} - The transcription result
 */
async function directTranscribe(videoUrl) {
  try {
    console.log(`[DirectTranscription] Starting direct transcription for: ${videoUrl}`);
    
    // Step 1: Download the video file
    const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer' });
    console.log(`[DirectTranscription] Downloaded video file: ${videoResponse.data.byteLength} bytes`);
    
    // Step 2: Call Azure Speech API directly
    // Get API key and region from environment variables
    const speechKey = process.env.AZURE_SPEECH_KEY;
    const speechRegion = process.env.AZURE_SPEECH_REGION || 'eastus';
    
    if (!speechKey) {
      throw new Error('Azure Speech API key not configured');
    }
    
    // Set the API endpoint
    const endpoint = `https://${speechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`;
    
    // Set headers for the API request
    const headers = {
      'Ocp-Apim-Subscription-Key': speechKey,
      'Content-Type': 'audio/webm; codecs=opus',
      'Accept': 'application/json'
    };
    
    // Add query parameters
    const params = {
      'language': 'en-US',
      'format': 'detailed',
      'profanity': 'masked'
    };
    
    console.log(`[DirectTranscription] Calling Azure Speech API at ${endpoint}`);
    
    // Make POST request to Azure Speech API
    const speechResponse = await axios.post(
      endpoint,
      videoResponse.data,  // Send the video data directly
      { 
        headers,
        params
      }
    );
    
    console.log(`[DirectTranscription] Azure Speech API Response:`, speechResponse.data);
    
    // Extract the transcript from the response
    if (speechResponse.data && speechResponse.data.RecognitionStatus === 'Success') {
      return speechResponse.data.DisplayText || speechResponse.data.NBest[0].Display;
    } else if (speechResponse.data && speechResponse.data.RecognitionStatus) {
      console.warn(`[DirectTranscription] Recognition status: ${speechResponse.data.RecognitionStatus}`);
      if (speechResponse.data.RecognitionStatus === 'EndOfDictation' || 
          speechResponse.data.RecognitionStatus === 'NoMatch') {
        return "No speech detected in the recording.";
      }
      return `Transcription status: ${speechResponse.data.RecognitionStatus}`;
    }
    
    throw new Error('Invalid response from Speech API');
  } catch (error) {
    console.error('[DirectTranscription] Error:', error.message);
    
    // If we can get more details from the error response
    if (error.response) {
      console.error('[DirectTranscription] Response status:', error.response.status);
      console.error('[DirectTranscription] Response data:', error.response.data);
    }
    
    return "Transcription failed. The audio could not be processed.";
  }
}

/**
 * Alternative transcription method that uses Azure Speech SDK's REST API
 * @param {string} videoUrl - URL to the video file
 * @returns {Promise<string>} - Transcription text
 */
async function transcribeUsingAzureRest(videoUrl) {
  try {
    console.log(`[DirectTranscription] Starting Azure REST API transcription for: ${videoUrl}`);
    
    // First, we need to get the Azure speech token
    const speechKey = process.env.AZURE_SPEECH_KEY;
    const speechRegion = process.env.AZURE_SPEECH_REGION || 'eastus';
    
    if (!speechKey) {
      throw new Error('Speech API key not configured');
    }
    
    // Get token
    const tokenEndpoint = `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
    const tokenResponse = await axios.post(
      tokenEndpoint, 
      null, 
      {
        headers: {
          'Ocp-Apim-Subscription-Key': speechKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const token = tokenResponse.data;
    console.log(`[DirectTranscription] Successfully obtained Azure speech token`);
    
    // Now download the video
    const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer' });
    console.log(`[DirectTranscription] Downloaded video file: ${videoResponse.data.byteLength} bytes`);
    
    // Create a form to send the audio file
    const formData = new FormData();
    formData.append('file', Buffer.from(videoResponse.data), {
      filename: 'audio.webm',
      contentType: 'audio/webm',
    });
    
    // Call the speech-to-text REST API
    const transcriptionEndpoint = `https://${speechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`;
    
    const transcriptionResponse = await axios.post(
      transcriptionEndpoint,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...formData.getHeaders()
        }
      }
    );
    
    console.log(`[DirectTranscription] Transcription API response:`, transcriptionResponse.data);
    
    if (transcriptionResponse.data.RecognitionStatus === 'Success') {
      return transcriptionResponse.data.DisplayText;
    } else {
      console.warn(`[DirectTranscription] Recognition failed with status: ${transcriptionResponse.data.RecognitionStatus}`);
      return "Transcription failed. Audio quality may be poor or there might be no speech in the recording.";
    }
  } catch (error) {
    console.error('[DirectTranscription] Error:', error);
    return "Transcription failed. Please try again later.";
  }
}

/**
 * Transcribe using a simple API - try both direct and REST methods
 */
async function transcribeVideo(videoUrl) {
  try {
    // First try direct method
    const transcript = await directTranscribe(videoUrl);
    
    // If we get a valid transcript, return it
    if (transcript && transcript !== "Transcription failed. The audio could not be processed.") {
      return transcript;
    }
    
    // Otherwise, try the alternative method
    console.log('[DirectTranscription] First method failed, trying alternative...');
    return await transcribeUsingAzureRest(videoUrl);
  } catch (error) {
    console.error('[DirectTranscription] All transcription methods failed:', error);
    return "Unable to transcribe audio. Please ensure the video contains clear speech.";
  }
}

module.exports = {
  transcribeVideo
};