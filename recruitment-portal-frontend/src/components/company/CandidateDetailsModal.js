// src/components/company/CandidateDetailsModal.js
import React from 'react';

function CandidateDetailsModal({ application, onClose }) {
  if (!application) return null;
  
  // Get candidate info from either source in the application object
  const candidateInfo = application.candidate || application.candidateInfo || {};
  
  // Extract skills array if available
  const skills = candidateInfo.skills || [];
  
  // Get suitability score if available
  const suitabilityScore = application.suitabilityScore || {};
  
  return (
    <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
        
        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Candidate Details
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
                  {/* Basic Information */}
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                        {candidateInfo.firstName ? candidateInfo.firstName.charAt(0) : 'C'}
                      </div>
                      <div className="ml-4">
                        <h4 className="text-md font-medium">
                          {candidateInfo.firstName} {candidateInfo.lastName}
                        </h4>
                        <p className="text-sm text-gray-500">{candidateInfo.email}</p>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-3">
                      <p className="text-sm text-gray-600">
                        Applied on: {new Date(application.appliedAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Status: <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(application.status)}`}>
                          {formatStatus(application.status)}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  {/* Skills Section */}
                  <div className="mb-6">
                    <h4 className="text-md font-medium mb-2">Skills</h4>
                    {skills && skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No skills listed</p>
                    )}
                  </div>
                  
                  {/* Suitability Score Section */}
                  {suitabilityScore && Object.keys(suitabilityScore).length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-md font-medium mb-2">Match Assessment</h4>
                      
                      {/* Overall Score */}
                      <div className="mb-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Overall Match</span>
                          <span className="text-sm font-medium">{Math.round(suitabilityScore.overall)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-blue-600"
                            style={{ width: `${suitabilityScore.overall}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Skills Score */}
                      <div className="mb-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Skills Match</span>
                          <span className="text-sm font-medium">{Math.round(suitabilityScore.skills)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-green-600"
                            style={{ width: `${suitabilityScore.skills}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Experience Score */}
                      <div className="mb-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Experience Match</span>
                          <span className="text-sm font-medium">{Math.round(suitabilityScore.experience)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-purple-600"
                            style={{ width: `${suitabilityScore.experience}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Education Score */}
                      <div className="mb-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Education Match</span>
                          <span className="text-sm font-medium">{Math.round(suitabilityScore.education)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-yellow-600"
                            style={{ width: `${suitabilityScore.education}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Matched/Missing Skills */}
                      <div className="mt-3">
                        {suitabilityScore.matchedSkills && suitabilityScore.matchedSkills.length > 0 && (
                          <div className="mb-2">
                            <p className="text-sm font-medium">Matched Skills:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
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
                            <p className="text-sm font-medium">Missing Skills:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {candidateInfo.cvUrl && (
              <a
                href={candidateInfo.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                View CV
              </a>
            )}
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getStatusClass(status) {
  switch (status) {
    case 'applied':
      return 'bg-blue-100 text-blue-800';
    case 'reviewed':
      return 'bg-yellow-100 text-yellow-800';
    case 'interviewed':
      return 'bg-purple-100 text-purple-800';
    case 'accepted':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function formatStatus(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default CandidateDetailsModal;