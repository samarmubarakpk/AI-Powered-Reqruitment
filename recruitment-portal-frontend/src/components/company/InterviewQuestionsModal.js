// src/components/company/InterviewQuestionsModal.js
import React, { useState } from 'react';

/**
 * Modal component to display and edit interview questions for a candidate
 */
function InterviewQuestionsModal({ candidate, vacancy, questions, isGenerating, onClose, onSave }) {
  // Define HomePage color scheme
  const colors = {
    primaryBlue: {
      light: '#2a6d8f',
      dark: '#1a4d6f',
      veryLight: '#e6f0f3'
    },
    primaryTeal: {
      light: '#5fb3a1',
      dark: '#3f9381',
      veryLight: '#eaf5f2'
    },
    primaryOrange: {
      light: '#f5923e',
      dark: '#e67e22',
      veryLight: '#fef2e9'
    }
  };

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
                  <h3 className="text-lg leading-6 font-medium" style={{ color: colors.primaryTeal.dark }} id="modal-title">
                    Preguntas de Entrevista para {candidate?.candidateName || 'Candidato'}
                  </h3>
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <span className="sr-only">Cerrar</span>
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mt-4">
                  {isGenerating ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2" style={{ borderColor: colors.primaryTeal.light }}></div>
                      <p className="mt-4 text-gray-600">Generando preguntas personalizadas para la entrevista...</p>
                    </div>
                  ) : editedQuestions && editedQuestions.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500 italic">
                        Estas preguntas han sido generadas en base al perfil del candidato y los requisitos del trabajo.
                        Puede editarlas antes de guardar.
                      </p>

                      {editedQuestions.map((question, index) => (
                        <div key={index} className="p-4 rounded-lg" style={{ backgroundColor: colors.primaryTeal.veryLight }}>
                          <div className="mb-2">
                            <div className="flex justify-between">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{
                                backgroundColor: question.category === 'Técnica' ? colors.primaryBlue.veryLight :
                                               question.category === 'Comportamiento' ? colors.primaryTeal.veryLight :
                                               question.category === 'Situacional' ? colors.primaryOrange.veryLight :
                                               '#e5e7eb',
                                color: question.category === 'Técnica' ? colors.primaryBlue.dark :
                                       question.category === 'Comportamiento' ? colors.primaryTeal.dark :
                                       question.category === 'Situacional' ? colors.primaryOrange.dark :
                                       '#374151'
                              }}>
                                {question.category || 'Pregunta'}
                              </span>
                              <span className="text-xs text-gray-500">Pregunta {index + 1}</span>
                            </div>
                          </div>
                          
                          <div className="mb-2">
                            <label htmlFor={`question-${index}`} className="block text-sm font-medium text-gray-700">
                              Pregunta
                            </label>
                            <textarea
                              id={`question-${index}`}
                              rows={2}
                              className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              value={question.question}
                              onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                              style={{ borderColor: colors.primaryTeal.light }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No se han generado preguntas todavía. Por favor, inténtelo de nuevo.</p>
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
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                (saving || isGenerating || !editedQuestions || editedQuestions.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{ backgroundColor: colors.primaryTeal.light }}
            >
              {saving ? 'Guardando...' : 'Guardar Preguntas'}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InterviewQuestionsModal;