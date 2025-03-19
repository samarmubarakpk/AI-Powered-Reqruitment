// src/components/company/CVAnalysisComponent.js
import React from 'react';

function CVAnalysisComponent({ matchData }) {
  if (!matchData) {
    return <div className="p-4 text-center text-gray-500">No analysis data available</div>;
  }
  
  // Helper function to get color class based on score
  const getScoreColorClass = (score) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-blue-600';
    if (score >= 40) return 'bg-yellow-600';
    return 'bg-red-600';
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="space-y-4">
        {/* Overall Score */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Overall Match</span>
            <span className="text-sm font-medium text-gray-900">{Math.round(matchData.matchScore || matchData.totalScore)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${getScoreColorClass(matchData.matchScore || matchData.totalScore)}`}
              style={{ width: `${matchData.matchScore || matchData.totalScore}%` }}
            ></div>
          </div>
        </div>
        
        {/* Skills Score */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Skills Match</span>
            <span className="text-sm font-medium text-gray-900">{Math.round(matchData.skillsScore)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="h-2.5 rounded-full bg-blue-600"
              style={{ width: `${matchData.skillsScore}%` }}
            ></div>
          </div>
        </div>
        
        {/* Experience Score */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Experience Match</span>
            <span className="text-sm font-medium text-gray-900">{Math.round(matchData.experienceScore)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="h-2.5 rounded-full bg-purple-600"
              style={{ width: `${matchData.experienceScore}%` }}
            ></div>
          </div>
        </div>
        
        {/* Education Score */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Education Match</span>
            <span className="text-sm font-medium text-gray-900">{Math.round(matchData.educationScore)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="h-2.5 rounded-full bg-yellow-600"
              style={{ width: `${matchData.educationScore}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Skills Breakdown */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Skills Analysis:</h3>
        
        {matchData.matchedSkills && matchData.matchedSkills.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Matched Skills:</p>
            <div className="flex flex-wrap gap-1">
              {matchData.matchedSkills.map((skill, index) => {
                // Check if this is a semantically matched skill
                const isSemantic = skill.includes('(semantic)');
                const isPartialMatch = skill.includes('(partial)');
                const baseSkill = skill.replace(' (semantic)', '').replace(' (partial)', '');
                
                return (
                  <span 
                    key={index} 
                    className={`px-2 py-0.5 rounded-full text-xs font-medium 
                      ${isSemantic ? 'bg-purple-100 text-purple-800' : 
                        isPartialMatch ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'}`
                    }
                  >
                    {baseSkill}
                    {isSemantic && 
                      <span className="ml-1 text-xs text-purple-600">(semantic)</span>
                    }
                    {isPartialMatch && 
                      <span className="ml-1 text-xs text-yellow-600">(partial)</span>
                    }
                  </span>
                );
              })}
            </div>
          </div>
        )}
        
        {matchData.missingSkills && matchData.missingSkills.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Missing Skills:</p>
            <div className="flex flex-wrap gap-1">
              {matchData.missingSkills.map((skill, index) => (
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
      
      {/* Experience Analysis */}
      {matchData.analysis && matchData.analysis.experience && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Experience Analysis:</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Total Experience:</p>
              <p className="text-sm font-medium">{matchData.analysis.experience.totalYears} years</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Required:</p>
              <p className="text-sm font-medium">{matchData.analysis.experience.requiredYears} years</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Relevance Score:</p>
              <p className="text-sm font-medium">{Math.round(matchData.analysis.experience.relevance)}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Recency Score:</p>
              <p className="text-sm font-medium">{Math.round(matchData.analysis.experience.recency)}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CVAnalysisComponent;