// services/simpleSpeechService.js - Fixed to use ffmpeg-static
const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const ffmpegPath = require('ffmpeg-static'); // Add this line

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
      console.log(`[SimpleSpeech] Successfully obtained token`);
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
    try {
      const videoResponse = await axios.get(videoUrl, { 
        responseType: 'arraybuffer',
        timeout: 30000 // 30 seconds timeout for large files
      });
      
      // Step 3: Use Speech REST API to transcribe
      const speechEndpoint = `https://${speechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`;
      console.log(`[SimpleSpeech] Calling Speech REST API for transcription`);
      
      // Set up proper headers for webm format
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'audio/webm;codecs=opus',
        'Accept': 'application/json'
      };
      
      const transcriptionResponse = await axios.post(
        speechEndpoint,
        videoResponse.data,
        {
          headers: headers,
          timeout: 60000 // 60 seconds timeout for transcription
        }
      );
      
      console.log(`[SimpleSpeech] REST API response received`);
      
      if (transcriptionResponse.data.RecognitionStatus === 'Success') {
        // Successfully transcribed
        const text = transcriptionResponse.data.DisplayText || 
                    (transcriptionResponse.data.NBest && transcriptionResponse.data.NBest[0].Display);
        
        console.log(`[SimpleSpeech] Transcription successful: "${text}"`);
        return text;
      } else {
        // Failed to transcribe
        console.log(`[SimpleSpeech] Transcription failed with status: ${transcriptionResponse.data.RecognitionStatus}`);
        return "";
      }
    } catch (error) {
      console.error(`[SimpleSpeech] Error processing video:`, error);
      return "";
    }
  } catch (error) {
    console.error(`[SimpleSpeech] Overall transcription error:`, error);
    return "";
  }
}

/**
 * Extract audio from video file using ffmpeg-static
 * @param {string} videoPath - Path to video file
 * @param {string} audioPath - Path to output audio file
 * @returns {Promise<boolean>} - Success status
 */
async function extractAudioFromVideo(videoPath, audioPath) {
  console.log(`[SimpleSpeech] Extracting audio with ffmpeg-static...`);
  console.log(`[SimpleSpeech] Using ffmpeg from: ${ffmpegPath}`);
  
  return new Promise((resolve, reject) => {
    // Use the ffmpeg-static path instead of just 'ffmpeg'
    const ffmpegProcess = spawn(ffmpegPath, [
      '-i', videoPath, 
      '-vn',                // Disable video
      '-acodec', 'pcm_s16le', // Audio codec (16-bit PCM)
      '-ar', '16000',        // Sample rate (16kHz) 
      '-ac', '1',            // Mono audio
      '-y',                  // Overwrite output file
      audioPath
    ]);
    
    let stdErrOutput = '';
    ffmpegProcess.stderr.on('data', (data) => {
      stdErrOutput += data.toString();
      console.log(`[ffmpeg] ${data.toString().trim()}`);
    });
    
    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        // Check if audio file was created and has content
        if (fs.existsSync(audioPath) && fs.statSync(audioPath).size > 0) {
          console.log('[SimpleSpeech] Audio extraction successful');
          resolve(true);
        } else {
          console.error('[SimpleSpeech] Audio file is empty or not created');
          resolve(false);
        }
      } else {
        console.error(`[SimpleSpeech] ffmpeg exited with code ${code}`);
        console.error(`[SimpleSpeech] ffmpeg stderr: ${stdErrOutput}`);
        resolve(false);
      }
    });
    
    ffmpegProcess.on('error', (err) => {
      console.error('[SimpleSpeech] ffmpeg process error:', err);
      resolve(false);
    });
  });
}

/**
 * Main transcribe function
 */
async function transcribeVideo(videoUrl) {
  console.log(`[SimpleSpeech] Starting transcription process for URL: ${videoUrl}`);
  
  // Create a temporary directory for processing
  const tempDir = path.join(os.tmpdir(), uuidv4());
  fs.mkdirSync(tempDir, { recursive: true });
  
  const videoPath = path.join(tempDir, 'input.webm');
  const audioPath = path.join(tempDir, 'output.wav');
  
  try {
    // Download the video file
    console.log(`[SimpleSpeech] Downloading video file...`);
    const response = await axios.get(videoUrl, { 
      responseType: 'arraybuffer',
      timeout: 30000 // 30 seconds timeout
    });
    
    fs.writeFileSync(videoPath, Buffer.from(response.data));
    console.log(`[SimpleSpeech] Video downloaded: ${response.data.byteLength} bytes`);
    
    // Try to extract audio using ffmpeg-static
    const extractionSuccess = await extractAudioFromVideo(videoPath, audioPath);
    
    if (extractionSuccess) {
      // Use the Azure REST API with extracted audio
      console.log(`[SimpleSpeech] Using extracted audio for transcription`);
      
      try {
        // Step 1: Get Azure Speech token
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
        
        // Step 2: Read audio file
        const audioData = fs.readFileSync(audioPath);
        
        // Step 3: Send to Speech API
        const speechEndpoint = `https://${speechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`;
        
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'audio/wave', // WAV file format
          'Accept': 'application/json'
        };
        
        const transcriptionResponse = await axios.post(
          speechEndpoint,
          audioData,
          {
            headers: headers,
            timeout: 60000 // 60 seconds timeout
          }
        );
        
        // Clean up temp files
        try {
          fs.unlinkSync(videoPath);
          fs.unlinkSync(audioPath);
          fs.rmdirSync(tempDir, { recursive: true });
        } catch (cleanupError) {
          console.warn(`[SimpleSpeech] Cleanup error:`, cleanupError);
        }
        
        if (transcriptionResponse.data.RecognitionStatus === 'Success') {
          const text = transcriptionResponse.data.DisplayText;
          console.log(`[SimpleSpeech] Transcription successful: "${text}"`);
          return text;
        } else {
          console.log(`[SimpleSpeech] No speech detected in recording`);
          return "";
        }
      } catch (apiError) {
        console.error(`[SimpleSpeech] API error:`, apiError);
        // Fall back to trying the direct method
      }
    }
    
    // If extraction failed or API failed, try direct transcription
    console.log(`[SimpleSpeech] Falling back to direct REST API method`);
    
    // Clean up temp files from first attempt
    try {
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      fs.rmdirSync(tempDir, { recursive: true });
    } catch (cleanupError) {
      console.warn(`[SimpleSpeech] Cleanup error:`, cleanupError);
    }
    
    // Try the REST API with the original video directly
    return await transcribeAudioREST(videoUrl);
    
  } catch (error) {
    console.error(`[SimpleSpeech] Transcription failed:`, error);
    
    // Clean up temp files
    try {
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      fs.rmdirSync(tempDir, { recursive: true });
    } catch (cleanupError) {
      console.warn(`[SimpleSpeech] Cleanup error:`, cleanupError);
    }
    
    return "";
  }
}

module.exports = {
  transcribeVideo
};