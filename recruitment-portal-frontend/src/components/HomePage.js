// src/components/HomePage.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-indigo-600">FlowRecruit</span>
              </div>
              
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a href="#features" className="text-gray-500 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Features
                </a>
                <a href="#portals" className="text-gray-500 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Portals
                </a>
                <a href="#contact" className="text-gray-500 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Contact
                </a>
              </div>
            </div>
            
            <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-3">
              <Link to="/login" className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-indigo-600 bg-white hover:bg-gray-50 border-indigo-600">
                Sign In
              </Link>
              <Link to="/register" className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                Sign Up
              </Link>
            </div>
            
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a
              href="#features"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#portals"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Portals
            </a>
            <a
              href="#contact"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </a>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-5 space-x-3">
              <Link
                to="/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-indigo-600 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="block px-3 py-2 rounded-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section (excluded as requested) */}

      {/* Portal Cards Section */}
      <div id="portals" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Choose Your Portal
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Three tailored interfaces designed for candidates, companies, and administrators
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
            {/* Candidate Portal Card */}
            <div className="group rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl bg-white border border-gray-200">
              <div className="p-6 bg-blue-600 text-white">
                <h3 className="text-xl font-bold">Candidate Portal</h3>
                <p className="mt-2">Find your dream job and showcase your talents</p>
              </div>
              <div className="p-6">
                <ul className="mt-4 space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Create and manage your profile
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Upload your CV
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Apply for job vacancies
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Participate in AI interviews
                  </li>
                </ul>
                <div className="mt-8 space-y-3">
                  <Link 
                    to="/register?type=candidate" 
                    className="w-full block text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Create Account
                  </Link>
                  <Link 
                    to="/login?type=candidate" 
                    className="w-full block text-center px-4 py-2 border border-blue-600 rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>

            {/* Company Portal Card */}
            <div className="group rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl bg-white border border-gray-200">
              <div className="p-6 bg-green-600 text-white">
                <h3 className="text-xl font-bold">Company Portal</h3>
                <p className="mt-2">Find the best talent for your organization</p>
              </div>
              <div className="p-6">
                <ul className="mt-4 space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Manage company profile
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Post and manage job vacancies
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Configure AI interviews
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Review candidate applications
                  </li>
                </ul>
                <div className="mt-8 space-y-3">
                  <p className="text-xs text-gray-500 text-center">Companies need admin approval</p>
                  <Link 
                    to="/login?type=company" 
                    className="w-full block text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    Company Sign In
                  </Link>
                  <Link 
                    to="/contact" 
                    className="w-full block text-center px-4 py-2 border border-green-600 rounded-md shadow-sm text-sm font-medium text-green-600 bg-white hover:bg-green-50"
                  >
                    Request Access
                  </Link>
                </div>
              </div>
            </div>

            {/* Admin Portal Card */}
            <div className="group rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl bg-white border border-gray-200">
              <div className="p-6 bg-purple-600 text-white">
                <h3 className="text-xl font-bold">Admin Portal</h3>
                <p className="mt-2">Manage the entire recruitment platform</p>
              </div>
              <div className="p-6">
                <ul className="mt-4 space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-purple-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Create and manage company accounts
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-purple-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Manage user permissions
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-purple-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    System configuration
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-purple-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Monitor platform activity
                  </li>
                </ul>
                <div className="mt-8 space-y-3">
                  <p className="text-xs text-gray-500 text-center">Administrator access only</p>
                  <Link 
                    to="/login?type=admin" 
                    className="w-full block text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                  >
                    Admin Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Powered by Azure AI
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Innovative features that transform the recruitment process
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">CV Processing</h3>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-base text-gray-500">
                    Azure Form Recognizer extracts and analyzes key information from candidate CVs automatically.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Automated Interviews</h3>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-base text-gray-500">
                    Azure OpenAI generates dynamic interview questions based on candidate profiles and job requirements.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Interview Analysis</h3>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-base text-gray-500">
                    Azure Video and Text Analytics evaluate candidate responses, providing comprehensive insights.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Candidate Matching</h3>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-base text-gray-500">
                    Azure Machine Learning scores candidates based on vacancy requirements and generates compatibility reports.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Report Generation</h3>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-base text-gray-500">
                    Power BI creates visual reports and Azure OpenAI generates summaries with recommendations.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Secure Access</h3>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-base text-gray-500">
                    Role-based permissions for candidates, companies, and administrators ensure data security.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Ready to transform your recruitment?
          </h2>
          <p className="mt-4 text-xl text-indigo-100">
            Get started with FlowRecruit today
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50">
              Get Started
            </Link>
            <Link to="/contact" className="inline-flex items-center justify-center px-5 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-indigo-500">
              Contact Us
            </Link>
          </div>
        </div>
      </div>

      {/* Footer (excluded as requested) */}
    </div>
  );
}

export default HomePage;