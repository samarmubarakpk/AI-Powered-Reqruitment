// src/components/company/CandidateProfile.js
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { companyService } from '../../services/api';
import NavBar from '../layout/NavBar';

function CandidateProfile() {
  const { id: candidateId, vacancyId } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [vacancy, setVacancy] = useState(null);
  const [matchDetails, setMatchDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchCandidateProfile = async () => {
      try {
        setLoading(true);
        
        // Get candidate details
        const candidateResponse = await companyService.getCandidateProfile(candidateId);
        setCandidate(candidateResponse.data.candidate);
        
        // Get vacancy details if vacancyId is provided
        if (vacancyId) {
          const vacancyResponse = await companyService.getVacancy(vacancyId);
          setVacancy(vacancyResponse.data.vacancy);
          
          // Get match details
          const matchResponse = await companyService.getCandidateMatch(vacancyId, candidateId);
          setMatchDetails(matchResponse.data.match);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching candidate profile:', err);
        setError('Failed to load candidate profile. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchCandidateProfile();
  }, [candidateId, vacancyId]);
  
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
            <h1 className="text-2xl font-bold">Candidate Profile</h1>
            {vacancy && (
              <p className="text-gray-600">
                Application for: {vacancy.title}
              </p>
            )}
          </div>
          <div>
            {vacancyId ? (
              <Link
                to={`/company/vacancies/${vacancyId}/applications`}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                Back to Applications
              </Link>
            ) : (
              <Link
                to="/company/vacancies"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                Back to Vacancies
              </Link>
            )}
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
        
        {candidate && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column: Personal info */}
            <div className="md:col-span-1">
              <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold">
                      {candidate.firstName ? candidate.firstName.charAt(0) : ''}
                      {candidate.lastName ? candidate.lastName.charAt(0) : ''}
                    </div>
                    <div className="ml-4">
                      <h2 className="text-xl font-bold text-gray-900">
                        {candidate.firstName} {candidate.lastName}
                      </h2>
                      <p className="text-sm text-gray-500">{candidate.email}</p>
                    </div>
                  </div>
                  
                  {candidate.cvUrl && (
                    <div className="mt-6">
                      <a 
                        href={candidate.cvUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <svg className="h-5 w-5 mr-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Full CV
                      </a>
                    </div>
                  )}
                </div>
                
                {/* Match score */}
                {matchDetails && (
                  <div className="border-t border-gray-200 px-6 py-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Match Score</h3>
                    <div className="flex flex-col space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Overall Match</span>
                          <span className="text-sm font-medium">{Math.round(matchDetails.totalScore)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${getScoreColorClass(matchDetails.totalScore)}`}
                            style={{ width: `${matchDetails.totalScore}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Skills</span>
                          <span className="text-sm font-medium">{Math.round(matchDetails.skillsScore)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="h-2.5 rounded-full bg-blue-600"
                            style={{ width: `${matchDetails.skillsScore}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Experience</span>
                          <span className="text-sm font-medium">{Math.round(matchDetails.experienceScore)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="h-2.5 rounded-full bg-purple-600"
                            style={{ width: `${matchDetails.experienceScore}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Education</span>
                          <span className="text-sm font-medium">{Math.round(matchDetails.educationScore)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="h-2.5 rounded-full bg-yellow-600"
                            style={{ width: `${matchDetails.educationScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right column: Skills, Experience, Education */}
            <div className="md:col-span-2">
              {/* Skills */}
              <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Skills</h3>
                  
                  {candidate.skills && candidate.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map((skill, index) => (
                        <span 
                          key={index} 
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            matchDetails && matchDetails.matchedSkills.includes(skill) 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {skill}
                          {matchDetails && matchDetails.matchedSkills.includes(skill) && (
                            <svg className="inline-block ml-1 h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No skills listed</p>
                  )}
                  
                  {/* Missing skills */}
                  {matchDetails && matchDetails.missingSkills.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Missing Required Skills:</h4>
                      <div className="flex flex-wrap gap-2">
                        {matchDetails.missingSkills.map((skill, index) => (
                          <span 
                            key={index} 
                            className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Experience */}
              <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Work Experience</h3>
                  
                  {candidate.experience && candidate.experience.length > 0 ? (
                    <div className="space-y-6">
                      {candidate.experience.map((exp, index) => (
                        <div key={index} className="border-l-2 border-gray-200 pl-4">
                          <h4 className="text-md font-medium text-gray-900">{exp.position}</h4>
                          <p className="text-sm text-gray-700">{exp.company}</p>
                          <p className="text-sm text-gray-500">
                            {exp.startDate || ''} - {exp.endDate || (exp.current ? 'Present' : '')}
                          </p>
                          {exp.description && (
                            <p className="mt-2 text-sm text-gray-600">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No work experience listed</p>
                  )}
                </div>
              </div>
              
              {/* Education */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Education</h3>
                  
                  {candidate.education && candidate.education.length > 0 ? (
                    <div className="space-y-6">
                      {candidate.education.map((edu, index) => (
                        <div key={index} className="border-l-2 border-gray-200 pl-4">
                          <h4 className="text-md font-medium text-gray-900">{edu.degree} {edu.field}</h4>
                          <p className="text-sm text-gray-700">{edu.institution}</p>
                          <p className="text-sm text-gray-500">
                            {edu.startDate || ''} - {edu.endDate || (edu.current ? 'Present' : '')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No education listed</p>
                  )}
                </div>
              </div>
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

export default CandidateProfile;