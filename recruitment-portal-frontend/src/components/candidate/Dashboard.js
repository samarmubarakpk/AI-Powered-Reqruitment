// src/components/candidate/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { candidateService } from '../../services/api';
import NavBar from '../layout/NavBar';
import ScheduledInterviews from './ScheduledInterviews';

// Define custom colors directly from HomePage
const colors = {
  primaryBlue: {
    light: '#2a6d8f',
    dark: '#1a4d6f',
    veryLight: '#e6f0f3'
  },
  primaryTeal: {
    light: '#5fb3a1',
    dark: '#3f9381',
    veryLight: '#eaf5f2'
  },
  primaryOrange: {
    light: '#f5923e',
    dark: '#e67e22',
    veryLight: '#fef2e9'
  }
};

function Dashboard() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      <div className="flex justify-center items-center h-screen" style={{ backgroundColor: colors.primaryBlue.veryLight }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: colors.primaryBlue.light }}></div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: colors.primaryBlue.veryLight, minHeight: '100vh' }}>
      <NavBar userType="candidate" />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Bienvenido {currentUser?.firstName || 'Candidato'}</h1>
        <p className="text-gray-600 mb-8">Gestiona tu perfil, solicitudes y búsqueda de empleo desde este panel</p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Link to="/candidate/profile" className="block bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Mi Perfil</h3>
              <div className="p-2 rounded-full" style={{ backgroundColor: colors.primaryBlue.veryLight }}>
                <svg className="w-6 h-6" style={{ color: colors.primaryBlue.light }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600">Actualiza tu información y habilidades para mejorar las coincidencias laborales</p>
          </Link>
          
          <Link to="/candidate/upload-cv" className="block bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Mi CV</h3>
              <div className="p-2 rounded-full" style={{ backgroundColor: colors.primaryTeal.veryLight }}>
                <svg className="w-6 h-6" style={{ color: colors.primaryTeal.light }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {profile?.cvUrl ? 'Ver o actualizar tu CV subido' : 'Sube tu CV para solicitar empleos'}
            </p>
          </Link>
          
          <Link to="/candidate/jobs" className="block bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Buscar Empleos</h3>
              <div className="p-2 rounded-full" style={{ backgroundColor: colors.primaryOrange.veryLight }}>
                <svg className="w-6 h-6" style={{ color: colors.primaryOrange.light }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600">Explora y solicita oportunidades laborales que coincidan con tus habilidades</p>
          </Link>
          
          <Link to="/candidate/applications" className="block bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Solicitudes</h3>
              <div className="p-2 rounded-full" style={{ backgroundColor: colors.primaryBlue.veryLight }}>
                <svg className="w-6 h-6" style={{ color: colors.primaryBlue.light }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600">Realiza un seguimiento del estado de tus solicitudes de empleo</p>
          </Link>
        </div>
        
        {/* Profile Status Card */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Completado del Perfil</h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Información del Perfil</span>
                <span className="text-sm font-medium text-gray-700">
                  {calculateProfileCompletion(profile)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="h-2.5 rounded-full" 
                  style={{ width: `${calculateProfileCompletion(profile)}%`, backgroundColor: colors.primaryTeal.light }}
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
                  <span>CV Subido</span>
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
                  <span>Habilidades</span>
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
                  <span>Educación</span>
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
                  <span>Experiencia</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scheduled Interviews Section */}
        <div className="mb-8">
          <ScheduledInterviews />
        </div>
        
        {/* Applications & Recent Jobs Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Applications */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200" style={{ backgroundColor: colors.primaryBlue.veryLight }}>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Solicitudes Recientes</h2>
                <Link to="/candidate/applications" className="text-sm font-medium hover:text-indigo-500" style={{ color: colors.primaryBlue.dark }}>
                  Ver Todas
                </Link>
              </div>
            </div>
            
            {applications.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {applications.slice(0, 3).map((application) => (
                  <div key={application.id} className="p-4">
                    <h3 className="font-medium text-gray-900">
                      {application.vacancyTitle || 'Título del Puesto'}
                    </h3>
                    <div className="mt-1 flex items-center">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(application.status)}`}>
                        {formatStatus(application.status)}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        Solicitado el {new Date(application.appliedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500">No has solicitado ningún empleo todavía.</p>
                <Link 
                  to="/candidate/jobs"
                  className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white"
                  style={{ backgroundColor: colors.primaryBlue.light }}
                >
                  Buscar Empleos
                </Link>
              </div>
            )}
          </div>
          
          {/* Recent Jobs */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200" style={{ backgroundColor: colors.primaryTeal.veryLight }}>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Empleos Recientes</h2>
                <Link to="/candidate/jobs" className="text-sm font-medium hover:text-indigo-500" style={{ color: colors.primaryTeal.dark }}>
                  Ver Todos
                </Link>
              </div>
            </div>
            
            {recentJobs.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {recentJobs.map((job) => (
                  <div key={job.id} className="p-4">
                    <h3 className="font-medium text-gray-900">{job.title}</h3>
                    <div className="mt-1 text-sm text-gray-500">
                      <p>{job.companyName || 'Empresa'}</p>
                      {job.requiredSkills && job.requiredSkills.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {job.requiredSkills.slice(0, 3).map((skill, index) => (
                            <span 
                              key={index} 
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ backgroundColor: colors.primaryTeal.veryLight, color: colors.primaryTeal.dark }}
                            >
                              {skill}
                            </span>
                          ))}
                          {job.requiredSkills.length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              +{job.requiredSkills.length - 3} más
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <Link 
                        to={`/candidate/jobs?id=${job.id}`}
                        className="text-sm font-medium hover:text-indigo-500"
                        style={{ color: colors.primaryTeal.dark }}
                      >
                        Ver Detalles
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500">No hay empleos disponibles en este momento.</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Actualizar
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Account Settings Link */}
        <div className="mt-8 text-center">
          <Link 
            to="/candidate/account"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-white hover:bg-opacity-90"
            style={{ backgroundColor: colors.primaryOrange.light, borderColor: colors.primaryOrange.light }}
          >
            <svg className="mr-2 h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            Configuración de la Cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function calculateProfileCompletion(profile) {
  if (!profile) return 0;
  
  // Define all the possible fields
  const possibleFields = [
    'basic', // Basic info from registration
    'cv',    // CV uploaded
    'skills', // Skills added
    'education', // Education added
    'experience' // Experience added
  ];
  
  let totalFields = possibleFields.length;
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
  
  // Ensure percentage doesn't exceed 100%
  const percentage = Math.min(Math.round((completedFields / totalFields) * 100), 100);
  return percentage;
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
  const statusMap = {
    'applied': 'Solicitado',
    'reviewed': 'Revisado',
    'interviewed': 'Entrevistado',
    'accepted': 'Aceptado',
    'rejected': 'Rechazado'
  };
  
  return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
}

export default Dashboard;