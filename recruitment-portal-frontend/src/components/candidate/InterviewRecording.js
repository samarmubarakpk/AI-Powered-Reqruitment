// src/components/candidate/InterviewRecording.js (enhanced with completion state handling)
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { candidateService } from '../../services/api';
import NavBar from '../layout/NavBar';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';


// Define custom colors directly from HomePage
const colors = {
  primaryBlue: {
    light: '#2a6d8f',
    dark: '#1a4d6f',
    veryLight: '#e6f0f3'
  },
  primaryTeal: {
    light: '#5fb3a1',
    dark: '#3f9381',
    veryLight: '#eaf5f2'
  },
  primaryOrange: {
    light: '#f5923e',
    dark: '#e67e22',
    veryLight: '#fef2e9'
  }
};

function InterviewRecording() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [interview, setInterview] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Single recording states
  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);

  //text to speech states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechSynthesizerRef = useRef(null);
  
  // References for media handling
  const mediaRecorderRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  // Fetch interview details when component mounts
  useEffect(() => {
    // Enhanced fetchInterviewDetails function with detailed logging
    const fetchInterviewDetails = async () => {
      try {
        setLoading(true);
        console.log('==================== INTERVIEW DEBUGGING ====================');
        console.log('Fetching interview details for ID:', interviewId);
        
        // First, try to get the scheduled interview
        const response = await candidateService.getInterviewDetails(interviewId);
        console.log('Primary interview response:', response);
        
        // Extract the candidateId and vacancyId from the response
        const interviewData = response.data || {};
        console.log('interviewData structure:', {
          id: interviewData.id,
          candidateId: interviewData.candidateId,
          vacancyId: interviewData.vacancyId,
          scheduledAt: interviewData.scheduledAt,
          status: interviewData.status,
          hasQuestions: !!interviewData.questions,
          questionsArray: Array.isArray(interviewData.questions),
          questionsLength: interviewData.questions ? interviewData.questions.length : 0
        });
        
        // If the interview is already completed, redirect to dashboard with a message
        if (interviewData.status === 'completed') {
          console.log('Interview is already completed, redirecting to dashboard');
          setError('Esta entrevista ya ha sido completada. No puedes volver a grabarla.');
          setLoading(false);
          // We'll still set the interview data so the completed state can be displayed
          setInterview(interviewData);
          return;
        }
        
        const { candidateId, vacancyId } = interviewData;
        
        // If we don't have questions but have candidateId and vacancyId, try to find them
        if ((!interviewData.questions || !Array.isArray(interviewData.questions) || interviewData.questions.length === 0) && 
            candidateId && vacancyId) {
          console.log('🔴 NO QUESTIONS FOUND in primary interview record, trying to find related interviews...');
          
          // IMPORTANT: Try using the ID prefix pattern matching first
          if (interviewId) {
            // Extract the prefix parts (usually vacancyId-candidateId)
            const idParts = interviewId.split('-');
            if (idParts.length >= 2) {
              const idPrefix = `${idParts[0]}-${idParts[1]}`;
              console.log(`Looking for related interviews with ID prefix: ${idPrefix}-*`);
              
              try {
                // Use the debug endpoint to find documents with matching ID prefix
                const debugResponse = await candidateService.getDebugInterview(interviewId);
                console.log('Debug interview response:', debugResponse);
                
                // If we found any questions in the debug response, use them
                if (debugResponse.data && debugResponse.data.interview && 
                    debugResponse.data.interview.questions && 
                    Array.isArray(debugResponse.data.interview.questions) && 
                    debugResponse.data.interview.questions.length > 0) {
                  console.log(`🟢 FOUND QUESTIONS via debug endpoint: ${debugResponse.data.interview.questions.length} questions`);
                  interviewData.questions = debugResponse.data.interview.questions;
                } else if (debugResponse.data && debugResponse.data.relatedInterviews) {
                  // Check if any related interviews have questions
                  const interviewWithQuestions = debugResponse.data.relatedInterviews.find(
                    interview => interview.questions && 
                                Array.isArray(interview.questions) && 
                                interview.questions.length > 0
                  );
                  
                  if (interviewWithQuestions) {
                    console.log(`🟢 FOUND QUESTIONS in related interview: ${interviewWithQuestions.id}`);
                    interviewData.questions = interviewWithQuestions.questions;
                  }
                }
              } catch (debugError) {
                console.error('Error with debug endpoint:', debugError);
              }
            }
          }
          
          // If still no questions, try the direct interviews endpoint
          if (!interviewData.questions || !Array.isArray(interviewData.questions) || interviewData.questions.length === 0) {
            try {
              console.log(`Making direct API call to get all interviews for candidate=${candidateId} and vacancy=${vacancyId}`);
              
              const allInterviewsResponse = await candidateService.getAllInterviews(candidateId, vacancyId);
              console.log('All related interviews found:', allInterviewsResponse.data);
              
              if (allInterviewsResponse.data && allInterviewsResponse.data.interviews) {
                const interviews = allInterviewsResponse.data.interviews;
                console.log(`Total interviews found: ${interviews.length}`);
                
                // Look for a completed interview
                const completedInterview = interviews.find(
                  interview => interview.status === 'completed'
                );
                
                if (completedInterview) {
                  console.log(`🟢 FOUND COMPLETED INTERVIEW: ${completedInterview.id}`);
                  console.log('This interview has already been completed');
                  setError('Esta entrevista ya ha sido completada por ti. No puedes volver a grabarla.');
                  setLoading(false);
                  
                  // We'll still set the interview data
                  setInterview({
                    ...interviewData,
                    status: 'completed'
                  });
                  return;
                }
                
                // Log each interview in detail
                interviews.forEach((interview, index) => {
                  console.log(`Interview #${index + 1} - ID: ${interview.id}`);
                  console.log(`  Status: ${interview.status || 'unknown'}`);
                  console.log(`  Has questions property: ${interview.hasOwnProperty('questions')}`);
                  console.log(`  Questions is array: ${Array.isArray(interview.questions)}`);
                  console.log(`  Questions length: ${interview.questions ? interview.questions.length : 0}`);
                });
                
                // Find the interview with questions
                const questionInterview = interviews.find(
                  interview => interview.questions && 
                              Array.isArray(interview.questions) && 
                              interview.questions.length > 0 &&
                              interview.id !== interviewId // Not the same as current interview
                );
                
                if (questionInterview) {
                  console.log(`🟢 FOUND INTERVIEW WITH QUESTIONS: ${questionInterview.id}`);
                  console.log(`Questions found: ${questionInterview.questions.length}`);
                  
                  // Merge the questions into our interview data
                  interviewData.questions = questionInterview.questions;
                  console.log('Questions merged successfully. New question count:', interviewData.questions.length);
                } else {
                  console.log('🔴 NO INTERVIEW WITH QUESTIONS FOUND in the related records');
                }
              }
            } catch (relatedError) {
              console.error('Error fetching related interviews:', relatedError);
            }
          }
          
          // As a last resort, try a direct questions endpoint
          if (!interviewData.questions || !Array.isArray(interviewData.questions) || interviewData.questions.length === 0) {
            try {
              console.log('Trying dedicated questions endpoint as last resort');
              const questionsResponse = await candidateService.getInterviewQuestions(interviewId, candidateId, vacancyId);
              
              if (questionsResponse.data && 
                  questionsResponse.data.questions && 
                  Array.isArray(questionsResponse.data.questions) &&
                  questionsResponse.data.questions.length > 0) {
                console.log(`🟢 FOUND QUESTIONS via dedicated endpoint: ${questionsResponse.data.questions.length} questions`);
                interviewData.questions = questionsResponse.data.questions;
              }
            } catch (questionsError) {
              console.error('Error fetching questions with dedicated endpoint:', questionsError);
            }
          }
        }
        
        // Log the final data before setting it
        console.log('Final interview data to be used:', {
          id: interviewData.id,
          hasQuestions: !!interviewData.questions,
          questionsArray: Array.isArray(interviewData.questions),
          questionsLength: interviewData.questions ? interviewData.questions.length : 0,
          questionsValid: interviewData.questions && 
                         Array.isArray(interviewData.questions) && 
                         interviewData.questions.length > 0
        });
        
        // Only use fallback as absolute last resort
        const USE_FALLBACK_QUESTIONS = true; // Set to true to allow fallback
        
        if ((!interviewData.questions || !Array.isArray(interviewData.questions) || interviewData.questions.length === 0) && 
            USE_FALLBACK_QUESTIONS) {
          console.warn('🟠 CREATING FALLBACK QUESTIONS as no valid questions were found');
          interviewData.questions = [
            {
              category: "Technical",
              question: "¿Puedes explicarnos cómo optimizarías una publicación de blog con bajo rendimiento para SEO?",
              explanation: "Esto evalúa tu conocimiento técnico de prácticas de SEO."
            },
            {
              category: "Behavioral",
              question: "Cuéntanos sobre una ocasión en la que tuviste que adaptarte rápidamente a un cambio significativo en la estrategia o prioridades de marketing.",
              explanation: "Esto nos ayuda a entender tu adaptabilidad y habilidades para resolver problemas."
            }
          ];
          console.log('Fallback questions created. Count:', interviewData.questions.length);
        }
        
        console.log('==================== END DEBUGGING ====================');
        
        setInterview(interviewData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching interview details:', err);
        setError('No se pudieron cargar los detalles de la entrevista. Por favor, inténtalo más tarde.');
        setLoading(false);
      }
    };

    fetchInterviewDetails();
    
    // Clean up camera and microphone on component unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (speechSynthesizerRef.current) {
        speechSynthesizerRef.current.close();
      }

    };
  }, [interviewId]);

  // Add this separate useEffect specifically for camera initialization
  useEffect(() => {
    // This effect handles camera initialization independently of interview data
    let isMounted = true; // Flag to prevent state updates after unmount
    
    const setupCamera = async () => {
      // Only initialize if instructions are accepted and component is still mounted
      if (!showInstructions && isMounted) {
        try {
          console.log("Setting up camera independently of interview data...");
          
          // Clear any existing stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          
          // Request camera with specific constraints
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user"
            }, 
            audio: true 
          });
          
          if (!isMounted) {
            // Component unmounted during camera setup, clean up stream
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          
          // Save stream reference
          streamRef.current = stream;
          
          // Log video tracks to debug
          const videoTracks = stream.getVideoTracks();
          console.log(`Got ${videoTracks.length} video tracks:`, 
            videoTracks.map(track => ({ label: track.label, enabled: track.enabled })));
          
          // Make sure video element exists before setting stream
          if (videoRef.current) {
            console.log("Attaching stream to video element");
            videoRef.current.srcObject = stream;
            videoRef.current.muted = true; // Prevent audio feedback
            
            // Force play the video stream
            try {
              await videoRef.current.play();
              console.log("Video playback started successfully");
            } catch (playError) {
              console.error("Error auto-playing video:", playError);
              // Most browsers require user interaction for autoplay
              // We'll handle this in the UI
            }
          } else {
            console.error("Video element reference is not available");
          }
        } catch (err) {
          if (isMounted) {
            console.error('Error accessing camera:', err);
            setError('No se pudo acceder a tu cámara. Por favor, asegúrate de haber concedido los permisos necesarios y que tus dispositivos estén funcionando correctamente.');
          }
        }
      }
    };
    
    setupCamera();
    
    // Clean up on unmount
    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [showInstructions]); // Only depend on showInstructions to control when camera initializes

