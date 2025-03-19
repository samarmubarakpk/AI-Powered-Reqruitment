// src/components/candidate/JobSearch.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { candidateService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import NavBar from '../layout/NavBar';
import SuitabilityScoreModal from './SuitabilityScoreModal';

function JobSearch() {
  const { currentUser } = useAuth();
  const [vacancies, setVacancies] = useState([]);
  const [filteredVacancies, setFilteredVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [applications, setApplications] = useState([]);
  const [applyingTo, setApplyingTo] = useState(null);
  const [applySuccess, setApplySuccess] = useState('');
  const [applyError, setApplyError] = useState('');
  const [profile, setProfile] = useState(null);
  const [filters, setFilters] = useState({
    industry: '',
    experienceLevel: ''
  });
  const [currentApplication, setCurrentApplication] = useState(null);
  const [showSuitabilityModal, setShowSuitabilityModal] = useState(false);

  // Fetch vacancies, candidate profile and applications on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch candidate profile to check for CV
        try {
          const profileResponse = await candidateService.getProfile();
          setProfile(profileResponse.data.candidate);
        } catch (err) {
          console.error('Error fetching profile:', err);
        }
        
        // Fetch user's existing applications
        try {
          const applicationsResponse = await candidateService.getApplications();
          setApplications(applicationsResponse.data.applications || []);
        } catch (err) {
          console.error('Error fetching applications:', err);
          setApplications([]);
        }
        
        // Use the public-vacancies endpoint from candidates API
        try {
          const vacancyResponse = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/candidates/public-vacancies`);
          
          // Get data from response and filter only open vacancies
          const vacanciesList = vacancyResponse.data.vacancies || [];
          const openVacancies = vacanciesList.filter(vacancy => vacancy.status === 'open');
          setVacancies(openVacancies);
          setFilteredVacancies(openVacancies);
        } catch (err) {
          console.error('Error fetching vacancies:', err);
          setError('Failed to load job listings. Please try again later.');
          setVacancies([]);
          setFilteredVacancies([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error in data fetching:', err);
        setError('An error occurred while loading data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter vacancies based on search term and filters
  useEffect(() => {
    if (!vacancies.length) return;
    
    const filtered = vacancies.filter(vacancy => {
      const matchesSearch = vacancy.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (vacancy.description && vacancy.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (vacancy.requiredSkills && vacancy.requiredSkills.some(skill => 
                             skill.toLowerCase().includes(searchTerm.toLowerCase())
                           ));
      
      const matchesIndustry = !filters.industry || vacancy.industry === filters.industry;
      
      const matchesExperience = !filters.experienceLevel || 
                               (filters.experienceLevel === 'entry' && vacancy.experienceRequired <= 2) ||
                               (filters.experienceLevel === 'mid' && vacancy.experienceRequired > 2 && vacancy.experienceRequired <= 5) ||
                               (filters.experienceLevel === 'senior' && vacancy.experienceRequired > 5);
      
      return matchesSearch && matchesIndustry && matchesExperience;
    });
    
    setFilteredVacancies(filtered);
  }, [searchTerm, filters, vacancies]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handleApply = async (vacancyId) => {
    // Clear previous messages
    setApplySuccess('');
    setApplyError('');
    
    // Check if user has uploaded a CV
    if (!profile || !profile.cvUrl) {
      setApplyError('Please upload your CV before applying for jobs');
      return;
    }
    
    // Check if already applied
    if (applications.some(app => app.vacancyId === vacancyId)) {
      setApplyError('You have already applied for this position');
      return;
    }
    
    setApplyingTo(vacancyId);
    
    try {
      const response = await candidateService.applyForVacancy(vacancyId);
      
      // Get suitability score from response
      const suitabilityScore = response.data.application.suitabilityScore;
      
      // Update applications list
      const newApplication = {
        id: response.data.application.id,
        vacancyId,
        status: 'applied',
        appliedAt: new Date().toISOString(),
        suitabilityScore
      };
      
      setApplications([...applications, newApplication]);
      
      // Show success message with suitability score
      setApplySuccess(`Application submitted successfully! Your match score is ${Math.round(suitabilityScore.overall)}%`);
      
      // Set the current application to show the detailed suitability modal
      setCurrentApplication(newApplication);
      setShowSuitabilityModal(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setApplySuccess('');
      }, 3000);
    } catch (err) {
      console.error('Error applying for vacancy:', err);
      setApplyError(err.response?.data?.message || 'Failed to submit application. Please try again.');
    } finally {
      setApplyingTo(null);
    }
  };

  const hasApplied = (vacancyId) => {
    return applications.some(app => app.vacancyId === vacancyId);
  };

  if (loading) {
    return (
      <div>
        <NavBar userType="candidate" />
        <div className="max-w-7xl mx-auto px-4 py-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavBar userType="candidate" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Find Jobs</h1>
          <p className="text-gray-600">Discover job opportunities matching your skills and experience</p>
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
        
        {/* Search & Filter Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="search" className="sr-only">Search jobs</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Search by job title, skills, or keywords"
                  type="search"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="industry" className="sr-only">Industry</label>
              <select
                id="industry"
                name="industry"
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={filters.industry}
                onChange={handleFilterChange}
              >
                <option value="">All Industries</option>
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Education">Education</option>
                <option value="Retail">Retail</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="experienceLevel" className="sr-only">Experience Level</label>
              <select
                id="experienceLevel"
                name="experienceLevel"
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={filters.experienceLevel}
                onChange={handleFilterChange}
              >
                <option value="">All Experience Levels</option>
                <option value="entry">Entry Level (0-2 years)</option>
                <option value="mid">Mid Level (3-5 years)</option>
                <option value="senior">Senior Level (6+ years)</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* CV Status Alert - Only show if no CV uploaded */}
        {(!profile || !profile.cvUrl) && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  You need to upload your CV before applying for jobs. 
                  <Link to="/candidate/upload-cv" className="font-medium underline text-yellow-700 hover:text-yellow-600 ml-1">
                    Upload now
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Application Alerts */}
        {applySuccess && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{applySuccess}</p>
              </div>
            </div>
          </div>
        )}
        
        {applyError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{applyError}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Job Listings */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Available Positions</h2>
              <span className="text-sm text-gray-500">{filteredVacancies.length} jobs found</span>
            </div>
          </div>
          
          {filteredVacancies.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredVacancies.map((vacancy) => (
                <div key={vacancy.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{vacancy.title}</h3>
                      <div className="mt-1 flex flex-wrap items-center text-sm text-gray-500">
                        <span>{vacancy.companyName || 'Company'}</span>
                        {vacancy.industry && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{vacancy.industry}</span>
                          </>
                        )}
                        {vacancy.experienceRequired > 0 && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{vacancy.experienceRequired} years experience</span>
                          </>
                        )}
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-sm text-gray-500">
                          {vacancy.description && vacancy.description.length > 200
                            ? `${vacancy.description.substring(0, 200)}...`
                            : vacancy.description}
                        </p>
                      </div>
                      
                      {vacancy.requiredSkills && vacancy.requiredSkills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {vacancy.requiredSkills.map((skill, index) => (
                            <span 
                              key={index} 
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="mt-3 text-sm text-gray-500">
                        <span>Posted: {new Date(vacancy.postingDate).toLocaleDateString()}</span>
                        {vacancy.closingDate && (
                          <>
                            <span className="mx-2">•</span>
                            <span>Deadline: {new Date(vacancy.closingDate).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0 md:ml-6 flex items-center">
                      {hasApplied(vacancy.id) ? (
                        <span className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600">
                          Applied
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApply(vacancy.id)}
                          disabled={applyingTo === vacancy.id || !profile?.cvUrl}
                          className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                            profile?.cvUrl
                              ? 'bg-indigo-600 hover:bg-indigo-700'
                              : 'bg-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {applyingTo === vacancy.id ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Applying...
                            </>
                          ) : 'Apply Now'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">No jobs found matching your criteria.</p>
              {searchTerm || filters.industry || filters.experienceLevel ? (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilters({ industry: '', experienceLevel: '' });
                  }}
                  className="mt-2 text-indigo-600 hover:text-indigo-500"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
      
      {showSuitabilityModal && currentApplication && (
        <SuitabilityScoreModal 
          application={currentApplication} 
          onClose={() => setShowSuitabilityModal(false)} 
        />
      )}
    </div>
  );
}

export default JobSearch;