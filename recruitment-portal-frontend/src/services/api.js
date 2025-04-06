

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance with a longer timeout
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000 // 15 seconds timeout
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    console.log(`API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Handle token expiration and improve error logging
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} from ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data || error.message);
    
    // Handle token expiration
    if (error.response && error.response.status === 401) {
      console.warn('Authentication expired. Redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Use setTimeout to avoid interrupting the current flow
      setTimeout(() => {
        window.location = '/login';
      }, 100);
    }
    
    return Promise.reject(error);
  }
);

// Create a function to handle API calls with better error handling
const safeApiCall = async (apiFunction, defaultValue = null) => {
  try {
    const response = await apiFunction();
    return response;
  } catch (error) {
    console.error('API call failed:', error);
    // Return a "safe" placeholder response to prevent UI breakage
    return { data: defaultValue };
  }
};

// Authentication services
export const authService = {
  register: (userData) => api.post('/auth/register/candidate', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

// Company services with enhanced error handling
export const companyService = {
  getProfile: () => api.get('/companies/profile'),
  updateProfile: (profileData) => api.put('/companies/profile', profileData),
  getVacancies: () => safeApiCall(() => api.get('/companies/vacancies'), { vacancies: [] }),
  createVacancy: (vacancyData) => api.post('/companies/vacancies', vacancyData),
  getCandidateMatches: (vacancyId) => api.get(`/companies/vacancies/${vacancyId}/matches`),
  
  updateVacancy: (id, vacancyData) => api.put(`/companies/vacancies/${id}`, vacancyData),
  getCandidateProfile: (candidateId) => api.get(`/companies/candidates/${candidateId}`),
  getCandidateMatch: (vacancyId, candidateId) => api.get(`/companies/vacancies/${vacancyId}/matches/${candidateId}`),

  // getRecommendations: () => api.get('/companies/recommendations'),
  searchCandidates: (searchParams) => api.post('/companies/candidates/search', searchParams),
  scheduleInterview: async (vacancyId, candidateId, scheduleData) => {
    console.log(`Scheduling interview for vacancy ${vacancyId} and candidate ${candidateId}`);
    console.log('Schedule data:', scheduleData);
    
    try {
      const response = await api.post(
        `/companies/vacancies/${vacancyId}/candidates/${candidateId}/schedule`, 
        scheduleData
      );
      console.log('Schedule interview API response:', response);
      return response;
    } catch (error) {
      console.error('Schedule interview API error:', error);
      throw error;
    }
  },
  getVacancy: async (id) => {
    console.log(`Fetching vacancy with ID: ${id}`);
    try {
      // First try the company-specific endpoint
      const response = await api.get(`/companies/vacancies/${id}`);
      console.log('Vacancy response from company endpoint:', response);
      return response;
    } catch (error) {
      console.error(`Error fetching vacancy ${id} from company endpoint:`, error);
      
      // If that fails, try the public vacancy endpoint
      try {
        console.log('Trying public vacancy endpoint');
        const publicResponse = await api.get(`/vacancies/${id}`);
        console.log('Vacancy response from public endpoint:', publicResponse);
        return publicResponse;
      } catch (publicError) {
        console.error(`Error fetching vacancy ${id} from public endpoint:`, publicError);
        
        // Try a third fallback - the debug endpoint
        try {
          console.log('Trying debug vacancy endpoint');
          const debugResponse = await api.get(`/debug/vacancy/${id}`);
          console.log('Vacancy response from debug endpoint:', debugResponse);
          
          // If debug works, transform to match expected format
          if (debugResponse.data && (debugResponse.data.vacancy || debugResponse.data.method)) {
            return {
              data: {
                vacancy: debugResponse.data.vacancy
              }
            };
          }
          
          throw new Error('Debug endpoint returned unexpected format');
        } catch (debugError) {
          console.error(`Debug endpoint also failed:`, debugError);
          // Throw the original error
          throw error;
        }
      }
    }
  },

  getRecommendations: (maxCandidates = 2) => {
    return api.get(`/companies/recommendations?maxCandidates=${maxCandidates}`);
  },
  deleteVacancy: async (id) => {
    try {
      if (!id) {
        throw new Error('Vacancy ID is required for deletion');
      }
      
      console.log(`Sending DELETE request for vacancy ID: ${id}`);
      const response = await api.delete(`/companies/vacancies/${id}`);
      
      console.log('Delete vacancy response status:', response.status);
      return response;
    } catch (error) {
      console.error(`Error in deleteVacancy for ID ${id}:`, error);
      
      // Enhance error object with more details
      if (error.response) {
        // Server responded with an error status
        console.error('Server error response:', error.response.data);
        error.message = error.response.data.message || 'Server error occurred during deletion';
      } else if (error.request) {
        // Request was made but no response was received
        console.error('No response received from server');
        error.message = 'No response received from server. Please check your network connection.';
      }
      
      throw error;
    }
  },

    generateInterviewQuestions: (vacancyId, candidateId, data) => {
    console.log(`Generating interview questions for vacancy ${vacancyId} and candidate ${candidateId}`);
    console.log('Data for question generation:', data);
    
    // Make sure we send the full job description in the request
    return api.post(`/companies/vacancies/${vacancyId}/candidates/${candidateId}/interview-questions`, {
      candidateName: data.candidateName,
      skills: data.skills || [],
      jobTitle: data.jobTitle,
      jobDescription: data.jobDescription, // This is crucial for better question generation
      requiredSkills: data.requiredSkills || []
    }, {
      // Increase timeout since this might take longer
      timeout: 30000
    });
  },
    
    saveInterviewQuestions: (vacancyId, candidateId, questions) => {
      return api.post(`/companies/vacancies/${vacancyId}/candidates/${candidateId}/save-interview`, { questions });
    },

  getCandidateCV: (candidateId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return '#'; // Return a placeholder URL that won't navigate anywhere
    }
    
    // Create a URL with the token as a query parameter
    return `${API_URL}/companies/candidates/${candidateId}/cv?token=${token}`;
  },

  getVacancyMatches: async (vacancyId, filters = {}) => {
    try {
      // First try the newer endpoint with filtering
      return await api.post(`/companies/vacancies/${vacancyId}/match`);
    } catch (error) {
      console.log("Falling back to basic matches endpoint");
      // Fall back to simpler endpoint if the advanced one fails
      return await api.get(`/companies/vacancies/${vacancyId}/matches`);
    }
  },
  // Enhanced getApplications with better error handling and debugging
  getApplications: async (vacancyId) => {
    try {
      console.log(`Fetching applications for vacancy ${vacancyId}`);
      // Add a timestamp parameter to avoid caching issues
      const response = await api.get(`/companies/vacancies/${vacancyId}/applications?t=${Date.now()}`);
      console.log('Applications API response:', response);
      return response;
    } catch (error) {
      console.error(`Error fetching applications for vacancy ${vacancyId}:`, error);
      // Return a structured response to prevent UI breakage
      return { 
        data: { 
          applications: [],
          message: error.response?.data?.message || error.message || 'Failed to load applications'
        } 
      };
    }
  },
  getInterviewRecordings: async () => {
    console.log('Fetching interview recordings');
    try {
      const response = await api.get('/companies/interview-recordings');
      console.log('Interview recordings API response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching interview recordings:', error);
      // Return a default response to prevent UI breakage
      return { 
        data: { 
          interviews: [],
          message: error.response?.data?.message || error.message || 'Failed to load interview recordings'
        }
      };
    }
  },
  
  getInterviewRecordingUrl: async (interviewId, questionIndex) => {
    console.log(`Getting secure URL for interview ${interviewId}, question ${questionIndex}`);
    try {
      const response = await api.get(`/companies/interview-recordings/${interviewId}/${questionIndex}/url`);
      console.log('Interview recording URL response:', response);
      return response;
    } catch (error) {
      console.error('Error getting interview recording URL:', error);
      throw error;
    }
  },
  
  getInterviewWithRecordings: async (interviewId) => {
    console.log(`Fetching interview ${interviewId} with recordings`);
    try {
      const response = await api.get(`/companies/interviews/${interviewId}/recordings`);
      console.log('Interview with recordings response:', response);
      return response;
    } catch (error) {
      console.error(`Error fetching interview ${interviewId} with recordings:`, error);
      throw error;
    }
  },
  
  // Updated updateApplicationStatus method in services/api.js
// Update this method in your companyService object in src/services/api.js
updateApplicationStatus: async (id, status) => {
  console.log(`Making API call to update application ${id} status to ${status}`);
  try {
    // Use the correct endpoint path
    const response = await api.put(`/applications/${id}`, { status });
    console.log('Update status response:', response);
    return response;
  } catch (error) {
    console.error('Error in updateApplicationStatus:', error);
    
    // Enhanced error logging
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Request URL:', error.config.url);
      console.error('Request data:', error.config.data);
    } else if (error.request) {
      console.error('Request was made but no response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    
    // Try an alternative endpoint as fallback
    try {
      console.log('Trying alternative endpoint path...');
      const alternativeResponse = await api.put(`/companies/applications/${id}`, { status });
      console.log('Alternative endpoint response:', alternativeResponse);
      return alternativeResponse;
    } catch (alternativeError) {
      console.error('Alternative endpoint also failed:', alternativeError);
      // Throw the original error
      throw error;
    }
  }
},
  configureInterview: (vacancyId, questions) => api.post(`/companies/vacancies/${vacancyId}/interview-config`, { questions })
};

export const enhancedCompanyService = {
  // Existing methods from companyService
  getProfile: () => api.get('/companies/profile'),
  updateProfile: (profileData) => api.put('/companies/profile', profileData),
  getVacancies: () => api.get('/companies/vacancies'),
  getVacancy: (id) => api.get(`/companies/vacancies/${id}`),
  createVacancy: (vacancyData) => api.post('/companies/vacancies', vacancyData),
  updateVacancy: (id, vacancyData) => api.put(`/companies/vacancies/${id}`, vacancyData),
  deleteVacancy: (id) => api.delete(`/companies/vacancies/${id}`),
  getApplications: (vacancyId) => api.get(`/companies/vacancies/${vacancyId}/applications`),
  updateApplicationStatus: (id, status) => api.put(`/companies/applications/${id}`, { status }),
  
  // Enhanced search methods
  
  // Unified search method that combines both general and vacancy-specific search
  enhancedCandidateSearch: async (searchParams) => {
    try {
      // If a vacancy ID is provided, use the AI-powered matching
      if (searchParams.vacancyId) {
        const response = await api.post(`/companies/vacancies/${searchParams.vacancyId}/match`, {
          minMatchScore: searchParams.minMatchScore || 0,
          includeAnalysis: true,
          fuzzyMatching: searchParams.fuzzyMatching !== false, // Default to true
          skillFilters: searchParams.skills || [],
          experienceMin: searchParams.experienceMin,
          experienceMax: searchParams.experienceMax,
          education: searchParams.education,
          location: searchParams.location
        });
        
        return {
          data: {
            candidates: response.data.matches,
            totalCount: response.data.totalMatches
          }
        };
      } else {
        // Otherwise use the general candidate search
        return api.post('/companies/candidates/enhanced-search', searchParams);
      }
    } catch (error) {
      console.error('Enhanced search error:', error);
      throw error;
    }
  },
  
  // Get AI-powered candidate matches for a specific vacancy
  getVacancyMatches: (vacancyId, options = {}) => {
    return api.post(`/companies/vacancies/${vacancyId}/match`, {
      minMatchScore: options.minMatchScore || 0,
      maxMatchScore: options.maxMatchScore || 100,
      includeAnalysis: options.includeAnalysis || true,
      fuzzyMatching: options.fuzzyMatching !== false, // Default to true
      skillFilters: options.skillFilters || [],
      maxResults: options.maxResults || 100
    });
  },
  
  // Get a specific candidate's match details for a vacancy
  getCandidateMatchDetails: (vacancyId, candidateId) => {
    return api.get(`/companies/vacancies/${vacancyId}/matches/${candidateId}`);
  },
  
  // Get recommended candidates based on multiple criteria
  getRecommendedCandidates: (criteria) => {
    return api.post('/companies/candidates/recommendations', criteria);
  },

    // Add to src/services/api.js in the companyService object
  getInterviewDetails: (vacancyId, candidateId) => api.get(`/companies/vacancies/${vacancyId}/candidates/${candidateId}/interview`),
    
  scheduleInterview: (vacancyId, candidateId, scheduleData) => 
    api.post(`/companies/vacancies/${vacancyId}/candidates/${candidateId}/schedule`, scheduleData),
    
  startInterview: (interviewId) => api.post(`/companies/interviews/${interviewId}/start`),
    
  completeInterview: (interviewId, notes) => 
    api.post(`/companies/interviews/${interviewId}/complete`, { notes }),
    
  getInterviewList: () => api.get('/companies/interviews'),
  
  // Get skill gap analysis for a set of candidates
  getSkillGapAnalysis: (vacancyId, candidateIds = []) => {
    return api.post(`/companies/vacancies/${vacancyId}/skill-gap-analysis`, {
      candidateIds
    });
  }
};



// Find this in your candidateService section:
export const candidateService = {
  getProfile: () => api.get('/candidates/profile'),
  updateProfile: (profileData) => api.put('/candidates/profile', profileData),
  uploadCV: (formData) => {
    return api.post('/candidates/cv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      // Add timeout increase for file uploads
      timeout: 30000 // 30 seconds
    });
  },
  //   // Inside candidateService object:
  // getInterviewDetails: (interviewId) => {
  //   console.log(`Fetching interview details for interview ID: ${interviewId}`);
  //   return api.get(`/candidates/interviews/${interviewId}`);
  // },

  uploadInterviewRecording: (formData, onProgress) => {
    console.log('Uploading interview recording');
    return api.post('/candidates/interview-recording', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000, // 60 seconds timeout for video upload
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (onProgress) {
          onProgress(percentCompleted);
        }
      }
    });
  },

  getScheduledInterviews: () => {
    console.log('Fetching scheduled interviews');
    return api.get('/candidates/scheduled-interviews');
  },


  getInterviewDetails: (interviewId) => {
    console.log(`Fetching interview details for interview ID: ${interviewId}`);
    return api.get(`/candidates/interviews/${interviewId}`);
  },

  // NEW METHOD: Add this function to fix the interview questions merging issue
  getAllInterviews: async (candidateId, vacancyId) => {
    console.log(`Fetching all interviews for candidate ${candidateId} and vacancy ${vacancyId}`);
    try {
      // First try with dedicated endpoint
      return await api.get(`/candidates/interviews?candidateId=${candidateId}&vacancyId=${vacancyId}`);
    } catch (error) {
      console.error("Error fetching interviews with dedicated endpoint:", error);
      
      // Try a fallback method if needed
      const interviews = [];
      
      // Our scheduled interview must already exist since we're viewing it
      const scheduledInterviewResponse = await api.get(`/candidates/scheduled-interviews`);
      const scheduledInterviews = scheduledInterviewResponse.data.interviews || [];
      
      // Filter to find interviews for this candidate and vacancy
      const matchingInterviews = scheduledInterviews.filter(
        interview => interview.candidateId === candidateId && interview.vacancyId === vacancyId
      );
      
      if (matchingInterviews.length > 0) {
        interviews.push(...matchingInterviews);
      }
      
      // Return in the expected format
      return {
        data: {
          interviews: interviews
        }
      };
    }
  },

  // ENHANCEMENT: Add direct capability to fetch questions for an interview
  getInterviewQuestions: async (interviewId, candidateId, vacancyId) => {
    console.log(`Fetching questions for interview: ${interviewId} (candidate: ${candidateId}, vacancy: ${vacancyId})`);
    
    try {
      // First try to get questions directly from the current interview
      const interviewResponse = await api.get(`/candidates/interviews/${interviewId}`);
      const interviewData = interviewResponse.data;
      
      if (interviewData.questions && Array.isArray(interviewData.questions) && interviewData.questions.length > 0) {
        console.log(`Found ${interviewData.questions.length} questions in the primary interview record`);
        return {
          data: {
            questions: interviewData.questions
          }
        };
      }
      
      // If no questions found, search for a complementary interview record
      if (candidateId && vacancyId) {
        console.log("No questions found in primary record, searching for complementary record...");
        const allInterviewsResponse = await api.get(`/candidates/interviews?candidateId=${candidateId}&vacancyId=${vacancyId}`);
        const allInterviews = allInterviewsResponse.data.interviews || [];
        
        // Find an interview with questions
        const interviewWithQuestions = allInterviews.find(
          interview => interview.questions && Array.isArray(interview.questions) && interview.questions.length > 0
        );
        
        if (interviewWithQuestions) {
          console.log(`Found complementary interview with ${interviewWithQuestions.questions.length} questions`);
          return {
            data: {
              questions: interviewWithQuestions.questions
            }
          };
        }
      }
      
      // If we get here, no questions were found
      console.log("No questions found in any interview records");
      return {
        data: {
          questions: []
        }
      };
    } catch (error) {
      console.error("Error fetching interview questions:", error);
      throw error;
    }
  },

  getApplications: () => safeApiCall(() => api.get('/candidates/applications'), { applications: [] }),
  applyForVacancy: (vacancyId) => api.post(`/candidates/apply/${vacancyId}`),
  deleteAccount: () => api.delete('/candidates/account'),
  getPublicVacancies: () => safeApiCall(() => api.get('/candidates/public-vacancies'), { vacancies: [] })
};

// Admin services
export const adminService = {
  getUsers: () => safeApiCall(() => api.get('/admin/users'), { users: [] }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  createAdmin: (userData) => api.post('/admin/users/admin', userData),
  createCompany: (companyData) => api.post('/admin/companies', companyData),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  resetPassword: (id, newPassword) => api.post(`/admin/users/${id}/reset-password`, { newPassword }),
  getCompanies: () => safeApiCall(() => api.get('/admin/companies'), { companies: [] })
};

// Enhance the interceptors with better logging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} from ${response.config.url}`);
    if (response.config.url.includes('/matches')) {
      console.log('Matches data received:', response.data);
    }
    return response;
  },
  (error) => {
    console.error(`API Error: ${error.response?.status} from ${error.config?.url}`);
    console.error('API Error details:', error.response?.data);
    
    if (error.config && error.config.url.includes('/matches')) {
      console.error('Error with matches endpoint:', error);
    }
    
    return Promise.reject(error);
  }
);

export default api;