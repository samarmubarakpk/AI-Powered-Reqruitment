// src/components/candidate/ApplicationsView.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { candidateService } from '../../services/api';
import NavBar from '../layout/NavBar';

function ApplicationsView() {
  const [applications, setApplications] = useState([]);
  const [vacancies, setVacancies] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredApplications, setFilteredApplications] = useState([]);
  
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        
        // Fetch applications
        const response = await candidateService.getApplications();
        const applicationsList = response.data.applications;
        setApplications(applicationsList);
        
        // Fetch vacancy details for each application
        const vacancyDetails = {};
        for (const app of applicationsList) {
          try {
            // Assuming there's an API endpoint to get vacancy details
            const vacancyResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/vacancies/${app.vacancyId}`);
            const vacancyData = await vacancyResponse.json();
            vacancyDetails[app.vacancyId] = vacancyData.vacancy;
          } catch (err) {
            console.error(`Error fetching vacancy ${app.vacancyId}:`, err);
            // Set a placeholder for failed vacancy fetches
            vacancyDetails[app.vacancyId] = { title: 'Unknown Position' };
          }
        }
        
        setVacancies(vacancyDetails);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError('Failed to load your applications. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchApplications();
  }, []);
  
  // Filter applications based on status
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredApplications(applications);
    } else {
      const filtered = applications.filter(app => app.status === statusFilter);
      setFilteredApplications(filtered);
    }
  }, [statusFilter, applications]);
  
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
          <h1 className="text-2xl font-bold">My Applications</h1>
          <p className="text-gray-600">Track the status of your job applications</p>
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
        
        {/* Filter Controls */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Application Status</h2>
              <p className="mt-1 text-sm text-gray-500">
                Filter your applications by status
              </p>
            </div>
            
            <div className="mt-3 sm:mt-0 sm:ml-4">
              <select
                id="statusFilter"
                name="statusFilter"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Applications</option>
                <option value="applied">Applied</option>
                <option value="reviewed">Reviewed</option>
                <option value="interviewed">Interviewed</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Applications List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredApplications.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {filteredApplications.map((application) => {
                const vacancy = vacancies[application.vacancyId] || { title: 'Unknown Position' };
                
                return (
                  <li key={application.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {vacancy.title}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(application.status)}`}>
                              {formatStatus(application.status)}
                            </p>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex items-center">
                          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex sm:space-x-4">
                          {vacancy.companyName && (
                            <p className="flex items-center text-sm text-gray-500">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                              </svg>
                              {vacancy.companyName}
                            </p>
                          )}
                          {vacancy.location && (
                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              {vacancy.location}
                            </p>
                          )}
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          <p>
                            Applied on <time dateTime={application.appliedAt}>{new Date(application.appliedAt).toLocaleDateString()}</time>
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-center py-10 px-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {statusFilter === 'all' 
                  ? 'You haven\'t applied to any jobs yet.' 
                  : `You don't have any applications with status "${statusFilter}".`}
              </p>
              <div className="mt-6">
                <Link
                  to="/candidate/jobs"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Find Jobs
                </Link>
              </div>
            </div>
          )}
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

export default ApplicationsView;