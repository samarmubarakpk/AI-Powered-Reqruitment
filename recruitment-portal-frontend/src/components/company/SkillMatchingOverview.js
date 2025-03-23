import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { companyService } from '../../services/api';

const SkillMatchingOverview = ({ vacancyId }) => {
  const [data, setData] = useState({
    loading: true,
    error: null,
    overview: null,
    skillDistribution: null
  });

  useEffect(() => {
    if (!vacancyId) {
      setData({
        loading: false,
        error: null,
        overview: null,
        skillDistribution: null
      });
      return;
    }

    const fetchData = async () => {
      try {
        // Get applications for the vacancy
        const applicationsResponse = await companyService.getApplications(vacancyId);
        const applications = applicationsResponse.data.applications || [];

        // Get vacancy details
        const vacancyResponse = await companyService.getVacancy(vacancyId);
        const vacancy = vacancyResponse.data.vacancy;

        if (!vacancy.requiredSkills || vacancy.requiredSkills.length === 0) {
          setData({
            loading: false,
            error: "This vacancy has no required skills defined.",
            overview: null,
            skillDistribution: null
          });
          return;
        }

        // Calculate skill matching stats
        const requiredSkills = vacancy.requiredSkills;
        const skillStats = {};
        
        // Initialize stats for each skill
        requiredSkills.forEach(skill => {
          skillStats[skill] = {
            total: applications.length,
            matches: 0,
            partial: 0,
            missing: 0
          };
        });

        // Analyze each application
        applications.forEach(application => {
          const candidateSkills = application.candidate?.skills || [];
          
          // Check each required skill
          requiredSkills.forEach(skill => {
            const exactMatch = candidateSkills.some(s => 
              s.toLowerCase() === skill.toLowerCase()
            );
            
            const partialMatch = !exactMatch && candidateSkills.some(s => 
              s.toLowerCase().includes(skill.toLowerCase()) || 
              skill.toLowerCase().includes(s.toLowerCase())
            );
            
            if (exactMatch) {
              skillStats[skill].matches++;
            } else if (partialMatch) {
              skillStats[skill].partial++;
            } else {
              skillStats[skill].missing++;
            }
          });
        });

        // Calculate overall skill coverage
        const totalSkillInstances = Object.values(skillStats).reduce(
          (sum, stat) => sum + stat.total, 
          0
        );
        
        const totalMatches = Object.values(skillStats).reduce(
          (sum, stat) => sum + stat.matches, 
          0
        );
        
        const totalPartial = Object.values(skillStats).reduce(
          (sum, stat) => sum + stat.partial, 
          0
        );

        // Prepare data for pie chart
        const matchData = [
          { name: 'Exact Match', value: totalMatches, color: '#4ade80' },
          { name: 'Partial Match', value: totalPartial, color: '#fbbf24' },
          { name: 'Missing', value: totalSkillInstances - totalMatches - totalPartial, color: '#f87171' }
        ];

        // Prepare detailed skill distribution data
        const skillDistribution = Object.entries(skillStats).map(([skill, stats]) => ({
          skill,
          exactMatch: stats.matches,
          partialMatch: stats.partial,
          missing: stats.missing,
          coverage: Math.round(((stats.matches + stats.partial) / stats.total) * 100) || 0
        }));

        // Sort by coverage (ascending)
        skillDistribution.sort((a, b) => a.coverage - b.coverage);

        setData({
          loading: false,
          error: null,
          overview: {
            totalApplications: applications.length,
            totalSkills: requiredSkills.length,
            matchData: matchData
          },
          skillDistribution
        });
      } catch (error) {
        console.error('Error fetching skill matching data:', error);
        setData({
          loading: false,
          error: 'Failed to load skill matching data. Please try again later.',
          overview: null,
          skillDistribution: null
        });
      }
    };

    fetchData();
  }, [vacancyId]);

  if (!vacancyId) {
    return (
      <div className="p-6 text-center text-gray-500">
        Please select a vacancy to view skill matching statistics.
      </div>
    );
  }

  if (data.loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading skill matching data...</p>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="p-6 text-center text-red-500">
        {data.error}
      </div>
    );
  }

  if (!data.overview || data.overview.totalApplications === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No application data available for skill matching analysis.
      </div>
    );
  }

  const COLORS = ['#4ade80', '#fbbf24', '#f87171'];

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Skill Matching Overview</h2>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Required Skills</p>
          <p className="text-2xl font-bold">{data.overview.totalSkills}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Avg. Skill Coverage</p>
          <p className="text-2xl font-bold">
            {data.skillDistribution && data.skillDistribution.length > 0
              ? `${Math.round(data.skillDistribution.reduce((sum, item) => sum + item.coverage, 0) / data.skillDistribution.length)}%`
              : '0%'
            }
          </p>
        </div>
      </div>
      
      {/* Skill Match Distribution Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-md font-medium text-gray-800 mb-2">Overall Skill Match Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.overview.matchData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {data.overview.matchData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} instances`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Skill Coverage Details */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-md font-medium text-gray-800 mb-2">Skill Coverage by Requirement</h3>
          <div className="h-64 overflow-y-auto">
            <div className="space-y-4">
              {data.skillDistribution.map((skillData) => (
                <div key={skillData.skill}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{skillData.skill}</span>
                    <span className="text-sm font-medium text-gray-700">
                      {skillData.coverage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getSkillCoverageColor(skillData.coverage)}`}
                      style={{ width: `${skillData.coverage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>Exact: {skillData.exactMatch}</span>
                    <span>Partial: {skillData.partialMatch}</span>
                    <span>Missing: {skillData.missing}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Recommendations Section */}
      <div className="mt-6 bg-indigo-50 p-4 rounded-lg">
        <h3 className="text-md font-medium text-indigo-900 mb-2">Recommendations</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
          {generateRecommendations(data.skillDistribution)}
        </ul>
      </div>
    </div>
  );
};

// Helper function to get color for skill coverage
const getSkillCoverageColor = (percentage) => {
  if (percentage >= 70) return 'bg-green-500';
  if (percentage >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
};

// Helper function to generate recommendations
const generateRecommendations = (skillDistribution) => {
  if (!skillDistribution || skillDistribution.length === 0) {
    return [<li key="no-data">No data available for recommendations.</li>];
  }

  const recommendations = [];
  
  // Identify poorly covered skills (less than 30%)
  const poorlyCoveredSkills = skillDistribution
    .filter(skill => skill.coverage < 30)
    .map(skill => skill.skill);
  
  if (poorlyCoveredSkills.length > 0) {
    recommendations.push(
      <li key="poorly-covered">
        <span className="font-medium">Skill Gap Alert:</span> Consider broadening your search for candidates with {poorlyCoveredSkills.join(', ')}.
      </li>
    );
  }
  
  // Check if there are well-covered skills (more than 70%)
  const wellCoveredSkills = skillDistribution
    .filter(skill => skill.coverage > 70)
    .map(skill => skill.skill);
  
  if (wellCoveredSkills.length > 0 && wellCoveredSkills.length < skillDistribution.length) {
    recommendations.push(
      <li key="well-covered">
        <span className="font-medium">Strengths:</span> Your candidate pool shows strong coverage for {wellCoveredSkills.join(', ')}.
      </li>
    );
  }
  
  // Overall recommendation based on average coverage
  const avgCoverage = Math.round(
    skillDistribution.reduce((sum, item) => sum + item.coverage, 0) / skillDistribution.length
  );
  
  if (avgCoverage < 40) {
    recommendations.push(
      <li key="low-coverage">
        <span className="font-medium">Action Needed:</span> Overall skill coverage is low ({avgCoverage}%). Consider adjusting job requirements or expanding your recruitment channels.
      </li>
    );
  } else if (avgCoverage < 60) {
    recommendations.push(
      <li key="medium-coverage">
        <span className="font-medium">Suggestion:</span> Moderate skill coverage ({avgCoverage}%). Focus recruitment efforts on candidates with the skills identified above as gaps.
      </li>
    );
  } else {
    recommendations.push(
      <li key="high-coverage">
        <span className="font-medium">Good News:</span> Strong overall skill coverage ({avgCoverage}%). Your candidate pool aligns well with your requirements.
      </li>
    );
  }
  
  return recommendations;
};

export default SkillMatchingOverview;