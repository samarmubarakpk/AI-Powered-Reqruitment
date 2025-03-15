// src/components/auth/Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // Get the user type from URL query parameter
  const queryParams = new URLSearchParams(location.search);
  const typeFromUrl = queryParams.get('type');
  
  const [userType, setUserType] = useState(typeFromUrl || 'candidate');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update userType when URL query parameter changes
  useEffect(() => {
    if (typeFromUrl) {
      setUserType(typeFromUrl);
    }
  }, [typeFromUrl]);

  const handleUserTypeChange = (type) => {
    setUserType(type);
    // Update URL without page refresh
    const newUrl = `${window.location.pathname}?type=${type}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      
      const result = await login({
        ...formData,
        userType // Pass the selected user type to the login function
      });
      
      // Redirect based on user type
      switch (result.user.userType) {
        case 'candidate':
          navigate('/candidate/dashboard');
          break;
        case 'company':
          navigate('/company/dashboard');
          break;
        case 'admin':
          navigate('/admin/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-indigo-600">
            Recruitment Portal
          </h2>
        </Link>
        <h2 className="mt-2 text-center text-2xl font-bold text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* User Type Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => handleUserTypeChange('candidate')}
              className={`flex-1 py-3 px-1 text-center border-b-2 text-sm font-medium ${
                userType === 'candidate'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Candidate
            </button>
            <button
              onClick={() => handleUserTypeChange('company')}
              className={`flex-1 py-3 px-1 text-center border-b-2 text-sm font-medium ${
                userType === 'company'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Company
            </button>
            <button
              onClick={() => handleUserTypeChange('admin')}
              className={`flex-1 py-3 px-1 text-center border-b-2 text-sm font-medium ${
                userType === 'admin'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Admin
            </button>
          </div>

          {/* User Type Specific Message */}
          <div className="mb-6">
            {userType === 'candidate' && (
              <div className="bg-indigo-50 p-3 rounded-md">
                <p className="text-sm text-indigo-700">
                  Sign in to your candidate account to view and apply for jobs.
                </p>
              </div>
            )}
            {userType === 'company' && (
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-700">
                  Company accounts are created by administrators. Contact support if you need access.
                </p>
              </div>
            )}
            {userType === 'admin' && (
              <div className="bg-purple-50 p-3 rounded-md">
                <p className="text-sm text-purple-700">
                  Administrator access is restricted. Please enter your admin credentials.
                </p>
              </div>
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
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  userType === 'candidate' 
                    ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500' 
                    : userType === 'company'
                      ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                      : 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
                }`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : `Sign in as ${userType.charAt(0).toUpperCase() + userType.slice(1)}`}
              </button>
            </div>
          </form>

          {userType === 'candidate' && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">New candidate?</span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  to="/register"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Create a candidate account
                </Link>
              </div>
            </div>
          )}

          {userType === 'company' && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Need a company account?</span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  to="/contact"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Request company access
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;