// src/components/company/InterviewRecordings.js
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { companyService } from '../../services/api';
import NavBar from '../layout/NavBar';
import TranscriptDisplay from './TranscriptDisplay';
import axios from 'axios';
import AnalysisProgressIndicator from './AnalysisProgressIndicator';

function InterviewRecordings() {
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

  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [interviews, setInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [playing, setPlaying] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const videoRef = useRef(null);
  
  // Fetch all interviews with recordings when component mounts
  useEffect(() => {
    const fetchInterviewRecordings = async () => {
      try {
        setLoading(true);
        const response = await companyService.getInterviewRecordings();
        console.log('Interview recordings response:', response.data);
        setInterviews(response.data.interviews || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching interview recordings:', err);
        setError('Error al cargar las grabaciones de entrevistas. Por favor, inténtelo de nuevo más tarde.');
        setLoading(false);
      }
    };

    fetchInterviewRecordings();
  }, []);

  // Handle viewing a recording
  const viewRecording = async (interview, recordingIndex = 0) => {
    try {
      setSelectedInterview(interview);
      setAnalysis(null);
      setTranscript(null);
      setCurrentQuestionIndex(recordingIndex);
      
      // If interview has recordings
      if (interview.recordings && interview.recordings.length > 0) {
        const recording = interview.recordings[recordingIndex];
        
        // Get secure URL for the recording
        const response = await companyService.getInterviewRecordingUrl(
          interview.id, 
          recording.questionIndex
        );
        
        setVideoUrl(response.data.url);
        setPlaying(true);
        
        // Check if this recording already has an analysis
        if (recording.analysis) {
          console.log('Using existing analysis:', recording.analysis);
          
          // Ensure analysis has all required properties
          const sanitizedAnalysis = {
            confidence: recording.analysis.confidence || 0,
            nervousness: recording.analysis.nervousness || 0,
            answerQuality: {
              relevance: recording.analysis.answerQuality?.relevance || 0,
              completeness: recording.analysis.answerQuality?.completeness || 0,
              coherence: recording.analysis.answerQuality?.coherence || 0,
              technicalAccuracy: recording.analysis.answerQuality?.technicalAccuracy || 0
            },
            overallAssessment: {
              confidenceLevel: recording.analysis.overallAssessment?.confidenceLevel || 'Medio',
              summary: recording.analysis.overallAssessment?.summary || 'No hay evaluación disponible.'
            }
          };
          
          setAnalysis(sanitizedAnalysis);
        }
        
        // Check if this recording already has a transcript
        if (recording.transcript) {
          console.log('Using existing transcript:', recording.transcript);
          setTranscript(recording.transcript);
        }
        if (!interview.questions || !Array.isArray(interview.questions) || interview.questions.length === 0) {
          // Extract vacancy and candidate IDs from the interview ID
          const idParts = interview.id.split('-');
          if (idParts.length >= 2) {
            const vacancyId = idParts[0];
            const candidateId = idParts[1];
            
            try {
              // Fetch interview data with questions
              const questionsResponse = await companyService.getInterviewQuestions(
                vacancyId, 
                candidateId
              );
              
              if (questionsResponse.data && 
                  questionsResponse.data.questions && 
                  Array.isArray(questionsResponse.data.questions) && 
                  questionsResponse.data.questions.length > 0) {
                // Update the interview object with questions
                interview.questions = questionsResponse.data.questions;
                setSelectedInterview({...interview}); // Trigger a re-render with the questions
              }
            } catch (questionsError) {
              console.error('Error fetching questions:', questionsError);
            }
          }
        }
      } else {
        setError('No hay grabaciones disponibles para esta entrevista');
      }
    } catch (err) {
      console.error('Error getting recording URL:', err);
      setError('Error al cargar la grabación de la entrevista. Por favor, inténtelo de nuevo.');
    }
  };
  

  // Close the video player
  const closePlayer = () => {
    setSelectedInterview(null);
    setVideoUrl('');
    setPlaying(false);
    setAnalysis(null);
    setTranscript(null);
    setCurrentQuestionIndex(0);
  };
  
  // Transcribe the audio separately (for cases where video indexer fails)
  const transcribeAudio = async () => {
    if (!selectedInterview || !videoUrl) {
      setError('No hay grabación seleccionada para transcripción');
      return;
    }
    
    try {
      setTranscribing(true);
      setError('');
      
      // Get the question index from the current recording
      const questionIndex = selectedInterview.recordings[currentQuestionIndex]?.questionIndex || 0;
      
      console.log(`Transcribing audio for interview ${selectedInterview.id}, question ${questionIndex}`);
      
      // Show a message that we're transcribing
      setTranscript("Transcribiendo audio... Esto puede tardar hasta un minuto para grabaciones más largas.");
      
      // Create a custom axios instance with longer timeout for just this request
      const customAxios = axios.create({
        baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
        timeout: 12000000 // 20 minutes timeout
      });
      
      // Add token to request
      const token = localStorage.getItem('token');
      if (token) {
        customAxios.defaults.headers.common['x-auth-token'] = token;
      }
      
      // Make direct API call instead of using companyService
      const response = await customAxios.post(
        `/companies/interview-recordings/${selectedInterview.id}/${questionIndex}/transcribe`
      );
      
      console.log('Transcription response:', response.data);
      
      if (response.data.transcript) {
        setTranscript(response.data.transcript);
        setError(null);
      } else {
        setTranscript("No se pudo transcribir ningún discurso de esta grabación.");
        setError("No se pudo extraer el discurso de la grabación.");
      }
      
      setTranscribing(false);
    } catch (err) {
      console.error('Error transcribing audio:', err);
      setError(`Error al transcribir el audio: ${err.message}`);
      setTranscript("La transcripción falló. Por favor, inténtelo de nuevo.");
      setTranscribing(false);
    }
  };
  
  // Analyze the current recording using Azure AI services
  // const analyzeRecording = async () => {
  //   if (!selectedInterview || !videoUrl) {
  //     setError('No hay grabación seleccionada para análisis');
  //     return;
  //   }
    
  //   try {
  //     setAnalyzing(true);
  //     setError('');
      
  //     // Find the recording index that corresponds to the current question
  //     const questionIndex = selectedInterview.recordings[currentQuestionIndex]?.questionIndex || 0;
      
  //     console.log(`Analyzing recording for interview ${selectedInterview.id}, question index ${questionIndex}`);
      
  //     // Show more detailed progress information with a valid structure
  //     setAnalysis({
  //       confidence: null,
  //       nervousness: null,
  //       answerQuality: {
  //         relevance: null,
  //         completeness: null,
  //         coherence: null,
  //         technicalAccuracy: null
  //       },
  //       overallAssessment: {
  //         confidenceLevel: 'En Progreso',
  //         summary: "El análisis está en progreso. Esto puede tardar 2-3 minutos mientras el video es procesado. Por favor, espere..."
  //       }
  //     });
      
  //     // Add retry logic with exponential backoff
  //     let attempts = 0;
  //     const maxAttempts = 3;
  //     let success = false;
  //     let lastError = null;
      
  //     while (attempts < maxAttempts && !success) {
  //       try {
  //         attempts++;
          
  //         // If this is a retry, show a message
  //         if (attempts > 1) {
  //           setAnalysis(prev => ({
  //             ...prev,
  //             overallAssessment: {
  //               ...prev.overallAssessment,
  //               summary: `Reintentando análisis (intento ${attempts}/${maxAttempts})...`
  //             }
  //           }));
  //         }
          
  //         // Call the analysis API
  //         const response = await companyService.analyzeInterviewRecording(
  //           selectedInterview.id, 
  //           questionIndex
  //         );
          
  //         console.log('Analysis response:', response.data);
          
  //         if (response.data.error) {
  //           setError(`El análisis se completó con advertencias: ${response.data.error}`);
  //         } else {
  //           setError(null);
  //         }
          
  //         // Make sure the analysis object has a valid structure before setting it
  //         const receivedAnalysis = response.data.analysis || {};
          
  //         // Ensure all required properties exist
  //         const validAnalysis = {
  //           confidence: receivedAnalysis.confidence || 0,
  //           nervousness: receivedAnalysis.nervousness || 0,
  //           answerQuality: {
  //             relevance: receivedAnalysis.answerQuality?.relevance || 0,
  //             completeness: receivedAnalysis.answerQuality?.completeness || 0,
  //             coherence: receivedAnalysis.answerQuality?.coherence || 0,
  //             technicalAccuracy: receivedAnalysis.answerQuality?.technicalAccuracy || 0
  //           },
  //           overallAssessment: {
  //             confidenceLevel: receivedAnalysis.overallAssessment?.confidenceLevel || 'Medio',
  //             summary: receivedAnalysis.overallAssessment?.summary || 'Análisis completado, pero no hay evaluación detallada disponible.'
  //           }
  //         };
          
  //         // Set the analysis with our sanitized version
  //         setAnalysis(validAnalysis);
          
  //         // Only set transcript if one was returned and we're not already transcribing
  //         if (response.data.transcript && !transcribing) {
  //           setTranscript(response.data.transcript);
  //         }
          
  //         success = true;
  //       } catch (err) {
  //         lastError = err;
  //         console.error(`Analysis attempt ${attempts} failed:`, err);
          
  //         // If this is not the last attempt, wait before retrying
  //         if (attempts < maxAttempts) {
  //           // Exponential backoff: wait longer between each retry
  //           const waitTime = Math.pow(2, attempts) * 1000;
  //           console.log(`Waiting ${waitTime}ms before retry...`);
            
  //           setAnalysis(prev => ({
  //             ...prev,
  //             overallAssessment: {
  //               ...prev.overallAssessment,
  //               summary: `Error en el análisis. Reintentando en ${waitTime/1000} segundos...`
  //             }
  //           }));
            
  //           await new Promise(resolve => setTimeout(resolve, waitTime));
  //         }
  //       }
  //     }
      
  //     // If all attempts failed, handle the final error
  //     if (!success) {
  //       console.error('All analysis attempts failed:', lastError);
        
  //       // Provide more specific error messages based on error type
  //       if (lastError.code === 'ECONNABORTED' || lastError.message.includes('timeout')) {
  //         setError('El análisis ha excedido el tiempo máximo. El video puede ser demasiado largo o el servidor está ocupado. Por favor, intente de nuevo más tarde.');
  //       } else if (lastError.message.includes('Network Error')) {
  //         setError('Error de conexión al servidor. Por favor, verifique su conexión a internet e intente de nuevo.');
  //       } else {
  //         setError(`Error al analizar la grabación: ${lastError.response?.data?.message || lastError.message}`);
  //       }
        
  //       // Reset analysis with a valid empty structure
  //       setAnalysis(null);
  //     }
      
  //     setAnalyzing(false);
  //   } catch (err) {
  //     console.error('Unexpected error in analyzeRecording:', err);
  //     setError(`Error inesperado: ${err.message}. Por favor, recargue la página e intente de nuevo.`);
  //     setAnalyzing(false);
      
  //     // Reset analysis with a valid empty structure
  //     setAnalysis(null);
  //   }
  // };


const analyzeRecording = async () => {
  if (!selectedInterview || !videoUrl) {
    setError('No hay grabación seleccionada para análisis');
    return;
  }
  
  try {
    setAnalyzing(true);
    setError('');
    
    // Find the recording index that corresponds to the current question
    const questionIndex = selectedInterview.recordings[currentQuestionIndex]?.questionIndex || 0;
    
    console.log(`Analyzing recording for interview ${selectedInterview.id}, question index ${questionIndex}`);
    
    // Show progress information with a valid structure
    setAnalysis({
      confidence: null,
      nervousness: null,
      answerQuality: {
        relevance: null,
        completeness: null,
        coherence: null,
        technicalAccuracy: null
      },
      overallAssessment: {
        confidenceLevel: 'En Progreso',
        summary: "El análisis está en progreso. Esto puede tardar 2-3 minutos mientras el video es procesado. Por favor, espere..."
      }
    });
    
    // Call the analysis API with a 3-minute timeout
    const response = await companyService.analyzeInterviewRecording(
      selectedInterview.id, 
      questionIndex
    );
    
    console.log('Analysis response:', response.data);
    
    if (response.data.error) {
      setError(`El análisis se completó con advertencias: ${response.data.error}`);
    } else {
      setError(null);
    }
    
    // Make sure the analysis object has a valid structure before setting it
    const receivedAnalysis = response.data.analysis || {};
    
    // Ensure all required properties exist
    const validAnalysis = {
      confidence: receivedAnalysis.confidence || 0,
      nervousness: receivedAnalysis.nervousness || 0,
      answerQuality: {
        relevance: receivedAnalysis.answerQuality?.relevance || 0,
        completeness: receivedAnalysis.answerQuality?.completeness || 0,
        coherence: receivedAnalysis.answerQuality?.coherence || 0,
        technicalAccuracy: receivedAnalysis.answerQuality?.technicalAccuracy || 0
      },
      overallAssessment: {
        confidenceLevel: receivedAnalysis.overallAssessment?.confidenceLevel || 'Medio',
        summary: receivedAnalysis.overallAssessment?.summary || 'Análisis completado, pero no hay evaluación detallada disponible.'
      }
    };
    
    // Set the analysis with our sanitized version
    setAnalysis(validAnalysis);
    
    // Only set transcript if one was returned and we're not already transcribing
    if (response.data.transcript && !transcribing) {
      setTranscript(response.data.transcript);
    }
    
    setAnalyzing(false);
  } catch (err) {
    console.error('Error analyzing recording:', err);
    
    // Provide a more helpful message for network errors
    if (err.message.includes('Network Error')) {
      setError('El análisis puede haberse completado correctamente a pesar del error de red. Por favor, actualice la página e intente ver la grabación nuevamente.');
    } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      setError('El análisis ha excedido el tiempo máximo. El video puede ser demasiado largo o el servidor está ocupado. Actualice la página para verificar si los resultados están disponibles.');
    } else {
      setError(`Error al analizar la grabación: ${err.response?.data?.message || err.message}`);
    }
    
    setAnalyzing(false);
    setAnalysis(null);
  }
};

  // Render sentiment score with color coding - with null check
  const renderSentimentScore = (score) => {
    // Check if score is undefined or null
    if (score === undefined || score === null) {
      return <span className="text-gray-600">N/A</span>;
    }
    
    let color = 'text-gray-600';
    if (score > 0.6) color = 'text-green-600';
    else if (score > 0.4) color = 'text-blue-600';
    else if (score > 0.2) color = 'text-yellow-600';
    else color = 'text-red-600';
    
    return (
      <span className={color}>
        {(score * 100).toFixed(0)}%
      </span>
    );
  };
  
  // Render confidence assessment
  const renderConfidenceLevel = (confidence) => {
    if (!confidence) {
      return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">Desconocido</span>;
    }
    
    const levels = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-red-100 text-red-800',
      'in progress': 'bg-blue-100 text-blue-800',
      alto: 'bg-green-100 text-green-800',
      medio: 'bg-yellow-100 text-yellow-800',
      bajo: 'bg-red-100 text-red-800',
      'en progreso': 'bg-blue-100 text-blue-800'
    };
    
    const lowercaseConfidence = confidence.toLowerCase();
    const colorClass = levels[lowercaseConfidence] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {confidence}
      </span>
    );
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Loading state
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
            <h1 className="text-2xl font-bold" style={{ color: colors.primaryTeal.dark }}>Grabaciones de Entrevistas</h1>
            <p className="text-gray-600">Ver entrevistas grabadas de candidatos</p>
          </div>
          <Link
            to="/company/dashboard"
            className="px-4 py-2 rounded-md text-sm font-medium"
            style={{ backgroundColor: colors.primaryTeal.veryLight, color: colors.primaryTeal.dark, border: `1px solid ${colors.primaryTeal.light}` }}
          >
            Volver al Panel
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
        
        {/* Video Player Modal */}
        {selectedInterview && videoUrl && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Background overlay */}
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={closePlayer}></div>
              
              {/* Modal panel */}
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      {selectedInterview.candidateName || 'Candidato'} - {selectedInterview.vacancyTitle || 'Posición'}
                    </h3>
                    <button
                      type="button"
                      className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                      onClick={closePlayer}
                    >
                      <span className="sr-only">Cerrar</span>
                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left column: Video and basic info */}
                    <div>
                      <div className="aspect-video bg-black rounded-lg overflow-hidden">
                        <video
                          ref={videoRef}
                          src={videoUrl}
                          className="w-full h-full"
                          controls
                          autoPlay={playing}
                        />
                      </div>
                      
                      {/* Recording details */}
                      <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: colors.primaryTeal.veryLight }}>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Detalles de la Entrevista</h4>
                        <div className="text-sm text-gray-500">
                          <p><span className="font-medium">Fecha:</span> {formatDate(selectedInterview.scheduledAt || selectedInterview.createdAt)}</p>
                          <p><span className="font-medium">Estado:</span> {selectedInterview.status || 'Completada'}</p>
                          <p><span className="font-medium">Preguntas Grabadas:</span> {selectedInterview.recordings?.length || 0}</p>
                        </div>
                      </div>
                      
                      {/* Multiple recording navigation (if interview has multiple recordings) */}
                      {selectedInterview.recordings && selectedInterview.recordings.length > 1 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Todas las Grabaciones</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedInterview.recordings.map((recording, index) => (
                              <button
                                key={index}
                                onClick={() => viewRecording(selectedInterview, index)}
                                className={`px-3 py-1 text-sm rounded-full ${
                                  currentQuestionIndex === index
                                    ? 'text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                                style={{ 
                                  backgroundColor: currentQuestionIndex === index ? colors.primaryTeal.light : undefined 
                                }}
                              >
                                Pregunta {recording.questionIndex + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Right column: Analysis and transcript */}
                    <div className="bg-gray-50 rounded-lg p-4 overflow-y-auto max-h-[80vh]">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-md font-medium" style={{ color: colors.primaryTeal.dark }}>Análisis con IA</h4>
                        <div className="flex space-x-2">
                          <button
                            onClick={transcribeAudio}
                            disabled={transcribing}
                            className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm ${
                              transcribing 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'text-white'
                            }`}
                            style={{ 
                              backgroundColor: transcribing ? undefined : colors.primaryBlue.light
                            }}
                          >
                            {transcribing ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Transcribiendo...
                              </>
                            ) : (
                              <>
                                <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                                Transcribir Audio
                              </>
                            )}
                          </button>

                          
                          
                          <button
                            onClick={analyzeRecording}
                            disabled={analyzing}
                            className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm ${
                              analyzing 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'text-white'
                            }`}
                            style={{ 
                              backgroundColor: analyzing ? undefined : colors.primaryTeal.light
                            }}
                          >
                            {analyzing ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Analizando...
                              </>
                            ) : (
                              <>
                                <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Análisis de Video
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Add the progress indicator component here */}
                      <AnalysisProgressIndicator isAnalyzing={analyzing} />
                      
                      {/* Transcript Section */}
                      <TranscriptDisplay 
                      transcript={transcript} 
                      questions={selectedInterview?.questions || []}
                      loading={transcribing} 
                    />
                      
                      {analysis ? (
                        <div className="space-y-4 mt-4">
                          {/* Sentiment analysis */}
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h5 className="font-medium text-gray-800 mb-2">Video Análisis de Sentimiento</h5>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Confianza</p>
                                <p className="text-lg font-medium">{renderSentimentScore(analysis.confidence)}</p>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(analysis.confidence || 0) * 100}%` }}></div>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Nerviosismo</p>
                                <p className="text-lg font-medium">{renderSentimentScore(analysis.nervousness)}</p>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                                  <div className="bg-yellow-600 h-2.5 rounded-full" style={{ width: `${(analysis.nervousness || 0) * 100}%` }}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Answer content analysis - Only render if answerQuality exists */}
                          {analysis.answerQuality && (
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                              <h5 className="font-medium text-gray-800 mb-2">Calidad de la Respuesta</h5>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-gray-600">Relevancia</p>
                                  <p className="text-lg font-medium">{renderSentimentScore(analysis.answerQuality.relevance)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Completitud</p>
                                  <p className="text-lg font-medium">{renderSentimentScore(analysis.answerQuality.completeness)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Coherencia</p>
                                  <p className="text-lg font-medium">{renderSentimentScore(analysis.answerQuality.coherence)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Precisión Técnica</p>
                                  <p className="text-lg font-medium">{renderSentimentScore(analysis.answerQuality.technicalAccuracy)}</p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Overall assessment - Only render if overallAssessment exists */}
                          {analysis.overallAssessment && (
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                              <h5 className="font-medium text-gray-800 mb-2">Evaluación General</h5>
                              <div className="flex items-center mb-2">
                                <p className="text-sm text-gray-600 mr-2">Nivel de Confianza:</p>
                                {renderConfidenceLevel(analysis.overallAssessment.confidenceLevel || 'Desconocido')}
                              </div>
                              <p className="text-sm text-gray-600">{analysis.overallAssessment.summary || 'No hay evaluación disponible.'}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-white p-6 rounded-lg text-center shadow-sm mt-4">
                          <svg className="h-12 w-12 text-gray-400 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                          <p className="text-gray-600">
                            {analyzing ? 'Analizando respuesta...' : 'Haga clic en "Análisis de Video" para generar información de IA sobre esta respuesta de entrevista.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={closePlayer}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
                      
        {/* Interview Recordings List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium" style={{ color: colors.primaryTeal.dark }}>{interviews.length} Entrevistas Grabadas</h2>
          </div>
          
          {interviews.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {interviews.map((interview) => (
                <div key={interview.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {interview.candidateName || 'Candidato'}
                      </h3>
                      <p className="text-sm text-gray-500">{interview.vacancyTitle || 'Posición'}</p>
                      
                      <div className="mt-2 flex items-center">
                        <svg className="h-5 w-5 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-gray-500">
                          {formatDate(interview.scheduledAt || interview.createdAt)}
                        </span>
                      </div>
                      
                      <div className="mt-2 flex items-center">
                        <svg className="h-5 w-5 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-gray-500">
                          {interview.recordings?.length || 0} grabación{interview.recordings?.length !== 1 ? 'es' : ''}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={() => viewRecording(interview)}
                        disabled={!interview.recordings || interview.recordings.length === 0}
                        className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
                          interview.recordings && interview.recordings.length > 0
                            ? 'text-white'
                            : 'text-gray-500 bg-gray-200 cursor-not-allowed'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                        style={{ 
                          backgroundColor: (interview.recordings && interview.recordings.length > 0) ? 
                            colors.primaryTeal.light : undefined
                        }}
                      >
                        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Ver Grabación
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay grabaciones de entrevistas</h3>
              <p className="mt-1 text-sm text-gray-500">
                Ningún candidato ha completado sus entrevistas todavía.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InterviewRecordings;