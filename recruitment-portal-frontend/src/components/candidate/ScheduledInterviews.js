// src/components/candidate/ScheduledInterviews.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { candidateService } from '../../services/api';

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

function ScheduledInterviews() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [interviews, setInterviews] = useState([]);
  
  // Get completed interview IDs from localStorage
  const getCompletedInterviewIds = () => {
    try {
      const storedIds = localStorage.getItem('completedInterviewIds');
      return storedIds ? JSON.parse(storedIds) : [];
    } catch (e) {
      console.error('Error reading from localStorage:', e);
      return [];
    }
  };
  
  // Save completed interview ID to localStorage
  const addCompletedInterviewId = (id) => {
    try {
      const currentIds = getCompletedInterviewIds();
      if (!currentIds.includes(id)) {
        const updatedIds = [...currentIds, id];
        localStorage.setItem('completedInterviewIds', JSON.stringify(updatedIds));
        console.log(`Added interview ID ${id} to completed list in localStorage`);
      }
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  };
  
  // Create a memoized fetchInterviews function that we can call multiple times
  const fetchScheduledInterviews = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get our completed interview IDs from localStorage
      const completedIds = getCompletedInterviewIds();
      console.log("Client-side completed interview IDs:", completedIds);
      
      const response = await candidateService.getScheduledInterviews();
      console.log("Raw interviews data:", response.data.interviews);
      
      // AGGRESSIVE FILTERING - directly filter out any interviews that:
      // 1. Are marked as completed in status
      // 2. Have an ID that's in our localStorage list
      const filteredInterviews = (response.data.interviews || []).filter(interview => {
        // Check if it's explicitly marked as completed
        if (interview.status === 'completed') {
          console.log(`Filtering out interview ${interview.id} - status is 'completed'`);
          // Add it to our localStorage for future reference
          addCompletedInterviewId(interview.id);
          return false;
        }
        
        // Check if we know it's completed from localStorage
        if (completedIds.includes(interview.id)) {
          console.log(`Filtering out interview ${interview.id} - found in localStorage completed list`);
          return false;
        }
        
        // If it passes all checks, include it
        return true;
      });
      
      console.log(`Filtered out ${response.data.interviews.length - filteredInterviews.length} completed interviews`);
      console.log("Remaining interviews:", filteredInterviews);
      
      setInterviews(filteredInterviews);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching scheduled interviews:', err);
      setError('No se pudieron cargar las entrevistas programadas. Por favor, inténtalo más tarde.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch interviews on mount
    fetchScheduledInterviews();
    
    // Set up an interval to refresh the list periodically
    const intervalId = setInterval(() => {
      console.log("Auto-refreshing scheduled interviews");
      fetchScheduledInterviews();
    }, 30000); // Refresh every 30 seconds
    
    // Clear interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchScheduledInterviews]);

  // Listen for the custom event that signals an interview was completed
  useEffect(() => {
    const handleInterviewCompleted = (event) => {
      const completedId = event.detail.interviewId;
      console.log(`Received interviewCompleted event for ID: ${completedId}`);
      
      if (completedId) {
        // Add to localStorage
        addCompletedInterviewId(completedId);
        
        // Remove from current state immediately
        setInterviews(prevInterviews => 
          prevInterviews.filter(interview => interview.id !== completedId)
        );
        
        // Also refresh from server
        fetchScheduledInterviews();
      }
    };
    
    // Register event listener
    window.addEventListener('interviewCompleted', handleInterviewCompleted);
    
    // Clean up
    return () => {
      window.removeEventListener('interviewCompleted', handleInterviewCompleted);
    };
  }, [fetchScheduledInterviews]);

  // Get count of questions
  const getQuestionCount = (interview) => {
    if (!interview.questions || !Array.isArray(interview.questions)) {
      return 0;
    }
    return interview.questions.length;
  };

  // Determine if the interview is ready for the candidate to take
  const isInterviewReady = (interview) => {
    return !!interview.scheduledAt;
  };

  // Add refresh button functionality
  const handleRefresh = () => {
    console.log("Manual refresh triggered");
    fetchScheduledInterviews();
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

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center" style={{ backgroundColor: colors.primaryBlue.veryLight }}>
        <h2 className="text-lg font-medium">Tus Entrevistas Programadas</h2>
        <button 
          onClick={handleRefresh}
          className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          title="Actualizar lista"
        >
          <svg className="w-5 h-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      
      {interviews.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500">No tienes entrevistas programadas en este momento.</p>
        </div>
      ) : (
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
                      {interview.vacancyTitle || "Entrevista de Trabajo"}
                    </h3>
                    <p className="text-sm text-gray-500">{interview.companyName || "Empresa"}</p>
                    
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: colors.primaryBlue.veryLight, color: colors.primaryBlue.dark }}>
                        {new Date(interview.scheduledAt).toLocaleString('es-ES')}
                      </span>
                      {interview.status === 'scheduled' && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Lista para Entrevista
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-4 text-sm">
                      {questionCount > 0 ? (
                        <div className="flex items-center">
                          <p>{questionCount} preguntas preparadas</p>
                        </div>
                      ) : (
                        <p>Preguntas de la entrevista en preparación</p>
                      )}
                    </div>
                    
                    {/* For debugging purposes only - display interview details */}
                    <div className="mt-2 text-xs text-gray-400">
                      ID: {interview.id}
                      <span className="ml-2">Status: {interview.status || "unknown"}</span>
                    </div>
                  </div>
                  
                  <Link
                    to={`/candidate/interviews/${interview.id}`}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
                      interviewReady 
                        ? 'text-white hover:bg-opacity-90'
                        : 'text-gray-500 bg-gray-200 cursor-not-allowed'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    style={interviewReady ? { backgroundColor: colors.primaryTeal.light } : {}}
                    onClick={e => !interviewReady && e.preventDefault()}
                  >
                    {interviewReady ? 'Iniciar Entrevista' : 'Entrevista Próximamente'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ScheduledInterviews;