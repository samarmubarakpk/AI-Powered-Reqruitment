// Enhanced API services with better error handling and fallbacks
// This version adds more robust error handling and logging for critical API calls
// Replace or update the existing api.js file with these enhancements

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
  getVacancy: (id) => api.get(`/companies/vacancies/${id}`),
  createVacancy: (vacancyData) => api.post('/companies/vacancies', vacancyData),
  getCandidateMatches: (vacancyId) => api.get(`/companies/vacancies/${vacancyId}/matches`),
  
  updateVacancy: (id, vacancyData) => api.put(`/companies/vacancies/${id}`, vacancyData),
  deleteVacancy: (id) => api.delete(`/companies/vacancies/${id}`),
  getCandidateMatches: (vacancyId) => api.get(`/companies/vacancies/${vacancyId}/matches`),
  getCandidateProfile: (candidateId) => api.get(`/companies/candidates/${candidateId}`),
  getCandidateMatch: (vacancyId, candidateId) => api.get(`/companies/vacancies/${vacancyId}/matches/${candidateId}`),

  getRecommendations: () => api.get('/companies/recommendations'),
  searchCandidates: (searchParams) => api.post('/companies/candidates/search', searchParams),
  getVacancyMatches: (vacancyId, filters) => api.post(`/companies/vacancies/${vacancyId}/match`, filters),

  // Enhanced getApplications with better error handling and debugging
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
  
  updateApplicationStatus: (id, status) => api.put(`/companies/applications/${id}`, { status }),
  configureInterview: (vacancyId, questions) => api.post(`/companies/vacancies/${vacancyId}/interview-config`, { questions })
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

export default api;