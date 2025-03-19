// src/components/company/VacancyAnalyticsOverview.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { companyService } from '../../services/api';
import SkillMatchingVisualization from './SkillMatchingVisualization';

function VacancyAnalyticsOverview({ vacancyId }) {
  const [vacancy, setVacancy] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchVacancyData = async () => {
      try {
        setLoading(true);
        
        // Get vacancy details
        const vacancyResponse = await companyService.getVacancy(vacancyId);
        setVacancy(vacancyResponse.data.vacancy);
        
        // Get candidate matches
        const matchesResponse = await companyService.getVacancyMatches(vacancyId);
        setMatchData(matchesResponse.data);
        
        // Get applications
        try {
          const applicationsResponse = await companyService.getApplications(vacancyId);
          setApplications(applicationsResponse.data.applications || []);
        } catch (err) {
          console.error('Error fetching applications:', err);
          setApplications([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching vacancy data:', err);
        setError('Failed to load vacancy analytics data');
        setLoading(false);
      }
    };
    
    fetchVacancyData();
  }, [vacancyId]);
  
  // Calculate application/match statistics
  const calculateStatistics = () => {
    if (!matchData || !matchData.matches || !applications) {
      return {
        totalMatches: 0,
        highMatches: 0,
        mediumMatches: 0,
        lowMatches: 0,
        applicationRate: 0,
        averageMatchScore: 0
      };
    }
    
    const totalMatches = matchData.matches.length;
    const highMatches = matchData.matches.filter(match => match.matchScore >= 80).length;
    const mediumMatches = matchData.matches.filter(match => match.matchScore >= 60 && match.matchScore < 80).length;
    const lowMatches = matchData.matches.filter(match => match.matchScore < 60).length;
    
    // Application rate: percentage of matches who actually applied
    const applicationIds = new Set(applications.map(app => app.candidateId));
    const appliedMatches = matchData.matches.filter(match => 
      applicationIds.has(match.candidateId)
    ).length;
    
    const applicationRate = totalMatches > 0 ? Math.round((appliedMatches / totalMatches) * 100) : 0;
    
    // Average match score
    const averageMatchScore = totalMatches > 0 
      ? Math.round(matchData.matches.reduce((acc, match) => acc + match.matchScore, 0) / totalMatches) 
      : 0;
    
    return {
      totalMatches,
      highMatches,
      mediumMatches,
      lowMatches,
      applicationRate,
      averageMatchScore
    };
  };
  
  const stats = calculateStatistics();
  
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }
  
  if (!vacancy) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Vacancy data not available</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Vacancy Overview */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-medium text-gray-900">{vacancy.title}</h2>
            <div className="flex space-x-2">
              <Link
                to={`/company/vacancies/${vacancyId}/matches`}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                View Matches
              </Link>
              <Link
                to={`/company/vacancies/${vacancyId}/applications`}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                View Applications
              </Link>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Total Matches</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMatches}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-sm text-green-500">High Matches (80%+)</p>
              <p className="text-2xl font-bold text-green-700">{stats.highMatches}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <p className="text-sm text-yellow-600">Medium Matches</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.mediumMatches}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <p className="text-sm text-red-500">Low Matches</p>
              <p className="text-2xl font-bold text-red-700">{stats.lowMatches}</p>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-indigo-700">Average Match Score</p>
                  <p className="text-xl font-bold text-indigo-900">{stats.averageMatchScore}%</p>
                </div>
                <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full overflow-hidden">
                    <div 
                      className={`h-12 rounded-full ${
                        stats.averageMatchScore >= 80 ? 'bg-green-500' :
                        stats.averageMatchScore >= 60 ? 'bg-blue-500' :
                        'bg-yellow-500'
                      }`}
                      style={{ width: `${stats.averageMatchScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-purple-700">Application Rate</p>
                  <p className="text-xl font-bold text-purple-900">{stats.applicationRate}%</p>
                </div>
                <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center p-2">
                  <svg viewBox="0 0 36 36" className="h-12 w-12">
                    <path
                      d="M18 2.0845
                         a 15.9155 15.9155 0 0 1 0 31.831
                         a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth="3"
                      strokeDasharray="100, 100"
                    />
                    <path
                      d="M18 2.0845
                         a 15.9155 15.9155 0 0 1 0 31.831
                         a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#7c3aed"
                      strokeWidth="3"
                      strokeDasharray={`${stats.applicationRate}, 100`}
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {/* Vacancy Details */}
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-md font-medium text-gray-900 mb-2">Job Requirements</h3>
            
            {vacancy.requiredSkills && vacancy.requiredSkills.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700">Required Skills:</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {vacancy.requiredSkills.map((skill, index) => (
                    <span 
                      key={index} 
                      className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Experience Required:</p>
                <p className="text-sm text-gray-600">{vacancy.experienceRequired || 0} years</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Posting Date:</p>
                <p className="text-sm text-gray-600">
                  {vacancy.postingDate ? new Date(vacancy.postingDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              
              {vacancy.closingDate && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Closing Date:</p>
                  <p className="text-sm text-gray-600">
                    {new Date(vacancy.closingDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              <div>
                <p className="text-sm font-medium text-gray-700">Applications:</p>
                <p className="text-sm text-gray-600">{applications.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Skill Matching Visualization */}
      {matchData && matchData.matches && (
        <SkillMatchingVisualization 
          vacancy={vacancy} 
          candidates={matchData.matches} 
        />
      )}
      
      {/* Application Status Breakdown */}
      {applications.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Application Status</h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {['applied', 'reviewed', 'interviewed', 'accepted', 'rejected'].map(status => {
                const count = applications.filter(app => app.status === status).length;
                const percentage = Math.round((count / applications.length) * 100);
                return (
                  <div key={status} className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-sm capitalize text-gray-700">{status}</p>
                    <p className="text-xl font-bold text-gray-900">{count}</p>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${
                          status === 'applied' ? 'bg-blue-500' :
                          status === 'reviewed' ? 'bg-yellow-500' :
                          status === 'interviewed' ? 'bg-purple-500' :
                          status === 'accepted' ? 'bg-green-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VacancyAnalyticsOverview;