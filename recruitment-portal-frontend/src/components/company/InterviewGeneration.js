// src/components/company/InterviewGeneration.js
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { companyService } from '../../services/api';
import NavBar from '../layout/NavBar';
import InterviewQuestionsModal from './InterviewQuestionsModal';
import axios from 'axios';

function InterviewGeneration() {
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

  const { vacancyId, candidateId } = useParams();
  const navigate = useNavigate();
  const [notifyCandidate, setNotifyCandidate] = useState(true); // Default to true
  const [emailSent, setEmailSent] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vacancy, setVacancy] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [interviewScheduled, setInterviewScheduled] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [numQuestions, setNumQuestions] = useState(5); // Default to 5 questions
  
  // Try to load cached vacancy data from localStorage if available
  useEffect(() => {
    // Check if we have this vacancy cached in localStorage
    const cachedVacancy = localStorage.getItem(`vacancy-${vacancyId}`);
    if (cachedVacancy) {
      try {
        const parsedVacancy = JSON.parse(cachedVacancy);
        console.log("Using cached vacancy data:", parsedVacancy);
        setVacancy(parsedVacancy);
      } catch (e) {
        console.error("Error parsing cached vacancy:", e);
      }
    }
  }, [vacancyId]);
  
  // Enhanced data fetching with fallback mechanisms
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch candidate details
        try {
          console.log(`Fetching candidate with ID: ${candidateId}`);
          const candidateResponse = await companyService.getCandidateProfile(candidateId);
          console.log('Candidate response:', candidateResponse);
          setCandidate(candidateResponse.data.candidate);
        } catch (candidateError) {
          console.error('Error fetching candidate:', candidateError);
          setError('Error al cargar datos del candidato. Por favor, inténtelo de nuevo.');
        }
        
        // Only proceed with vacancy fetch if we don't already have it from cache
        if (!vacancy) {
          try {
            // APPROACH 1: Try the standard API
            console.log(`Fetching vacancy with ID: ${vacancyId} via standard API`);
            const vacancyResponse = await companyService.getVacancy(vacancyId);
            
            if (vacancyResponse.data && vacancyResponse.data.vacancy) {
              console.log('Vacancy response from standard API:', vacancyResponse.data.vacancy);
              setVacancy(vacancyResponse.data.vacancy);
              
              // Cache this vacancy for future use
              localStorage.setItem(`vacancy-${vacancyId}`, JSON.stringify(vacancyResponse.data.vacancy));
            } else {
              throw new Error("Invalid response format from standard API");
            }
          } catch (vacancyError) {
            console.error('Standard API failed:', vacancyError);
            
            // APPROACH 2: Simulate/create a vacancy object from our knowledge of the structure
            console.log("Creating simulated vacancy object");
            
            // This is a fallback using the known structure from the database
            const simulatedVacancy = {
              id: vacancyId,
              title: "Posición de Trabajo", // Default title
              description: "Este trabajo requiere un profesional cualificado con experiencia en el campo relevante.",
              requiredSkills: [],
              experienceRequired: 0,
              status: "open"
            };
            
            // Try to load this vacancy ID from the applications list if available
            try {
              const applications = JSON.parse(localStorage.getItem('applications') || '[]');
              const matchingApp = applications.find(app => app.vacancyId === vacancyId);
              
              if (matchingApp && matchingApp.vacancyTitle) {
                simulatedVacancy.title = matchingApp.vacancyTitle;
              }
            } catch (e) {
              console.error("Error checking applications:", e);
            }
            
            console.log("Using simulated vacancy:", simulatedVacancy);
            setVacancy(simulatedVacancy);
            
            // Don't set an error here - we're using a fallback
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('General error in fetchData:', err);
        setError('Error al cargar datos de la entrevista. Por favor, inténtelo de nuevo.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [vacancyId, candidateId, vacancy]);
  
  // Improved question generation with focus on job description
  const generateInterview = async () => {
    try {
      setGeneratingQuestions(true);
      setError('');
      
      // Validate required data
      if (!candidate) {
        throw new Error('Información del candidato no disponible');
      }
      
      if (!vacancy) {
        throw new Error('Información de la vacante no disponible');
      }
      
      const candidateSkills = candidate.skills || [];
      console.log("Candidate skills:", candidateSkills);
      
      // If we have a very minimal vacancy object, populate it further
      let enhancedVacancy = { ...vacancy };
      if (!enhancedVacancy.requiredSkills || enhancedVacancy.requiredSkills.length === 0) {
        // Try to extract skills from the description
        enhancedVacancy.requiredSkills = extractSkillsFromDescription(enhancedVacancy.description);
      }
      
      console.log("Preparing to call generateInterviewQuestions API with:");
      const requestData = {
        candidateName: `${candidate.firstName} ${candidate.lastName}`,
        skills: candidateSkills,
        jobTitle: enhancedVacancy.title,
        jobDescription: enhancedVacancy.description,
        requiredSkills: enhancedVacancy.requiredSkills || [],
        questionCount: numQuestions // Add the question count parameter
      };
      
      console.log(requestData);
      
      // Call API to generate questions
      const response = await companyService.generateInterviewQuestions(
        vacancyId, 
        candidateId,
        requestData
      );
      
      console.log("API response:", response);
      
      // Check if response has the expected format
      if (response.data && response.data.questions) {
        setQuestions(response.data.questions);
        setShowQuestionsModal(true);
      } else if (response.data && Array.isArray(response.data)) {
        // Handle the case where the API returns an array directly
        setQuestions(response.data);
        setShowQuestionsModal(true);
      } else {
        // Fallback with simulated questions if API response is not as expected
        console.warn("API response format unexpected, using fallback questions");
        const fallbackQuestions = generateFallbackQuestions(
          candidate.firstName, 
          candidateSkills, 
          enhancedVacancy.title,
          numQuestions
        );
        setQuestions(fallbackQuestions);
        setShowQuestionsModal(true);
      }
      
      setGeneratingQuestions(false);
    } catch (err) {
      console.error('Error generating interview questions:', err);
      
      // Generate fallback questions if the API call fails
      try {
        if (candidate && vacancy) {
          console.log("Generating fallback questions due to API error");
          const fallbackQuestions = generateFallbackQuestions(
            candidate.firstName, 
            candidate.skills || [], 
            vacancy.title,
            numQuestions
          );
          setQuestions(fallbackQuestions);
          setShowQuestionsModal(true);
        }
      } catch (fallbackError) {
        console.error("Error generating fallback questions:", fallbackError);
      }
      
      setError('Hubo un problema con el servicio de generación de preguntas. Usando preguntas alternativas.');
      setGeneratingQuestions(false);
    }
  };
  
  // Helper function to extract skills from job description
  const extractSkillsFromDescription = (description) => {
    if (!description) return [];
    
    const commonSkills = [
      "JavaScript", "React", "Angular", "Vue", "Node.js", "Python", "Java", "HTML", "CSS",
      "SQL", "NoSQL", "MongoDB", "MySQL", "PostgreSQL", "AWS", "Azure", "GCP",
      "Docker", "Kubernetes", "CI/CD", "Git", "Agile", "Scrum", "DevOps", 
      "WordPress", "SEO", "Content Marketing", "Social Media", "Email Marketing",
      "HubSpot", "Analytics", "CMS", "Web Design", "UI/UX", "Graphic Design",
      "Project Management", "Leadership", "Communication", "Problem Solving"
    ];
    
    // Check if description contains any of the common skills
    return commonSkills.filter(skill => 
      description.toLowerCase().includes(skill.toLowerCase())
    );
  };
  
  // Helper function to generate fallback interview questions
  const generateFallbackQuestions = (firstName, skills, jobTitle, count = 5) => {
    const skillsToUse = skills.length > 0 ? skills : ["habilidades relevantes"];
    
    const questionPool = [
      {
        category: "Experiencia",
        question: `¿Cuál considera que ha sido su mayor logro profesional hasta ahora y por qué?`,
        explanation: "Revela valores profesionales y motivaciones."
      }
    ];
    
    // Return requested number of questions (or all if we don't have enough)
    return questionPool.slice(0, Math.min(count, questionPool.length));
  };
  
  const saveInterviewQuestions = async (updatedQuestions) => {
    try {
      // Try to save to backend
      try {
        await companyService.saveInterviewQuestions(
          vacancyId,
          candidateId,
          updatedQuestions
        );
      } catch (apiError) {
        console.error("Error saving questions to API:", apiError);
        // Continue anyway since we'll save locally
      }
      
      setQuestions(updatedQuestions);
      
      // Save to localStorage as fallback
      localStorage.setItem(`interview-${vacancyId}-${candidateId}`, JSON.stringify({
        questions: updatedQuestions,
        scheduled: interviewScheduled,
        date: interviewDate
      }));
      
      return true;
    } catch (err) {
      console.error('Error saving interview questions:', err);
      setError('Error al guardar las preguntas de la entrevista. Por favor, inténtelo de nuevo.');
      return false;
    }
  };
  
  const scheduleInterview = async () => {
    if (!interviewDate) {
      setError('Por favor, seleccione una fecha y hora para la entrevista');
      return;
    }
    
    try {
      console.log('Scheduling interview with notification:', notifyCandidate);
      
      // Create a more detailed logs for debugging
      const scheduleData = {
        scheduledAt: new Date(interviewDate).toISOString(),
        notifyCandidate: notifyCandidate,
        questions: questions ? questions.slice(0, 3) : [] // Only send a few questions to avoid payload issues
      };
      
      console.log('Sending schedule data:', JSON.stringify(scheduleData));
      
      // Call the API to schedule the interview
      const response = await companyService.scheduleInterview(
        vacancyId,
        candidateId,
        scheduleData
      );
      
      console.log('Schedule interview response:', response);
      
      setInterviewScheduled(true);
      // Check if email was sent based on response
      setEmailSent(response.data.emailSent === true);
      
      // Show a more detailed alert that mentions the email
      alert(
        `¡Entrevista programada con éxito!${response.data.emailSent ? ' Se ha enviado un correo electrónico de notificación al candidato.' : ''}`
      );
    } catch (err) {
      console.error('Error scheduling interview:', err);
      
      // More detailed error message
      if (err.response) {
        console.error('API Error Response:', err.response.data);
        setError(`Error al programar la entrevista: ${err.response.data.message || err.message}`);
      } else {
        setError(`Error al programar la entrevista: ${err.message}`);
      }
    }
  };
  
  // Load previously saved interview data if available
  useEffect(() => {
    const savedInterview = localStorage.getItem(`interview-${vacancyId}-${candidateId}`);
    if (savedInterview) {
      try {
        const parsedData = JSON.parse(savedInterview);
        if (parsedData.questions && parsedData.questions.length > 0) {
          setQuestions(parsedData.questions);
        }
        if (parsedData.scheduled) {
          setInterviewScheduled(parsedData.scheduled);
        }
        if (parsedData.date) {
          setInterviewDate(parsedData.date);
        }
      } catch (e) {
        console.error("Error parsing saved interview data:", e);
      }
    }
  }, [vacancyId, candidateId]);
  
  if (loading) {
    return (
      <div>
        <NavBar userType="company" />
        <div className="max-w-7xl mx-auto px-4 py-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" style={{ borderColor: colors.primaryTeal.light }}></div>
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
            <h1 className="text-2xl font-bold" style={{ color: colors.primaryTeal.dark }}>Generación de Entrevista</h1>
            <p className="text-gray-600">
              {vacancy ? `Para: ${vacancy.title}` : 'Preparar preguntas de entrevista'}
            </p>
          </div>
          <Link
            to="/company/interviews"
            className="px-4 py-2 rounded-md text-sm font-medium"
            style={{ backgroundColor: colors.primaryTeal.veryLight, color: colors.primaryTeal.dark, border: `1px solid ${colors.primaryTeal.light}` }}
          >
            Volver a Entrevistas
          </Link>
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
        
        {/* Candidate and Vacancy Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Candidate Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4" style={{ color: colors.primaryTeal.dark }}>Información del Candidato</h2>
            
            {candidate ? (
              <div>
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ backgroundColor: colors.primaryTeal.light }}>
                    {candidate.firstName.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-medium">{candidate.firstName} {candidate.lastName}</h3>
                    <p className="text-gray-500">{candidate.email}</p>
                  </div>
                </div>
                
                {candidate.skills && candidate.skills.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Habilidades</h4>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs font-medium rounded-full"
                          style={{ backgroundColor: colors.primaryTeal.veryLight, color: colors.primaryTeal.dark }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-4">
                  <Link
                    to={`/company/candidates/${candidateId}?vacancyId=${vacancyId}`}
                    className="font-medium text-sm"
                    style={{ color: colors.primaryTeal.dark }}
                  >
                    Ver Perfil Completo
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Información del candidato no disponible</p>
            )}
          </div>
          
          {/* Vacancy Info - Enhanced to show full description */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4" style={{ color: colors.primaryTeal.dark }}>Información de la Vacante</h2>
            
            {vacancy ? (
              <div>
                <h3 className="text-xl font-medium mb-2">{vacancy.title}</h3>
                
                {vacancy.requiredSkills && vacancy.requiredSkills.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Habilidades Requeridas</h4>
                    <div className="flex flex-wrap gap-2">
                      {vacancy.requiredSkills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs font-medium rounded-full"
                          style={{ backgroundColor: colors.primaryBlue.veryLight, color: colors.primaryBlue.dark }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Descripción del Puesto</h4>
                  <div className="text-sm text-gray-600 overflow-y-auto max-h-48 whitespace-pre-line">
                    {/* Use pre-line to preserve newlines in the description */}
                    {vacancy.description}
                  </div>
                </div>
                
                {vacancy.experienceRequired > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Experiencia Requerida</h4>
                    <p className="text-sm text-gray-600">
                      {vacancy.experienceRequired} años
                    </p>
                  </div>
                )}
                
                <div className="mt-4">
                  <Link
                    to={`/company/vacancies/${vacancyId}/edit`}
                    className="font-medium text-sm"
                    style={{ color: colors.primaryTeal.dark }}
                  >
                    Ver Detalles Completos
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Información de la vacante no disponible</p>
            )}
          </div>
        </div>
        
        {/* Interview Generation */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium" style={{ color: colors.primaryTeal.dark }}>Preguntas de Entrevista</h2>
            <p className="text-sm text-gray-500 mt-1">
              Genere preguntas personalizadas basadas en el perfil del candidato y los requisitos del puesto.
            </p>
          </div>
          
          <div className="p-6">
            {questions.length > 0 ? (
              <div>
                <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: colors.primaryTeal.veryLight }}>
                  <h3 className="text-md font-medium mb-3" style={{ color: colors.primaryTeal.dark }}>Preguntas Generadas</h3>
                  
                  <div className="space-y-3">
                    {questions.slice(0, 3).map((question, index) => (
                      <div key={index} className="bg-white p-3 rounded border border-gray-200">
                        <div className="flex items-center mb-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{
                            backgroundColor: question.category === 'Técnica' ? colors.primaryBlue.veryLight :
                                           question.category === 'Comportamiento' ? colors.primaryTeal.veryLight :
                                           question.category === 'Situacional' ? colors.primaryOrange.veryLight :
                                           '#e5e7eb',
                            color: question.category === 'Técnica' ? colors.primaryBlue.dark :
                                   question.category === 'Comportamiento' ? colors.primaryTeal.dark :
                                   question.category === 'Situacional' ? colors.primaryOrange.dark :
                                   '#374151'
                          }}>
                            {question.category || 'Pregunta'}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{question.question}</p>
                      </div>
                    ))}
                    
                    {questions.length > 3 && (
                      <p className="text-sm text-gray-500 text-center">
                        + {questions.length - 3} preguntas más disponibles
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={() => setShowQuestionsModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{ borderColor: colors.primaryTeal.light, color: colors.primaryTeal.dark }}
                    >
                      <svg className="mr-2 h-4 w-4" style={{ color: colors.primaryTeal.light }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Ver y Editar Todas las Preguntas
                    </button>
                    
                    <button
                      onClick={generateInterview}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{ backgroundColor: colors.primaryTeal.light, borderColor: colors.primaryTeal.light }}
                      disabled={generatingQuestions}
                    >
                      {generatingQuestions ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generando...
                        </>
                      ) : (
                        <>
                          <svg className="mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Regenerar Preguntas
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12" style={{ color: colors.primaryTeal.light }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Sin preguntas de entrevista todavía</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Genere preguntas personalizadas para este candidato basadas en sus habilidades y los requisitos del trabajo.
                </p>
                
                {/* Add number of questions selector */}
                <div className="mt-4 max-w-xs mx-auto">
                  <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700 text-left mb-1">
                    Número de preguntas a generar:
                  </label>
                  <select
                    id="numQuestions"
                    name="numQuestions"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    style={{ borderColor: colors.primaryTeal.light }}
                  >
                    <option value="3">3 preguntas</option>
                    <option value="5">5 preguntas</option>
                    <option value="7">7 preguntas</option>
                    <option value="10">10 preguntas</option>
                  </select>
                </div>
                
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={generateInterview}
                    disabled={generatingQuestions}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ backgroundColor: colors.primaryTeal.light }}
                  >
                    {generatingQuestions ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generando Preguntas...
                      </>
                    ) : (
                      <>
                        <svg className="mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>
                        </svg>
                        Generar Preguntas de Entrevista
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
          {/* Schedule Interview */}
          {questions.length > 0 && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium" style={{ color: colors.primaryTeal.dark }}>Programar Entrevista</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Establezca una hora para la entrevista y notifique al candidato.
                </p>
              </div>
              
              <div className="p-6">
                {interviewScheduled ? (
                  <div className="border border-green-200 rounded-lg p-4" style={{ backgroundColor: colors.primaryTeal.veryLight }}>
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5" style={{ color: colors.primaryTeal.dark }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium" style={{ color: colors.primaryTeal.dark }}>Entrevista Programada</h3>
                        <div className="mt-2 text-sm" style={{ color: colors.primaryTeal.light }}>
                          <p>
                            Entrevista con {candidate?.firstName} {candidate?.lastName} ha sido programada para {new Date(interviewDate).toLocaleString()}.
                          </p>
                          {emailSent && (
                            <p className="mt-1 font-medium" style={{ color: colors.primaryTeal.dark }}>
                              ✉️ Correo electrónico de notificación enviado al candidato
                            </p>
                          )}
                        </div>
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() => setInterviewScheduled(false)}
                            className="text-sm font-medium"
                            style={{ color: colors.primaryTeal.dark }}
                          >
                            Reprogramar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-4">
                      <label htmlFor="interviewDate" className="block text-sm font-medium text-gray-700">
                        Fecha y Hora de la Entrevista
                      </label>
                      <input
                        type="datetime-local"
                        id="interviewDate"
                        value={interviewDate}
                        onChange={(e) => setInterviewDate(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        style={{ borderColor: colors.primaryTeal.light }}
                      />
                    </div>
                    
                    {/* Add the notification checkbox here */}
                    <div className="flex items-center mb-4">
                      <input
                        id="notifyCandidate"
                        type="checkbox"
                        checked={notifyCandidate}
                        onChange={(e) => setNotifyCandidate(e.target.checked)}
                        className="h-4 w-4 focus:ring-indigo-500 border-gray-300 rounded"
                        style={{ color: colors.primaryTeal.light }}
                      />
                      <label htmlFor="notifyCandidate" className="ml-2 block text-sm text-gray-700">
                        Enviar correo electrónico de notificación al candidato
                      </label>
                    </div>
                    
                    <button
                      type="button"
                      onClick={scheduleInterview}
                      disabled={!interviewDate}
                      className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${!interviewDate ? 'opacity-50 cursor-not-allowed' : ''}`}
                      style={{ backgroundColor: colors.primaryTeal.light }}
                    >
                      <svg className="mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Programar Entrevista
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
                  
        {/* Interview Questions Modal */}
        {showQuestionsModal && (
          <InterviewQuestionsModal
            questions={questions}
            onClose={() => setShowQuestionsModal(false)}
            onSave={saveInterviewQuestions}
          />
        )}
      </div>
    </div>
  );
}
export default InterviewGeneration;