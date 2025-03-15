// src/components/company/InterviewConfig.js
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import NavBar from '../layout/NavBar';

function InterviewConfig() {
  const { id } = useParams();

  return (
    <div>
      <NavBar userType="company" />
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">AI Interview Configuration</h1>
          <Link
            to="/company/vacancies"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
          >
            Back to Vacancies
          </Link>
        </div>
        
        {/* Under development notification */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6" role="alert">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Feature Under Development</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  The AI Interview feature is currently under development. This feature will allow you to:
                </p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Configure AI-generated interview questions based on job requirements</li>
                  <li>Set up automated screening interviews for candidates</li>
                  <li>Access interview recordings and analysis reports</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sample feature preview */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Interview Settings</h2>
            <p className="text-gray-600">
              This section will allow you to configure the AI interview process for vacancy ID: {id}
            </p>
          </div>
          
          <div className="space-y-6 opacity-50 pointer-events-none">
            <div className="border border-gray-300 rounded-md p-4">
              <h3 className="text-md font-medium mb-2">Interview Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                  <div className="flex items-center">
                    <input
                      id="screening"
                      name="interviewType"
                      type="radio"
                      checked={true}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      disabled
                    />
                    <label htmlFor="screening" className="ml-3 block text-sm font-medium text-gray-700">
                      Screening Interview
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 ml-7">
                    Basic screening to assess candidate qualifications
                  </p>
                </div>
                <div className="border border-gray-200 rounded-md p-3">
                  <div className="flex items-center">
                    <input
                      id="technical"
                      name="interviewType"
                      type="radio"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      disabled
                    />
                    <label htmlFor="technical" className="ml-3 block text-sm font-medium text-gray-700">
                      Technical Interview
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 ml-7">
                    In-depth technical assessment with role-specific questions
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="questionCount" className="block text-sm font-medium text-gray-700">
                Number of Questions
              </label>
              <select
                id="questionCount"
                name="questionCount"
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                defaultValue={5}
                disabled
              >
                <option>3</option>
                <option>5</option>
                <option>7</option>
                <option>10</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="focusAreas" className="block text-sm font-medium text-gray-700">
                Focus Areas
              </label>
              <div className="mt-1">
                <div className="flex items-center mb-2">
                  <input
                    id="technical-skills"
                    name="focusAreas"
                    type="checkbox"
                    checked={true}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    disabled
                  />
                  <label htmlFor="technical-skills" className="ml-2 block text-sm text-gray-700">
                    Technical Skills
                  </label>
                </div>
                <div className="flex items-center mb-2">
                  <input
                    id="experience"
                    name="focusAreas"
                    type="checkbox"
                    checked={true}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    disabled
                  />
                  <label htmlFor="experience" className="ml-2 block text-sm text-gray-700">
                    Previous Experience
                  </label>
                </div>
                <div className="flex items-center mb-2">
                  <input
                    id="problem-solving"
                    name="focusAreas"
                    type="checkbox"
                    checked={true}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    disabled
                  />
                  <label htmlFor="problem-solving" className="ml-2 block text-sm text-gray-700">
                    Problem Solving
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="cultural-fit"
                    name="focusAreas"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    disabled
                  />
                  <label htmlFor="cultural-fit" className="ml-2 block text-sm text-gray-700">
                    Cultural Fit
                  </label>
                </div>
              </div>
            </div>
            
            <div className="pt-5">
              <button
                type="button"
                disabled={true}
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Configure AI Interview
              </button>
            </div>
          </div>
          
          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="flex justify-center">
              <div className="text-center">
                <img 
                  src="/api/placeholder/400/230" 
                  alt="Coming Soon" 
                  className="mx-auto mb-4 rounded-lg"
                />
                <h3 className="text-lg font-medium text-gray-900">Coming Soon</h3>
                <p className="mt-2 text-sm text-gray-500">
                  The AI Interview feature is currently under development and will be available soon.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <Link
            to="/company/vacancies"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Return to Vacancies
          </Link>
        </div>
      </div>
    </div>
  );
}

export default InterviewConfig;