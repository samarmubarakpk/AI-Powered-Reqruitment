// src/components/company/ApplicationsManagement.js
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { companyService } from '../../services/api';
import NavBar from '../layout/NavBar';
import CandidateDetailsModal from './CandidateDetailsModal';
import CVLinkComponent from './CVLinkComponent';
import InterviewQuestionsModal from './InterviewQuestionsModal';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function ApplicationsManagement() {
  const navigate = useNavigate();
  const { id: vacancyId } = useParams();
  const [vacancy, setVacancy] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortType, setSortType] = useState('default'); // New state for sorting
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [currentInterviewCandidate, setCurrentInterviewCandidate] = useState(null);
  const [generatedQuestions, setGeneratedQuestions] = useState(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      console.log(`Starting to fetch data for vacancy ID: ${vacancyId}`);
      setLoading(true);
      setError('');
      
      try {
        // Step 1: Fetch vacancy details
        console.log("Fetching vacancy details...");
        let vacancyData = null;
        try {
          const vacancyResponse = await companyService.getVacancy(vacancyId);
          console.log("Vacancy response received");
          vacancyData = vacancyResponse.data.vacancy;
          setVacancy(vacancyData);
          console.log("Vacancy data set successfully");
        } catch (vacancyError) {
          console.error("Error fetching vacancy:", vacancyError);
          // Continue even if vacancy fetch fails - don't abort the whole process
        }
        
        // Step 2: Fetch applications
        console.log(`Fetching applications for vacancy ID: ${vacancyId}`);
        try {
          const applicationsResponse = await companyService.getApplications(vacancyId);
          console.log("Applications response received");
          
          // Check if response has the expected structure
          if (applicationsResponse && applicationsResponse.data) {
            const applicationsData = applicationsResponse.data.applications || [];
            console.log(`Found ${applicationsData.length} applications`);
            
            setApplications(applicationsData);
            // If we got here without error, it's successful
            setLoading(false);
          } else {
            console.error("Unexpected response format");
            setError('Received invalid data format from server');
            setLoading(false);
          }
        } catch (applicationsError) {
          console.error("Error fetching applications:", applicationsError);
          // More detailed error message
          const errorMessage = applicationsError.response?.data?.message || 
                              applicationsError.message || 
                              'Failed to load applications. Please try again later.';
          setError(errorMessage);
          // Initialize with empty array to prevent UI issues
          setApplications([]);
          setLoading(false);
        }
      } catch (err) {
        console.error('Unexpected error in fetchData:', err);
        setError('An unexpected error occurred. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [vacancyId]);
  
  // Filter and sort applications based on status and sort type
  useEffect(() => {
    console.log(`Filtering applications by status: ${statusFilter} and sort type: ${sortType}`);
    
    // First filter by status
    let filtered = applications;
    if (statusFilter !== 'all') {
      filtered = applications.filter(app => app.status === statusFilter);
    }
    
    // Then sort based on sort type
    if (sortType === 'overallMatch') {
      filtered = [...filtered].sort((a, b) => {
        // Extract suitability scores, defaulting to 0 if not present
        const scoreA = a.suitabilityScore?.overall || 
                     (a.suitabilityScore && typeof a.suitabilityScore === 'number' ? a.suitabilityScore : 0);
        const scoreB = b.suitabilityScore?.overall || 
                     (b.suitabilityScore && typeof b.suitabilityScore === 'number' ? b.suitabilityScore : 0);
        
        // Sort in descending order (highest match first)
        return scoreB - scoreA;
      });
    } else if (sortType === 'recent') {
      filtered = [...filtered].sort((a, b) => {
        // Sort by application date (newest first)
        return new Date(b.appliedAt) - new Date(a.appliedAt);
      });
    }
    
    setFilteredApplications(filtered);
    console.log("Filtering and sorting complete");
  }, [statusFilter, sortType, applications]);
  
  // Alternative implementation to debug and fix the status update issue
  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      console.log(`Updating application ${applicationId} status to ${newStatus}`);
      
      // Show confirmation for rejection
      if (newStatus === 'rejected' && !window.confirm('Are you sure you want to reject this applicant?')) {
        return; // User cancelled the rejection
      }
      
      // Show confirmation for interview
      if (newStatus === 'interviewed' && !window.confirm('Are you sure you want to mark this applicant for interview?')) {
        return; // User cancelled the interview status
      }
      
      // Add loading state for the specific application
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, isUpdating: true } : app
      ));
      
      // Log the application to make sure it exists
      console.log("Applications:", applications);
      const appToUpdate = applications.find(app => app.id === applicationId);
      console.log("Application to update:", appToUpdate);
      
      if (!appToUpdate) {
        throw new Error(`Application with ID ${applicationId} not found in local state`);
      }
      
      // Call the API to update the status
      const response = await companyService.updateApplicationStatus(applicationId, newStatus);
      console.log("Status update API response:", response);
      
      if (response && response.data) {
        // Update local state
        setApplications(applications.map(app => 
          app.id === applicationId ? { ...app, status: newStatus, isUpdating: false } : app
        ));
        
        // Show success message based on the action
        if (newStatus === 'rejected') {
          alert('Applicant has been rejected.');
        } else if (newStatus === 'interviewed') {
          alert('Applicant has been moved to the interview stage.');
          
          // Offer to navigate to interviews page
          const goToInterviews = window.confirm('Would you like to go to the Interviews page now?');
          if (goToInterviews) {
            navigate('/company/interviews');
          }
        }
        
        console.log("Status updated successfully");
        
        // Clear any previous error
        setError('');
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error('Error updating application status:', err);
      
      // Reset the updating state
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, isUpdating: false } : app
      ));
      
      // Enhanced error logging
      if (err.response) {
        console.error('Error status:', err.response.status);
        console.error('Error data:', err.response.data);
        console.error('Request URL:', err.config?.url);
      }
      
      // Show more specific error message if available
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update application status. Please try again.';
      setError(`${errorMessage} (Status: ${err.response?.status || 'unknown'})`);
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setError('');
      }, 5000);
    }
  };
  
  const generateInterview = async (application) => {
    try {
      setCurrentInterviewCandidate(application);
      setIsGeneratingQuestions(true);
      setShowInterviewModal(true);
      
      // Get candidate skills and experience from the application
      const candidateInfo = getCandidateInfo(application);
      const candidateSkills = application.candidate?.skills || [];
      
      // Call the API to generate questions based on candidate profile and job requirements
      const response = await companyService.generateInterviewQuestions(
        vacancyId, 
        application.candidateId,
        {
          candidateName: `${candidateInfo.firstName} ${candidateInfo.lastName}`,
          skills: candidateSkills,
          jobTitle: vacancy.title,
          jobDescription: vacancy.description,
          requiredSkills: vacancy.requiredSkills || []
        }
      );
      
      setGeneratedQuestions(response.data.questions);
      setIsGeneratingQuestions(false);
    } catch (err) {
      console.error('Error generating interview questions:', err);
      setError('Failed to generate interview questions. Please try again.');
      setIsGeneratingQuestions(false);
    }
  };


  const openDetailsModal = (application) => {
    setSelectedApplication(application);
  };
  
  const closeDetailsModal = () => {
    setSelectedApplication(null);
  };
  
  
  // Function to get candidate info, handling all possible data structures
  const getCandidateInfo = (application) => {
    // Try all possible places where candidate info might be stored
    if (application.candidate) {
      return {
        firstName: application.candidate.firstName || 'Unknown',
        lastName: application.candidate.lastName || 'Candidate',
        email: application.candidate.email || 'No email'
      };
    } else if (application.candidateInfo) {
      return {
        firstName: application.candidateInfo.firstName || 'Unknown',
        lastName: application.candidateInfo.lastName || 'Candidate',
        email: application.candidateInfo.email || 'No email'
      };
    } else {
      // Try to extract name from other properties if available
      const name = application.candidateName || 'Unknown Candidate';
      const email = application.candidateEmail || 'No email';
      
      // Try to split name into first and last if it's a string
      const nameParts = typeof name === 'string' ? name.split(' ') : ['Unknown', 'Candidate'];
      
      return {
        firstName: nameParts[0] || 'Unknown',
        lastName: nameParts.slice(1).join(' ') || 'Candidate',
        email: email
      };
    }
  };
  
  // Function to render candidate CV link
  const renderCVLink = (application) => {
    // First, try to get candidate ID from different possible locations
    let candidateId = null;
    
    if (application.candidateId) {
      candidateId = application.candidateId;
    } else if (application.candidate && application.candidate.id) {
      candidateId = application.candidate.id;
    } else if (application.candidateInfo && application.candidateInfo.id) {
      candidateId = application.candidateInfo.id;
    }
    
    // If we found a candidate ID, use the secure CV link component
    if (candidateId) {
      return <CVLinkComponent candidateId={candidateId} />;
    }
    
    // Fallback to the original URL approach if candidateId isn't available
    // but a direct URL is (for backward compatibility)
    let cvUrl = null;
    
    // Try all possible locations where CV URL might be stored
    if (application.candidate && application.candidate.cvUrl) {
      cvUrl = application.candidate.cvUrl;
    } 
    else if (application.candidateInfo && application.candidateInfo.cvUrl) {
      cvUrl = application.candidateInfo.cvUrl;
    }
    else if (application.cv || application.cvUrl) {
      cvUrl = application.cv || application.cvUrl;
    }
    
    if (cvUrl) {
      console.warn('Using direct CV URL - consider updating to use secure access method');
      return (
        <a 
          href={cvUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-900 flex items-center"
        >
          <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View CV
        </a>
      );
    }
    
    // No CV available
    return <span>No CV available</span>;
  };
  
  // Function to render match score if available
  const renderMatchScore = (application) => {
    if (!application.suitabilityScore) return null;
    
    // Get the score, handling different possible structures
    const score = application.suitabilityScore.overall || 
                 (typeof application.suitabilityScore === 'number' ? application.suitabilityScore : null);
    
    if (score === null) return null;
    
    // Calculate color class based on score
    const getColorClass = (score) => {
      if (score >= 80) return 'bg-green-600';
      if (score >= 60) return 'bg-blue-600';
      if (score >= 40) return 'bg-yellow-600';
      return 'bg-red-600';
    };
    
    return (
      <div className="flex items-center mt-1">
        <div className="w-16 h-1.5 bg-gray-200 rounded-full mr-2">
          <div 
            className={`h-1.5 rounded-full ${getColorClass(score)}`}
            style={{ width: `${score}%` }}
          ></div>
        </div>
        <span className="text-xs text-gray-500">{Math.round(score)}% Match</span>
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
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Applications</h1>
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
        
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <span className="text-gray-700 text-sm font-medium">Total Applications: </span>
                <span className="text-gray-900 font-semibold">{applications.length}</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Filter by Status */}
                <div>
                  <label htmlFor="statusFilter" className="block text-sm text-gray-700 mb-1">Filter by Status</label>
                  <select
                    id="statusFilter"
                    name="statusFilter"
                    className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Applications</option>
                    <option value="applied">Newly Applied</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="interviewed">Interviewed</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                
                {/* Sort By */}
                <div>
                  <label htmlFor="sortType" className="block text-sm text-gray-700 mb-1">Sort By</label>
                  <select
                    id="sortType"
                    name="sortType"
                    className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={sortType}
                    onChange={(e) => setSortType(e.target.value)}
                  >
                    <option value="default">Default</option>
                    <option value="overallMatch">Overall Match (High to Low)</option>
                    <option value="recent">Most Recent</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {filteredApplications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Match Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CV
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplications.map((application) => {
                    const candidateInfo = getCandidateInfo(application);
                    return (
                      <tr key={application.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                              {candidateInfo.firstName.charAt(0) || 'C'}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {candidateInfo.firstName} {candidateInfo.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {candidateInfo.email}
                              </div>
                              {/* Status badge */}
                              {application.status === 'interviewed' && (
                                <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                  <svg className="mr-1.5 h-2 w-2 text-purple-400" fill="currentColor" viewBox="0 0 8 8">
                                    <circle cx="4" cy="4" r="3" />
                                  </svg>
                                  To Be Interviewed
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(application.appliedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(application.status)}`}>
                            {formatStatus(application.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {application.suitabilityScore ? (
                            <div className="flex items-center">
                              <span className="font-medium text-sm">
                                {Math.round(application.suitabilityScore.overall || 
                                          (typeof application.suitabilityScore === 'number' ? 
                                           application.suitabilityScore : 0))}%
                              </span>
                              <div className="ml-2 w-16 bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full ${getMatchScoreColor(
                                    application.suitabilityScore.overall || 
                                    (typeof application.suitabilityScore === 'number' ? 
                                    application.suitabilityScore : 0)
                                  )}`}
                                  style={{ width: `${application.suitabilityScore.overall || 
                                                    (typeof application.suitabilityScore === 'number' ? 
                                                    application.suitabilityScore : 0)}%` }}
                                ></div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Not available</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {renderCVLink(application)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col space-y-2">
                          {/* Action buttons with proper loading states */}
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleStatusChange(application.id, 'interviewed')}
                              disabled={application.isUpdating}
                              className={`flex-1 px-2 py-1 ${
                                application.isUpdating 
                                  ? 'bg-gray-400 cursor-not-allowed' 
                                  : 'bg-indigo-600 hover:bg-indigo-700'
                              } text-white text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                            >
                              {application.isUpdating ? (
                                <div className="flex items-center justify-center">
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span>Updating...</span>
                                </div>
                              ) : 'To Be Interviewed'}
                            </button>
                            <button
                              onClick={() => handleStatusChange(application.id, 'rejected')}
                              disabled={application.isUpdating}
                              className={`flex-1 px-2 py-1 ${
                                application.isUpdating 
                                  ? 'bg-gray-400 cursor-not-allowed' 
                                  : 'bg-red-600 hover:bg-red-700'
                              } text-white text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-red-500`}
                            >
                              {application.isUpdating ? (
                                <div className="flex items-center justify-center">
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span>Updating...</span>
                                </div>
                              ) : 'Reject'}
                            </button>
                          </div>

                            {application.status === 'interviewed' && (
                                <button
                                  onClick={() => generateInterview(application)}
                                  className="w-full mt-2 px-2 py-1 bg-purple-600 text-white text-xs font-medium rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                  Generate Interview
                                </button>
                              )}
                            

                            
                            <button
                              onClick={() => openDetailsModal(application)}
                              className="inline-flex justify-center items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              View Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">
                {statusFilter === 'all' 
                  ? 'No applications have been received for this position yet.' 
                  : `No applications with status "${statusFilter}" found.`}
              </p>
            </div>
          )}
        </div>
        
        {/* Interview Setup CTA */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Set Up Automated Interviews</h2>
              <p className="mt-1 text-sm text-gray-500">
                Configure AI-powered interviews to streamline your screening process.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link 
                to={`/company/vacancies/${vacancyId}/interview-config`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Configure Interviews
              </Link>
            </div>
          </div>
        </div>

        {/* Link to Interviews Page */}
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">View Candidates Selected for Interview</h2>
              <p className="mt-1 text-sm text-gray-500">
                View and manage all candidates that have been marked for interviews across all vacancies.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link 
                to="/company/interviews"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <svg className="mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                View Interview Candidates
              </Link>
            </div>
          </div>
        </div>

        
        
        {/* Candidate Details Modal */}
        {selectedApplication && (
          <CandidateDetailsModal 
            application={selectedApplication} 
            onClose={closeDetailsModal} 
          />
        )}
      </div>
      {/* Interview Questions Modal */}
        {showInterviewModal && (
          <InterviewQuestionsModal
            candidate={{
              candidateId: currentInterviewCandidate?.candidateId,
              candidateName: currentInterviewCandidate ? 
                `${getCandidateInfo(currentInterviewCandidate).firstName} ${getCandidateInfo(currentInterviewCandidate).lastName}` : 
                'Candidate'
            }}
            vacancy={vacancy}
            questions={generatedQuestions}
            isGenerating={isGeneratingQuestions}
            onClose={() => {
              setShowInterviewModal(false);
              setCurrentInterviewCandidate(null);
            }}
            onSave={async (questions) => {
              // Save the questions to the backend
              await companyService.saveInterviewQuestions(
                vacancyId,
                currentInterviewCandidate.candidateId,
                questions
              );
              alert('Interview questions saved successfully!');
            }}
          />
        )}
            </div>
          );
        }

// Helper functions
function getStatusClass(status) {
  switch (status) {
    case 'applied':
      return 'bg-blue-100 text-blue-800';
    case 'reviewed':
      return 'bg-yellow-100 text-yellow-800';
    case 'interviewed':
      return 'bg-purple-100 text-purple-800';
    case 'accepted':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getMatchScoreColor(score) {
  if (score >= 80) return 'bg-green-600';
  if (score >= 60) return 'bg-blue-600';
  if (score >= 40) return 'bg-yellow-600';
  return 'bg-red-600';
}

function formatStatus(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default ApplicationsManagement;