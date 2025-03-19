// src/components/company/Dashboard.js (Enhanced version)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { companyService } from '../../services/api';
import NavBar from '../layout/NavBar';
import CandidateAnalyticsCard from './CandidateAnalyticsCard';
import VacancyAnalyticsOverview from './VacancyAnalyticsOverview';

function Dashboard() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [vacancies, setVacancies] = useState([]);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    totalVacancies: 0,
    activeVacancies: 0,
    totalApplications: 0,
    newApplications: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVacancy, setSelectedVacancy] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch company profile
      const profileResponse = await companyService.getProfile();
      setProfile(profileResponse.data.company);
      
      // Fetch all vacancies
      const vacanciesResponse = await companyService.getVacancies();
      const vacanciesList = vacanciesResponse.data.vacancies || [];
      setVacancies(vacanciesList);
      
      // Set the first active vacancy as selected by default
      const activeVacancies = vacanciesList.filter(v => v.status === 'open');
      if (activeVacancies.length > 0) {
        setSelectedVacancy(activeVacancies[0].id);
      }
      
      // Collect applications data
      let allApplications = [];
      let newApplicationsCount = 0;
      
      // Process each vacancy to get its applications
      for (const vacancy of vacanciesList) {
        try {
          const applicationsResponse = await companyService.getApplications(vacancy.id);
          const vacancyApplications = applicationsResponse.data.applications || [];
          
          // Enhance applications with vacancy title
          const enhancedApplications = vacancyApplications.map(app => ({
            ...app,
            vacancyTitle: vacancy.title
          }));
          
          allApplications = [...allApplications, ...enhancedApplications];
          
          // Count new applications (status === 'applied')
          newApplicationsCount += vacancyApplications.filter(app => app.status === 'applied').length;
        } catch (err) {
          console.error(`Error fetching applications for vacancy ${vacancy.id}:`, err);
        }
      }
      
      setApplications(allApplications);
      
      // Update statistics
      setStats({
        totalVacancies: vacanciesList.length,
        activeVacancies: vacanciesList.filter(v => v.status === 'open').length,
        totalApplications: allApplications.length,
        newApplications: newApplicationsCount
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div>
      <NavBar userType="company" />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Company Dashboard</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {/* Company Information */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{profile?.name || 'Your Company'}</h2>
              <p className="text-gray-600">{profile?.industry || 'Industry not specified'}</p>
              <p className="mt-2">{profile?.description || 'No company description available.'}</p>
            </div>
            <Link
              to="/company/profile"
              className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-md text-sm font-medium"
            >
              Edit Profile
            </Link>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Total Vacancies</p>
                <h3 className="text-3xl font-bold">{stats.totalVacancies}</h3>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Active Vacancies</p>
                <h3 className="text-3xl font-bold">{stats.activeVacancies}</h3>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Total Applications</p>
                <h3 className="text-3xl font-bold">{stats.totalApplications}</h3>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">New Applications</p>
                <h3 className="text-3xl font-bold">{stats.newApplications}</h3>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Analytics Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Recruitment Analytics</h2>
          
          {/* Vacancy Selector */}
          {vacancies.filter(v => v.status === 'open').length > 0 && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h3 className="text-lg font-medium text-gray-900">Select a vacancy to view analytics</h3>
                <div className="w-full md:w-1/3">
                  <select
                    value={selectedVacancy || ''}
                    onChange={(e) => setSelectedVacancy(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">Select a vacancy</option>
                    {vacancies
                      .filter(v => v.status === 'open')
                      .map(vacancy => (
                        <option key={vacancy.id} value={vacancy.id}>
                          {vacancy.title}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          )}
          
          {/* Vacancy Analytics */}
          {selectedVacancy && (
            <VacancyAnalyticsOverview vacancyId={selectedVacancy} />
          )}
          
          {/* Candidate Analytics Cards */}
          {vacancies.filter(v => v.status === 'open').length > 0 && !selectedVacancy && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {vacancies
                .filter(v => v.status === 'open')
                .slice(0, 4)
                .map(vacancy => (
                  <CandidateAnalyticsCard 
                    key={vacancy.id} 
                    vacancyId={vacancy.id} 
                    vacancyTitle={vacancy.title} 
                  />
                ))}
            </div>
          )}
          
          {/* Empty state */}
          {vacancies.filter(v => v.status === 'open').length === 0 && (
            <div className="bg-white shadow rounded-lg p-10 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No active vacancies</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create some job postings to view analytics data.
              </p>
              <div className="mt-6">
                <Link
                  to="/company/vacancies/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create a Vacancy
                </Link>
              </div>
            </div>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link 
              to="/company/vacancies/create"
              className="bg-white shadow border rounded-lg p-6 hover:shadow-md transition flex flex-col items-center text-center"
            >
              <svg className="w-8 h-8 text-indigo-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              <span className="font-medium">Post New Vacancy</span>
            </Link>
            <Link 
              to="/company/vacancies"
              className="bg-white shadow border rounded-lg p-6 hover:shadow-md transition flex flex-col items-center text-center"
            >
              <svg className="w-8 h-8 text-indigo-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
              <span className="font-medium">Manage Vacancies</span>
            </Link>
            <Link 
              to="/company/recommendations"
              className="bg-white shadow border rounded-lg p-6 hover:shadow-md transition flex flex-col items-center text-center"
            >
              <svg className="w-8 h-8 text-indigo-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
              <span className="font-medium">Candidate Recommendations</span>
            </Link>
            <Link 
              to="/company/candidate-search"
              className="bg-white shadow border rounded-lg p-6 hover:shadow-md transition flex flex-col items-center text-center"
            >
              <svg className="w-8 h-8 text-indigo-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span className="font-medium">Advanced Candidate Search</span>
            </Link>
          </div>
        </div>
        
        {/* Recent Vacancies */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Vacancies</h2>
            <Link 
              to="/company/vacancies"
              className="text-indigo-600 hover:text-indigo-900 font-medium"
            >
              View All
            </Link>
          </div>
          
          {vacancies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applications
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vacancies.slice(0, 5).map((vacancy) => (
                    <tr key={vacancy.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{vacancy.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          vacancy.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {vacancy.status === 'open' ? 'Active' : 'Closed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(vacancy.postingDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {applications.filter(app => app.vacancyId === vacancy.id).length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link to={`/company/vacancies/${vacancy.id}/applications`} className="text-indigo-600 hover:text-indigo-900">
                            Applications
                          </Link>
                          <Link to={`/company/vacancies/${vacancy.id}/matches`} className="text-indigo-600 hover:text-indigo-900">
                            Matches
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No vacancies found</p>
              <Link 
                to="/company/vacancies/create"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Post Your First Vacancy
              </Link>
            </div>
          )}
        </div>
        
        {/* Recent Applications */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Applications</h2>
          </div>
          
          {applications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied On
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.slice(0, 5).map((application) => (
                    <tr key={application.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {application.candidate?.firstName} {application.candidate?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{application.candidate?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {application.vacancyTitle || 'Unknown Position'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(application.status)}`}>
                          {formatStatus(application.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(application.appliedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link 
                            to={`/company/candidates/${application.candidateId}?vacancyId=${application.vacancyId}`} 
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No applications received yet</p>
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

export default Dashboard;