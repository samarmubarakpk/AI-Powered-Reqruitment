// src/components/company/SasCVButton.js
import React, { useState } from 'react';
import api from '../../services/api';

function SasCVButton({ candidateId, buttonStyle = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to get secure URL and open it
  const handleViewCV = async () => {
    if (!candidateId) {
      setError('No candidate ID provided');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Request a secure URL from the backend
      const response = await api.get(`/companies/candidates/${candidateId}/cv-url`);
      
      // Get the secure URL
      const { url } = response.data;
      
      if (!url) {
        throw new Error('No CV URL returned');
      }
      
      // Open the URL in a new tab
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error viewing CV:', err);
      setError(err.response?.data?.message || 'Failed to load CV. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (buttonStyle) {
    return (
      <div>
        <button 
          onClick={handleViewCV}
          disabled={loading}
          className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-50 cursor-wait' : ''}`}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading CV...
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View CV
            </>
          )}
        </button>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
  
  return (
    <div>
      <button 
        onClick={handleViewCV}
        disabled={loading}
        className={`text-indigo-600 hover:text-indigo-900 flex items-center ${loading ? 'opacity-50 cursor-wait' : ''}`}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading CV...
          </>
        ) : (
          <>
            <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View CV
          </>
        )}
      </button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default SasCVButton;