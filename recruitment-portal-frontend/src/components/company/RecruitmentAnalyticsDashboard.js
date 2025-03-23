import React, { useState, useEffect } from 'react';
import { LineChart, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line } from 'recharts';
import { companyService } from '../../services/api';

const RecruitmentAnalyticsDashboard = ({ vacancyId }) => {
  const [analytics, setAnalytics] = useState({
    vacancyData: null,
    applicationStats: null,
    skillCoverage: null,
    matchScoreDistribution: null,
    applicationTrend: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        // Get vacancy details
        let vacancyData = null;
        if (vacancyId) {
          const vacancyResponse = await companyService.getVacancy(vacancyId);
          vacancyData = vacancyResponse.data.vacancy;
        } else {
          // If no specific vacancy selected, get all vacancies
          const vacanciesResponse = await companyService.getVacancies();
          const activeVacancies = vacanciesResponse.data.vacancies.filter(v => v.status === 'open');
          vacancyData = {
            count: activeVacancies.length,
            list: activeVacancies
          };
        }

        // Get applications for the vacancy or all vacancies
        let applications = [];
        let applicationStats = {
          total: 0,
          byStatus: {}
        };

        if (vacancyId) {
          // Get applications for specific vacancy
          const applicationsResponse = await companyService.getApplications(vacancyId);
          applications = applicationsResponse.data.applications || [];
        } else {
          // Get applications for all vacancies
          for (const vacancy of vacancyData.list) {
            try {
              const appResponse = await companyService.getApplications(vacancy.id);
              const vacancyApps = appResponse.data.applications || [];
              applications = [...applications, ...vacancyApps];
            } catch (error) {
              console.error(`Error fetching applications for vacancy ${vacancy.id}:`, error);
            }
          }
        }

        // Process application statistics
        applicationStats.total = applications.length;
        
        // Count applications by status
        applicationStats.byStatus = applications.reduce((acc, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        }, {});

        // Generate status labels and counts for chart
        const statusOrder = ['applied', 'reviewed', 'interviewed', 'accepted', 'rejected'];
        const applicationStatusData = statusOrder.map(status => ({
          status: status.charAt(0).toUpperCase() + status.slice(1),
          count: applicationStats.byStatus[status] || 0
        }));

        // Calculate match score distribution
        const matchScores = applications
          .filter(app => app.suitabilityScore)
          .map(app => {
            // Handle different data structures for suitability score
            const score = typeof app.suitabilityScore === 'number' 
              ? app.suitabilityScore 
              : app.suitabilityScore?.overall || 0;
            
            return Math.round(score);
          });

        // Group scores into ranges
        const scoreRanges = {
          '0-20': 0,
          '21-40': 0, 
          '41-60': 0,
          '61-80': 0,
          '81-100': 0
        };

        matchScores.forEach(score => {
          if (score <= 20) scoreRanges['0-20']++;
          else if (score <= 40) scoreRanges['21-40']++;
          else if (score <= 60) scoreRanges['41-60']++;
          else if (score <= 80) scoreRanges['61-80']++;
          else scoreRanges['81-100']++;
        });

        const matchScoreDistribution = Object.entries(scoreRanges).map(([range, count]) => ({
          range,
          count
        }));

        // Calculate skill coverage
        let skillCoverage = [];
        if (vacancyId && vacancyData.requiredSkills) {
          // Get all the candidates who applied for this vacancy
          const candidateSkills = applications.reduce((acc, app) => {
            const candidateSkillsList = app.candidate?.skills || [];
            candidateSkillsList.forEach(skill => {
              if (!acc[skill]) acc[skill] = 0;
              acc[skill]++;
            });
            return acc;
          }, {});

          // Calculate how many candidates have each required skill
          skillCoverage = vacancyData.requiredSkills.map(skill => {
            const matchCount = applications.reduce((count, app) => {
              const hasSkill = (app.candidate?.skills || []).some(s => 
                s.toLowerCase().includes(skill.toLowerCase()) || 
                skill.toLowerCase().includes(s.toLowerCase())
              );
              return hasSkill ? count + 1 : count;
            }, 0);

            const coveragePercent = applications.length > 0 
              ? Math.round((matchCount / applications.length) * 100) 
              : 0;

            return {
              skill,
              count: matchCount,
              coverage: coveragePercent
            };
          });

          // Sort by coverage (ascending)
          skillCoverage.sort((a, b) => a.coverage - b.coverage);
        }

        // Generate application trend data (last 30 days)
        const applicationTrend = generateApplicationTrend(applications, 30);

        setAnalytics({
          vacancyData,
          applicationStats,
          applicationStatusData,
          skillCoverage,
          matchScoreDistribution,
          applicationTrend,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setAnalytics(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load analytics data. Please try again later.'
        }));
      }
    };

    fetchAnalyticsData();
  }, [vacancyId]);

  // Helper function to generate application trend data
  const generateApplicationTrend = (applications, days) => {
    const today = new Date();
    const dateMap = {};
    
    // Initialize dates for the last X days
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap[dateStr] = 0;
    }
    
    // Count applications by date
    applications.forEach(app => {
      if (app.appliedAt) {
        const appDate = new Date(app.appliedAt).toISOString().split('T')[0];
        if (dateMap[appDate] !== undefined) {
          dateMap[appDate]++;
        }
      }
    });
    
    // Convert to array for chart
    const result = Object.entries(dateMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Only return the last 14 days for better visualization
    return result.slice(-14);
  };

  if (analytics.loading) {
    return (
      <div className="w-full p-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  if (analytics.error) {
    return (
      <div className="w-full p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center text-red-600 p-4">
          <p>{analytics.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-lg">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">
          {vacancyId 
            ? `Analytics for: ${analytics.vacancyData?.title || 'Unknown Vacancy'}`
            : 'Overall Recruitment Analytics'
          }
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {vacancyId
            ? `Total Applications: ${analytics.applicationStats?.total || 0}`
            : `Active Vacancies: ${analytics.vacancyData?.count || 0}, Total Applications: ${analytics.applicationStats?.total || 0}`
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {/* Application Status Chart */}
        <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Application Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.applicationStatusData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Applications" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Match Score Distribution */}
        <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Match Score Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.matchScoreDistribution}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="count"
                  name="Candidates"
                  fill="#82ca9d"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Application Trend */}
        <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Application Trend (Last 14 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={analytics.applicationTrend}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                <YAxis />
                <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Applications"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill Coverage - Only show for specific vacancy */}
        {vacancyId && analytics.skillCoverage && analytics.skillCoverage.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Required Skills Coverage</h3>
            <div className="h-64 overflow-y-auto">
              <div className="space-y-4">
                {analytics.skillCoverage.map((skillData) => (
                  <div key={skillData.skill}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{skillData.skill}</span>
                      <span className="text-sm font-medium text-gray-700">
                        {skillData.count} candidates ({skillData.coverage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getSkillCoverageColor(skillData.coverage)}`}
                        style={{ width: `${skillData.coverage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Key Insights Section */}
      <div className="p-6 bg-indigo-50 border-t border-indigo-100">
        <h3 className="text-lg font-medium text-indigo-900 mb-3">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="text-md font-medium text-gray-800">Application Pipeline</h4>
            <p className="text-sm text-gray-600 mt-1">
              {generatePipelineInsight(analytics.applicationStatusData)}
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="text-md font-medium text-gray-800">Candidate Quality</h4>
            <p className="text-sm text-gray-600 mt-1">
              {generateCandidateQualityInsight(analytics.matchScoreDistribution)}
            </p>
          </div>
          
          {vacancyId && analytics.skillCoverage && (
            <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2">
              <h4 className="text-md font-medium text-gray-800">Skill Gaps</h4>
              <p className="text-sm text-gray-600 mt-1">
                {generateSkillGapInsight(analytics.skillCoverage)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to generate pipeline insight
const generatePipelineInsight = (statusData) => {
  if (!statusData || statusData.length === 0) {
    return "No application data available.";
  }

  const appliedCount = statusData.find(s => s.status === 'Applied')?.count || 0;
  const interviewedCount = statusData.find(s => s.status === 'Interviewed')?.count || 0;
  const acceptedCount = statusData.find(s => s.status === 'Accepted')?.count || 0;
  const rejectedCount = statusData.find(s => s.status === 'Rejected')?.count || 0;
  const totalCount = statusData.reduce((sum, item) => sum + item.count, 0);

  const interviewRate = totalCount > 0 ? Math.round((interviewedCount / totalCount) * 100) : 0;
  const acceptanceRate = interviewedCount > 0 ? Math.round((acceptedCount / interviewedCount) * 100) : 0;

  if (totalCount === 0) {
    return "No applications have been received yet.";
  }

  return `${interviewRate}% of applicants reach the interview stage. ${acceptanceRate}% of interviewed candidates are accepted. ${totalCount} total applications in pipeline.`;
};

// Helper function to generate candidate quality insight
const generateCandidateQualityInsight = (scoreDistribution) => {
  if (!scoreDistribution || scoreDistribution.length === 0) {
    return "No candidate match data available.";
  }

  const highMatchCount = scoreDistribution.find(s => s.range === '81-100')?.count || 0;
  const goodMatchCount = scoreDistribution.find(s => s.range === '61-80')?.count || 0;
  const totalCount = scoreDistribution.reduce((sum, item) => sum + item.count, 0);

  const highMatchPercentage = totalCount > 0 ? Math.round((highMatchCount / totalCount) * 100) : 0;
  const goodMatchPercentage = totalCount > 0 ? Math.round((goodMatchCount / totalCount) * 100) : 0;
  const qualityMatchPercentage = totalCount > 0 ? Math.round(((highMatchCount + goodMatchCount) / totalCount) * 100) : 0;

  if (totalCount === 0) {
    return "No candidate match data available.";
  }

  if (qualityMatchPercentage >= 75) {
    return `Excellent candidate pool with ${qualityMatchPercentage}% of candidates having 60%+ match scores. ${highMatchPercentage}% are high-quality matches (80%+).`;
  } else if (qualityMatchPercentage >= 50) {
    return `Good candidate pool with ${qualityMatchPercentage}% of candidates having 60%+ match scores. Consider adjusting requirements to attract more qualified candidates.`;
  } else {
    return `Limited candidate pool quality with only ${qualityMatchPercentage}% of candidates having 60%+ match scores. Consider broadening search criteria or improving job description.`;
  }
};

// Helper function to generate skill gap insight
const generateSkillGapInsight = (skillCoverage) => {
  if (!skillCoverage || skillCoverage.length === 0) {
    return "No skill coverage data available.";
  }

  const lowCoverageSkills = skillCoverage
    .filter(s => s.coverage < 30)
    .map(s => s.skill);

  const highCoverageSkills = skillCoverage
    .filter(s => s.coverage > 70)
    .map(s => s.skill);

  if (lowCoverageSkills.length === 0) {
    return `Strong skill coverage across all required skills. ${highCoverageSkills.length} skills have excellent coverage (70%+).`;
  } else if (lowCoverageSkills.length <= 2) {
    return `Good overall skill coverage with gaps in: ${lowCoverageSkills.join(', ')}. Consider targeting candidates with these skills specifically.`;
  } else {
    return `Significant skill gaps identified in: ${lowCoverageSkills.join(', ')}. Consider broadening your candidate search or adjusting requirements for hard-to-find skills.`;
  }
};

// Helper function to get color for skill coverage
const getSkillCoverageColor = (percentage) => {
  if (percentage >= 70) return 'bg-green-500';
  if (percentage >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
};

export default RecruitmentAnalyticsDashboard;