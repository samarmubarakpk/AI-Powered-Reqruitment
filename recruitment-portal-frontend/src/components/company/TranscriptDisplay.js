// src/components/company/TranscriptDisplay.js
import React, { useState } from 'react';

const TranscriptDisplay = ({ transcript, question, loading = false }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (loading) {
    return (
      <div className="mt-4">
        <h4 className="text-md font-medium text-gray-800 mb-2">Transcript</h4>
        <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-center">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!transcript) {
    return (
      <div className="mt-4">
        <h4 className="text-md font-medium text-gray-800 mb-2">Transcript</h4>
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <p className="text-gray-500">No transcript available. Click "Analyze Recording" to generate a transcript.</p>
        </div>
      </div>
    );
  }
  
  // Display a limited amount of text when not expanded
  const displayText = expanded ? transcript : transcript.substring(0, 300) + (transcript.length > 300 ? '...' : '');
  
  return (
    <div className="mt-4">
      <h4 className="text-md font-medium text-gray-800 mb-2">Question & Answer</h4>
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="mb-4 pb-3 border-b border-gray-200">
          <h5 className="font-medium text-gray-800 mb-1">Question:</h5>
          <p className="text-sm text-gray-700">{question || "Unknown question"}</p>
        </div>
        
        <div>
          <h5 className="font-medium text-gray-800 mb-1">Answer Transcript:</h5>
          <p className="text-sm text-gray-600 whitespace-pre-line">{displayText}</p>
          
          {transcript.length > 300 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 focus:outline-none"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranscriptDisplay;