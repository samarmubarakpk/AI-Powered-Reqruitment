import React, { useState, useEffect } from 'react';
import { companyService } from '../../services/api';
import RecruitmentAnalyticsDashboard from './RecruitmentAnalyticsDashboard';
import SkillMatchingOverview from './SkillMatchingOverview';
import PipelinePerformance from './PipelinePerformance';
import RecruitmentFunnel from './RecruitmentFunnel';

const CompleteAnalyticsDashboard = ({ vacancyId }) => {
  const [dashboardData, setDashboardData] = useState({
    loading: true,
    error: null,
    vacancy: null,
    applications: []
  });
  
  // Use local state for tabs since we're not using @headlessui/react
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!vacancyId) {
        setDashboardData({
          loading: false,
          error: null,
          vacancy: null,
          applications: []
        });
        return;
      }

      try {
        setDashboardData(prev => ({ ...prev, loading: true, error: null }));

        // Fetch vacancy details
        const vacancyResponse = await companyService.getVacancy(vacancyId);
        const vacancy = vacancyResponse.data.vacancy;

        // Fetch applications for the vacancy
        // Wrap this in a try/catch since it might fail if API integration is incomplete
        let applications = [];
        try {
          const applicationsResponse = await companyService.getApplications(vacancyId);
          applications = applicationsResponse.data.applications || [];
        } catch (appError) {
          console.warn(`Failed to load applications for vacancy ${vacancyId}:`, appError);
          // Continue with empty applications array
        }

        setDashboardData({
          loading: false,
          error: null,
          vacancy,
          applications
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        
        // Set a more helpful error message
        let errorMessage = 'Failed to load analytics data. Please try again later.';
        if (error.response && error.response.status === 404) {
          errorMessage = 'Vacancy not found. It may have been deleted.';
        } else if (error.message && error.message.includes('Network Error')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
        
        setDashboardData({
          loading: false,
          error: errorMessage,
          vacancy: null,
          applications: []
        });
      }
    };

    fetchDashboardData();
  }, [vacancyId]);

  if (!vacancyId) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center text-gray-500 p-10">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Overall Analytics</h3>
          <p className="mt-1 text-sm text-gray-500">
            Currently showing analytics for all vacancies. Select a specific vacancy for detailed analysis.
          </p>
        </div>
      </div>
    );
  }

  if (dashboardData.loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  if (dashboardData.error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <svg className="h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p className="text-red-600 mb-2">{dashboardData.error}</p>
          <p className="text-sm text-gray-500">
            Try selecting a different vacancy or viewing the overall analytics.
          </p>
        </div>
      </div>
    );
  }

  // Generate placeholder data for demos and testing
  const generatePlaceholderData = () => {
    // If we have real application data, use it
    if (dashboardData.applications && dashboardData.applications.length > 0) {
      return dashboardData.applications;
    }
    
    // Otherwise, generate placeholder data
    const statuses = ['applied', 'reviewed', 'interviewed', 'accepted', 'rejected'];
    const placeholderApps = [];
    
    // Create 10-20 random applications
    const count = Math.floor(Math.random() * 10) + 10;
    
    for (let i = 0; i < count; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const appliedDate = new Date();
      appliedDate.setDate(appliedDate.getDate() - Math.floor(Math.random() * 30));
      
      placeholderApps.push({
        id: `placeholder-${i}`,
        candidateId: `candidate-${i}`,
        vacancyId: vacancyId,
        status: status,
        appliedAt: appliedDate.toISOString(),
        updatedAt: new Date().toISOString(),
        suitabilityScore: {
          overall: Math.floor(Math.random() * 100),
          skills: Math.floor(Math.random() * 100),
          experience: Math.floor(Math.random() * 100),
          education: Math.floor(Math.random() * 100)
        },
        candidate: {
          firstName: `Candidate`,
          lastName: `${i+1}`,
          email: `candidate${i+1}@example.com`,
          skills: dashboardData.vacancy?.requiredSkills || ["JavaScript", "React", "Node.js"]
        }
      });
    }
    
    return placeholderApps;
  };
  
  // Get applications data - either real or placeholder
  const applications = generatePlaceholderData();
  
  // Helper function to set the active tab style
  const getTabStyle = (tabName) => {
    return activeTab === tabName
      ? 'border-b-2 border-indigo-600 text-indigo-600'
      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300';
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">
          Analytics for: {dashboardData.vacancy?.title || 'Unknown Vacancy'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {applications.length} applications • Created on {dashboardData.vacancy?.postingDate ? new Date(dashboardData.vacancy.postingDate).toLocaleDateString() : 'unknown date'}
          {dashboardData.vacancy?.closingDate && ` • Closing on ${new Date(dashboardData.vacancy.closingDate).toLocaleDateString()}`}
        </p>
        {dashboardData.applications.length === 0 && applications.length > 0 && (
          <p className="text-xs text-yellow-600 mt-1">
            Note: Using sample data for demonstration purposes.
          </p>
        )}
      </div>

      {/* Custom tab implementation */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'pipeline', label: 'Pipeline' },
          { id: 'skills', label: 'Skills' },
          { id: 'funnel', label: 'Funnel' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-6 text-sm font-medium outline-none ${getTabStyle(tab.id)}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab content */}
      <div>
        {activeTab === 'overview' && (
          <RecruitmentAnalyticsDashboard vacancyId={vacancyId} />
        )}
        {activeTab === 'pipeline' && (
          <PipelinePerformance vacancyId={vacancyId} />
        )}
        {activeTab === 'skills' && (
          <SkillMatchingOverview vacancyId={vacancyId} />
        )}
        {activeTab === 'funnel' && (
          <RecruitmentFunnel 
            applications={applications} 
            vacancy={dashboardData.vacancy} 
          />
        )}
      </div>
    </div>
  );
};

export default CompleteAnalyticsDashboard;