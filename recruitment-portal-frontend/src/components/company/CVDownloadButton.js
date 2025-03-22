// src/components/company/CVDownloadButton.js
import React, { useState } from 'react';
import { companyService } from '../../services/api';

function CVDownloadButton({ candidateId, buttonStyle = false, label = "View CV" }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  // Function to handle downloading with proper error handling
  const handleDownload = (e) => {
    if (!candidateId) {
      e.preventDefault();
      setError('No candidate ID provided');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      e.preventDefault();
      setError('Authentication required');
      return;
    }

    // If everything is fine, we'll let the link work normally
    setDownloading(true);
    
    // Reset state after a short delay
    setTimeout(() => {
      setDownloading(false);
    }, 1000);
  };

  // Generate the URL
  const cvUrl = companyService.getCandidateCV(candidateId);

  if (buttonStyle) {
    return (
      <div>
        <a 
          href={cvUrl}
          target="_blank" 
          rel="noopener noreferrer"
          onClick={handleDownload}
          className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${downloading ? 'opacity-50 cursor-wait' : ''}`}
          disabled={downloading}
        >
          {downloading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Opening...
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {label}
            </>
          )}
        </a>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
  
  return (
    <div>
      <a 
        href={cvUrl}
        target="_blank" 
        rel="noopener noreferrer"
        onClick={handleDownload}
        className={`text-indigo-600 hover:text-indigo-900 flex items-center ${downloading ? 'opacity-50 cursor-wait' : ''}`}
        disabled={downloading}
      >
        {downloading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Opening...
          </>
        ) : (
          <>
            <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {label}
          </>
        )}
      </a>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default CVDownloadButton;