// src/components/company/InterviewGeneration.js
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { companyService } from '../../services/api';
import NavBar from '../layout/NavBar';
import InterviewQuestionsModal from './InterviewQuestionsModal';

function InterviewGeneration() {
  const { vacancyId, candidateId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vacancy, setVacancy] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [interviewScheduled, setInterviewScheduled] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  
  useEffect(() => {
    fetchData();
  }, [vacancyId, candidateId]);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch vacancy details
      const vacancyResponse = await companyService.getVacancy(vacancyId);
      setVacancy(vacancyResponse.data.vacancy);
      
      // Fetch candidate details
      const candidateResponse = await companyService.getCandidateProfile(candidateId);
      setCandidate(candidateResponse.data.candidate);
      
      // Check if this candidate already has interview questions generated
      // This would typically come from your backend, but in this demo we're just using localStorage
      try {
        const savedInterview = localStorage.getItem(`interview-${vacancyId}-${candidateId}`);
        if (savedInterview) {
          const parsedInterview = JSON.parse(savedInterview);
          setQuestions(parsedInterview.questions || []);
          setInterviewScheduled(parsedInterview.scheduled || false);
          setInterviewDate(parsedInterview.date || '');
        }
      } catch (err) {
        console.warn('Error loading saved interview:', err);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading interview data:', err);
      setError('Failed to load interview data. Please try again.');
      setLoading(false);
    }
  };
  
  const generateInterview = async () => {
    try {
      setGeneratingQuestions(true);
      
      // Get candidate skills and experience
      const candidateSkills = candidate.skills || [];
      
      // Call API to generate questions
      const response = await companyService.generateInterviewQuestions(
        vacancyId, 
        candidateId,
        {
          candidateName: `${candidate.firstName} ${candidate.lastName}`,
          skills: candidateSkills,
          jobTitle: vacancy.title,
          jobDescription: vacancy.description,
          requiredSkills: vacancy.requiredSkills || []
        }
      );
      
      setQuestions(response.data.questions);
      setShowQuestionsModal(true);
      setGeneratingQuestions(false);
    } catch (err) {
      console.error('Error generating interview questions:', err);
      setError('Failed to generate interview questions. Please try again.');
      setGeneratingQuestions(false);
    }
  };
  
  const saveInterviewQuestions = async (updatedQuestions) => {
    try {
      await companyService.saveInterviewQuestions(
        vacancyId,
        candidateId,
        updatedQuestions
      );
      
      setQuestions(updatedQuestions);
      
      // Also save to localStorage for demo purposes
      localStorage.setItem(`interview-${vacancyId}-${candidateId}`, JSON.stringify({
        questions: updatedQuestions,
        scheduled: interviewScheduled,
        date: interviewDate
      }));
      
      return true;
    } catch (err) {
      console.error('Error saving interview questions:', err);
      setError('Failed to save interview questions. Please try again.');
      return false;
    }
  };
  
  const scheduleInterview = () => {
    if (!interviewDate) {
      setError('Please select an interview date and time');
      return;
    }
    
    // Save interview schedule
    setInterviewScheduled(true);
    
    // Update localStorage
    localStorage.setItem(`interview-${vacancyId}-${candidateId}`, JSON.stringify({
      questions: questions,
      scheduled: true,
      date: interviewDate
    }));
    
    // Show confirmation message
    alert('Interview has been scheduled successfully!');
  };
  
  if (loading) {
    return (
      <div>
        <NavBar userType="company" />
        <div className="max-w-7xl mx-auto px-4 py-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <NavBar userType="company" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Interview Generation</h1>
            <p className="text-gray-600">
              {vacancy ? `For: ${vacancy.title}` : 'Prepare interview questions'}
            </p>
          </div>
          <Link
            to="/company/interviews"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
          >
            Back to Interviews
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
            <h2 className="text-lg font-medium mb-4">Candidate Information</h2>
            
            {candidate ? (
              <div>
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
                    {candidate.firstName.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-medium">{candidate.firstName} {candidate.lastName}</h3>
                    <p className="text-gray-500">{candidate.email}</p>
                  </div>
                </div>
                
                {candidate.skills && candidate.skills.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full"
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
                    className="text-indigo-600 hover:text-indigo-900 font-medium text-sm"
                  >
                    View Full Profile
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Candidate information not available</p>
            )}
          </div>
          
          {/* Vacancy Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Vacancy Information</h2>
            
            {vacancy ? (
              <div>
                <h3 className="text-xl font-medium mb-2">{vacancy.title}</h3>
                
                {vacancy.requiredSkills && vacancy.requiredSkills.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {vacancy.requiredSkills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Job Description</h4>
                  <p className="text-sm text-gray-600">
                    {vacancy.description.length > 200 
                      ? `${vacancy.description.substring(0, 200)}...` 
                      : vacancy.description}
                  </p>
                </div>
                
                <div className="mt-4">
                  <Link
                    to={`/company/vacancies/${vacancyId}/edit`}
                    className="text-indigo-600 hover:text-indigo-900 font-medium text-sm"
                  >
                    View Full Details
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Vacancy information not available</p>
            )}
          </div>
        </div>
        
        {/* Interview Generation */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium">Interview Questions</h2>
            <p className="text-sm text-gray-500 mt-1">
              Generate personalized interview questions based on the candidate's profile and job requirements.
            </p>
          </div>
          
          <div className="p-6">
            {questions.length > 0 ? (
              <div>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="text-md font-medium mb-3">Generated Questions</h3>
                  
                  <div className="space-y-3">
                    {questions.slice(0, 3).map((question, index) => (
                      <div key={index} className="bg-white p-3 rounded border border-gray-200">
                        <div className="flex items-center mb-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            question.category === 'Technical' ? 'bg-blue-100 text-blue-800' :
                            question.category === 'Behavioral' ? 'bg-green-100 text-green-800' :
                            question.category === 'Situational' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {question.category || 'Question'}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{question.question}</p>
                      </div>
                    ))}
                    
                    {questions.length > 3 && (
                      <p className="text-sm text-gray-500 text-center">
                        + {questions.length - 3} more questions available
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={() => setShowQuestionsModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <svg className="mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      View & Edit All Questions
                    </button>
                    
                    <button
                      onClick={generateInterview}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      disabled={generatingQuestions}
                    >
                      {generatingQuestions ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>
                          <svg className="mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Regenerate Questions
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No interview questions yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Generate personalized questions for this candidate based on their skills and the job requirements.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={generateInterview}
                    disabled={generatingQuestions}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {generatingQuestions ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating Questions...
                      </>
                    ) : (
                      <>
                        <svg className="mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>
                        </svg>
                        Generate Interview Questions
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
              <h2 className="text-lg font-medium">Schedule Interview</h2>
              <p className="text-sm text-gray-500 mt-1">
                Set up a time for the interview and notify the candidate.
              </p>
            </div>
            
            <div className="p-6">
              {interviewScheduled ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Interview Scheduled</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>
                          Interview with {candidate?.firstName} {candidate?.lastName} has been scheduled for {new Date(interviewDate).toLocaleString()}.
                        </p>
                      </div>
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => setInterviewScheduled(false)}
                          className="text-sm font-medium text-green-600 hover:text-green-500"
                        >
                          Reschedule
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <label htmlFor="interviewDate" className="block text-sm font-medium text-gray-700">
                      Interview Date and Time
                    </label>
                    <input
                      type="datetime-local"
                      id="interviewDate"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={scheduleInterview}
                    disabled={!interviewDate}
                    className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${!interviewDate ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <svg className="mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Schedule Interview
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Questions Modal */}
      {showQuestionsModal && (
        <InterviewQuestionsModal
          candidate={{ candidateName: `${candidate?.firstName} ${candidate?.lastName}` }}
          vacancy={vacancy}
          questions={questions}
          isGenerating={false}
          onClose={() => setShowQuestionsModal(false)}
          onSave={saveInterviewQuestions}
        />
      )}
    </div>
  );
}

export default InterviewGeneration;