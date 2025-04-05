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
        console.log("Raw interviews data:", response.data.interviews);
        
        // Process interviews to remove duplicates and combine information
        const processedInterviews = processInterviews(response.data.interviews || []);
        console.log("Processed interviews:", processedInterviews);
        
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

  // Process interviews to eliminate duplicates and combine information
  const processInterviews = (interviewsList) => {
    // Group interviews by vacancy and candidate combination
    const groupedByVacancy = {};
    
    // First pass: group all interviews
    interviewsList.forEach(interview => {
      const key = `${interview.vacancyId}-${interview.candidateId}`;
      if (!groupedByVacancy[key]) {
        groupedByVacancy[key] = [];
      }
      groupedByVacancy[key].push(interview);
    });

    console.log("Grouped interviews:", groupedByVacancy);
    
    // Second pass: combine information for each group
    const processedInterviews = Object.entries(groupedByVacancy).map(([key, group]) => {
      // If there's only one interview in the group, return it as is
      if (group.length === 1) {
        return group[0];
      }
      
      console.log(`Merging ${group.length} interviews for key ${key}`);
      
      // First identify which interview has scheduling info and which has questions
      let scheduledInterview = group.find(interview => interview.scheduledAt && interview.status === 'scheduled');
      let questionsInterview = group.find(interview => 
        interview.questions && Array.isArray(interview.questions) && interview.questions.length > 0
      );
      
      console.log("Found scheduled interview:", scheduledInterview ? scheduledInterview.id : "None");
      console.log("Found questions interview:", questionsInterview ? questionsInterview.id : "None");
      
      // If we have both types, merge them, preferring the scheduled one as the base
      if (scheduledInterview && questionsInterview) {
        const mergedInterview = { 
          ...scheduledInterview,
          questions: questionsInterview.questions,
          _merged: true,
          _mergedFrom: [scheduledInterview.id, questionsInterview.id]
        };
        
        console.log("Created merged interview with ID:", mergedInterview.id);
        console.log("Merged interview has questions:", mergedInterview.questions.length);
        console.log("Merged interview has scheduledAt:", mergedInterview.scheduledAt);
        
        return mergedInterview;
      } 
      
      // If we only have the scheduled interview, return it
      if (scheduledInterview) {
        console.log("Using only scheduled interview:", scheduledInterview.id);
        return scheduledInterview;
      }
      
      // If we only have the questions interview, return it
      if (questionsInterview) {
        console.log("Using only questions interview:", questionsInterview.id);
        return questionsInterview;
      }
      
      // Otherwise, just return the first one
      console.log("No special interviews found, using first one:", group[0].id);
      return group[0];
    });

    // Only return interviews that have been scheduled
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

  // Get count of questions
  const getQuestionCount = (interview) => {
    if (!interview.questions || !Array.isArray(interview.questions)) {
      return 0;
    }
    return interview.questions.length;
  };

  // Determine if the interview is ready for the candidate to take
  const isInterviewReady = (interview) => {
    // An interview is ready if it has scheduling info AND has questions
    // (either within the same document or merged from multiple documents)
    const hasSchedule = !!interview.scheduledAt;
    const hasQuestions = interview.questions && 
                         Array.isArray(interview.questions) && 
                         interview.questions.length > 0;
    
    // IMPORTANT: For debugging only - force consider ALL scheduled interviews as ready
    // This is a workaround until the backend is updated
    const forceReady = hasSchedule; // Set to true to force all scheduled interviews to be "ready"
    
    console.log(`Interview ${interview.id} readiness check:`, { 
      hasSchedule, 
      hasQuestions, 
      questionCount: hasQuestions ? interview.questions.length : 0,
      scheduledAt: interview.scheduledAt,
      forceReady: forceReady
    });
    
    // return hasSchedule && hasQuestions; // Original condition
    
    // WORKAROUND: If it has scheduledAt, assume it's ready
    // This ensures that if an interview is scheduled but questions aren't 
    // properly merged, candidates can still access it
    return forceReady || (hasSchedule && hasQuestions);
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
                  <h3 className="text-lg font-medium text-gray-900">
                    {interview.vacancyTitle || "Job Interview"}
                    {interview._merged && <span className="ml-2 text-xs text-gray-400">(Combined data)</span>}
                  </h3>
                  <p className="text-sm text-gray-500">{interview.companyName || "Company"}</p>
                  
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {new Date(interview.scheduledAt).toLocaleString()}
                    </span>
                    {interview.status === 'scheduled' && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Ready for Interview
                      </span>
                    )}
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
                  
                  {/* For debugging purposes only - display interview details */}
                  <div className="mt-2 text-xs text-gray-400">
                    ID: {interview.id}
                    {interview._mergedFrom && (
                      <div>Merged from: {interview._mergedFrom.join(', ')}</div>
                    )}
                  </div>
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