// src/components/candidate/InterviewRecording.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { candidateService } from '../../services/api';
import NavBar from '../layout/NavBar';

function InterviewRecording() {
  const { interviewId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [interview, setInterview] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const mediaRecorderRef = useRef(null);
  const videoRef = useRef(null);

  // Fetch interview details when component mounts
  useEffect(() => {
    const fetchInterviewDetails = async () => {
      try {
        setLoading(true);
        const response = await candidateService.getInterviewDetails(interviewId);
        setInterview(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching interview details:', err);
        setError('Failed to load interview details. Please try again later.');
        setLoading(false);
      }
    };

    fetchInterviewDetails();
  }, [interviewId]);

  // Handle starting the recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      // Display the video stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Create the media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm'
      });
      
      const recordedChunks = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        setRecordedChunks(recordedChunks);
        setRecordingComplete(true);
        
        // Stop the camera and microphone
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      setRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access camera and microphone. Please ensure you have granted the necessary permissions.');
    }
  };

  // Handle stopping the recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // Handle uploading the recording
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
      formData.append('interviewRecording', blob, `interview-${interviewId}.webm`);
      formData.append('interviewId', interviewId);
      formData.append('questionIndex', currentQuestionIndex);
      
      // Upload the recording
      const response = await candidateService.uploadInterviewRecording(formData, (progress) => {
        setUploadProgress(progress);
      });
      
      setUploadComplete(true);
      setUploading(false);
      
      // Move to the next question if available
      if (interview && interview.questions && currentQuestionIndex < interview.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setRecordedChunks([]);
        setRecordingComplete(false);
        setUploadProgress(0);
        setUploadComplete(false);
      }
    } catch (err) {
      console.error('Error uploading recording:', err);
      setError('Failed to upload recording. Please try again.');
      setUploading(false);
    }
  };

  // Handle moving to the next question
  const nextQuestion = () => {
    if (interview && interview.questions && currentQuestionIndex < interview.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setRecordedChunks([]);
      setRecordingComplete(false);
      setUploadProgress(0);
      setUploadComplete(false);
    }
  };

  // Handle moving to the previous question
  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setRecordedChunks([]);
      setRecordingComplete(false);
      setUploadProgress(0);
      setUploadComplete(false);
    }
  };

  // Display loading state
  if (loading) {
    return (
      <div>
        <NavBar userType="candidate" />
        <div className="max-w-7xl mx-auto px-4 py-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  // Display error state
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

  // Display if no interview found
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

  // Get the current question
  const currentQuestion = interview.questions && interview.questions.length > 0 
    ? interview.questions[currentQuestionIndex] 
    : null;

  // Check if all questions are completed
  const allQuestionsCompleted = currentQuestionIndex >= interview.questions.length - 1 && uploadComplete;

  return (
    <div>
      <NavBar userType="candidate" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">AI Interview</h1>
          <p className="text-gray-600">
            Position: {interview.vacancyTitle || 'Job Position'}
          </p>
        </div>
        
        {/* Interview Instructions */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Interview Instructions</h2>
          <div className="prose prose-sm text-gray-600">
            <ul className="list-disc pl-5 space-y-2">
              <li>Answer each question as if you were speaking to a hiring manager.</li>
              <li>You will have up to 3 minutes to record your answer for each question.</li>
              <li>Ensure you are in a quiet environment with good lighting.</li>
              <li>Test your camera and microphone before starting.</li>
              <li>You can review your recording before submitting, and re-record if needed.</li>
              <li>Complete all questions to finish the interview.</li>
            </ul>
          </div>
        </div>
        
        {/* Question and Recording Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Question Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Question {currentQuestionIndex + 1} of {interview.questions?.length || 0}</h2>
            
            {currentQuestion ? (
              <div>
                <div className={`px-2 py-1 inline-flex text-xs font-medium rounded-full mb-2 ${
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
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Context:</h3>
                    <p className="text-sm text-gray-600">{currentQuestion.explanation}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No questions available for this interview.</p>
            )}
            
            <div className="mt-6 flex justify-between">
              <button
                onClick={previousQuestion}
                disabled={currentQuestionIndex === 0}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  currentQuestionIndex === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Previous
              </button>
              
              <button
                onClick={nextQuestion}
                disabled={currentQuestionIndex >= interview.questions.length - 1 || !uploadComplete}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  currentQuestionIndex >= interview.questions.length - 1 || !uploadComplete
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                Next
              </button>
            </div>
          </div>
          
          {/* Recording Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Your Answer</h2>
            
            <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden mb-4">
              <video
                ref={videoRef}
                className="w-full h-full"
                autoPlay
                muted={recording} // Mute when recording to prevent feedback
                playsInline
              />
            </div>
            
            <div className="flex justify-center space-x-4 mb-4">
              {!recording && !recordingComplete && (
                <button
                  onClick={startRecording}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
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
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <rect x="6" y="6" width="12" height="12" strokeWidth="2" />
                  </svg>
                  Stop Recording
                </button>
              )}
              
              {recordingComplete && !uploading && !uploadComplete && (
                <>
                  <button
                    onClick={() => {
                      setRecordingComplete(false);
                      setRecordedChunks([]);
                      startRecording();
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Re-record
                  </button>
                  
                  <button
                    onClick={uploadRecording}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Upload Answer
                  </button>
                </>
              )}
            </div>
            
            {uploading && (
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Uploading...</span>
                  <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {uploadComplete && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
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
            
            {allQuestionsCompleted && (
              <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 mt-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-indigo-700">
                      Interview completed! Thank you for your time. The hiring team will review your responses.
                    </p>
                    <Link
                      to="/candidate/dashboard"
                      className="text-sm font-medium text-indigo-700 hover:text-indigo-600 mt-2 inline-block"
                    >
                      Return to Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default InterviewRecording;