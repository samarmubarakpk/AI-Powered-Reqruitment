// src/components/company/InterviewRecordings.js
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { companyService } from '../../services/api';
import NavBar from '../layout/NavBar';
import TranscriptDisplay from './TranscriptDisplay';

function InterviewRecordings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [interviews, setInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [playing, setPlaying] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const videoRef = useRef(null);
  
  // Fetch all interviews with recordings when component mounts
  useEffect(() => {
    const fetchInterviewRecordings = async () => {
      try {
        setLoading(true);
        const response = await companyService.getInterviewRecordings();
        console.log('Interview recordings response:', response.data);
        setInterviews(response.data.interviews || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching interview recordings:', err);
        setError('Failed to load interview recordings. Please try again later.');
        setLoading(false);
      }
    };

    fetchInterviewRecordings();
  }, []);

  // Handle viewing a recording
  const viewRecording = async (interview, recordingIndex = 0) => {
    try {
      setSelectedInterview(interview);
      setAnalysis(null);
      setTranscript(null);
      setCurrentQuestionIndex(recordingIndex);
      
      // If interview has recordings
      if (interview.recordings && interview.recordings.length > 0) {
        const recording = interview.recordings[recordingIndex];
        
        // Get secure URL for the recording
        const response = await companyService.getInterviewRecordingUrl(
          interview.id, 
          recording.questionIndex
        );
        
        setVideoUrl(response.data.url);
        setPlaying(true);
        
        // Check if this recording already has an analysis
        if (recording.analysis) {
          console.log('Using existing analysis:', recording.analysis);
          setAnalysis(recording.analysis);
        }
        
        // Check if this recording already has a transcript
        if (recording.transcript) {
          console.log('Using existing transcript:', recording.transcript);
          setTranscript(recording.transcript);
        }
      } else {
        setError('No recordings available for this interview');
      }
    } catch (err) {
      console.error('Error getting recording URL:', err);
      setError('Failed to load interview recording. Please try again.');
    }
  };

  // Close the video player
  const closePlayer = () => {
    setSelectedInterview(null);
    setVideoUrl('');
    setPlaying(false);
    setAnalysis(null);
    setTranscript(null);
    setCurrentQuestionIndex(0);
  };
  
  // Transcribe the audio separately (for cases where video indexer fails)
// Transcribe the audio separately (for cases where video indexer fails)
const transcribeAudio = async () => {
  if (!selectedInterview || !videoUrl) {
    setError('No recording selected for transcription');
    return;
  }
  
  try {
    setTranscribing(true);
    setError('');
    
    // Get the question index from the current recording
    const questionIndex = selectedInterview.recordings[currentQuestionIndex]?.questionIndex || 0;
    
    console.log(`Transcribing audio for interview ${selectedInterview.id}, question ${questionIndex}`);
    
    // Show a message that we're transcribing
    setTranscript("Transcribing audio... This may take a minute.");
    
    // Call the simplified transcription API
    const response = await companyService.transcribeInterviewRecording(
      selectedInterview.id, 
      questionIndex
    );
    
    console.log('Transcription response:', response.data);
    
    if (response.data.transcript) {
      setTranscript(response.data.transcript);
      setError(null);
    } else {
      setTranscript("No speech could be transcribed from this recording.");
      setError("Could not extract speech from the recording.");
    }
    
    setTranscribing(false);
  } catch (err) {
    console.error('Error transcribing audio:', err);
    setError(`Failed to transcribe audio: ${err.response?.data?.message || err.message}`);
    setTranscript("Transcription failed. Please try again.");
    setTranscribing(false);
  }
};
  
  // Analyze the current recording using Azure AI services
  const analyzeRecording = async () => {
    if (!selectedInterview || !videoUrl) {
      setError('No recording selected for analysis');
      return;
    }
    
    try {
      setAnalyzing(true);
      setError('');
      
      // Also set transcribing to true since we'll be getting a transcript
      setTranscribing(true);
      
      // Find the recording index that corresponds to the current question
      const questionIndex = selectedInterview.recordings[currentQuestionIndex]?.questionIndex || 0;
      
      console.log(`Analyzing recording for interview ${selectedInterview.id}, question index ${questionIndex}`);
      
      // Call the analysis API
      const response = await companyService.analyzeInterviewRecording(
        selectedInterview.id, 
        questionIndex
      );
      
      console.log('Analysis response:', response.data);
      
      if (response.data.error) {
        setError(`Analysis completed with warnings: ${response.data.error}`);
      } else {
        setError(null);
      }
      
      // Set the analysis and transcript data
      setAnalysis(response.data.analysis);
      setTranscript(response.data.transcript);
      
      setAnalyzing(false);
      setTranscribing(false);
    } catch (err) {
      console.error('Error analyzing recording:', err);
      setError(`Failed to analyze recording: ${err.response?.data?.message || err.message}`);
      setAnalyzing(false);
      setTranscribing(false);
    }
  };
  
  // Render sentiment score with color coding
  const renderSentimentScore = (score) => {
    let color = 'text-gray-600';
    if (score > 0.6) color = 'text-green-600';
    else if (score > 0.4) color = 'text-blue-600';
    else if (score > 0.2) color = 'text-yellow-600';
    else color = 'text-red-600';
    
    return (
      <span className={color}>
        {(score * 100).toFixed(0)}%
      </span>
    );
  };
  
  // Render confidence assessment
  const renderConfidenceLevel = (confidence) => {
    const levels = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-red-100 text-red-800'
    };
    
    const colorClass = levels[confidence.toLowerCase()] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {confidence}
      </span>
    );
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Loading state
  if (loading) {
    return (
      <div>
        <NavBar userType="company" />
        <div className="max-w-7xl mx-auto px-4 py-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  // Get current question text
  const getCurrentQuestionText = () => {
    if (!selectedInterview || !selectedInterview.questions) return "Unknown question";
    
    // If the interview has questions matching the recording indices
    if (Array.isArray(selectedInterview.questions) && 
        selectedInterview.recordings && 
        selectedInterview.recordings[currentQuestionIndex]) {
      const questionIndex = selectedInterview.recordings[currentQuestionIndex].questionIndex;
      if (questionIndex < selectedInterview.questions.length) {
        return selectedInterview.questions[questionIndex].question;
      }
    }
    
    // Fallback to the question at current index if available
    if (Array.isArray(selectedInterview.questions) && 
        currentQuestionIndex < selectedInterview.questions.length) {
      return selectedInterview.questions[currentQuestionIndex].question;
    }

    return "Unknown question";
  };

  return (
    <div>
      <NavBar userType="company" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Interview Recordings</h1>
            <p className="text-gray-600">View recorded interviews from candidates</p>
          </div>
          <Link
            to="/company/dashboard"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
          >
            Back to Dashboard
          </Link>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6" role="alert">
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
        
        {/* Video Player Modal */}
        {selectedInterview && videoUrl && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Background overlay */}
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={closePlayer}></div>
              
              {/* Modal panel */}
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      {selectedInterview.candidateName || 'Candidate'} - {selectedInterview.vacancyTitle || 'Position'}
                    </h3>
                    <button
                      type="button"
                      className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                      onClick={closePlayer}
                    >
                      <span className="sr-only">Close</span>
                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left column: Video and basic info */}
                    <div>
                      <div className="aspect-video bg-black rounded-lg overflow-hidden">
                        <video
                          ref={videoRef}
                          src={videoUrl}
                          className="w-full h-full"
                          controls
                          autoPlay={playing}
                        />
                      </div>
                      
                      {/* Recording details */}
                      <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Interview Details</h4>
                        <div className="text-sm text-gray-500">
                          <p><span className="font-medium">Date:</span> {formatDate(selectedInterview.scheduledAt || selectedInterview.createdAt)}</p>
                          <p><span className="font-medium">Status:</span> {selectedInterview.status || 'Completed'}</p>
                          <p><span className="font-medium">Questions Recorded:</span> {selectedInterview.recordings?.length || 0}</p>
                        </div>
                      </div>
                      
                      {/* Multiple recording navigation (if interview has multiple recordings) */}
                      {selectedInterview.recordings && selectedInterview.recordings.length > 1 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">All Recordings</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedInterview.recordings.map((recording, index) => (
                              <button
                                key={index}
                                onClick={() => viewRecording(selectedInterview, index)}
                                className={`px-3 py-1 text-sm rounded-full ${
                                  currentQuestionIndex === index
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                Question {recording.questionIndex + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Right column: Analysis and transcript */}
                    <div className="bg-gray-50 rounded-lg p-4 overflow-y-auto max-h-[80vh]">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-md font-medium text-gray-800">AI Analysis</h4>
                        <div className="flex space-x-2">
                          <button
                            onClick={transcribeAudio}
                            disabled={transcribing}
                            className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm ${
                              transcribing 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'text-white bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            {transcribing ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Transcribing...
                              </>
                            ) : (
                              <>
                                <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                                Transcribe Audio
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={analyzeRecording}
                            disabled={analyzing}
                            className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm ${
                              analyzing 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'text-white bg-indigo-600 hover:bg-indigo-700'
                            }`}
                          >
                            {analyzing ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                Full Analysis
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* Transcript Section */}
                      <TranscriptDisplay 
                        transcript={transcript} 
                        question={getCurrentQuestionText()}
                        loading={transcribing} 
                      />
                      
                      {analysis ? (
                        <div className="space-y-4 mt-4">
                          {/* Sentiment analysis */}
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h5 className="font-medium text-gray-800 mb-2">Sentiment Analysis</h5>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Confidence</p>
                                <p className="text-lg font-medium">{renderSentimentScore(analysis.confidence)}</p>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${analysis.confidence * 100}%` }}></div>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Nervousness</p>
                                <p className="text-lg font-medium">{renderSentimentScore(analysis.nervousness)}</p>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                                  <div className="bg-yellow-600 h-2.5 rounded-full" style={{ width: `${analysis.nervousness * 100}%` }}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Answer content analysis */}
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h5 className="font-medium text-gray-800 mb-2">Answer Quality</h5>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Relevance</p>
                                <p className="text-lg font-medium">{renderSentimentScore(analysis.answerQuality.relevance)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Completeness</p>
                                <p className="text-lg font-medium">{renderSentimentScore(analysis.answerQuality.completeness)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Coherence</p>
                                <p className="text-lg font-medium">{renderSentimentScore(analysis.answerQuality.coherence)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Technical Accuracy</p>
                                <p className="text-lg font-medium">{renderSentimentScore(analysis.answerQuality.technicalAccuracy)}</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Overall assessment */}
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h5 className="font-medium text-gray-800 mb-2">Overall Assessment</h5>
                            <div className="flex items-center mb-2">
                              <p className="text-sm text-gray-600 mr-2">Confidence Level:</p>
                              {renderConfidenceLevel(analysis.overallAssessment.confidenceLevel)}
                            </div>
                            <p className="text-sm text-gray-600">{analysis.overallAssessment.summary}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white p-6 rounded-lg text-center shadow-sm mt-4">
                          <svg className="h-12 w-12 text-gray-400 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                          <p className="text-gray-600">
                            {analyzing ? 'Analyzing response...' : 'Click "Full Analysis" to generate AI insights about this interview response.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={closePlayer}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Interview Recordings List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium">{interviews.length} Recorded Interviews</h2>
          </div>
          
          {interviews.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {interviews.map((interview) => (
                <div key={interview.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {interview.candidateName || 'Candidate'}
                      </h3>
                      <p className="text-sm text-gray-500">{interview.vacancyTitle || 'Position'}</p>
                      
                      <div className="mt-2 flex items-center">
                        <svg className="h-5 w-5 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-gray-500">
                          {formatDate(interview.scheduledAt || interview.createdAt)}
                        </span>
                      </div>
                      
                      <div className="mt-2 flex items-center">
                        <svg className="h-5 w-5 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-gray-500">
                          {interview.recordings?.length || 0} recording{interview.recordings?.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={() => viewRecording(interview)}
                        disabled={!interview.recordings || interview.recordings.length === 0}
                        className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
                          interview.recordings && interview.recordings.length > 0
                            ? 'text-white bg-indigo-600 hover:bg-indigo-700'
                            : 'text-gray-500 bg-gray-200 cursor-not-allowed'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                      >
                        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        View Recording
                      </button>
                      
                      <Link
                        to={`/company/candidates/${interview.candidateId}?vacancyId=${interview.vacancyId}`}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No interview recordings</h3>
              <p className="mt-1 text-sm text-gray-500">
                No candidates have completed their interviews yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InterviewRecordings;