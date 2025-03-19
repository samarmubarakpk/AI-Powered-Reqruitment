// src/components/company/CandidateComparison.js
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { companyService } from '../../services/api';
import NavBar from '../layout/NavBar';
import CVAnalysisComponent from './CVAnalysisComponent';

function CandidateComparison() {
  const { id: vacancyId } = useParams();
  const [candidates, setCandidates] = useState([]);
  const [vacancy, setVacancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  
  // Fetch candidates with match data for this vacancy
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        
        // Get vacancy details
        const vacancyResponse = await companyService.getVacancy(vacancyId);
        setVacancy(vacancyResponse.data.vacancy);
        
        // Get candidate matches
        const matchesResponse = await companyService.getVacancyMatches(vacancyId);
        setCandidates(matchesResponse.data.matches);
        
        // Pre-select top 3 candidates
        if (matchesResponse.data.matches.length > 0) {
          setSelectedCandidates(matchesResponse.data.matches.slice(0, 3).map(c => c.candidateId));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching candidates for comparison:', err);
        setError('Failed to load candidates. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchCandidates();
  }, [vacancyId]);
  
  const toggleCandidateSelection = (candidateId) => {
    if (selectedCandidates.includes(candidateId)) {
      setSelectedCandidates(selectedCandidates.filter(id => id !== candidateId));
    } else {
      // Limit to max 4 candidates for comparison
      if (selectedCandidates.length < 4) {
        setSelectedCandidates([...selectedCandidates, candidateId]);
      }
    }
  };
  
  const filteredCandidates = candidates
    .filter(candidate => selectedCandidates.includes(candidate.candidateId))
    .sort((a, b) => b.matchScore - a.matchScore);
  
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
            <h1 className="text-2xl font-bold">Candidate Comparison</h1>
            <p className="text-gray-600">
              {vacancy ? `For: ${vacancy.title}` : `For Vacancy ID: ${vacancyId}`}
            </p>
          </div>
          <Link
            to={`/company/vacancies/${vacancyId}/matches`}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
          >
            Back to Matches
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
        
        {/* Candidate Selection */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Select Candidates to Compare (Max 4)</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {candidates.map((candidate) => (
              <div 
                key={candidate.candidateId} 
                className={`border rounded-lg p-4 cursor-pointer ${
                  selectedCandidates.includes(candidate.candidateId) 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleCandidateSelection(candidate.candidateId)}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedCandidates.includes(candidate.candidateId)}
                    onChange={() => {}}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">{candidate.candidateName}</h3>
                    <p className="text-xs text-gray-500">{Math.round(candidate.matchScore)}% Match</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Comparison Table */}
        {filteredCandidates.length > 0 ? (
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Metric
                    </th>
                    {filteredCandidates.map((candidate) => (
                      <th 
                        key={candidate.candidateId} 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {candidate.candidateName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Overall Score */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Overall Match
                    </td>
                    {filteredCandidates.map((candidate) => (
                      <td key={candidate.candidateId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className="mr-2">{Math.round(candidate.matchScore)}%</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                candidate.matchScore >= 80 ? 'bg-green-600' :
                                candidate.matchScore >= 60 ? 'bg-blue-600' :
                                candidate.matchScore >= 40 ? 'bg-yellow-600' :
                                'bg-red-600'
                              }`}
                              style={{ width: `${candidate.matchScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                  
                  {/* Skills Score */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Skills Match
                    </td>
                    {filteredCandidates.map((candidate) => (
                      <td key={candidate.candidateId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className="mr-2">{Math.round(candidate.skillsScore)}%</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-blue-600"
                              style={{ width: `${candidate.skillsScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                  
                  {/* Experience Score */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Experience Match
                    </td>
                    {filteredCandidates.map((candidate) => (
                      <td key={candidate.candidateId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className="mr-2">{Math.round(candidate.experienceScore)}%</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-purple-600"
                              style={{ width: `${candidate.experienceScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                  
                  {/* Education Score */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Education Match
                    </td>
                    {filteredCandidates.map((candidate) => (
                      <td key={candidate.candidateId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className="mr-2">{Math.round(candidate.educationScore)}%</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-yellow-600"
                              style={{ width: `${candidate.educationScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                  
                  {/* Matched Skills Count */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Matched Skills
                    </td>
                    {filteredCandidates.map((candidate) => (
                      <td key={candidate.candidateId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {candidate.matchedSkills.length} skills
                      </td>
                    ))}
                  </tr>
                  
                  {/* Missing Skills Count */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Missing Skills
                    </td>
                    {filteredCandidates.map((candidate) => (
                      <td key={candidate.candidateId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {candidate.missingSkills.length} skills
                      </td>
                    ))}
                  </tr>
                  
                  {/* Actions */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Actions
                    </td>
                    {filteredCandidates.map((candidate) => (
                      <td key={candidate.candidateId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Link
                          to={`/company/candidates/${candidate.candidateId}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View Profile
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 mb-6 text-center">
            <p className="text-gray-500">Please select candidates to compare</p>
          </div>
        )}
        
        {/* Individual Candidate Analysis */}
        {filteredCandidates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCandidates.map((candidate) => (
              <div key={candidate.candidateId} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">{candidate.candidateName}</h2>
                  <p className="text-sm text-gray-500">{Math.round(candidate.matchScore)}% Overall Match</p>
                </div>
                <div className="p-6">
                  <CVAnalysisComponent matchData={candidate} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CandidateComparison;