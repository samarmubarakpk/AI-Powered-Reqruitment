// src/components/company/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { companyService } from '../../services/api';
import NavBar from '../layout/NavBar';

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

// In CompanyDashboard.js - update fetchDashboardData function
// Fix for src/components/company/Dashboard.js
// Fix for src/components/company/Dashboard.js
// Replace the fetchDashboardData function with this improved version

const fetchDashboardData = async () => {
  try {
    setLoading(true);
    
    // First fetch company profile
    const profileResponse = await companyService.getProfile();
    const company = profileResponse.data.company;
    setProfile(company);
    
    // Then fetch all vacancies for this company
    const vacanciesResponse = await companyService.getVacancies();
    const vacanciesList = vacanciesResponse.data.vacancies || [];
    setVacancies(vacanciesList);
    
    // Initialize application counters
    let allApplications = [];
    let totalApplicationsCount = 0;
    let newApplicationsCount = 0;
    
    // Process each vacancy to get its applications
    for (const vacancy of vacanciesList) {
      try {
        console.log(`Fetching applications for vacancy ${vacancy.id}`);
        const applicationsResponse = await companyService.getApplications(vacancy.id);
        const vacancyApplications = applicationsResponse.data.applications || [];
        
        // Log for debugging
        console.log(`Found ${vacancyApplications.length} applications for vacancy ${vacancy.id}`);
        
        // Add these applications to our collection
        if (vacancyApplications.length > 0) {
          // Enhance applications with vacancy title for display
          const enhancedApplications = vacancyApplications.map(app => ({
            ...app,
            vacancyTitle: vacancy.title
          }));
          
          allApplications = [...allApplications, ...enhancedApplications];
          
          // Count new applications (status === 'applied')
          newApplicationsCount += vacancyApplications.filter(app => app.status === 'applied').length;
        }
      } catch (err) {
        console.error(`Error fetching applications for vacancy ${vacancy.id}:`, err);
      }
    }
    
    // Set applications state with all collected applications
    setApplications(allApplications);
    totalApplicationsCount = allApplications.length;
    
    // Update statistics
    setStats({
      totalVacancies: vacanciesList.length,
      activeVacancies: vacanciesList.filter(v => v.status === 'open').length,
      totalApplications: totalApplicationsCount,
      newApplications: newApplicationsCount
    });
    
    setLoading(false);
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    setError('Failed to load dashboard data');
    setLoading(false);
  }
};
  useEffect(() => {
    fetchDashboardData();
  }, []);

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
              to="/company/interviews"
              className="bg-white shadow border rounded-lg p-6 hover:shadow-md transition flex flex-col items-center text-center"
            >
              <svg className="w-8 h-8 text-indigo-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              <span className="font-medium">AI Interviews</span>
            </Link>
            <Link 
              to="/company/cv-analysis"
              className="bg-white shadow border rounded-lg p-6 hover:shadow-md transition flex flex-col items-center text-center"
            >
              <svg className="w-8 h-8 text-indigo-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span className="font-medium">CV Analysis</span>
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
                        <Link to={`/company/vacancies/${vacancy.id}/applications`} className="text-indigo-600 hover:text-indigo-900">
                          View
                        </Link>
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
                  {applications.slice(0, 5).map((application) => {
                    // Find vacancy for this application
                    const vacancy = vacancies.find(v => v.id === application.vacancyId);
                    
                    return (
                      <tr key={application.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {application.candidate?.firstName} {application.candidate?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{application.candidate?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{vacancy?.title || 'Unknown Position'}</div>
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
                          <Link to={`/company/vacancies/${application.vacancyId}/applications`} className="text-indigo-600 hover:text-indigo-900">
                            Review
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
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