// Add this useEffect to ensure the video properly displays the stream
useEffect(() => {
  // This effect ensures video is properly initialized after stream is available
  if (videoRef.current && streamRef.current && !showInstructions) {
    console.log("Ensuring video element has the correct stream");
    videoRef.current.srcObject = streamRef.current;
    
    // Try to play the video whenever the stream is updated
    videoRef.current.play().catch(err => {
      console.warn("Could not auto-play video after stream update:", err);
      // Some browsers block autoplay without user interaction
    });
  }
}, [videoRef.current, streamRef.current, showInstructions]);

// Timer effect for continuous recording time tracking
useEffect(() => {
  if (recording) {
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  } else if (timerRef.current) {
    clearInterval(timerRef.current);
  }
  
  return () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };
}, [recording]);

// Handle accepting instructions and starting the interview
const acceptInstructions = () => {
  // Check if interview is already completed
  if (interview?.status === 'completed') {
    setError('Esta entrevista ya ha sido completada. No puedes volver a grabarla.');
    return;
  }
  
  // Simply set the flag to false, which will trigger the camera setup useEffect
  setShowInstructions(false);
  
  // Don't call initializeCamera() directly here, 
  // let the separate useEffect handle it for better reliability
  
  console.log("Instructions accepted, camera setup will begin");
};

