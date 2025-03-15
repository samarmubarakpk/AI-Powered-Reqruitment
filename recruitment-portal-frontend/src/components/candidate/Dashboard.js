// src/components/candidate/ImprovedDashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { candidateService } from '../../services/api';
import NavBar from '../layout/NavBar';

function Dashboard() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

// Update this part in src/components/candidate/Dashboard.js useEffect

useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch profile data
      const profileResponse = await candidateService.getProfile();
      setProfile(profileResponse.data.candidate);
      
      // Fetch applications
      const applicationsResponse = await candidateService.getApplications();
      setApplications(applicationsResponse.data.applications);
      
      // Fetch recent jobs (using the public-vacancies endpoint)
      try {
        const jobsResponse = await candidateService.getPublicVacancies();
        const jobsData = jobsResponse.data.vacancies || [];
        const openVacancies = jobsData.filter(job => job.status === 'open').slice(0, 3); // Get only the first 3
        setRecentJobs(openVacancies);
      } catch (err) {
        console.error('Error fetching recent jobs:', err);
        setRecentJobs([]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };
  
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
      <NavBar userType="candidate" />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Welcome {currentUser?.firstName || 'Candidate'}</h1>
        <p className="text-gray-600 mb-8">Manage your profile, applications, and job search from this dashboard</p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Link to="/candidate/profile" className="block bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">My Profile</h3>
              <div className="p-2 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600">Update your information and skills to improve job matches</p>
          </Link>
          
          <Link to="/candidate/upload-cv" className="block bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">My CV</h3>
              <div className="p-2 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {profile?.cvUrl ? 'View or update your uploaded CV' : 'Upload your CV to apply for jobs'}
            </p>
          </Link>
          
          <Link to="/candidate/jobs" className="block bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Find Jobs</h3>
              <div className="p-2 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600">Browse and apply for job opportunities matching your skills</p>
          </Link>
          
          <Link to="/candidate/applications" className="block bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Applications</h3>
              <div className="p-2 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600">Track the status of your job applications</p>
          </Link>
        </div>
        
        {/* Profile Status Card */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Profile Completion</h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Profile Information</span>
                <span className="text-sm font-medium text-gray-700">
                  {calculateProfileCompletion(profile)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${calculateProfileCompletion(profile)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-4 rounded-lg ${profile?.cvUrl ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
                <div className="flex items-center">
                  {profile?.cvUrl ? (
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                  )}
                  <span>CV Upload</span>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${profile?.skills?.length > 0 ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
                <div className="flex items-center">
                  {profile?.skills?.length > 0 ? (
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                  )}
                  <span>Skills</span>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${profile?.education?.length > 0 ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
                <div className="flex items-center">
                  {profile?.education?.length > 0 ? (
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                  )}
                  <span>Education</span>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${profile?.experience?.length > 0 ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
                <div className="flex items-center">
                  {profile?.experience?.length > 0 ? (
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                  )}
                  <span>Experience</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Applications & Recent Jobs Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Applications */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Recent Applications</h2>
                <Link to="/candidate/applications" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  View All
                </Link>
              </div>
            </div>
            
            {applications.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {applications.slice(0, 3).map((application) => (
                  <div key={application.id} className="p-4">
                    <h3 className="font-medium text-gray-900">
                      {application.vacancyTitle || 'Position Title'}
                    </h3>
                    <div className="mt-1 flex items-center">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(application.status)}`}>
                        {formatStatus(application.status)}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        Applied on {new Date(application.appliedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500">You haven't applied to any jobs yet.</p>
                <Link 
                  to="/candidate/jobs"
                  className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Find Jobs
                </Link>
              </div>
            )}
          </div>
          
          {/* Recent Jobs */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Recent Job Postings</h2>
                <Link to="/candidate/jobs" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  View All
                </Link>
              </div>
            </div>
            
            {recentJobs.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {recentJobs.map((job) => (
                  <div key={job.id} className="p-4">
                    <h3 className="font-medium text-gray-900">{job.title}</h3>
                    <div className="mt-1 text-sm text-gray-500">
                      <p>{job.companyName || 'Company'}</p>
                      {job.requiredSkills && job.requiredSkills.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {job.requiredSkills.slice(0, 3).map((skill, index) => (
                            <span 
                              key={index} 
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.requiredSkills.length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              +{job.requiredSkills.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <Link 
                        to={`/candidate/jobs?id=${job.id}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500">No job postings available at the moment.</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Refresh
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Account Settings Link */}
        <div className="mt-8 text-center">
          <Link 
            to="/candidate/account"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="mr-2 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            Account Settings
          </Link>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function calculateProfileCompletion(profile) {
  if (!profile) return 0;
  
  let totalFields = 4; // Base fields, CV, Skills, Education, Experience
  let completedFields = 1; // User always has basic info from registration
  
  // Check if CV exists
  if (profile.cvUrl) {
    completedFields += 1;
  }
  
  // Check if skills are added
  if (profile.skills && profile.skills.length > 0) {
    completedFields += 1;
  }
  
  // Check if education is added
  if (profile.education && profile.education.length > 0) {
    completedFields += 1;
  }
  
  // Check if experience is added
  if (profile.experience && profile.experience.length > 0) {
    completedFields += 1;
  }
  
  return Math.round((completedFields / totalFields) * 100);
}

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