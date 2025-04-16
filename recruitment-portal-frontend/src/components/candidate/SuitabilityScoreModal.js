// src/components/candidate/SuitabilityScoreModal.js
import React from 'react';

// Define custom colors directly from HomePage
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

function SuitabilityScoreModal({ application, onClose }) {
  if (!application || !application.suitabilityScore) {
    return null;
  }
  
  const { suitabilityScore } = application;
  
  // Helper function to get color class based on score
  const getScoreColorClass = (score) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-blue-600';
    if (score >= 40) return 'bg-yellow-600';
    return 'bg-red-600';
  };
  
  return (
    <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full" style={{ backgroundColor: colors.primaryBlue.veryLight }}>
              <svg className="h-6 w-6" style={{ color: colors.primaryBlue.light }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                Tu Puntuación de Compatibilidad
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Así es como tu perfil coincide con los requisitos del trabajo:
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-5 sm:mt-6">
            <div className="space-y-4">
              {/* Overall Score */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Compatibilidad General</span>
                  <span className="text-sm font-medium text-gray-900">{Math.round(suitabilityScore.overall)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${getScoreColorClass(suitabilityScore.overall)}`}
                    style={{ width: `${suitabilityScore.overall}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Skills Score */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Compatibilidad de Habilidades</span>
                  <span className="text-sm font-medium text-gray-900">{Math.round(suitabilityScore.skills)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full"
                    style={{ width: `${suitabilityScore.skills}%`, backgroundColor: colors.primaryBlue.light }}
                  ></div>
                </div>
              </div>
              
              {/* Experience Score */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Compatibilidad de Experiencia</span>
                  <span className="text-sm font-medium text-gray-900">{Math.round(suitabilityScore.experience)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full"
                    style={{ width: `${suitabilityScore.experience}%`, backgroundColor: colors.primaryTeal.light }}
                  ></div>
                </div>
              </div>
              
              {/* Education Score */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Compatibilidad de Educación</span>
                  <span className="text-sm font-medium text-gray-900">{Math.round(suitabilityScore.education)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full"
                    style={{ width: `${suitabilityScore.education}%`, backgroundColor: colors.primaryOrange.light }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Skills Breakdown */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Desglose de Habilidades:</h4>
              
              {suitabilityScore.matchedSkills && suitabilityScore.matchedSkills.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Habilidades Coincidentes:</p>
                  <div className="flex flex-wrap gap-1">
                    {suitabilityScore.matchedSkills.map((skill, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {suitabilityScore.missingSkills && suitabilityScore.missingSkills.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Habilidades Faltantes:</p>
                  <div className="flex flex-wrap gap-1">
                    {suitabilityScore.missingSkills.map((skill, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-5 sm:mt-6">
              <button
                type="button"
                className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                style={{ backgroundColor: colors.primaryBlue.light }}
                onClick={onClose}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuitabilityScoreModal;