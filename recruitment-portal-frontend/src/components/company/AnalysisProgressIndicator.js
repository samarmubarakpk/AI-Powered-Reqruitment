// src/components/company/AnalysisProgressIndicator.js
import React, { useState, useEffect } from 'react';

const AnalysisProgressIndicator = ({ isAnalyzing }) => {
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Preparing analysis...');
  
  // Simulate progress for better UX
  useEffect(() => {
    if (!isAnalyzing) {
      setProgress(0);
      return;
    }
    
    const messages = [
      'Preparing analysis...',
      'Uploading video to Azure...',
      'Processing video...',
      'Analyzing facial expressions...',
      'Analyzing speech patterns...',
      'Detecting emotions...',
      'Analyzing answer quality...', // New step
      'Comparing to question...', // New step
      'Generating insights...',
      'Almost done...'
    ];
  
    
    let currentProgress = 0;
    
    // Function to update progress
    const updateProgress = () => {
      // Calculate next progress with diminishing returns
      // (faster at first, then slower as it approaches 95%)
      const increment = Math.max(0.5, 5 * (1 - currentProgress / 100));
      currentProgress = Math.min(95, currentProgress + increment);
      
      // Update message based on progress
      const messageIndex = Math.floor((currentProgress / 95) * (messages.length - 1));
      setStatusMessage(messages[messageIndex]);
      
      setProgress(currentProgress);
    };
    
    // Start with initial progress
    updateProgress();
    
    // Update progress every 2 seconds
    const timer = setInterval(updateProgress, 2000);
    
    return () => clearInterval(timer);
  }, [isAnalyzing]);
  
  if (!isAnalyzing) return null;
  
  return (
    <div className="mt-4 mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-indigo-700">{statusMessage}</span>
        <span className="text-sm font-medium text-indigo-700">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }} 
        ></div>
      </div>
      <p className="mt-2 text-xs text-gray-500 text-center">
        Video analysis can take up to 3 minutes depending on the length of the recording
      </p>
    </div>
  );
};

export default AnalysisProgressIndicator;