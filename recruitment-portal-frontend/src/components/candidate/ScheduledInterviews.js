// src/components/candidate/ScheduledInterviews.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { candidateService } from '../../services/api';

function ScheduledInterviews() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [interviews, setInterviews] = useState([]);
  const [expandedInterview, setExpandedInterview] = useState(null);

  useEffect(() => {
    const fetchScheduledInterviews = async () => {
      try {
        setLoading(true);
        const response = await candidateService.getScheduledInterviews();
        
        // Process interviews to remove duplicates and sort by most complete
        const processedInterviews = processInterviews(response.data.interviews || []);
        
        setInterviews(processedInterviews);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching scheduled interviews:', err);
        setError('Failed to load scheduled interviews. Please try again later.');
        setLoading(false);
      }
    };

    fetchScheduledInterviews();
  }, []);

  // Process interviews to eliminate duplicates and prioritize ones with questions
  const processInterviews = (interviewsList) => {
    // Group interviews by vacancyId
    const groupedByVacancy = interviewsList.reduce((acc, interview) => {
      const key = `${interview.vacancyId}-${interview.candidateId}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(interview);
      return acc;
    }, {});

    // For each group, merge information from all instances
    const processedInterviews = Object.values(groupedByVacancy).map(group => {
      // If only one instance exists, return it
      if (group.length === 1) {
        return group[0];
      }
      
      // Find the instance with questions (if any)
      const instanceWithQuestions = group.find(
        interview => interview.questions && Array.isArray(interview.questions) && interview.questions.length > 0
      );
      
      // Find the instance with scheduling information (if any)
      const instanceWithSchedule = group.find(
        interview => interview.scheduledAt
      );
      
      // If we have both types of instances, merge them
      if (instanceWithQuestions && instanceWithSchedule && instanceWithQuestions.id !== instanceWithSchedule.id) {
        return {
          ...instanceWithSchedule, // Take the scheduled instance as base
          questions: instanceWithQuestions.questions, // Add questions from the other instance
          id: instanceWithSchedule.id, // Ensure we keep the scheduled instance ID
          // Indicate this is a merged record
          _merged: true
        };
      }
      
      // If no merge needed, return the instance with questions or scheduledAt, with preference to scheduled
      return instanceWithSchedule || instanceWithQuestions || group[0];
    });

    // Only return interviews that have been scheduled (have scheduledAt)
    return processedInterviews
      .filter(interview => interview.scheduledAt)
      .sort((a, b) => {
        const dateA = new Date(a.scheduledAt);
        const dateB = new Date(b.scheduledAt);
        return dateA - dateB;
      });
  };

  const toggleExpandInterview = (id) => {
    if (expandedInterview === id) {
      setExpandedInterview(null);
    } else {
      setExpandedInterview(id);
    }
  };

  const getQuestionCount = (interview) => {
    if (!interview.questions || !Array.isArray(interview.questions)) {
      return 0;
    }
    return interview.questions.length;
  };

  // Determine if the interview is ready for the candidate to take
  const isInterviewReady = (interview) => {
    // Check if both questions exist and the interview is scheduled
    return (
      interview.scheduledAt && 
      interview.questions && 
      Array.isArray(interview.questions) && 
      interview.questions.length > 0
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 mb-4 rounded"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  if (interviews.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Scheduled Interviews</h2>
        <div className="text-center py-4">
          <p className="text-gray-500">You don't have any scheduled interviews at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium">Your Scheduled Interviews</h2>
      </div>
      
      <div className="divide-y divide-gray-200">
        {interviews.map((interview) => {
          // Get count of questions
          const questionCount = getQuestionCount(interview);
          // Check if interview is ready
          const interviewReady = isInterviewReady(interview);
          
          return (
            <div key={interview.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{interview.vacancyTitle}</h3>
                  <p className="text-sm text-gray-500">{interview.companyName}</p>
                  
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {new Date(interview.scheduledAt).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="mt-4 text-sm">
                    {questionCount > 0 ? (
                      <div className="flex items-center">
                        <p>{questionCount} questions prepared</p>
                      </div>
                    ) : (
                      <p>Interview questions being prepared</p>
                    )}
                  </div>
                  
                  {/* Status indicators based on readiness */}
                  {!interview.scheduledAt && questionCount > 0 && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <svg className="mr-1.5 h-2 w-2 text-yellow-400" fill="currentColor" viewBox="0 0 8 8">
                          <circle cx="4" cy="4" r="3" />
                        </svg>
                        Waiting for scheduling confirmation
                      </span>
                    </div>
                  )}
                </div>
                
                <Link
                  to={`/candidate/interviews/${interview.id}`}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
                    interviewReady 
                      ? 'text-white bg-indigo-600 hover:bg-indigo-700'
                      : 'text-gray-500 bg-gray-200 cursor-not-allowed'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  onClick={e => !interviewReady && e.preventDefault()}
                >
                  {interviewReady ? 'Start Interview' : 'Interview Coming Soon'}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ScheduledInterviews;