// Initialize camera and permission requests (kept for reference but not used directly)
const initializeCamera = async () => {
  try {
    console.log("Initializing camera...");
    // Request camera with specific constraints for better compatibility
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user" // Front-facing camera
      }, 
      audio: true 
    });
    
    // Save stream reference
    streamRef.current = stream;
    
    // Log video tracks to verify we're getting video
    const videoTracks = stream.getVideoTracks();
    console.log(`Got ${videoTracks.length} video tracks:`, 
      videoTracks.map(track => track.label));
    
    // Make sure video element exists before setting stream
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true; // Prevent audio feedback
      
      // Force play the video stream (important)
      try {
        await videoRef.current.play();
        console.log("Video playback started successfully");
      } catch (playError) {
        console.error("Error auto-playing video:", playError);
        
        // Some browsers require user interaction before playing
        // Add a click-to-play fallback
        alert("Haz clic en cualquier parte de la pantalla para iniciar tu cámara");
        document.addEventListener('click', () => {
          videoRef.current.play()
            .then(() => console.log("Video playing after user click"))
            .catch(e => console.error("Play on click failed:", e));
        }, { once: true });
      }
    } else {
      console.error("Video element reference is not available");
    }
  } catch (err) {
    console.error('Error accessing camera:', err);
    setError('No se pudo acceder a tu cámara y micrófono. Por favor, asegúrate de haber concedido los permisos necesarios y que tus dispositivos estén funcionando correctamente.');
  }
};

