// src/components/company/CandidateMatches.js
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { companyService } from '../../services/api';
import NavBar from '../layout/NavBar';

function CandidateMatches() {
  const { id: vacancyId } = useParams();
  const [vacancy, setVacancy] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        
        // Get vacancy details
        const vacancyResponse = await companyService.getVacancy(vacancyId);
        setVacancy(vacancyResponse.data.vacancy);
        
        // Get candidate matches
        const matchesResponse = await companyService.getCandidateMatches(vacancyId);
        setMatches(matchesResponse.data.matches);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching candidate matches:', err);
        setError('Failed to load candidate matches. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchMatches();
  }, [vacancyId]);
  
  const renderSkillBadges = (skills) => {
    if (!skills || skills.length === 0) return <span className="text-gray-500">None</span>;
    
    return (
      <div className="flex flex-wrap gap-1">
        {skills.map((skill, index) => (
          <span 
            key={index} 
            className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800"
          >
            {skill}
          </span>
        ))}
      </div>
    );
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
            <h1 className="text-2xl font-bold">Candidate Matches</h1>
            <p className="text-gray-600">
              {vacancy ? `For: ${vacancy.title}` : `For Vacancy ID: ${vacancyId}`}
            </p>
          </div>
          <Link
            to="/company/vacancies"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
          >
            Back to Vacancies
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
        
        {/* Match results */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-medium text-gray-900">AI-Powered Candidate Matching Results</h2>
            <p className="mt-1 text-sm text-gray-500">
              Candidates are ranked based on skills, experience, and education matches to your job requirements.
            </p>
          </div>
          
          {matches.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Match Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Skills Match
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Experience
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CV
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {matches.map((match, index) => (
                    <tr key={match.candidateId} className={index === 0 ? "bg-green-50" : ""}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-bold ${index === 0 ? "text-green-600" : ""}`}>
                          #{index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{match.candidateName}</div>
                        <div className="text-sm text-gray-500">{match.candidateEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="h-4 w-16 bg-gray-200 rounded-full overflow-hidden"
                            role="progressbar" 
                            aria-valuenow={match.matchScore} 
                            aria-valuemin="0" 
                            aria-valuemax="100"
                          >
                            <div 
                              className={`h-full ${getScoreColorClass(match.matchScore)}`}
                              style={{ width: `${match.matchScore}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-sm font-medium text-gray-900">
                            {Math.round(match.matchScore)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">
                          {Math.round(match.skillsScore)}% Match
                        </div>
                        <details className="mt-1">
                          <summary className="text-xs text-indigo-600 cursor-pointer">
                            View Skills
                          </summary>
                          <div className="mt-2 text-xs">
                            <div className="mb-1">
                              <span className="font-medium">Matched:</span>
                              {renderSkillBadges(match.matchedSkills)}
                            </div>
                            <div>
                              <span className="font-medium">Missing:</span>
                              {renderSkillBadges(match.missingSkills)}
                            </div>
                          </div>
                        </details>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {Math.round(match.experienceScore)}% Match
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {match.cvUrl ? (
                          <a 
                            href={match.cvUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View CV
                          </a>
                        ) : (
                          <span className="text-gray-500">Not available</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">No candidate matches found.</p>
            </div>
          )}
        </div>
        
        {matches.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">AI Matching Insights</h2>
            <div className="prose max-w-none">
              <p>Based on your job requirements, we've identified {matches.length} potential candidates.</p>
              
              {matches.length > 0 && (
                <>
                  <p className="font-medium">Top Candidate: {matches[0].candidateName}</p>
                  <ul>
                    <li>Overall match score: {Math.round(matches[0].matchScore)}%</li>
                    <li>Skills match: {Math.round(matches[0].skillsScore)}%</li>
                    <li>Experience match: {Math.round(matches[0].experienceScore)}%</li>
                  </ul>
                  
                  <p>
                    This candidate matches {matches[0].matchedSkills.length} out of {matches[0].matchedSkills.length + matches[0].missingSkills.length} required skills for this position.
                  </p>
                </>
              )}
              
              <p className="mt-4">
                Consider reviewing the top 3 candidates first, as they have the highest match scores based on the requirements you specified.
              </p>
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

export default CandidateMatches;