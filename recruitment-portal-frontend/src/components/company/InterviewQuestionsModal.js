// src/components/company/InterviewQuestionsModal.js
import React, { useState } from 'react';

function InterviewQuestionsModal({ candidate, vacancy, questions, isGenerating, onClose, onSave }) {
  const [customizedQuestions, setCustomizedQuestions] = useState(questions || []);
  
  // Handle editing questions
  const handleQuestionChange = (index, newText) => {
    const updatedQuestions = [...customizedQuestions];
    updatedQuestions[index].question = newText;
    setCustomizedQuestions(updatedQuestions);
  };
  
  // Handle saving interview questions
  const handleSave = async () => {
    try {
      await onSave(customizedQuestions);
      onClose();
    } catch (err) {
      console.error('Error saving interview questions:', err);
    }
  };
  
  if (isGenerating) {
    return (
      <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        {/* Modal content */}
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75"></div>
          <div className="inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full p-6">
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-4 text-lg font-medium text-gray-900">Generating personalized interview questions...</p>
              <p className="mt-2 text-sm text-gray-500">This may take a moment as we analyze the candidate's profile and job requirements.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Modal content */}
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        <div className="inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Interview Questions for {candidate?.candidateName || 'Candidate'}
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            {customizedQuestions && customizedQuestions.length > 0 ? (
              <div className="space-y-6">
                {customizedQuestions.map((item, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-2 flex items-center">
                      <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                    </div>
                    <textarea
                      value={item.question}
                      onChange={(e) => handleQuestionChange(index, e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      rows="3"
                    />
                    {item.explanation && (
                      <p className="mt-2 text-sm text-gray-500">{item.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">No questions generated yet.</p>
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 bg-gray-50 flex justify-end">
            <button
              onClick={onClose}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Save and Schedule Interview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InterviewQuestionsModal;