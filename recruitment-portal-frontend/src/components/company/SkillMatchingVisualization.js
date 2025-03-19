// src/components/company/SkillMatchingVisualization.js
import React from 'react';

function SkillMatchingVisualization({ vacancy, candidates }) {
  if (!vacancy || !vacancy.requiredSkills || !candidates || candidates.length === 0) {
    return <div className="text-center text-gray-500">No data available for visualization</div>;
  }
  
  // Calculate skill coverage statistics
  const skillStats = vacancy.requiredSkills.map(skill => {
    // Count candidates with this skill
    const candidatesWithSkill = candidates.filter(candidate => 
      candidate.matchedSkills && candidate.matchedSkills.some(s => 
        s.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(s.toLowerCase())
      )
    );
    
    const percentage = Math.round((candidatesWithSkill.length / candidates.length) * 100);
    
    return {
      skill,
      count: candidatesWithSkill.length,
      percentage,
      candidates: candidatesWithSkill.map(c => c.candidateId)
    };
  });
  
  // Sort by coverage (ascending)
  const sortedSkills = [...skillStats].sort((a, b) => a.percentage - b.percentage);
  
  // Color function based on coverage
  const getColorClass = (percentage) => {
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Required Skills Coverage</h3>
        <p className="text-sm text-gray-500">
          Analysis of candidate skill coverage for {vacancy.title}
        </p>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {sortedSkills.map((skillStat) => (
            <div key={skillStat.skill}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{skillStat.skill}</span>
                <span className="text-sm font-medium text-gray-700">
                  {skillStat.count}/{candidates.length} candidates ({skillStat.percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getColorClass(skillStat.percentage)}`}
                  style={{ width: `${skillStat.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Skill Coverage Summary */}
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Analysis</h4>
          
          {/* Most covered skills */}
          {sortedSkills.length > 0 && sortedSkills[sortedSkills.length - 1].percentage > 0 && (
            <div className="mb-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Most covered skill:</span> {sortedSkills[sortedSkills.length - 1].skill} 
                ({sortedSkills[sortedSkills.length - 1].percentage}% of candidates)
              </p>
            </div>
          )}
          
          {/* Least covered skills */}
          {sortedSkills.length > 0 && sortedSkills[0].percentage < 100 && (
            <div className="mb-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Least covered skill:</span> {sortedSkills[0].skill} 
                ({sortedSkills[0].percentage}% of candidates)
              </p>
            </div>
          )}
          
          {/* Skill gaps */}
          {sortedSkills.filter(s => s.percentage < 30).length > 0 && (
            <div className="mb-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Skill gaps:</span> {
                  sortedSkills.filter(s => s.percentage < 30).map(s => s.skill).join(', ')
                }
              </p>
            </div>
          )}
          
          {/* Recommendation */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              {sortedSkills.filter(s => s.percentage < 30).length > 0
                ? <span>Consider broadening your candidate search or adjusting requirements for hard-to-find skills.</span>
                : <span>Your candidate pool has good coverage of the required skills.</span>
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SkillMatchingVisualization;