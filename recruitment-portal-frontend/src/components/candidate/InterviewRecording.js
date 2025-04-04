// src/components/candidate/InterviewRecording.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { candidateService } from '../../services/api';
import NavBar from '../layout/NavBar';

function InterviewRecording() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [interview, setInterview] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(5); // 5 minutes per question
  
  // Recording states
  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [allQuestionsCompleted, setAllQuestionsCompleted] = useState(false);
  
  // References for media handling
  const mediaRecorderRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  // Fetch interview details when component mounts
  useEffect(() => {
    const fetchInterviewDetails = async () => {
      try {
        setLoading(true);
        console.log('Fetching interview details for ID:', interviewId);
        const response = await candidateService.getInterviewDetails(interviewId);
        console.log('Interview details response:', response);
        
        // Ensure we have a valid interview object with questions array
        const interviewData = response.data || {};
        if (!interviewData.questions || !Array.isArray(interviewData.questions)) {
          console.log('No questions array found, initializing empty array');
          interviewData.questions = []; // Initialize as empty array if missing
        }
        
        console.log('Processed interview data:', interviewData);
        setInterview(interviewData);
        
        // Check if any questions have already been answered
        if (interviewData.recordings && Array.isArray(interviewData.recordings) && interviewData.recordings.length > 0) {
          const answeredQuestions = interviewData.recordings.map(r => r.questionIndex);
          const highestAnswered = Math.max(...answeredQuestions);
          // Start with the next unanswered question
          setCurrentQuestionIndex(highestAnswered + 1);
          
          // Check if all questions are already answered
          if (interviewData.questions.length > 0 && highestAnswered >= interviewData.questions.length - 1) {
            setAllQuestionsCompleted(true);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching interview details:', err);
        setError('Failed to load interview details. Please try again later.');
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
    };
  }, [interviewId]);

  // Timer effect
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prevSeconds => {
          if (prevSeconds === 59) {
            setTimerMinutes(prevMinutes => {
              if (prevMinutes === 0) {
                // Time's up - stop recording automatically
                clearInterval(timerRef.current);
                if (recording) {
                  stopRecording();
                }
                return 0;
              }
              return prevMinutes - 1;
            });
            return 0;
          }
          return prevSeconds + 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerActive, recording]);

  // Handle accepting instructions and starting the interview
  const acceptInstructions = () => {
    setShowInstructions(false);
    // Initialize camera after accepting instructions
    initializeCamera();
  };

  // Initialize camera and permission requests
  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      streamRef.current = stream;
      
      // Display the video stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Failed to access your camera and microphone. Please ensure you have granted the necessary permissions and that your devices are working properly.');
    }
  };

  // Start recording
  const startRecording = () => {
    if (!streamRef.current) {
      console.error('No media stream available');
      setError('No camera access. Please refresh and try again.');
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
        setTimerActive(false);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      
      setRecording(true);
      setTimerActive(true);
      setTimerMinutes(5); // Reset timer to 5 minutes
      setTimerSeconds(0);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please refresh and try again.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // Upload recording to server
  const uploadRecording = async () => {
    if (recordedChunks.length === 0) {
      setError('No recording to upload.');
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
      formData.append('interviewRecording', blob, `interview-${interviewId}-q${currentQuestionIndex}.webm`);
      formData.append('interviewId', interviewId);
      formData.append('questionIndex', currentQuestionIndex);
      
      // Upload the recording
      const response = await candidateService.uploadInterviewRecording(formData, (progress) => {
        setUploadProgress(progress);
      });
      
      setUploadComplete(true);
      setUploading(false);
      
      // Check if this was the last question
      if (interview && interview.questions && Array.isArray(interview.questions) && 
          currentQuestionIndex >= interview.questions.length - 1) {
        setAllQuestionsCompleted(true);
      }
    } catch (err) {
      console.error('Error uploading recording:', err);
      setError('Failed to upload recording. Please try again.');
      setUploading(false);
    }
  };

  // Move to next question
  const nextQuestion = () => {
    if (interview && interview.questions && Array.isArray(interview.questions) && 
        currentQuestionIndex < interview.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setRecordedChunks([]);
      setRecordingComplete(false);
      setUploadProgress(0);
      setUploadComplete(false);
      
      // Reset recording state for next question
      if (streamRef.current) {
        // Keep the same stream for the next question
        setTimerMinutes(5);
        setTimerSeconds(0);
      } else {
        // Reinitialize camera if stream was lost
        initializeCamera();
      }
    }
  };

  // Format time for display
  const formatTime = (minutes, seconds) => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Display instructions screen
  if (showInstructions) {
    return (
      <div>
        <NavBar userType="candidate" />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="bg-indigo-600 px-6 py-4">
              <h1 className="text-2xl font-bold text-white">Interview Instructions</h1>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <h2 className="text-lg font-medium text-blue-700">Please read carefully before proceeding</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-700">You will be recorded (video and audio) during this interview.</p>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-700">You have 5 minutes to answer each question.</p>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-700">Ensure your face is clearly visible in the camera throughout the interview.</p>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-700">Speak clearly and ensure your microphone is working properly.</p>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-700">Find a quiet, well-lit environment with no distractions.</p>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-700">You can review your recording before submitting and re-record if needed.</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium text-gray-700 mb-2">Technical Requirements:</h3>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                  <li>A working webcam and microphone</li>
                  <li>Stable internet connection</li>
                  <li>Modern browser (Chrome, Firefox, Edge recommended)</li>
                  <li>Allow camera and microphone permissions when prompted</li>
                </ul>
              </div>
              
              <div className="pt-4">
                <button
                  onClick={acceptInstructions}
                  className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  I Understand - Start Interview
                </button>
                
                <Link
                  to="/candidate/dashboard"
                  className="block text-center mt-4 text-indigo-600 hover:text-indigo-500"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle loading state
  if (loading) {
    return (
      <div>
        <NavBar userType="candidate" />
        <div className="max-w-7xl mx-auto px-4 py-8 flex justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="mt-4 text-gray-600">Loading interview...</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div>
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
                  Return to Dashboard
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
      <div>
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
                  No interview found. The interview may have been cancelled or completed.
                </p>
                <Link to="/candidate/dashboard" className="text-sm font-medium text-yellow-700 hover:text-yellow-600 mt-2 inline-block">
                  Return to Dashboard
                </Link>
              </div>
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
  
  // Handle all questions completed state
  if (allQuestionsCompleted) {
    return (
      <div>
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
                <h2 className="text-xl font-bold text-green-800">Interview Completed!</h2>
                <p className="text-green-700 mt-1">
                  Thank you for completing your interview for {interview.vacancyTitle || 'the position'}.
                </p>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-gray-700 mb-4">
                Your responses have been successfully recorded and will be reviewed by the hiring team.
                You will be notified of the next steps in the recruitment process.
              </p>
              
              <Link
                to="/candidate/dashboard"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavBar userType="candidate" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">AI Interview</h1>
          <p className="text-gray-600">
            Position: {interview.vacancyTitle || 'Job Position'} • Question {currentQuestionIndex + 1} of {totalQuestions}
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
                  muted={!recording} // Only mute when not recording to avoid feedback
                />
                
                {/* Recording indicator */}
                {recording && (
                  <div className="absolute top-4 left-4 flex items-center bg-black bg-opacity-50 text-white px-3 py-1 rounded-full">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2 animate-pulse"></div>
                    <span>Recording • {formatTime(timerMinutes, timerSeconds)}</span>
                  </div>
                )}
                
                {/* Preview overlay for completed recordings */}
                {recordingComplete && !uploading && !uploadComplete && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-center">
                      <h3 className="text-white font-bold text-xl mb-4">Recording Complete</h3>
                      <div className="flex justify-center space-x-4">
                        <button
                          onClick={() => {
                            setRecordingComplete(false);
                            setRecordedChunks([]);
                            startRecording();
                          }}
                          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                        >
                          Record Again
                        </button>
                        <button
                          onClick={uploadRecording}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Submit Answer
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Upload progress overlay */}
                {uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center">
                    <div className="text-center">
                      <h3 className="text-white font-bold text-xl mb-4">Uploading Recording</h3>
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
                      className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                        <circle cx="12" cy="12" r="4" fill="currentColor" />
                      </svg>
                      Start Recording
                    </button>
                  )}
                  
                  {recording && (
                    <button
                      onClick={stopRecording}
                      className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <rect x="6" y="6" width="12" height="12" strokeWidth="2" />
                      </svg>
                      Stop Recording
                    </button>
                  )}
                  
                  {uploadComplete && currentQuestionIndex < (totalQuestions - 1) && (
                    <button
                      onClick={nextQuestion}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                      Next Question
                    </button>
                  )}
                  
                  {uploadComplete && currentQuestionIndex >= (totalQuestions - 1) && (
                    <button
                      onClick={() => setAllQuestionsCompleted(true)}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Complete Interview
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column: Question and information */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="bg-indigo-600 p-4 text-white">
                <h2 className="font-medium">Current Question</h2>
              </div>
              
              {/* Question content */}
              {currentQuestion ? (
                <div className="p-4">
                  <div className={`inline-block px-2 py-1 text-xs font-medium rounded-full mb-2 ${
                    currentQuestion.category === 'Technical' ? 'bg-blue-100 text-blue-800' :
                    currentQuestion.category === 'Behavioral' ? 'bg-green-100 text-green-800' :
                    currentQuestion.category === 'Situational' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {currentQuestion.category || 'Question'}
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-gray-900 font-medium">{currentQuestion.question}</p>
                  </div>
                  
                  {currentQuestion.explanation && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Tip:</h3>
                      <p className="text-sm text-gray-600">{currentQuestion.explanation}</p>
                    </div>
                  )}
                  
                  {uploadComplete && (
                    <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-3">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-green-700">
                            Answer recorded successfully!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4">
                  <p className="text-gray-500">No questions available for this interview.</p>
                </div>
              )}
              
              {/* Interview progress */}
              <div className="border-t border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Interview Progress</h3>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full" 
                    style={{ width: `${((currentQuestionIndex + (uploadComplete ? 1 : 0)) / Math.max(totalQuestions, 1)) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Question {currentQuestionIndex + 1}/{totalQuestions || 1}</span>
                  <span>{Math.round(((currentQuestionIndex + (uploadComplete ? 1 : 0)) / Math.max(totalQuestions, 1)) * 100)}% complete</span>
                </div>
              </div>
              
              {/* Instructions reminder */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center mb-2">
                  <svg className="h-5 w-5 text-indigo-600 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-sm font-medium text-gray-700">Reminders</h3>
                </div>
                <ul className="text-xs text-gray-600 space-y-1 pl-7 list-disc">
                  <li>Ensure your face is clearly visible</li>
                  <li>Speak clearly and directly into your microphone</li>
                  <li>You have 5 minutes to answer each question</li>
                  <li>You can re-record your answer if needed</li>
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