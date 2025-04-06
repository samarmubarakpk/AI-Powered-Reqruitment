// src/components/company/InterviewRecordings.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { companyService } from '../../services/api';
import NavBar from '../layout/NavBar';

function InterviewRecordings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [interviews, setInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [playing, setPlaying] = useState(false);
  
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
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <div className="flex justify-between items-center">
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
                      
                      <div className="mt-4">
                        <div className="aspect-video bg-black rounded-lg overflow-hidden">
                          <video
                            src={videoUrl}
                            className="w-full h-full"
                            controls
                            autoPlay={playing}
                          />
                        </div>
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
                                  videoUrl === recording.blobUrl
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