// Text-to-Speech function to read out the current question
const speakQuestion = (questionText) => {
  if (isSpeaking) {
    // If already speaking, stop current speech
    if (speechSynthesizerRef.current) {
      speechSynthesizerRef.current.close();
      speechSynthesizerRef.current = null;
      setIsSpeaking(false);
      return;
    }
  }

  try {
    setIsSpeaking(true);
    
    // Get Azure credentials from environment variables
    const speechKey = process.env.REACT_APP_AZURE_SPEECH_KEY;
    const speechRegion = process.env.REACT_APP_AZURE_SPEECH_REGION;
    
    if (!speechKey || !speechRegion) {
      console.error('Azure Speech credentials not configured');
      setIsSpeaking(false);
      return;
    }
    
    // Configure speech synthesis
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(speechKey, speechRegion);
    
    // Set the voice to Spanish (Spain) - female
    speechConfig.speechSynthesisVoiceName = "es-ES-ElviraNeural";
    speechConfig.speechSynthesisLanguage = "es-ES";
    
    // Create the synthesizer
    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);
    speechSynthesizerRef.current = synthesizer;
    
    // Start speaking
    synthesizer.speakTextAsync(
      questionText,
      result => {
        // Speaking completed successfully
        if (result) {
          console.log('Speech synthesis completed');
          synthesizer.close();
          speechSynthesizerRef.current = null;
          setIsSpeaking(false);
        }
      },
      error => {
        // Speaking error
        console.error('Speech synthesis error:', error);
        synthesizer.close();
        speechSynthesizerRef.current = null;
        setIsSpeaking(false);
      }
    );
  } catch (error) {
    console.error('Error initializing speech synthesis:', error);
    setIsSpeaking(false);
  }
};

// Fallback TTS using browser's built-in speech synthesis
const speakQuestionFallback = (questionText) => {
  if (isSpeaking) {
    // If already speaking, stop current speech
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    return;
  }

  try {
    setIsSpeaking(true);
    
    // Check if speech synthesis is available
    if (!window.speechSynthesis) {
      console.error('Speech synthesis is not supported in this browser');
      setIsSpeaking(false);
      return;
    }
    
    // Create a new speech synthesis utterance
    const utterance = new SpeechSynthesisUtterance(questionText);
    
    // Set the language to Spanish
    utterance.lang = 'es-ES';
    
    // Set voice to a Spanish voice if available
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(voice => voice.lang.includes('es'));
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }
    
    // Event handlers
    utterance.onend = () => {
      console.log('Speech synthesis completed');
      setIsSpeaking(false);
    };
    
    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error);
      setIsSpeaking(false);
    };
    
    // Start speaking
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error('Error with browser speech synthesis:', error);
    setIsSpeaking(false);
  }
};

