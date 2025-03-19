// src/components/company/CandidateAnalyticsCard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { companyService } from '../../services/api';

function CandidateAnalyticsCard({ vacancyId, vacancyTitle }) {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        setLoading(true);
        const response = await companyService.getVacancyMatches(vacancyId);
        setMatchData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching match data:', err);
        setError('Failed to load candidate matches');
        setLoading(false);
      }
    };
    
    fetchMatchData();
  }, [vacancyId]);
  
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }
  
  if (!matchData || !matchData.matches || matchData.matches.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{vacancyTitle}</h3>
        <p className="text-gray-500">No candidate matches found for this vacancy.</p>
      </div>
    );
  }
  
  // Get top 3 candidates
  const topCandidates = matchData.matches.slice(0, 3);
  
  // Calculate average scores
  const averageOverall = matchData.matches.reduce((acc, match) => acc + match.matchScore, 0) / matchData.matches.length;
  const averageSkills = matchData.matches.reduce((acc, match) => acc + match.skillsScore, 0) / matchData.matches.length;
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">{vacancyTitle}</h3>
          <Link 
            to={`/company/vacancies/${vacancyId}/matches`}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            View All
          </Link>
        </div>
      </div>
      
      <div className="px-6 py-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-gray-500">Total Candidates</p>
            <p className="text-xl font-bold">{matchData.matches.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Average Match</p>
            <p className="text-xl font-bold">{Math.round(averageOverall)}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Skills Coverage</p>
            <p className="text-xl font-bold">{Math.round(averageSkills)}%</p>
          </div>
        </div>
        
        <h4 className="text-sm font-medium text-gray-700 mb-2">Top Candidates</h4>
        <div className="space-y-3">
          {topCandidates.map((candidate, index) => (
            <div key={candidate.candidateId} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-sm font-medium w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  {index + 1}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{candidate.candidateName}</p>
                  <div className="flex items-center">
                    <div className="w-20 h-1.5 bg-gray-200 rounded-full">
                      <div 
                        className={`h-1.5 rounded-full ${
                          candidate.matchScore >= 80 ? 'bg-green-600' :
                          candidate.matchScore >= 60 ? 'bg-blue-600' :
                          'bg-yellow-600'
                        }`}
                        style={{ width: `${candidate.matchScore}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-xs text-gray-500">{Math.round(candidate.matchScore)}%</span>
                  </div>
                </div>
              </div>
              <Link
                to={`/company/candidates/${candidate.candidateId}?vacancyId=${vacancyId}`}
                className="text-sm text-indigo-600 hover:text-indigo-900"
              >
                View
              </Link>
            </div>
          ))}
        </div>
      </div>
      
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <Link
          to={`/company/vacancies/${vacancyId}/comparison`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Compare Candidates
        </Link>
      </div>
    </div>
  );
}

export default CandidateAnalyticsCard;