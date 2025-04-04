// src/components/candidate/ScheduledInterviews.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { candidateService } from '../../services/api';

function ScheduledInterviews() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [interviews, setInterviews] = useState([]);

  useEffect(() => {
    const fetchScheduledInterviews = async () => {
      try {
        setLoading(true);
        const response = await candidateService.getScheduledInterviews();
        setInterviews(response.data.interviews || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching scheduled interviews:', err);
        setError('Failed to load scheduled interviews. Please try again later.');
        setLoading(false);
      }
    };

    fetchScheduledInterviews();
  }, []);

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
        {interviews.map((interview) => (
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
                  <p>
                    {interview.questions && interview.questions.length > 0 
                      ? `${interview.questions.length} questions prepared` 
                      : 'Interview questions being prepared'}
                  </p>
                </div>
              </div>
              
              <Link
                to={`/candidate/interviews/${interview.id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Start Interview
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ScheduledInterviews;