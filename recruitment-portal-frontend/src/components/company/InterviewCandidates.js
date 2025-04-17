// src/components/company/InterviewCandidates.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { companyService } from '../../services/api';
import NavBar from '../layout/NavBar';
import CVLinkComponent from './CVLinkComponent';

function InterviewCandidates() {
  // Define HomePage color scheme
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [interviews, setInterviews] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [selectedVacancy, setSelectedVacancy] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Function to manually refresh data
  const refreshData = () => {
    console.log('Actualización manual solicitada');
    setRefreshKey(prev => prev + 1);
  };
  
  useEffect(() => {
    console.log('Componente InterviewCandidates inicializando o refrescando');
    // Clean up any stale data first
    setInterviews([]);
    setVacancies([]);
    setError('');
    
    // Then fetch fresh data
    fetchInterviewCandidates();
    
    // Add a focus event listener to refresh data when the page regains focus
    // This ensures fresh data when navigating back to this page
    const handleFocus = () => {
      console.log('Ventana enfocada, actualizando candidatos de entrevista');
      fetchInterviewCandidates();
    };
    
    // Also add a visibility change handler to catch tab switches
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Página visible, actualizando candidatos de entrevista');
        fetchInterviewCandidates();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up the event listeners
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshKey]); // Add refreshKey to the dependency array
  
  const fetchInterviewCandidates = async () => {
    try {
      setLoading(true);
      console.log('Obteniendo datos de candidatos para entrevista...');
      
      // Step 1: Get all vacancies
      const vacanciesResponse = await companyService.getVacancies();
      const vacanciesList = vacanciesResponse.data.vacancies || [];
      setVacancies(vacanciesList);
      
      // Step 2: Get all applications with "interviewed" status for each vacancy
      let allInterviews = [];
      
      for (const vacancy of vacanciesList) {
        try {
          console.log(`Obteniendo solicitudes para vacante ${vacancy.id}`);
          const applicationsResponse = await companyService.getApplications(vacancy.id);
          const applications = applicationsResponse.data.applications || [];
          
          // Filter applications by status "interviewed"
          const interviewApplications = applications
            .filter(app => app.status === 'interviewed')
            .map(app => ({
              ...app,
              vacancyTitle: vacancy.title,
              vacancyId: vacancy.id
            }));
          
          console.log(`Encontradas ${interviewApplications.length} solicitudes de entrevista para vacante ${vacancy.id}`);
          allInterviews = [...allInterviews, ...interviewApplications];
        } catch (err) {
          console.error(`Error obteniendo solicitudes para vacante ${vacancy.id}:`, err);
        }
      }
      
      console.log(`Total de candidatos para entrevista encontrados: ${allInterviews.length}`);
      setInterviews(allInterviews);
      setLoading(false);
    } catch (err) {
      console.error('Error obteniendo candidatos para entrevista:', err);
      setError('No se pudieron cargar los candidatos para entrevista. Por favor, inténtelo de nuevo.');
      setLoading(false);
    }
  };
  
  // Filter interviews by selected vacancy
  const filteredInterviews = selectedVacancy === 'all' 
    ? interviews 
    : interviews.filter(interview => interview.vacancyId === selectedVacancy);
  
  // Handle generating interview for a candidate
  const handleGenerateInterview = async (candidate) => {
    try {
      // Navigate to the interview generation page
      window.location.href = `/company/vacancies/${candidate.vacancyId}/interview/${candidate.candidateId}`;
    } catch (error) {
      console.error('Error generando entrevista:', error);
    }
  };
  
  // Get candidate info from different possible structures
  const getCandidateInfo = (application) => {
    if (application.candidate) {
      return application.candidate;
    } else if (application.candidateInfo) {
      return application.candidateInfo;
    } else {
      return {
        firstName: 'Desconocido',
        lastName: 'Candidato',
        email: application.candidateEmail || 'Sin correo'
      };
    }
  };
  
  if (loading) {
    return (
      <div style={{ backgroundColor: colors.primaryTeal.veryLight, minHeight: '100vh' }}>
        <NavBar userType="company" />
        <div className="max-w-7xl mx-auto px-4 py-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: colors.primaryTeal.light }}></div>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ backgroundColor: colors.primaryTeal.veryLight, minHeight: '100vh' }}>
      <NavBar userType="company" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: colors.primaryTeal.dark }}>Candidatos para Entrevista</h1>
            <p className="text-gray-600">Gestione candidatos seleccionados para entrevistas</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={refreshData}
              className="px-4 py-2 rounded-md text-sm font-medium flex items-center"
              style={{ backgroundColor: colors.primaryTeal.veryLight, color: colors.primaryTeal.dark, border: `1px solid ${colors.primaryTeal.light}` }}
            >
              <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar Datos
            </button>
            <Link
              to="/company/vacancies"
              className="px-4 py-2 rounded-md text-sm font-medium"
              style={{ backgroundColor: colors.primaryTeal.veryLight, color: colors.primaryTeal.dark, border: `1px solid ${colors.primaryTeal.light}` }}
            >
              Volver a Vacantes
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
        
        {/* Filter by Vacancy */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-lg font-medium" style={{ color: colors.primaryTeal.dark }}>Filtrar por Vacante</h2>
            <div className="w-full md:w-1/3">
              <select
                value={selectedVacancy}
                onChange={(e) => setSelectedVacancy(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none sm:text-sm rounded-md"
                style={{ borderColor: colors.primaryTeal.light }}
              >
                <option value="all">Todas las Vacantes</option>
                {vacancies.map(vacancy => (
                  <option key={vacancy.id} value={vacancy.id}>
                    {vacancy.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Interview Candidates List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium" style={{ color: colors.primaryTeal.dark }}>
                {filteredInterviews.length} 
                {filteredInterviews.length === 1 ? ' Candidato' : ' Candidatos'} 
                Seleccionados para Entrevista
              </h2>
              <p className="text-sm text-gray-500">
                Última actualización: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          {filteredInterviews.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vacante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Puntuación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seleccionado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CV
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInterviews.map((interview) => {
                    const candidate = getCandidateInfo(interview);
                    return (
                      <tr key={interview.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium" style={{ backgroundColor: colors.primaryTeal.light }}>
                              {candidate.firstName.charAt(0) || 'C'}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {candidate.firstName} {candidate.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {candidate.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {interview.vacancyTitle || 'Posición Desconocida'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {interview.suitabilityScore ? (
                            <div className="flex items-center">
                              <span className="font-medium text-sm">
                                {Math.round(interview.suitabilityScore.overall || 
                                  (typeof interview.suitabilityScore === 'number' ? 
                                    interview.suitabilityScore : 0))}%
                              </span>
                              <div className="ml-2 w-16 bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="h-1.5 rounded-full"
                                  style={{ 
                                    width: `${interview.suitabilityScore.overall || 
                                      (typeof interview.suitabilityScore === 'number' ? 
                                        interview.suitabilityScore : 0)}%`,
                                    backgroundColor: getMatchScoreColor(
                                      interview.suitabilityScore.overall || 
                                      (typeof interview.suitabilityScore === 'number' ? 
                                        interview.suitabilityScore : 0),
                                      colors
                                    )
                                  }}
                                ></div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">No disponible</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(interview.updatedAt || interview.appliedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {interview.candidateId && (
                            <CVLinkComponent candidateId={interview.candidateId} />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex flex-col space-y-2">
                            <button
                              onClick={() => handleGenerateInterview(interview)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white"
                              style={{ backgroundColor: colors.primaryTeal.light }}
                            >
                              Generar Entrevista
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
            <div className="p-10 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay candidatos para entrevista</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedVacancy === 'all' 
                  ? 'Aún no se han seleccionado candidatos para entrevistas.' 
                  : 'No se han seleccionado candidatos para entrevistas para esta vacante.'}
              </p>
              <div className="mt-6 flex justify-center space-x-4">
                <button
                  onClick={refreshData}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md"
                  style={{ backgroundColor: colors.primaryTeal.veryLight, color: colors.primaryTeal.dark, border: `1px solid ${colors.primaryTeal.light}` }}
                >
                  <svg className="mr-2 h-4 w-4" style={{ color: colors.primaryTeal.dark }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Actualizar
                </button>
                <Link
                  to="/company/vacancies"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white"
                  style={{ backgroundColor: colors.primaryTeal.light }}
                >
                  Volver a Solicitudes
                </Link>
              </div>
            </div>
          )}
        </div>
        
        {filteredInterviews.length > 0 && (
          <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-lg p-6" style={{ backgroundColor: colors.primaryTeal.veryLight, borderColor: colors.primaryTeal.light }}>
            <h3 className="text-md font-medium mb-2" style={{ color: colors.primaryTeal.dark }}>Proceso de Entrevista</h3>
            <p className="text-sm text-gray-700 mb-4">
              Los candidatos listados aquí han sido marcados para entrevistas. Puede generar preguntas de entrevista
              personalizadas basadas en su perfil y los requisitos del trabajo.
            </p>
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" style={{ color: colors.primaryTeal.dark }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm" style={{ color: colors.primaryTeal.dark }}>
                Haga clic en "Generar Entrevista" para crear un guión de entrevista personalizado para cada candidato.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to determine the color for match score
function getMatchScoreColor(score, colors) {
  if (score >= 80) return colors.primaryTeal.light;
  if (score >= 60) return colors.primaryBlue.light;
  if (score >= 40) return colors.primaryOrange.light;
  return '#ef4444'; // Red for low scores
}

export default InterviewCandidates;