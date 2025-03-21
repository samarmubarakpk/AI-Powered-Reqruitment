// src/components/company/RecommendationsDashboard.js - Simplified version
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { companyService } from '../../services/api';
import NavBar from '../layout/NavBar';

function RecommendationsDashboard() {
  const [recommendations, setRecommendations] = useState({
    recommendationsByVacancy: [],
    versatileCandidates: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [maxCandidates, setMaxCandidates] = useState(2); // Default to 2 top candidates per vacancy

  // Function to fetch recommendations with custom number of candidates
  const fetchRecommendations = async (numCandidates) => {
    try {
      setLoading(true);
      const response = await companyService.getRecommendations(numCandidates);
      console.log("Recommendations data:", response.data); // Log to help debug
      setRecommendations(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load recommendations. Please try again later.');
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchRecommendations(maxCandidates);
  }, []);

  // Function to handle changing the number of candidates
  const handleCandidateNumberChange = (e) => {
    const newValue = parseInt(e.target.value);
    setMaxCandidates(newValue);
    fetchRecommendations(newValue);
  };

  // Function to get status badge for applicants
  const getStatusBadge = (status) => {
    switch (status) {
      case 'applied':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Applied</span>;
      case 'reviewed':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Reviewed</span>;
      case 'interviewed':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Interviewed</span>;
      case 'accepted':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Accepted</span>;
      case 'rejected':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>;
      default:
        return null;
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
          <h1 className="text-2xl font-bold">Candidate Recommendations</h1>
          
          {/* Control for number of candidates per vacancy */}
          <div className="flex items-center space-x-2">
            <label htmlFor="maxCandidates" className="block text-sm font-medium text-gray-700">
              Top candidates per vacancy:
            </label>
            <select
              id="maxCandidates"
              value={maxCandidates}
              onChange={handleCandidateNumberChange}
              className="block w-full rounded-md border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="5">5</option>
              <option value="10">10</option>
            </select>
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
        

        
        {/* Recommendations by Vacancy */}
        {recommendations.recommendationsByVacancy && recommendations.recommendationsByVacancy.length > 0 ? (
          recommendations.recommendationsByVacancy.map((vacancyRec) => (
            <div key={vacancyRec.vacancyId} className="bg-white shadow rounded-lg overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-medium text-gray-900">{vacancyRec.vacancyTitle}</h2>
                    <p className="text-sm text-gray-500">
                      {vacancyRec.applicantCount > 0 ? 
                        `${vacancyRec.applicantCount} applications received` : 
                        'No applications yet'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      to={`/company/vacancies/${vacancyRec.vacancyId}/applications`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      View Applications
                    </Link>
                    <Link
                      to={`/company/vacancies/${vacancyRec.vacancyId}/matches`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      View All Matches
                    </Link>
                  </div>
                </div>
              </div>
              
              {vacancyRec.topCandidates && vacancyRec.topCandidates.length > 0 ? (
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {vacancyRec.topCandidates.map((candidate) => (
                    <div key={candidate.candidateId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center mb-3">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-semibold">
                          {candidate.candidateName.charAt(0)}
                        </div>
                        <div className="ml-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">{candidate.candidateName}</h3>
                          <p className="text-xs text-gray-500 truncate">{candidate.candidateEmail}</p>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-medium text-gray-500">Match Score</span>
                          <span className="text-xs font-medium text-gray-900">{Math.round(candidate.matchScore)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getScoreColorClass(candidate.matchScore)}`}
                            style={{ width: `${candidate.matchScore}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Add status badge for applicants */}
                      {candidate.status && (
                        <div className="mb-3">
                          {getStatusBadge(candidate.status)}
                          {candidate.appliedAt && (
                            <span className="text-xs text-gray-500 ml-2">
                              {new Date(candidate.appliedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex justify-between space-x-2">
                        <Link
                          to={`/company/candidates/${candidate.candidateId}`}
                          className="flex-1 text-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Profile
                        </Link>
                        <Link
                          to={`/company/vacancies/${vacancyRec.vacancyId}/candidates/${candidate.candidateId}`}
                          className="flex-1 text-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          Compare
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No matching candidates found for this vacancy.</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white shadow rounded-lg p-10 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No active vacancies</h3>
            <p className="mt-1 text-sm text-gray-500">
              You need to create some job vacancies to get candidate recommendations.
            </p>
            <div className="mt-6">
              <Link
                to="/company/vacancies/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create a Vacancy
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function for getting score color classes
function getScoreColorClass(score) {
  if (score >= 80) return 'bg-green-600';
  if (score >= 60) return 'bg-blue-600';
  if (score >= 40) return 'bg-yellow-600';
  return 'bg-red-600';
}

export default RecommendationsDashboard;