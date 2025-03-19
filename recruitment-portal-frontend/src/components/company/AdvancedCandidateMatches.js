// src/components/company/AdvancedCandidateMatches.js
// Fixed version with removed comment text that was showing in the UI

import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { companyService } from '../../services/api';
import NavBar from '../layout/NavBar';

function AdvancedCandidateMatches() {
  const { id: vacancyId } = useParams();
  const navigate = useNavigate();
  const [vacancy, setVacancy] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState('overall');
  const [skillsFilter, setSkillsFilter] = useState([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        
        // Get vacancy details
        const vacancyResponse = await companyService.getVacancy(vacancyId);
        setVacancy(vacancyResponse.data.vacancy);
        
        // Get candidate matches
        const matchesResponse = await companyService.getVacancyMatches(vacancyId, {
          minMatchScore: 0, // Get all matches initially
          includeAnalysis: true // Get full analysis data
        });
        
        setMatches(matchesResponse.data.matches);
        
        // Extract skills for filtering
        if (vacancyResponse.data.vacancy.requiredSkills) {
          setSkillsFilter(vacancyResponse.data.vacancy.requiredSkills.map(skill => ({
            name: skill,
            selected: false
          })));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching candidate matches:', err);
        setError('Failed to load candidate matches. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchMatches();
  }, [vacancyId]);
  
  // Apply filters and sorting to matches
  const filteredAndSortedMatches = React.useMemo(() => {
    // First apply minimum score filter
    let filtered = matches.filter(match => match.matchScore >= minScore);
    
    // Apply skills filter if any skills are selected
    const selectedSkills = skillsFilter.filter(s => s.selected).map(s => s.name);
    if (selectedSkills.length > 0) {
      filtered = filtered.filter(match => 
        selectedSkills.every(skill => 
          match.matchedSkills.some(ms => ms.includes(skill))
        )
      );
    }
    
    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'skills':
          return b.skillsScore - a.skillsScore;
        case 'experience':
          return b.experienceScore - a.experienceScore;
        case 'education':
          return b.educationScore - a.educationScore;
        case 'overall':
        default:
          return b.matchScore - a.matchScore;
      }
    });
  }, [matches, minScore, sortBy, skillsFilter]);
  
  const handleSkillFilterChange = (skillName) => {
    setSkillsFilter(skills => 
      skills.map(skill => 
        skill.name === skillName 
          ? { ...skill, selected: !skill.selected } 
          : skill
      )
    );
  };
  
  const renderSkillBadges = (skills) => {
    if (!skills || skills.length === 0) return <span className="text-gray-500">None</span>;
    
    return (
      <div className="flex flex-wrap gap-1">
        {skills.map((skill, index) => {
          // Check if this is a semantically matched skill
          const isSemantic = skill.includes('(semantic)');
          const isPartialMatch = skill.includes('(partial)');
          const baseSkill = skill.replace(' (semantic)', '').replace(' (partial)', '');
          
          // Check if this skill is in the filter list and selected
          const isFilteredSkill = skillsFilter.some(
            s => s.selected && s.name.toLowerCase() === baseSkill.toLowerCase()
          );
          
          return (
            <span 
              key={index} 
              className={`px-2 py-1 text-xs font-medium rounded-full 
                ${isSemantic ? 'bg-purple-100 text-purple-800' : 
                  isPartialMatch ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-blue-100 text-blue-800'}
                ${isFilteredSkill ? 'ring-2 ring-indigo-500' : ''}
              `}
            >
              {baseSkill}
              {isSemantic && 
                <span className="ml-1 text-xs text-purple-600">(semantic)</span>
              }
              {isPartialMatch && 
                <span className="ml-1 text-xs text-yellow-600">(partial)</span>
              }
            </span>
          );
        })}
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
            <h1 className="text-2xl font-bold">AI-Powered Candidate Matching</h1>
            <p className="text-gray-600">
              {vacancy ? `For: ${vacancy.title}` : `For Vacancy ID: ${vacancyId}`}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => navigate(`/company/vacancies/${vacancyId}/interview-config`)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Configure Interviews
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
        
        {/* Filters Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Refine Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Minimum Score Filter */}
            <div>
              <label htmlFor="minScore" className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Match Score: {minScore}%
              </label>
              <input
                type="range"
                id="minScore"
                name="minScore"
                min="0"
                max="100"
                value={minScore}
                onChange={(e) => setMinScore(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            {/* Sort By Filter */}
            <div>
              <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                id="sortBy"
                name="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="overall">Overall Match</option>
                <option value="skills">Skills Match</option>
                <option value="experience">Experience Match</option>
                <option value="education">Education Match</option>
              </select>
            </div>
            
            {/* Show Analysis Toggle */}
            <div className="flex items-center space-x-3 pt-6">
              <input
                id="showAnalysis"
                name="showAnalysis"
                type="checkbox"
                checked={showAnalysis}
                onChange={() => setShowAnalysis(!showAnalysis)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="showAnalysis" className="font-medium text-gray-700">
                Show Detailed Analysis
              </label>
            </div>
            
            {/* View Selected Only Button */}
            <div className="pt-6">
              <button
                onClick={() => setMinScore(70)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View Strong Matches (70%+)
              </button>
            </div>
          </div>
          
          {/* Skills Filter */}
          {skillsFilter.length > 0 && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Required Skills
              </label>
              <div className="flex flex-wrap gap-2">
                {skillsFilter.map((skill, index) => (
                  <button
                    key={index}
                    onClick={() => handleSkillFilterChange(skill.name)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      skill.selected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Match Results */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-medium text-gray-900">Matching Results</h2>
              <p className="text-sm text-gray-500">
                {filteredAndSortedMatches.length} candidates match your criteria
              </p>
            </div>
          </div>
          
          {filteredAndSortedMatches.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredAndSortedMatches.map((match, index) => (
                <div key={match.candidateId} className={`p-6 ${index === 0 ? 'bg-green-50' : ''}`}>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                    <div className="flex-1">
                      {/* Candidate Name and Basic Info */}
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-semibold">
                          {match.candidateName.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <h3 className="text-lg font-medium text-gray-900">{match.candidateName}</h3>
                          <p className="text-sm text-gray-500">{match.candidateEmail}</p>
                        </div>
                        {index === 0 && (
                          <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Top Match
                          </span>
                        )}
                      </div>
                      
                      {/* Match Score Indicators */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs font-medium">Overall</span>
                            <span className="text-xs font-medium">{Math.round(match.matchScore)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getScoreColorClass(match.matchScore)}`}
                              style={{ width: `${match.matchScore}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs font-medium">Skills</span>
                            <span className="text-xs font-medium">{Math.round(match.skillsScore)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-blue-600"
                              style={{ width: `${match.skillsScore}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs font-medium">Experience</span>
                            <span className="text-xs font-medium">{Math.round(match.experienceScore)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-purple-600"
                              style={{ width: `${match.experienceScore}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs font-medium">Education</span>
                            <span className="text-xs font-medium">{Math.round(match.educationScore)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-yellow-600"
                              style={{ width: `${match.educationScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Skills Match */}
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700">Matched Skills:</p>
                        {renderSkillBadges(match.matchedSkills)}
                      </div>
                      
                      {match.missingSkills.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">Missing Skills:</p>
                          <div className="flex flex-wrap gap-1">
                            {match.missingSkills.map((skill, skillIndex) => (
                              <span 
                                key={skillIndex} 
                                className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Detailed Analysis (expandable) */}
                      {showAnalysis && match.analysis && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <details className="text-sm">
                            <summary className="text-indigo-600 cursor-pointer font-medium">
                              View Detailed Analysis
                            </summary>
                            <div className="mt-2 p-3 bg-gray-50 rounded-md">
                              {match.analysis.experience && (
                                <div className="mb-2">
                                  <p className="font-medium">Experience Analysis:</p>
                                  <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                                    <li>Total years: {match.analysis.experience.totalYears} years (Required: {match.analysis.experience.requiredYears} years)</li>
                                    <li>Relevance to job: {Math.round(match.analysis.experience.relevance)}%</li>
                                    <li>Recency score: {Math.round(match.analysis.experience.recency)}%</li>
                                  </ul>
                                </div>
                              )}
                              
                              <div>
                                <p className="font-medium">Match Quality Indicators:</p>
                                <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                                  <li>Skills match: {Math.round(match.skillsScore)}% ({match.matchedSkills.length}/{match.matchedSkills.length + match.missingSkills.length} required skills)</li>
                                  <li>Experience match: {Math.round(match.experienceScore)}%</li>
                                  <li>Education match: {Math.round(match.educationScore)}%</li>
                                </ul>
                              </div>
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="mt-4 md:mt-0 md:ml-6 flex flex-col space-y-2">
                      {match.cvUrl && (
                        <a 
                          href={match.cvUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <svg className="mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View CV
                        </a>
                      )}
                      
                      <Link 
                        to={`/company/candidates/${match.candidateId}`}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <svg className="mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        View Profile
                      </Link>
                      
                      <button
                        onClick={() => navigate(`/company/vacancies/${vacancyId}/interview/${match.candidateId}`)}
                        className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <svg className="mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Schedule Interview
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">No candidates match your filtering criteria.</p>
              <button
                onClick={() => {
                  setMinScore(0);
                  setSortBy('overall');
                  setSkillsFilter(skillsFilter.map(s => ({ ...s, selected: false })));
                }}
                className="mt-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
        
        {/* Recommendation Insights */}
        {filteredAndSortedMatches.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">AI Matching Insights</h2>
            <div className="prose max-w-none">
              <p>Based on your job requirements, we've identified {filteredAndSortedMatches.length} potential candidates.</p>
              
              {filteredAndSortedMatches.length > 0 && (
                <>
                  <p className="font-medium">Top Candidate: {filteredAndSortedMatches[0].candidateName}</p>
                  <ul>
                    <li>Overall match score: {Math.round(filteredAndSortedMatches[0].matchScore)}%</li>
                    <li>Skills match: {Math.round(filteredAndSortedMatches[0].skillsScore)}%</li>
                    <li>Experience match: {Math.round(filteredAndSortedMatches[0].experienceScore)}%</li>
                  </ul>
                  
                  <p>
                    This candidate matches {filteredAndSortedMatches[0].matchedSkills.length} out of {filteredAndSortedMatches[0].matchedSkills.length + filteredAndSortedMatches[0].missingSkills.length} required skills for this position.
                  </p>
                </>
              )}
              
              {/* Skill Gap Analysis */}
              {vacancy && vacancy.requiredSkills && vacancy.requiredSkills.length > 0 && (
                <div className="mt-4">
                  <p className="font-medium">Skill Gap Analysis:</p>
                  <p className="text-sm text-gray-600">
                    The chart below shows how many candidates possess each required skill:
                  </p>
                  
                  <div className="mt-2 space-y-2">
                    {vacancy.requiredSkills.map((skill, index) => {
                      // Count how many candidates have this skill
                      const candidatesWithSkill = filteredAndSortedMatches.filter(m => 
                        m.matchedSkills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
                      ).length;
                      
                      const percentage = Math.round((candidatesWithSkill / filteredAndSortedMatches.length) * 100);
                      
                      return (
                        <div key={index}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{skill}</span>
                            <span className="text-sm font-medium">{candidatesWithSkill}/{filteredAndSortedMatches.length} candidates ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${percentage < 30 ? 'bg-red-500' : percentage < 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <p className="mt-4 text-sm text-gray-600">
                    Consider adjusting your job requirements if you're having difficulty finding candidates with certain skills.
                  </p>
                </div>
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

export default AdvancedCandidateMatches;