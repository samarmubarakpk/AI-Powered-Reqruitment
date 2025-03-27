// src/components/company/InterviewQuestionsModal.js
import React, { useState } from 'react';

/**
 * Modal component to display and edit interview questions for a candidate
 */
function InterviewQuestionsModal({ candidate, vacancy, questions, isGenerating, onClose, onSave }) {
  const [editedQuestions, setEditedQuestions] = useState(questions || []);
  const [saving, setSaving] = useState(false);

  // Handle changing a question
  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...editedQuestions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    setEditedQuestions(updatedQuestions);
  };

  // Handle saving the questions
  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(editedQuestions);
      setSaving(false);
      onClose();
    } catch (error) {
      console.error('Error saving questions:', error);
      setSaving(false);
    }
  };

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
        
        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Interview Questions for {candidate?.candidateName || 'Candidate'}
                  </h3>
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mt-4">
                  {isGenerating ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                      <p className="mt-4 text-gray-600">Generating personalized interview questions...</p>
                    </div>
                  ) : editedQuestions && editedQuestions.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500 italic">
                        These questions have been generated based on the candidate's profile and the job requirements.
                        You can edit them before saving.
                      </p>

                      {editedQuestions.map((question, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <div className="mb-2">
                            <div className="flex justify-between">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                question.category === 'Technical' ? 'bg-blue-100 text-blue-800' :
                                question.category === 'Behavioral' ? 'bg-green-100 text-green-800' :
                                question.category === 'Situational' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {question.category || 'Question'}
                              </span>
                              <span className="text-xs text-gray-500">Question {index + 1}</span>
                            </div>
                          </div>
                          
                          <div className="mb-2">
                            <label htmlFor={`question-${index}`} className="block text-sm font-medium text-gray-700">
                              Question
                            </label>
                            <textarea
                              id={`question-${index}`}
                              rows={2}
                              className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              value={question.question}
                              onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                            />
                          </div>
                          
                          <div className="mb-2">
                            <label htmlFor={`explanation-${index}`} className="block text-sm font-medium text-gray-700">
                              Explanation
                            </label>
                            <textarea
                              id={`explanation-${index}`}
                              rows={2}
                              className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              value={question.explanation}
                              onChange={(e) => handleQuestionChange(index, 'explanation', e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No questions generated yet. Please try again.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || isGenerating || !editedQuestions || editedQuestions.length === 0}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm ${
                (saving || isGenerating || !editedQuestions || editedQuestions.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {saving ? 'Saving...' : 'Save Questions'}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InterviewQuestionsModal;