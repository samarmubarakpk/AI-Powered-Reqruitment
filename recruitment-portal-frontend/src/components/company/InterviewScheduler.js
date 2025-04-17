// src/components/company/InterviewScheduler.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { companyService } from '../../services/api';
import NavBar from '../layout/NavBar';

// Define custom colors based on HomePage.js
const colors = {
  primaryBlue: {
    light: '#2a6d8f',
    dark: '#1a4d6f',
    veryLight: '#e6f0f3' // Light background shade
  },
  primaryTeal: {
    light: '#5fb3a1',
    dark: '#3f9381',
    veryLight: '#eaf5f2' // Light background shade
  },
  primaryOrange: {
    light: '#f5923e',
    dark: '#e67e22',
    veryLight: '#fef2e9' // Light background shade
  }
};

const InterviewScheduler = () => {
  const { vacancyId, candidateId } = useParams();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [candidate, setCandidate] = useState(null);
  const [vacancy, setVacancy] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch candidate details
        const candidateResponse = await companyService.getCandidateProfile(candidateId);
        setCandidate(candidateResponse.data.candidate);
        
        // Fetch vacancy details
        const vacancyResponse = await companyService.getVacancy(vacancyId);
        setVacancy(vacancyResponse.data.vacancy);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error al cargar los datos del candidato o la vacante');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [candidateId, vacancyId]);
  
  if (loading) {
    return (
      <div style={{ backgroundColor: colors.primaryTeal.veryLight, minHeight: '100vh' }}>
        <NavBar userType="company" />
        <div className="max-w-3xl mx-auto px-4 py-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: colors.primaryTeal.light }}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: colors.primaryTeal.veryLight, minHeight: '100vh' }}>
      <NavBar userType="company" />
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: colors.primaryTeal.dark }}>Programar Entrevista</h1>
          
          {candidate && vacancy && (
            <p className="text-gray-600">
              Para {candidate.firstName} {candidate.lastName} • {vacancy.title}
            </p>
          )}
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
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            {/* Candidate Info */}
            {candidate && (
              <div>
                <h3 className="text-lg font-medium mb-4" style={{ color: colors.primaryTeal.dark }}>Información del Candidato</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nombre</p>
                    <p className="font-medium">{candidate.firstName} {candidate.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Correo Electrónico</p>
                    <p className="font-medium">{candidate.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewScheduler;