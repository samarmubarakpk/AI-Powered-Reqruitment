// src/components/company/EnhancedCandidateSearch.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { companyService } from '../../services/api';
import NavBar from '../layout/NavBar';
import SkillMatchingVisualization from './SkillMatchingVisualization';
import CVAnalysisComponent from './CVAnalysisComponent';
import {  enhancedCompanyService } from '../../services/api';
import CVLinkComponent from './CVLinkComponent';


function EnhancedCandidateSearch() {
  // Basic state
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [error, setError] = useState('');
  const [vacancy, setVacancy] = useState(null);
  
  // Advanced filtering state
  const [minScore, setMinScore] = useState(0);
  const [maxScore, setMaxScore] = useState(100);
  const [sortBy, setSortBy] = useState('overall');
  const [skillsFilter, setSkillsFilter] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  
  // Search parameters
  const [searchParams, setSearchParams] = useState({
    skills: [],
    experienceMin: '',
    experienceMax: '',
    education: '',
    location: '',
    fuzzyMatching: true,
    vacancyId: '' // Optional vacancy ID for context-specific search
  });
  
  // New skill input
  const [newSkill, setNewSkill] = useState('');
  
  // Fetch predefined skill options from vacancies
  const [availableSkills, setAvailableSkills] = useState([]);
  
    // Fetch available vacancies for reference search
    const [vacancies, setVacancies] = useState([]);

    useEffect(() => {
      // Fetch available vacancies
      const fetchVacancies = async () => {
        try {
          const response = await companyService.getVacancies();
          setVacancies(response.data.vacancies || []);
          
          // Collect all unique skills from vacancies
          const skillsSet = new Set();
          response.data.vacancies.forEach(vacancy => {
            if (vacancy.requiredSkills && Array.isArray(vacancy.requiredSkills)) {
              vacancy.requiredSkills.forEach(skill => skillsSet.add(skill));
            }
          });
          
          setAvailableSkills(Array.from(skillsSet).map(skill => ({
            name: skill,
            selected: false
          })));
        } catch (err) {
          console.error('Error fetching vacancies:', err);
        }
      };
      
      fetchVacancies();
    }, []);
    
    useEffect(() => {
      if (searchParams.vacancyId) {
        const selectedVacancy = vacancies.find(v => v.id === searchParams.vacancyId);
        if (selectedVacancy && selectedVacancy.requiredSkills) {
          setVacancy(selectedVacancy);
          
          // Update skill filters based on vacancy skills
          setSkillsFilter(selectedVacancy.requiredSkills.map(skill => ({
            name: skill,
            selected: false
          })));
          
          // Auto-fill skills in search params
          setSearchParams(prev => ({
            ...prev,
            skills: selectedVacancy.requiredSkills
          }));
          
          // Automatically fetch matches when a vacancy is selected
          (async () => {
            try {
              setLoading(true);
              const response = await companyService.getVacancyMatches(searchParams.vacancyId);
              setCandidates(response.data.matches || []);
              setSearchPerformed(true);
              setLoading(false);
            } catch (err) {
              console.error('Error fetching matches:', err);
              setLoading(false);
            }
          })();
        }
      } else {
        setVacancy(null);
        // Reset skill filters if no vacancy selected
        setSkillsFilter(availableSkills);
      }
    }, [searchParams.vacancyId, vacancies, availableSkills]);
    
    const handleSearch = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Use enhancedCompanyService instead of companyService
        const response = await enhancedCompanyService.enhancedCandidateSearch({
          ...searchParams,
          experienceMin: searchParams.experienceMin ? parseInt(searchParams.experienceMin) : undefined,
          experienceMax: searchParams.experienceMax ? parseInt(searchParams.experienceMax) : undefined,
          minMatchScore: minScore,
          maxMatchScore: maxScore
        });
        
        // The rest of your function remains the same
        if (searchParams.vacancyId) {
          setCandidates(response.data.candidates || []);
        } else {
          // Convert the response format as needed
          const standardizedCandidates = response.data.candidates.map(candidate => ({
            candidateId: candidate.id,
            candidateName: `${candidate.firstName} ${candidate.lastName}`,
            candidateEmail: candidate.email,
            cvUrl: candidate.cvUrl,
            matchScore: candidate.matchScore || 75,
            skillsScore: candidate.skillsScore || 70,
            experienceScore: candidate.experienceScore || 80,
            educationScore: candidate.educationScore || 75,
            matchedSkills: candidate.skills || [],
            missingSkills: []
          }));
          
          setCandidates(standardizedCandidates);
        }
        
        setSearchPerformed(true);
        setLoading(false);
      } catch (err) {
        console.error('Error searching candidates:', err);
        setError('Failed to search candidates. Please try again.');
        setLoading(false);
      }
    };
  
  // Filter candidates based on selections
  const filteredCandidates = React.useMemo(() => {
    if (!candidates.length) return [];
    
    // Apply score filters
    let filtered = candidates.filter(candidate => 
      candidate.matchScore >= minScore && 
      candidate.matchScore <= maxScore
    );
    
    // Apply skills filter if any skills are selected
    const selectedSkills = skillsFilter.filter(s => s.selected).map(s => s.name);
    if (selectedSkills.length > 0) {
      filtered = filtered.filter(candidate => 
        selectedSkills.every(skill => 
          candidate.matchedSkills && candidate.matchedSkills.some(ms => 
            ms.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(ms.toLowerCase())
          )
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
  }, [candidates, minScore, maxScore, sortBy, skillsFilter]);
  
  const handleAddSkill = () => {
    if (newSkill.trim() && !searchParams.skills.includes(newSkill.trim())) {
      setSearchParams({
        ...searchParams,
        skills: [...searchParams.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };
  
  const handleRemoveSkill = (skill) => {
    setSearchParams({
      ...searchParams,
      skills: searchParams.skills.filter(s => s !== skill)
    });
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams({
      ...searchParams,
      [name]: value
    });
  };
  
  const handleSkillFilterChange = (skillName) => {
    setSkillsFilter(skills => 
      skills.map(skill => 
        skill.name === skillName 
          ? { ...skill, selected: !skill.selected } 
          : skill
      )
    );
  };
  
  const handleCandidateClick = (candidateId) => {
    setSelectedCandidateId(candidateId === selectedCandidateId ? null : candidateId);
  };
  
  // Helper function to get score color class
  const getScoreColorClass = (score) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-blue-600';
    if (score >= 40) return 'bg-yellow-600';
    return 'bg-red-600';
  };
  
  // Render skill badges with highlighting for matches
  const renderSkillBadges = (skills, isMatched = false) => {
    if (!skills || skills.length === 0) return <span className="text-gray-500">None</span>;
    
    return (
      <div className="flex flex-wrap gap-1">
        {skills.map((skill, index) => {
          // Check if this is a semantically matched skill
          const isSemantic = typeof skill === 'string' && skill.includes('(semantic)');
          const isPartialMatch = typeof skill === 'string' && skill.includes('(partial)');
          const baseSkill = typeof skill === 'string' ? 
            skill.replace(' (semantic)', '').replace(' (partial)', '') : 
            skill;
          
          // Check if this skill is in the filter list and selected
          const isFilteredSkill = skillsFilter.some(
            s => s.selected && s.name.toLowerCase() === (typeof baseSkill === 'string' ? baseSkill.toLowerCase() : '')
          );
          
          return (
            <span 
              key={index} 
              className={`px-2 py-1 text-xs font-medium rounded-full 
                ${isSemantic ? 'bg-purple-100 text-purple-800' : 
                  isPartialMatch ? 'bg-yellow-100 text-yellow-800' : 
                  isMatched ? 'bg-green-100 text-green-800' :
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
  
  return (
    <div>
      <NavBar userType="company" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Enhanced Candidate Search</h1>
        
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
        
        {/* Search Form */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Search Parameters</h2>
            
            <div className="space-y-6">
              {/* Vacancy Selection */}
              <div>
                <label htmlFor="vacancyId" className="block text-sm font-medium text-gray-700">
                  Search Based on Job Vacancy (Optional)
                </label>
                <select
                  id="vacancyId"
                  name="vacancyId"
                  value={searchParams.vacancyId}
                  onChange={handleInputChange}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">General Search (No specific vacancy)</option>
                  {vacancies.filter(v => v.status === 'open').map(vacancy => (
                    <option key={vacancy.id} value={vacancy.id}>
                      {vacancy.title}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Selecting a vacancy will use AI-powered matching against specific job requirements
                </p>
              </div>
              
              {/* Skills Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Required Skills
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    className="flex-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Enter a skill"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    list="available-skills"
                  />
                  <datalist id="available-skills">
                    {availableSkills.map((skill, idx) => (
                      <option key={idx} value={skill.name} />
                    ))}
                  </datalist>
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Add
                  </button>
                </div>
                
                {searchParams.skills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {searchParams.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-1.5 inline-flex flex-shrink-0 h-4 w-4 rounded-full text-indigo-400 hover:text-indigo-600 focus:outline-none focus:text-indigo-500"
                        >
                          <span className="sr-only">Remove {skill}</span>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Experience Range */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="experienceMin" className="block text-sm font-medium text-gray-700">
                    Minimum Experience (years)
                  </label>
                  <input
                    type="number"
                    id="experienceMin"
                    name="experienceMin"
                    min="0"
                    value={searchParams.experienceMin}
                    onChange={handleInputChange}
                    className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="experienceMax" className="block text-sm font-medium text-gray-700">
                    Maximum Experience (years)
                  </label>
                  <input
                    type="number"
                    id="experienceMax"
                    name="experienceMax"
                    min="0"
                    value={searchParams.experienceMax}
                    onChange={handleInputChange}
                    className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              {/* Education */}
              <div>
                <label htmlFor="education" className="block text-sm font-medium text-gray-700">
                  Education
                </label>
                <select
                  id="education"
                  name="education"
                  value={searchParams.education}
                  onChange={handleInputChange}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Any Education Level</option>
                  <option value="Bachelor">Bachelor's Degree</option>
                  <option value="Master">Master's Degree</option>
                  <option value="PhD">PhD / Doctorate</option>
                </select>
              </div>
              
              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={searchParams.location}
                  onChange={handleInputChange}
                  className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="City, State, or Country"
                />
              </div>
              
              {/* Advanced Settings */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Advanced Settings</h3>
                
                <div className="flex items-center">
                  <input
                    id="fuzzyMatching"
                    name="fuzzyMatching"
                    type="checkbox"
                    checked={searchParams.fuzzyMatching}
                    onChange={(e) => setSearchParams({...searchParams, fuzzyMatching: e.target.checked})}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="fuzzyMatching" className="ml-2 block text-sm text-gray-700">
                    Enable Fuzzy Matching
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Fuzzy matching will find candidates with similar but not exact skill matches using semantic analysis
                </p>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Searching...
                    </>
                  ) : "Search Candidates"}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters Section - Appears after search */}
        {searchPerformed && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Refine Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Match Score Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Match Score Range: {minScore}% - {maxScore}%
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={minScore}
                    onChange={(e) => setMinScore(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={maxScore}
                    onChange={(e) => setMaxScore(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
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
              
              {/* Quick Filter Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setMinScore(80)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  High Matches (80%+)
                </button>
                <button
                  onClick={() => { setMinScore(60); setMaxScore(80); }}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Medium Matches (60-80%)
                </button>
              </div>
            </div>
            
            {/* Skills Filter */}
            {skillsFilter.length > 0 && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Skills
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
        )}
        
        {/* Skill Coverage Visualization - Only if vacancy is selected */}
        {searchPerformed && vacancy && filteredCandidates.length > 0 && (
          <SkillMatchingVisualization 
            vacancy={vacancy} 
            candidates={filteredCandidates} 
          />
        )}
        
        {/* Search Results */}
        {searchPerformed && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Search Results</h2>
                <span className="text-sm text-gray-500">
                  {filteredCandidates.length} candidates found
                </span>
              </div>
            </div>
            
            {filteredCandidates.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredCandidates.map((candidate) => (
                  <div key={candidate.candidateId} className="p-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                      <div className="flex-1">
                        {/* Candidate Name and Basic Info */}
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-semibold">
                            {candidate.candidateName.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900">{candidate.candidateName}</h3>
                            <p className="text-sm text-gray-500">{candidate.candidateEmail}</p>
                          </div>
                        </div>
                        
                        {/* Skills Match */}
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700">Matched Skills:</p>
                          {renderSkillBadges(candidate.matchedSkills, true)}
                        </div>
                        
                        {candidate.missingSkills && candidate.missingSkills.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700">Missing Skills:</p>
                            <div className="flex flex-wrap gap-1">
                              {candidate.missingSkills.map((skill, skillIndex) => (
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
                        
                        {/* Expandable Analysis */}
                        <div className="mt-4">
                          <button
                            onClick={() => handleCandidateClick(candidate.candidateId)}
                            className="text-sm text-indigo-600 hover:text-indigo-900 flex items-center"
                          >
                            {selectedCandidateId === candidate.candidateId ? 'Hide Details' : 'Show Details'}
                            <svg className={`ml-1 h-4 w-4 transform ${selectedCandidateId === candidate.candidateId ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="mt-4 md:mt-0 md:ml-6 flex flex-col space-y-2">
                      {(candidate.candidateId || candidate.cvUrl) && (
                          candidate.candidateId ? (
                            <CVLinkComponent 
                              candidateId={candidate.candidateId} 
                              buttonStyle={true} 
                            />
                          ) : candidate.cvUrl ? (
                            <a 
                              href={candidate.cvUrl} 
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
                          ) : null
                        )}
                        
                        <Link 
                          to={`/company/candidates/${candidate.candidateId}`}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <svg className="mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          View Profile
                        </Link>
                        
                        {searchParams.vacancyId && (
                          <button
                            onClick={() => window.location.href = `/company/vacancies/${searchParams.vacancyId}/interview/${candidate.candidateId}`}
                            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <svg className="mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Schedule Interview
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Expanded Details Section */}
                    {selectedCandidateId === candidate.candidateId && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <CVAnalysisComponent matchData={candidate} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No candidates found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search criteria to find more candidates.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setMinScore(0);
                      setMaxScore(100);
                      setSkillsFilter(skillsFilter.map(s => ({ ...s, selected: false })));
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default EnhancedCandidateSearch;