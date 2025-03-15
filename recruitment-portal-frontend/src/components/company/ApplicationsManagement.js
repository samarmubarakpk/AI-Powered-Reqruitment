// Enhanced debug version of ApplicationsManagement to troubleshoot and fix the issue
// This version adds verbose logging and more robust error handling
// Replace your current ApplicationsManagement.js with this version

import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { companyService } from '../../services/api';
import NavBar from '../layout/NavBar';

function ApplicationsManagement() {
  const { id: vacancyId } = useParams();
  const [vacancy, setVacancy] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [rawResponseData, setRawResponseData] = useState(null); // For debugging
  
  // Enhanced fetch with more detailed error handling and logging
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
          console.log("Vacancy response:", vacancyResponse);
          vacancyData = vacancyResponse.data.vacancy;
          setVacancy(vacancyData);
          console.log("Vacancy data set successfully:", vacancyData);
        } catch (vacancyError) {
          console.error("Error fetching vacancy:", vacancyError);
          // Continue even if vacancy fetch fails - don't abort the whole process
        }
        
        // Step 2: Fetch applications with full error details
        console.log(`Fetching applications for vacancy ID: ${vacancyId}`);
        try {
          // Make API call directly to ensure we see full response/error
          const applicationsResponse = await companyService.getApplications(vacancyId);
          console.log("Applications response:", applicationsResponse);
          
          // Store raw data for debugging
          setRawResponseData(applicationsResponse.data);
          
          // Check if response has the expected structure
          if (applicationsResponse && applicationsResponse.data) {
            const applicationsData = applicationsResponse.data.applications || [];
            console.log(`Found ${applicationsData.length} applications`);
            
            // Log each application
            applicationsData.forEach((app, index) => {
              console.log(`Application ${index + 1}:`, app);
            });
            
            setApplications(applicationsData);
            // If we got here without error, it's successful
            setLoading(false);
          } else {
            console.error("Unexpected response format:", applicationsResponse);
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
  
  // Filter applications based on status
  useEffect(() => {
    console.log(`Filtering applications by status: ${statusFilter}`);
    console.log("Applications to filter:", applications);
    
    if (statusFilter === 'all') {
      setFilteredApplications(applications);
    } else {
      const filtered = applications.filter(app => app.status === statusFilter);
      setFilteredApplications(filtered);
    }
    
    console.log("Filtered applications:", filteredApplications);
  }, [statusFilter, applications]);
  
  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      console.log(`Updating application ${applicationId} status to ${newStatus}`);
      await companyService.updateApplicationStatus(applicationId, newStatus);
      
      // Update local state
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));
      
      console.log("Status updated successfully");
    } catch (err) {
      console.error('Error updating application status:', err);
      setError('Failed to update application status. Please try again.');
    }
  };
  
  // Function to render candidate CV link
  const renderCVLink = (application) => {
    // Log for debugging
    console.log("Rendering CV link for application:", application);
    
    let cvUrl = null;
    
    // Try all possible locations where CV URL might be stored
    if (application.candidate && application.candidate.cvUrl) {
      cvUrl = application.candidate.cvUrl;
      console.log("Found CV URL in application.candidate.cvUrl:", cvUrl);
    } 
    else if (application.candidateInfo && application.candidateInfo.cvUrl) {
      cvUrl = application.candidateInfo.cvUrl;
      console.log("Found CV URL in application.candidateInfo.cvUrl:", cvUrl);
    }
    else if (application.cv || application.cvUrl) {
      cvUrl = application.cv || application.cvUrl;
      console.log("Found CV URL in application.cv or application.cvUrl:", cvUrl);
    }
    
    if (cvUrl) {
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
    } else {
      console.log("No CV URL found for this application");
      return <span>No CV available</span>;
    }
  };
  
  // Function to get candidate info, handling all possible data structures
  const getCandidateInfo = (application) => {
    console.log("Getting candidate info for application:", application);
    
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
  
  // Debug rendering section
  const renderDebugInfo = () => {
    if (!rawResponseData) return null;
    
    return (
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Debug Information</h3>
        <p className="mb-2">Raw Response Data:</p>
        <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-auto max-h-64">
          {JSON.stringify(rawResponseData, null, 2)}
        </pre>
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
        
        {/* Debug section for development */}
        {process.env.NODE_ENV === 'development' && renderDebugInfo()}
        
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <span className="text-gray-700 text-sm font-medium">Total Applications: </span>
                <span className="text-gray-900 font-semibold">{applications.length}</span>
              </div>
              
              <div>
                <label htmlFor="statusFilter" className="sr-only">Filter by Status</label>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {renderCVLink(application)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <select
                            value={application.status}
                            onChange={(e) => handleStatusChange(application.id, e.target.value)}
                            className="block w-full py-1 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          >
                            <option value="applied">Newly Applied</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="interviewed">Interviewed</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                          </select>
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
      </div>
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

function formatStatus(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default ApplicationsManagement;