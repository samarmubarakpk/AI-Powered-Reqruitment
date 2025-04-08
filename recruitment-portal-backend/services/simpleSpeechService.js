// services/simpleSpeechService.js - Fixed version
const axios = require('axios');
const { Buffer } = require('buffer');

// Configure Azure Speech Service
const speechKey = process.env.AZURE_SPEECH_KEY || "FtOfyKSLZExbyeI8g3J8eU0t2yDJ7owZZsoWQQPzxLaCvOxqcvLmJQQJ99BDACYeBjFXJ3w3AAAYACOG7HjF";
const speechRegion = process.env.AZURE_SPEECH_REGION || "eastus";

/**
 * Transcribe audio using Azure Speech REST API directly
 * @param {string} videoUrl - URL to the video file
 * @returns {Promise<string>} - The transcription text
 */
async function transcribeAudioREST(videoUrl) {
  try {
    console.log(`[SimpleSpeech] Starting direct REST API transcription for: ${videoUrl}`);
    console.log(`[SimpleSpeech] Using Azure Speech key: ${speechKey.substring(0, 5)}...`);
    console.log(`[SimpleSpeech] Using Azure Speech region: ${speechRegion}`);
    
    // Step 1: Get Azure Speech token
    console.log(`[SimpleSpeech] Requesting Azure Speech token...`);
    const tokenEndpoint = `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
    
    let token;
    try {
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
      
      token = tokenResponse.data;
      console.log(`[SimpleSpeech] Successfully obtained token: ${token.substring(0, 10)}...`);
    } catch (tokenError) {
      console.error(`[SimpleSpeech] Error getting token:`, tokenError.message);
      if (tokenError.response) {
        console.error(`[SimpleSpeech] Status: ${tokenError.response.status}`);
        console.error(`[SimpleSpeech] Data: ${JSON.stringify(tokenError.response.data)}`);
      }
      throw new Error(`Failed to get Speech token: ${tokenError.message}`);
    }
    
    // Step 2: Download the video file
    console.log(`[SimpleSpeech] Downloading video file from URL...`);
    let videoData;
    try {
      const videoResponse = await axios.get(videoUrl, { 
        responseType: 'arraybuffer',
        timeout: 30000 // 30 seconds timeout for large files
      });
      videoData = videoResponse.data;
      console.log(`[SimpleSpeech] Successfully downloaded video: ${videoData.byteLength} bytes`);
    } catch (downloadError) {
      console.error(`[SimpleSpeech] Error downloading video:`, downloadError.message);
      throw new Error(`Failed to download video: ${downloadError.message}`);
    }
    
    // Step 3: Use Speech REST API to transcribe
    try {
      // Prepare the request URL
      const speechEndpoint = `https://${speechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`;
      console.log(`[SimpleSpeech] Calling Speech REST API for transcription at: ${speechEndpoint}`);
      
      // Set up proper headers for webm format
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'audio/webm;codecs=opus',
        'Accept': 'application/json'
      };
      
      console.log(`[SimpleSpeech] Set up headers, making API call with video data...`);
      
      const transcriptionResponse = await axios.post(
        speechEndpoint,
        videoData,
        {
          headers: headers,
          timeout: 60000 // 60 seconds timeout for transcription
        }
      );
      
      console.log(`[SimpleSpeech] REST API response statusCode: ${transcriptionResponse.status}`);
      console.log(`[SimpleSpeech] REST API response data:`, JSON.stringify(transcriptionResponse.data, null, 2));
      
      if (transcriptionResponse.data.RecognitionStatus === 'Success') {
        // Successfully transcribed
        const text = transcriptionResponse.data.DisplayText || 
                    (transcriptionResponse.data.NBest && transcriptionResponse.data.NBest[0].Display);
        
        console.log(`[SimpleSpeech] Transcription successful: "${text}"`);
        return text;
      } else {
        // Failed to transcribe
        console.log(`[SimpleSpeech] Transcription failed with status: ${transcriptionResponse.data.RecognitionStatus}`);
        return `Transcription status: ${transcriptionResponse.data.RecognitionStatus}. Please try again or watch the video.`;
      }
    } catch (transcriptionError) {
      console.error(`[SimpleSpeech] Error calling Speech REST API:`, transcriptionError.message);
      if (transcriptionError.response) {
        console.error(`[SimpleSpeech] Status: ${transcriptionError.response.status}`);
        console.error(`[SimpleSpeech] Data:`, transcriptionError.response.data);
      }
      
      // Special handling for likely format issues
      if (transcriptionError.message.includes('413') || 
          (transcriptionError.response && transcriptionError.response.status === 413)) {
        console.error(`[SimpleSpeech] File too large or incorrect format`);
        return "Transcription failed: The audio format may not be supported or the file is too large.";
      }
      
      throw new Error(`Transcription API error: ${transcriptionError.message}`);
    }
  } catch (error) {
    console.error(`[SimpleSpeech] Overall transcription error:`, error.message);
    return "Transcription failed. Please try again later.";
  }
}

/**
 * Main transcribe function 
 * @param {string} videoUrl - URL to the video file
 * @returns {Promise<string>} - Transcription text
 */
async function transcribeVideo(videoUrl) {
  console.log(`[SimpleSpeech] Starting transcription process for URL: ${videoUrl}`);
  
  try {
    console.log(`[SimpleSpeech] Attempting transcription using REST API...`);
    const transcript = await transcribeAudioREST(videoUrl);
    console.log(`[SimpleSpeech] Transcription completed: "${transcript}"`);
    return transcript;
  } catch (error) {
    console.error(`[SimpleSpeech] Transcription failed:`, error);
    return "Transcription failed. Please watch the video directly.";
  }
}

module.exports = {
  transcribeVideo
};