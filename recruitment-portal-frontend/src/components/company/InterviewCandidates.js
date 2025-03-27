// src/components/company/InterviewCandidates.js
// This component provides a dedicated interface for managing candidates selected for interviews
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { companyService } from '../../services/api';
import NavBar from '../layout/NavBar';
import CVLinkComponent from './CVLinkComponent';

function InterviewCandidates() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [interviews, setInterviews] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [selectedVacancy, setSelectedVacancy] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0); // Add refresh key to force re-renders
  
  // Function to manually refresh data
  const refreshData = () => {
    console.log('Manual refresh requested');
    setRefreshKey(prev => prev + 1);
  };
  
  useEffect(() => {
    console.log('InterviewCandidates component initializing or refreshing');
    // Clean up any stale data first
    setInterviews([]);
    setVacancies([]);
    setError('');
    
    // Then fetch fresh data
    fetchInterviewCandidates();
    
    // Add a focus event listener to refresh data when the page regains focus
    // This ensures fresh data when navigating back to this page
    const handleFocus = () => {
      console.log('Window focused, refreshing interview candidates');
      fetchInterviewCandidates();
    };
    
    // Also add a visibility change handler to catch tab switches
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, refreshing interview candidates');
        fetchInterviewCandidates();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up the event listeners
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshKey]); // Add refreshKey to the dependency array
  
  const fetchInterviewCandidates = async () => {
    try {
      setLoading(true);
      console.log('Fetching interview candidates data...');
      
      // Step 1: Get all vacancies
      const vacanciesResponse = await companyService.getVacancies();
      const vacanciesList = vacanciesResponse.data.vacancies || [];
      setVacancies(vacanciesList);
      
      // Step 2: Get all applications with "interviewed" status for each vacancy
      let allInterviews = [];
      
      for (const vacancy of vacanciesList) {
        try {
          console.log(`Fetching applications for vacancy ${vacancy.id}`);
          const applicationsResponse = await companyService.getApplications(vacancy.id);
          const applications = applicationsResponse.data.applications || [];
          
          // Filter applications by status "interviewed"
          const interviewApplications = applications
            .filter(app => app.status === 'interviewed')
            .map(app => ({
              ...app,
              vacancyTitle: vacancy.title,
              vacancyId: vacancy.id
            }));
          
          console.log(`Found ${interviewApplications.length} interview applications for vacancy ${vacancy.id}`);
          allInterviews = [...allInterviews, ...interviewApplications];
        } catch (err) {
          console.error(`Error fetching applications for vacancy ${vacancy.id}:`, err);
        }
      }
      
      console.log(`Total interview candidates found: ${allInterviews.length}`);
      setInterviews(allInterviews);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching interview candidates:', err);
      setError('Failed to load interview candidates. Please try again.');
      setLoading(false);
    }
  };
  
  // Filter interviews by selected vacancy
  const filteredInterviews = selectedVacancy === 'all' 
    ? interviews 
    : interviews.filter(interview => interview.vacancyId === selectedVacancy);
  
  // Handle generating interview for a candidate
  const handleGenerateInterview = async (candidate) => {
    try {
      // Navigate to the interview generation page
      window.location.href = `/company/vacancies/${candidate.vacancyId}/interview/${candidate.candidateId}`;
    } catch (error) {
      console.error('Error generating interview:', error);
    }
  };
  
  // Get candidate info from different possible structures
  const getCandidateInfo = (application) => {
    if (application.candidate) {
      return application.candidate;
    } else if (application.candidateInfo) {
      return application.candidateInfo;
    } else {
      return {
        firstName: 'Unknown',
        lastName: 'Candidate',
        email: application.candidateEmail || 'No email'
      };
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
          <div>
            <h1 className="text-2xl font-bold">Interview Candidates</h1>
            <p className="text-gray-600">Manage candidates selected for interviews</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={refreshData}
              className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-2 rounded-md text-sm font-medium flex items-center"
            >
              <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
            <Link
              to="/company/vacancies"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
            >
              Back to Vacancies
            </Link>
          </div>
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
        
        {/* Filter by Vacancy */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-lg font-medium">Filter by Vacancy</h2>
            <div className="w-full md:w-1/3">
              <select
                value={selectedVacancy}
                onChange={(e) => setSelectedVacancy(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="all">All Vacancies</option>
                {vacancies.map(vacancy => (
                  <option key={vacancy.id} value={vacancy.id}>
                    {vacancy.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Interview Candidates List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">
                {filteredInterviews.length} 
                {filteredInterviews.length === 1 ? ' Candidate' : ' Candidates'} 
                Selected for Interview
              </h2>
              <p className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          {filteredInterviews.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vacancy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Match Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Selected on
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CV
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInterviews.map((interview) => {
                    const candidate = getCandidateInfo(interview);
                    return (
                      <tr key={interview.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                              {candidate.firstName.charAt(0) || 'C'}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {candidate.firstName} {candidate.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {candidate.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {interview.vacancyTitle || 'Unknown Position'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {interview.suitabilityScore ? (
                            <div className="flex items-center">
                              <span className="font-medium text-sm">
                                {Math.round(interview.suitabilityScore.overall || 
                                  (typeof interview.suitabilityScore === 'number' ? 
                                    interview.suitabilityScore : 0))}%
                              </span>
                              <div className="ml-2 w-16 bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full ${getMatchScoreColor(
                                    interview.suitabilityScore.overall || 
                                    (typeof interview.suitabilityScore === 'number' ? 
                                      interview.suitabilityScore : 0)
                                  )}`}
                                  style={{ width: `${interview.suitabilityScore.overall || 
                                    (typeof interview.suitabilityScore === 'number' ? 
                                      interview.suitabilityScore : 0)}%` }}
                                ></div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Not available</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(interview.updatedAt || interview.appliedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {interview.candidateId && (
                            <CVLinkComponent candidateId={interview.candidateId} />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex flex-col space-y-2">
                            <button
                              onClick={() => handleGenerateInterview(interview)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              Generate Interview
                            </button>
                            <Link
                              to={`/company/candidates/${interview.candidateId}?vacancyId=${interview.vacancyId}`}
                              className="inline-flex justify-center items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              View Profile
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No interview candidates</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedVacancy === 'all' 
                  ? 'No candidates have been selected for interviews yet.' 
                  : 'No candidates have been selected for interviews for this vacancy.'}
              </p>
              <div className="mt-6 flex justify-center space-x-4">
                <button
                  onClick={refreshData}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
                <Link
                  to="/company/vacancies"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Back to Applications
                </Link>
              </div>
            </div>
          )}
        </div>
        
        {filteredInterviews.length > 0 && (
          <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-lg p-6">
            <h3 className="text-md font-medium text-indigo-900 mb-2">Interview Process</h3>
            <p className="text-sm text-gray-700 mb-4">
              Candidates listed here have been marked for interviews. You can generate personalized interview questions
              based on their profile and the job requirements.
            </p>
            <div className="flex items-center">
              <svg className="h-5 w-5 text-indigo-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-indigo-800">
                Click "Generate Interview" to create a custom interview script for each candidate.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to determine the color for match score
function getMatchScoreColor(score) {
  if (score >= 80) return 'bg-green-600';
  if (score >= 60) return 'bg-blue-600';
  if (score >= 40) return 'bg-yellow-600';
  return 'bg-red-600';
}

export default InterviewCandidates;