// src/components/company/TranscriptDisplay.js
import React, { useState } from 'react';

const TranscriptDisplay = ({ transcript, questions, loading = false }) => {
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
  
  // Determine if transcript should be truncated
  const shouldTruncate = transcript.length > 300 && !expanded;
  
  // Create display text
  const displayText = shouldTruncate 
    ? transcript.substring(0, 300) + '...' 
    : transcript;
  
  return (
    <div className="mt-4">
      <h4 className="text-md font-medium text-gray-800 mb-2">Questions & Answers</h4>
      <div className="bg-white p-4 rounded-lg shadow-sm">
        {/* Display all questions */}
        <div className="mb-4 pb-3 border-b border-gray-200">
          <h5 className="font-medium text-gray-800 mb-2">Questions:</h5>
          {Array.isArray(questions) && questions.length > 0 ? (
            <div className="space-y-3">
              {questions.map((question, index) => (
                <div key={index} className="pl-2 border-l-2 border-indigo-300">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Q{index + 1}:</span> {question.question || "Unknown question"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-700">Unknown questions</p>
          )}
        </div>
        
        <div>
          <h5 className="font-medium text-gray-800 mb-1">Answer Transcript:</h5>
          <div className="text-sm text-gray-600 whitespace-pre-line max-h-96 overflow-y-auto">
            {displayText}
          </div>
          
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