// Combine both TTS methods for better reliability
const handleSpeakQuestion = (questionText) => {
  try {
    // Try Azure Speech Service first
    if (process.env.REACT_APP_AZURE_SPEECH_KEY && process.env.REACT_APP_AZURE_SPEECH_REGION) {
      speakQuestion(questionText);
    } else {
      // Fall back to browser's native TTS
      speakQuestionFallback(questionText);
    }
  } catch (error) {
    console.error('TTS error:', error);
    // Try browser fallback if Azure fails
    try {
      speakQuestionFallback(questionText);
    } catch (fallbackError) {
      console.error('Fallback TTS also failed:', fallbackError);
      setIsSpeaking(false);
    }
  }
};

// Start recording - record the entire interview in one session
const startRecording = () => {
  if (!streamRef.current) {
    console.error('No media stream available');
    setError('No hay acceso a la cámara. Por favor, actualiza la página e inténtalo de nuevo.');
    return;
  }
  
  try {
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9,opus'
    });
    
    const chunks = [];
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      setRecordedChunks(chunks);
      setRecordingComplete(true);
    };
    
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(1000); // Collect data every second
    
    setRecording(true);
    setElapsedTime(0); // Reset timer when starting recording
  } catch (err) {
    console.error('Error starting recording:', err);
    setError('Error al iniciar la grabación. Por favor, actualiza la página e inténtalo de nuevo.');
  }
};

// Stop recording - end the entire interview session
const stopRecording = () => {
  if (mediaRecorderRef.current && recording) {
    mediaRecorderRef.current.stop();
    setRecording(false);
  }
};

// Move to next question (while continuing the same recording)
const nextQuestion = () => {
  if (interview?.questions && 
      currentQuestionIndex < interview.questions.length - 1) {
    setCurrentQuestionIndex(prevIndex => prevIndex + 1);
  }
};

// Go back to previous question (while continuing the same recording)
const previousQuestion = () => {
  if (currentQuestionIndex > 0) {
    setCurrentQuestionIndex(prevIndex => prevIndex - 1);
  }
};

const uploadRecording = async () => {
  if (recordedChunks.length === 0) {
    setError('No hay grabación para subir.');
    return;
  }
  
  try {
    setUploading(true);
    
    // Create a blob from the recorded chunks
    const blob = new Blob(recordedChunks, {
      type: 'video/webm'
    });
    
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('interviewRecording', blob, `interview-${interviewId}-full.webm`);
    formData.append('interviewId', interviewId);
    formData.append('questionCount', interview?.questions?.length || 0);
    formData.append('questionIndex', currentQuestionIndex.toString());
    
    // Upload the recording
    const response = await candidateService.uploadInterviewRecording(formData, (progress) => {
      setUploadProgress(progress);
    });
    
    setUploadComplete(true);
    setUploading(false);
    
    // Update the interview status locally to reflect completion
    setInterview(prev => ({
      ...prev,
      status: 'completed',
      completedAt: new Date().toISOString()
    }));
    
    // AGGRESSIVE FIX: Directly store this interview ID in localStorage to mark it as completed
    try {
      // Get existing completed interview IDs
      const storageKey = 'completedInterviewIds';
      const storedIds = localStorage.getItem(storageKey);
      const completedIds = storedIds ? JSON.parse(storedIds) : [];
      
      // Add this interview ID if not already present
      if (!completedIds.includes(interviewId)) {
        completedIds.push(interviewId);
        localStorage.setItem(storageKey, JSON.stringify(completedIds));
      }
      
      console.log(`Saved interview ${interviewId} as completed in localStorage`);
      
      // Also dispatch a custom event to notify other components about the completion
      const event = new CustomEvent('interviewCompleted', { 
        detail: { interviewId, vacancyId: interview.vacancyId }
      });
      window.dispatchEvent(event);
      
    } catch (storageError) {
      console.error('Failed to update localStorage:', storageError);
      // Continue even if localStorage fails
    }
    
  } catch (err) {
    console.error('Error uploading recording:', err);
    setError('Error al subir la grabación. Por favor, inténtalo de nuevo.');
    setUploading(false);
  }
};

