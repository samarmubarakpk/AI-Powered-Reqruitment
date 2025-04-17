// src/components/company/CandidateSearch.js (Simplified Version)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { companyService } from '../../services/api';
import NavBar from '../layout/NavBar';
import CVLinkComponent from './CVLinkComponent';

function CandidateSearch() {
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

  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [selectedVacancy, setSelectedVacancy] = useState('all');
  const [maxCandidates, setMaxCandidates] = useState(10); // Default to 10 candidates per vacancy
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  // Fetch candidates and vacancies on component mount
  useEffect(() => {
    fetchData();
  }, []);
  
  // Fetch all necessary data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch all vacancies
      const vacanciesResponse = await companyService.getVacancies();
      const vacanciesList = vacanciesResponse.data.vacancies || [];
      setVacancies(vacanciesList);
      
      // Fetch all candidates
      // We'll simulate this by collecting candidates from applications across all vacancies
      let allCandidates = [];
      const candidateMap = new Map(); // Use map to prevent duplicates
      
      for (const vacancy of vacanciesList) {
        try {
          const applicationsResponse = await companyService.getApplications(vacancy.id);
          const applications = applicationsResponse.data.applications || [];
          
          // Extract candidate information from applications
          applications.forEach(app => {
            if (app.candidateId && !candidateMap.has(app.candidateId)) {
              // Extract candidate info from application
              const candidateInfo = app.candidate || app.candidateInfo || {
                id: app.candidateId,
                firstName: 'Unknown',
                lastName: 'Candidate',
                email: app.candidateEmail || 'unknown@example.com'
              };
              
              // Create standardized candidate object
              const candidate = {
                candidateId: app.candidateId,
                candidateName: `${candidateInfo.firstName} ${candidateInfo.lastName}`,
                candidateEmail: candidateInfo.email,
                cvUrl: candidateInfo.cvUrl,
                skills: candidateInfo.skills || [],
                matchScore: app.suitabilityScore?.overall || 75, // Default score if not available
                vacancyId: vacancy.id,
                vacancyTitle: vacancy.title
              };
              
              candidateMap.set(app.candidateId, candidate);
              allCandidates.push(candidate);
            }
          });
        } catch (err) {
          console.error(`Error fetching applications for vacancy ${vacancy.id}:`, err);
        }
      }
      
      // Sort candidates by name for default view
      allCandidates.sort((a, b) => a.candidateName.localeCompare(b.candidateName));
      
      setCandidates(allCandidates);
      setSearchPerformed(true);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load candidates and vacancies. Please try again later.');
      setLoading(false);
    }
  };
  
  // Filter candidates based on selected vacancy
  const filteredCandidates = selectedVacancy === 'all'
    ? candidates
    : candidates.filter(candidate => candidate.vacancyId === selectedVacancy);
  
  // Limit the number of candidates shown based on maxCandidates setting
  const limitedCandidates = filteredCandidates.slice(0, maxCandidates);
  
  // Handle changing the number of candidates to display
  const handleCandidateNumberChange = (e) => {
    setMaxCandidates(parseInt(e.target.value));
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
          <h1 className="text-2xl font-bold" style={{ color: colors.primaryTeal.dark }}>Búsqueda de Candidatos</h1>
          <button
            onClick={fetchData}
            className="px-4 py-2 rounded-md text-sm font-medium flex items-center"
            style={{ backgroundColor: colors.primaryTeal.veryLight, color: colors.primaryTeal.dark, border: `1px solid ${colors.primaryTeal.light}` }}
          >
            <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar Datos
          </button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Filter by Vacancy - From InterviewCandidates.js */}
            <div>
              <h2 className="text-lg font-medium mb-2" style={{ color: colors.primaryTeal.dark }}>Filtrar por Vacante</h2>
              <select
                value={selectedVacancy}
                onChange={(e) => setSelectedVacancy(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none sm:text-sm rounded-md"
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
            
            {/* Candidates per Vacancy - From RecommendationsDashboard.js */}
            <div>
              <h2 className="text-lg font-medium mb-2" style={{ color: colors.primaryTeal.dark }}>Candidatos Mostrados</h2>
              <select
                value={maxCandidates}
                onChange={handleCandidateNumberChange}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none sm:text-sm rounded-md"
                style={{ borderColor: colors.primaryTeal.light }}
              >
                <option value="5">5 candidatos</option>
                <option value="10">10 candidatos</option>
                <option value="20">20 candidatos</option>
                <option value="50">50 candidatos</option>
                <option value="100">100 candidatos</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Candidates List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium" style={{ color: colors.primaryTeal.dark }}>
                {filteredCandidates.length} 
                {filteredCandidates.length === 1 ? ' Candidato' : ' Candidatos'} 
                {selectedVacancy !== 'all' && ' para esta vacante'}
              </h2>
              <p className="text-sm text-gray-500">
                Mostrando {Math.min(maxCandidates, filteredCandidates.length)} de {filteredCandidates.length}
              </p>
            </div>
          </div>
          
          {searchPerformed && limitedCandidates.length > 0 ? (
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
                      Puntuación de Compatibilidad
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
                  {limitedCandidates.map((candidate) => (
                    <tr key={candidate.candidateId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium" style={{ backgroundColor: colors.primaryTeal.light }}>
                            {candidate.candidateName.charAt(0) || 'C'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {candidate.candidateName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {candidate.candidateEmail}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {candidate.vacancyTitle || 'Posición Desconocida'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="font-medium text-sm">
                            {Math.round(candidate.matchScore)}%
                          </span>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="h-1.5 rounded-full"
                              style={{ 
                                width: `${candidate.matchScore}%`,
                                backgroundColor: getMatchScoreColor(candidate.matchScore, colors)
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {candidate.candidateId && (
                          <CVLinkComponent candidateId={candidate.candidateId} />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex flex-col space-y-2">
                          <Link
                            to={`/company/candidates/${candidate.candidateId}`}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white"
                            style={{ backgroundColor: colors.primaryTeal.light }}
                          >
                            Ver Perfil
                          </Link>
                          <Link
                            to={`/company/vacancies/${candidate.vacancyId}/candidates/${candidate.candidateId}/schedule`}
                            className="inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-md"
                            style={{ 
                              color: colors.primaryTeal.dark, 
                              borderColor: colors.primaryTeal.light 
                            }}
                          >
                            Agendar Entrevista
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron candidatos</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedVacancy === 'all' 
                  ? 'No hay candidatos disponibles en el sistema.' 
                  : 'No hay candidatos para esta vacante.'}
              </p>
              <div className="mt-6 flex justify-center space-x-4">
                <button
                  onClick={fetchData}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md"
                  style={{ backgroundColor: colors.primaryTeal.veryLight, color: colors.primaryTeal.dark, border: `1px solid ${colors.primaryTeal.light}` }}
                >
                  <svg className="mr-2 h-4 w-4" style={{ color: colors.primaryTeal.dark }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Actualizar
                </button>
              </div>
            </div>
          )}
        </div>
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

export default CandidateSearch;