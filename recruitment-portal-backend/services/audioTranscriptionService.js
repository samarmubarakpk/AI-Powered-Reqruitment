// services/audioTranscriptionService.js
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const { SpeechConfig, AudioConfig, SpeechRecognizer } = require('microsoft-cognitiveservices-speech-sdk');

/**
 * Extract audio from a video file using ffmpeg
 * @param {string} blobName - The full path to the video file in blob storage
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
 * Main function to transcribe audio from a video URL
 */
async function transcribeVideoAudio(videoUrl) {
  try {
    console.log(`[AudioTranscription] Starting transcription process for: ${videoUrl}`);
    
    // Extract audio from video
    const audioPath = await extractAudioFromVideo(videoUrl);
    console.log(`[AudioTranscription] Audio extracted to: ${audioPath}`);
    
    // Transcribe audio
    const transcription = await transcribeAudioFile(audioPath);
    console.log(`[AudioTranscription] Transcription completed with ${transcription.length} characters`);
    
    return transcription;
  } catch (error) {
    console.error('[AudioTranscription] Error in transcription process:', error);
    throw error;
  }
}

module.exports = {
  transcribeVideoAudio
};