// Format time for display (MM:SS)
const formatTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Display instructions screen
if (showInstructions) {
  return (
    <div style={{ backgroundColor: colors.primaryBlue.veryLight, minHeight: '100vh' }}>
      <NavBar userType="candidate" />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4" style={{ backgroundColor: colors.primaryBlue.light }}>
            <h1 className="text-2xl font-bold text-white">Instrucciones de la Entrevista</h1>
          </div>
          
          {/* Show error banner if interview is already completed */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* If interview is already completed, show message and back to dashboard button */}
          {interview?.status === 'completed' ? (
            <div className="p-6 space-y-6">
              <div className="bg-green-50 border-l-4 border-green-500 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">Ya has completado esta entrevista. No puedes grabarla nuevamente.</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 text-center">
                <Link
                  to="/candidate/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  style={{ backgroundColor: colors.primaryBlue.light }}
                >
                  Volver al Panel
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <h2 className="text-lg font-medium text-blue-700">Por favor, lee cuidadosamente antes de continuar</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-700">Serás grabado (video y audio) durante toda la sesión de la entrevista.</p>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-700">Todas las preguntas deben ser respondidas en una sola sesión de grabación.</p>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-700">Asegúrate de que tu rostro sea claramente visible en la cámara durante toda la entrevista.</p>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-700">Habla claramente y asegúrate de que tu micrófono funcione correctamente.</p>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-700">Usa el botón "Siguiente Pregunta" para navegar por las preguntas mientras grabas.</p>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-700">Una vez que termines de responder todas las preguntas, haz clic en "Finalizar Grabación" para enviar.</p>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 text-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="ml-3 text-red-700 font-medium">IMPORTANTE: Solo podrás completar esta entrevista una vez. No se permite volver a grabar la entrevista después de enviarla.</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium text-gray-700 mb-2">Requisitos Técnicos:</h3>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                  <li>Una webcam y micrófono que funcionen</li>
                  <li>Conexión a Internet estable</li>
                  <li>Navegador moderno (Chrome, Firefox, Edge recomendados)</li>
                  <li>Permitir permisos de cámara y micrófono cuando se te solicite</li>
                </ul>
              </div>
              
              <div className="pt-4">
                <button
                  onClick={acceptInstructions}
                  className="w-full py-3 rounded-md text-white hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{ backgroundColor: colors.primaryBlue.light }}
                >
                  Entiendo - Iniciar Entrevista
                </button>
                
                <Link
                  to="/candidate/dashboard"
                  className="block text-center mt-4 hover:text-opacity-80"
                  style={{ color: colors.primaryBlue.dark }}
                >
                  Volver al Panel
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Handle loading state
if (loading) {
  return (
    <div style={{ backgroundColor: colors.primaryBlue.veryLight, minHeight: '100vh' }}>
      <NavBar userType="candidate" />
      <div className="max-w-7xl mx-auto px-4 py-8 flex justify-center">
        <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: colors.primaryBlue.light }}></div>
            <p className="mt-4 text-gray-600">Cargando entrevista...</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div style={{ backgroundColor: colors.primaryBlue.veryLight, minHeight: '100vh' }}>
        <NavBar userType="candidate" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                <Link to="/candidate/dashboard" className="text-sm font-medium text-red-700 hover:text-red-600 mt-2 inline-block">
                  Volver al Panel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle no interview found
  if (!interview) {
    return (
      <div style={{ backgroundColor: colors.primaryBlue.veryLight, minHeight: '100vh' }}>
        <NavBar userType="candidate" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  No se encontró ninguna entrevista. La entrevista puede haber sido cancelada o completada.
                </p>
                <Link to="/candidate/dashboard" className="text-sm font-medium text-yellow-700 hover:text-yellow-600 mt-2 inline-block">
                  Volver al Panel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If the interview is already completed, show a message
  if (interview.status === 'completed') {
    return (
      <div style={{ backgroundColor: colors.primaryBlue.veryLight, minHeight: '100vh' }}>
        <NavBar userType="candidate" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-bold text-green-800">¡Entrevista Completada!</h2>
                <p className="text-green-700 mt-1">
                  Ya has completado esta entrevista para {interview.vacancyTitle || 'este puesto'}.
                </p>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-gray-700 mb-4">
                Tus respuestas han sido grabadas y están siendo revisadas por el equipo de contratación.
                No es posible volver a realizar esta entrevista. Se te notificará sobre los próximos pasos en el proceso de selección.
              </p>
              
              <Link
                to="/candidate/dashboard"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                style={{ backgroundColor: colors.primaryBlue.light }}
              >
                Volver al Panel
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get the current question with null checks
  const currentQuestion = interview?.questions && Array.isArray(interview.questions) && interview.questions.length > 0 
    ? interview.questions[currentQuestionIndex] 
    : null;
  
  // Get total questions count with null checks
  const totalQuestions = interview?.questions && Array.isArray(interview.questions) ? interview.questions.length : 0;
  
  // Handle upload complete state
  if (uploadComplete) {
    return (
      <div style={{ backgroundColor: colors.primaryBlue.veryLight, minHeight: '100vh' }}>
        <NavBar userType="candidate" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-bold text-green-800">¡Entrevista Completada!</h2>
                <p className="text-green-700 mt-1">
                  Gracias por completar tu entrevista para {interview.vacancyTitle || 'este puesto'}.
                </p>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-gray-700 mb-4">
                Tus respuestas han sido grabadas con éxito y serán revisadas por el equipo de contratación.
                Recuerda que no es posible volver a realizar esta entrevista. Se te notificará sobre los próximos pasos en el proceso de selección.
              </p>
              
              <Link
                to="/candidate/dashboard" 
                state={{ interviewCompleted: true, completedInterviewId: interviewId }}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                style={{ backgroundColor: colors.primaryBlue.light }}
              >
                Volver al Panel
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: colors.primaryBlue.veryLight, minHeight: '100vh' }}>
      <NavBar userType="candidate" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Entrevista con IA</h1>
          <p className="text-gray-600">
            Puesto: {interview.vacancyTitle || 'Puesto de Trabajo'} • Pregunta {currentQuestionIndex + 1} de {totalQuestions}
          </p>
        </div>
        
        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Video */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {/* Video container */}
              <div className="aspect-video bg-gray-900 relative">
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  autoPlay
                  playsInline
                  muted={true} // Only mute when not recording to avoid feedback
                />
                
                {/* Recording indicator */}
                {recording && (
                  <div className="absolute top-4 left-4 flex items-center bg-black bg-opacity-50 text-white px-3 py-1 rounded-full">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2 animate-pulse"></div>
                    <span>Grabando • {formatTime(elapsedTime)}</span>
                  </div>
                )}
                
                {/* Upload progress overlay */}
                {uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center">
                    <div className="text-center">
                      <h3 className="text-white font-bold text-xl mb-4">Subiendo Grabación</h3>
                      <div className="w-64 bg-gray-600 rounded-full h-4 mb-2">
                        <div 
                          className="bg-green-500 h-4 rounded-full" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <span className="text-white">{uploadProgress}%</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Controls */}
              <div className="p-4">
                <div className="flex flex-wrap justify-center gap-4">
                  {!recording && !recordingComplete && (
                    <button
                      onClick={startRecording}
                      className="px-6 py-2 text-white rounded-md hover:bg-opacity-90 flex items-center"
                      style={{ backgroundColor: colors.primaryBlue.light }}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                        <circle cx="12" cy="12" r="4" fill="currentColor" />
                      </svg>
                      Iniciar Grabación
                    </button>
                  )}
                  
                  {recording && (
                    <>
                      {/* Question navigation buttons while recording */}
                      <div className="flex items-center gap-4">
                        <button
                          onClick={previousQuestion}
                          disabled={currentQuestionIndex === 0}
                          className={`px-4 py-2 rounded-md flex items-center ${
                            currentQuestionIndex === 0 
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                              : 'bg-gray-600 text-white hover:bg-gray-700'
                          }`}
                        >
                          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                          </svg>
                          Anterior
                        </button>
                        
                        <button
                          onClick={nextQuestion}
                          disabled={currentQuestionIndex === totalQuestions - 1}
                          className={`px-4 py-2 rounded-md flex items-center ${
                            currentQuestionIndex === totalQuestions - 1 
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                              : 'text-white hover:bg-opacity-90'
                          }`}
                          style={currentQuestionIndex === totalQuestions - 1 ? {} : { backgroundColor: colors.primaryTeal.light }}
                        >
                          Siguiente
                          <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Stop recording button */}
                      <button
                        onClick={stopRecording}
                        className="px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 flex items-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <rect x="6" y="6" width="12" height="12" strokeWidth="2" />
                        </svg>
                        Finalizar Grabación
                      </button>
                    </>
                  )}
                  
                  {recordingComplete && !uploading && (
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          setRecordingComplete(false);
                          setRecordedChunks([]);
                          // Reset to first question to start over
                          setCurrentQuestionIndex(0);
                          startRecording();
                        }}
                        className="px-6 py-2 text-white rounded-md hover:bg-opacity-90 flex items-center"
                        style={{ backgroundColor: colors.primaryBlue.light }}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Comenzar de Nuevo
                      </button>
                      
                      <button
                        onClick={uploadRecording}
                        className="px-6 py-2 text-white rounded-md hover:bg-opacity-90 flex items-center"
                        style={{ backgroundColor: colors.primaryTeal.light }}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Enviar Entrevista
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column: Question and information */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-4 text-white" style={{ backgroundColor: colors.primaryBlue.light }}>
                <h2 className="font-medium">Pregunta Actual</h2>
              </div>
              
                        {/* Question content */}
                        {currentQuestion ? (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      currentQuestion.category === 'Technical' ? 'bg-blue-100 text-blue-800' :
                      currentQuestion.category === 'Behavioral' ? 'bg-green-100 text-green-800' :
                      currentQuestion.category === 'Situational' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {currentQuestion.category === 'Technical' ? 'Técnica' : 
                       currentQuestion.category === 'Behavioral' ? 'Conductual' :
                       currentQuestion.category === 'Situational' ? 'Situacional' :
                       currentQuestion.category || 'Pregunta'}
                    </div>
                    
                    {/* Text-to-Speech Button */}
                    <button
                      onClick={() => handleSpeakQuestion(currentQuestion.question)}
                      className="p-1 rounded-full hover:bg-gray-100 focus:outline-none"
                      aria-label="Escuchar pregunta"
                      title="Escuchar pregunta"
                    >
                      {isSpeaking ? (
                        <svg className="w-6 h-6 text-indigo-600 animate-pulse" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-gray-500 hover:text-indigo-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-gray-900 font-medium">{currentQuestion.question}</p>
                  </div>
                  
                  {currentQuestion.explanation && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Consejo:</h3>
                      <p className="text-sm text-gray-600">{currentQuestion.explanation}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4">
                  <p className="text-gray-500">No hay preguntas disponibles para esta entrevista.</p>
                </div>
              )}
              
              {/* Interview progress */}
              <div className="border-t border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Progreso de la Entrevista</h3>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div 
                    className="h-2.5 rounded-full" 
                    style={{ 
                      width: `${((currentQuestionIndex + 1) / Math.max(totalQuestions, 1)) * 100}%`,
                      backgroundColor: colors.primaryTeal.light
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Pregunta {currentQuestionIndex + 1}/{totalQuestions || 1}</span>
                  <span>{Math.round(((currentQuestionIndex + 1) / Math.max(totalQuestions, 1)) * 100)}% completado</span>
                </div>
              </div>
              
              {/* Instructions reminder */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center mb-2">
                  <svg className="h-5 w-5 mr-2" style={{ color: colors.primaryBlue.light }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-sm font-medium text-gray-700">Recordatorios</h3>
                </div>
                <ul className="text-xs text-gray-600 space-y-1 pl-7 list-disc">
                  <li>Tu entrevista completa está siendo grabada en una sola sesión</li>
                  <li>Usa los botones Siguiente/Anterior para navegar por las preguntas</li>
                  <li>Asegúrate de responder todas las preguntas antes de finalizar</li>
                  <li>Haz clic en "Finalizar Grabación" cuando hayas completado todas las preguntas</li>
                  <li>Puedes hacer clic en el ícono del altavoz para escuchar la pregunta</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InterviewRecording;