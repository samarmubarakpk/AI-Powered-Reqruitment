// src/components/company/RecommendationsDashboard.js
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

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const response = await companyService.getRecommendations();
        setRecommendations(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Failed to load recommendations. Please try again later.');
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

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
        <h1 className="text-2xl font-bold mb-6">Candidate Recommendations</h1>
        
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
        
        {/* Versatile Candidates */}
        {recommendations.versatileCandidates && recommendations.versatileCandidates.length > 0 && (
          <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-medium text-gray-900">Versatile Candidates</h2>
              <p className="text-sm text-gray-500">
                These candidates match multiple open positions in your company
              </p>
            </div>
            
            <div className="divide-y divide-gray-200">
              {recommendations.versatileCandidates.map((candidate) => (
                <div key={candidate.candidateId} className="p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-semibold">
                        {candidate.candidateName.charAt(0)}
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{candidate.candidateName}</h3>
                      <p className="text-sm text-gray-500">{candidate.candidateEmail}</p>
                      
                      {/* Matched Vacancies */}
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">
                          Matches {candidate.matchedVacancies.length} positions:
                        </p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {candidate.matchedVacancies.map((vacancy, index) => (
                            <Link 
                              key={index}
                              to={`/company/vacancies/${vacancy.vacancyId}/matches`}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                            >
                              {vacancy.vacancyTitle}
                              <span className="ml-1 text-xs">
                                ({Math.round(vacancy.matchScore)}%)
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex-shrink-0">
                      <Link
                        to={`/company/candidates/${candidate.candidateId}`}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Recommendations by Vacancy */}
        {recommendations.recommendationsByVacancy && recommendations.recommendationsByVacancy.length > 0 ? (
          recommendations.recommendationsByVacancy.map((vacancyRec) => (
            <div key={vacancyRec.vacancyId} className="bg-white shadow rounded-lg overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-medium text-gray-900">{vacancyRec.vacancyTitle}</h2>
                  <Link
                    to={`/company/vacancies/${vacancyRec.vacancyId}/matches`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    View All Matches
                  </Link>
                </div>
              </div>
              
              {vacancyRec.topCandidates.length > 0 ? (
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {vacancyRec.topCandidates.map((candidate, index) => (
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
                      
                      <div className="flex justify-between space-x-2">
                        <Link
                          to={`/company/candidates/${candidate.candidateId}`}
                          className="flex-1 text-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Profile
                        </Link>
                        // src/components/company/RecommendationsDashboard.js (continued)
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