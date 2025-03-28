// src/components/company/InterviewScheduler.js
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { companyService } from '../../services/api';
import NavBar from '../layout/NavBar';

function InterviewScheduler() {
  const { candidateId, vacancyId } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [vacancy, setVacancy] = useState(null);
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notifyCandidate, setNotifyCandidate] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get candidate info
        const candidateResponse = await companyService.getCandidateProfile(candidateId);
        setCandidate(candidateResponse.data.candidate);
        
        // Get vacancy info
        const vacancyResponse = await companyService.getVacancy(vacancyId);
        setVacancy(vacancyResponse.data.vacancy);
        
        // Check if interview is already scheduled
        const interviewResponse = await companyService.getInterviewDetails(vacancyId, candidateId);
        if (interviewResponse.data.interview) {
          setInterview(interviewResponse.data.interview);
          
          // Pre-fill date and time if scheduled
          if (interviewResponse.data.interview.scheduledAt) {
            const date = new Date(interviewResponse.data.interview.scheduledAt);
            setScheduledDate(date.toISOString().split('T')[0]);
            setScheduledTime(date.toTimeString().split(' ')[0].slice(0, 5));
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading interview data:', err);
        setError('Failed to load interview data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [candidateId, vacancyId]);
  
  const handleSchedule = async () => {
    try {
      if (!scheduledDate || !scheduledTime) {
        setError('Please select both date and time');
        return;
      }
      
      // Combine date and time into ISO string
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      
      // Schedule the interview
      const response = await companyService.scheduleInterview(
        vacancyId,
        candidateId,
        {
          scheduledAt: scheduledDateTime.toISOString(),
          notifyCandidate
        }
      );
      
      setInterview(response.data.interview);
      alert('Interview scheduled successfully!');
    } catch (err) {
      console.error('Error scheduling interview:', err);
      setError('Failed to schedule interview');
    }
  };
  
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
          <h1 className="text-2xl font-bold">Schedule Interview</h1>
          <Link
            to="/company/interviews"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
          >
            Back to Interviews
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
        
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium">Interview Details</h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Candidate Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium mb-2">Candidate</h3>
                <p className="text-sm"><span className="font-medium">Name:</span> {candidate?.firstName} {candidate?.lastName}</p>
                <p className="text-sm"><span className="font-medium">Email:</span> {candidate?.email}</p>
              </div>
              
              {/* Vacancy Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium mb-2">Position</h3>
                <p className="text-sm"><span className="font-medium">Title:</span> {vacancy?.title}</p>
              </div>
              
              {/* Schedule Selection */}
              <div className="col-span-1 md:col-span-2">
                <h3 className="text-md font-medium mb-4">Schedule Interview</h3>
                
                {interview && interview.status === 'scheduled' ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">Interview Scheduled</h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>
                            Interview with {candidate?.firstName} {candidate?.lastName} has been scheduled for {new Date(interview.scheduledAt).toLocaleString()}.
                          </p>
                        </div>
                        <div className="mt-4">
                          <Link
                            to={`/company/interviews/${interview.id}/room`}
                            className="text-sm font-medium text-green-600 hover:text-green-500"
                          >
                            Enter Interview Room
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700">
                          Date
                        </label>
                        <input
                          type="date"
                          id="scheduledDate"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700">
                          Time
                        </label>
                        <input
                          type="time"
                          id="scheduledTime"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="notifyCandidate"
                        type="checkbox"
                        checked={notifyCandidate}
                        onChange={(e) => setNotifyCandidate(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notifyCandidate" className="ml-2 block text-sm text-gray-700">
                        Send notification email to candidate
                      </label>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleSchedule}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Schedule Interview
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InterviewScheduler;