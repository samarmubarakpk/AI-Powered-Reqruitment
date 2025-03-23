import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { companyService } from '../../services/api';

const PipelinePerformance = ({ vacancyId }) => {
  const [pipelineData, setPipelineData] = useState({
    loading: true,
    error: null,
    applicationsByStage: [],
    conversionRates: [],
    timeToHire: null,
    qualityMetrics: null
  });

  useEffect(() => {
    const fetchPipelineData = async () => {
      try {
        // Get applications for the vacancy
        const applicationsResponse = await companyService.getApplications(vacancyId);
        const applications = applicationsResponse.data.applications || [];

        if (applications.length === 0) {
          setPipelineData({
            loading: false,
            error: "No applications found for this vacancy.",
            applicationsByStage: [],
            conversionRates: [],
            timeToHire: null,
            qualityMetrics: null
          });
          return;
        }

        // Define the stages in the recruitment pipeline
        const stages = ['applied', 'reviewed', 'interviewed', 'accepted', 'rejected'];
        
        // Count applications by stage
        const stageCounts = stages.reduce((acc, stage) => {
          acc[stage] = applications.filter(app => app.status === stage).length;
          return acc;
        }, {});

        // Prepare data for the funnel chart
        const stageData = stages.map(stage => ({
          stage: stage.charAt(0).toUpperCase() + stage.slice(1),
          count: stageCounts[stage] || 0
        }));

        // Calculate conversion rates between stages
        const conversionData = [];
        for (let i = 0; i < stages.length - 2; i++) { // Skip rejected stage
          const currentStage = stages[i];
          const nextStage = stages[i + 1];
          
          const currentCount = stageCounts[currentStage] || 0;
          const nextCount = stageCounts[nextStage] || 0;
          
          const conversionRate = currentCount > 0 ? (nextCount / currentCount) * 100 : 0;
          
          conversionData.push({
            name: `${currentStage.charAt(0).toUpperCase() + currentStage.slice(1)} → ${nextStage.charAt(0).toUpperCase() + nextStage.slice(1)}`,
            rate: Math.round(conversionRate)
          });
        }

        // Calculate time-to-hire metrics if timestamps are available
        let timeToHire = null;
        const applicationsWithDates = applications.filter(
          app => app.status === 'accepted' && app.appliedAt && app.updatedAt
        );
        
        if (applicationsWithDates.length > 0) {
          const totalDays = applicationsWithDates.reduce((sum, app) => {
            const appliedDate = new Date(app.appliedAt);
            const updatedDate = new Date(app.updatedAt);
            const daysDiff = Math.ceil((updatedDate - appliedDate) / (1000 * 60 * 60 * 24));
            return sum + daysDiff;
          }, 0);
          
          timeToHire = {
            averageDays: Math.round(totalDays / applicationsWithDates.length),
            min: Math.min(...applicationsWithDates.map(app => {
              const appliedDate = new Date(app.appliedAt);
              const updatedDate = new Date(app.updatedAt);
              return Math.ceil((updatedDate - appliedDate) / (1000 * 60 * 60 * 24));
            })),
            max: Math.max(...applicationsWithDates.map(app => {
              const appliedDate = new Date(app.appliedAt);
              const updatedDate = new Date(app.updatedAt);
              return Math.ceil((updatedDate - appliedDate) / (1000 * 60 * 60 * 24));
            }))
          };
        }

        // Calculate quality metrics based on match scores
        const qualityData = {
          highQualityCount: 0,
          mediumQualityCount: 0,
          lowQualityCount: 0,
          averageScore: 0
        };

        const applicationsWithScores = applications.filter(app => 
          app.suitabilityScore !== undefined && 
          (typeof app.suitabilityScore === 'number' || app.suitabilityScore?.overall !== undefined)
        );

        if (applicationsWithScores.length > 0) {
          let totalScore = 0;
          
          applicationsWithScores.forEach(app => {
            const score = typeof app.suitabilityScore === 'number' 
              ? app.suitabilityScore 
              : app.suitabilityScore.overall;
            
            totalScore += score;
            
            if (score >= 80) {
              qualityData.highQualityCount++;
            } else if (score >= 60) {
              qualityData.mediumQualityCount++;
            } else {
              qualityData.lowQualityCount++;
            }
          });
          
          qualityData.averageScore = Math.round(totalScore / applicationsWithScores.length);
        }

        setPipelineData({
          loading: false,
          error: null,
          applicationsByStage: stageData,
          conversionRates: conversionData,
          timeToHire,
          qualityMetrics: qualityData
        });
      } catch (error) {
        console.error('Error fetching pipeline data:', error);
        setPipelineData({
          loading: false,
          error: 'Failed to load pipeline performance data. Please try again later.',
          applicationsByStage: [],
          conversionRates: [],
          timeToHire: null,
          qualityMetrics: null
        });
      }
    };

    if (vacancyId) {
      fetchPipelineData();
    } else {
      setPipelineData({
        loading: false,
        error: "Please select a vacancy to view pipeline performance.",
        applicationsByStage: [],
        conversionRates: [],
        timeToHire: null,
        qualityMetrics: null
      });
    }
  }, [vacancyId]);

  if (pipelineData.loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading pipeline data...</p>
      </div>
    );
  }

  if (pipelineData.error) {
    return (
      <div className="p-6 text-center text-gray-500">
        {pipelineData.error}
      </div>
    );
  }

  const COLORS = ['#4ade80', '#60a5fa', '#f59e0b', '#f43f5e'];

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Recruitment Pipeline Performance</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Application Funnel */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-md font-medium text-gray-800 mb-2">Application Funnel</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pipelineData.applicationsByStage}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 50, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Candidates" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Conversion Rates */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-md font-medium text-gray-800 mb-2">Stage Conversion Rates</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pipelineData.conversionRates}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`${value}%`, 'Conversion Rate']} />
                <Bar dataKey="rate" name="Conversion Rate (%)" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Time to Hire Metrics */}
        {pipelineData.timeToHire && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-md font-medium text-gray-800 mb-2">Time to Hire</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-500">Average</p>
                <p className="text-xl font-bold text-blue-600">{pipelineData.timeToHire.averageDays} days</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-500">Fastest</p>
                <p className="text-xl font-bold text-green-600">{pipelineData.timeToHire.min} days</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-500">Slowest</p>
                <p className="text-xl font-bold text-yellow-600">{pipelineData.timeToHire.max} days</p>
              </div>
            </div>
            {pipelineData.timeToHire.averageDays > 14 ? (
              <p className="mt-3 text-sm text-red-500">Your average hiring time is higher than the industry benchmark. Consider streamlining your interview process.</p>
            ) : (
              <p className="mt-3 text-sm text-green-500">Your average hiring time is within industry benchmarks. Great job!</p>
            )}
          </div>
        )}
        
        {/* Candidate Quality Metrics */}
        {pipelineData.qualityMetrics && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-md font-medium text-gray-800 mb-2">Candidate Quality</h3>
            <div className="flex items-center">
              <div className="w-1/2">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'High Quality', value: pipelineData.qualityMetrics.highQualityCount },
                        { name: 'Medium Quality', value: pipelineData.qualityMetrics.mediumQualityCount },
                        { name: 'Low Quality', value: pipelineData.qualityMetrics.lowQualityCount }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1, 2].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 pl-4">
                <div className="mb-2">
                  <div className="flex items-center mb-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-xs">High Quality (80%+)</span>
                  </div>
                  <div className="flex items-center mb-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-xs">Medium Quality (60-79%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-xs">Low Quality (&lt; 60%)</span>
                  </div>
                </div>
                <div className="bg-indigo-50 p-2 rounded-lg mt-3">
                  <p className="text-sm font-medium text-indigo-800">Average Match Score:</p>
                  <p className="text-xl font-bold">{pipelineData.qualityMetrics.averageScore}%</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Performance Insights */}
      <div className="mt-6 bg-indigo-50 p-4 rounded-lg">
        <h3 className="text-md font-medium text-indigo-900 mb-2">Pipeline Insights</h3>
        <div className="text-sm text-gray-700">
          {generatePipelineInsights(pipelineData)}
        </div>
      </div>
    </div>
  );
};

// Helper function to generate pipeline insights
const generatePipelineInsights = (data) => {
  if (!data.applicationsByStage || data.applicationsByStage.length === 0) {
    return <p>No data available for pipeline analysis.</p>;
  }

  const insights = [];
  
  // Calculate total applicants
  const totalApplicants = data.applicationsByStage.find(d => d.stage === 'Applied')?.count || 0;
  const reviewed = data.applicationsByStage.find(d => d.stage === 'Reviewed')?.count || 0;
  const interviewed = data.applicationsByStage.find(d => d.stage === 'Interviewed')?.count || 0;
  const accepted = data.applicationsByStage.find(d => d.stage === 'Accepted')?.count || 0;
  const rejected = data.applicationsByStage.find(d => d.stage === 'Rejected')?.count || 0;
  
  // Calculate key metrics
  const screeningRate = totalApplicants > 0 ? Math.round((reviewed / totalApplicants) * 100) : 0;
  const interviewRate = reviewed > 0 ? Math.round((interviewed / reviewed) * 100) : 0;
  const offerRate = interviewed > 0 ? Math.round((accepted / interviewed) * 100) : 0;
  const overallConversionRate = totalApplicants > 0 ? Math.round((accepted / totalApplicants) * 100) : 0;
  
  // Add overall pipeline health insight
  insights.push(
    <p key="overall" className="mb-2">
      <span className="font-medium">Pipeline Health:</span> You have a {overallConversionRate}% overall conversion rate from application to hire
      {overallConversionRate > 5 ? ", which is above the industry average." : ", which is below the typical 5-8% industry benchmark."}
    </p>
  );
  
  // Add bottleneck identification
  let bottleneck = '';
  let bottleneckStage = '';
  
  if (screeningRate < 50 && (screeningRate < interviewRate && screeningRate < offerRate)) {
    bottleneck = 'initial screening';
    bottleneckStage = 'Applied → Reviewed';
  } else if (interviewRate < 50 && (interviewRate < screeningRate && interviewRate < offerRate)) {
    bottleneck = 'interview selection';
    bottleneckStage = 'Reviewed → Interviewed';
  } else if (offerRate < 50 && (offerRate < screeningRate && offerRate < interviewRate)) {
    bottleneck = 'offer stage';
    bottleneckStage = 'Interviewed → Accepted';
  }
  
  if (bottleneck) {
    insights.push(
      <p key="bottleneck" className="mb-2">
        <span className="font-medium">Pipeline Bottleneck:</span> Your recruitment process shows the greatest drop-off at the {bottleneck} stage ({bottleneckStage}).
      </p>
    );
  }
  
  // Add quality insight if available
  if (data.qualityMetrics) {
    const qualityScore = data.qualityMetrics.averageScore;
    const highQualityPercentage = totalApplicants > 0 
      ? Math.round((data.qualityMetrics.highQualityCount / totalApplicants) * 100) 
      : 0;
    
    insights.push(
      <p key="quality" className="mb-2">
        <span className="font-medium">Candidate Quality:</span> Your applicant pool has an average match score of {qualityScore}%, with {highQualityPercentage}% of candidates being high-quality matches (80%+).
      </p>
    );
  }
  
  // Add time efficiency insight if available
  if (data.timeToHire) {
    insights.push(
      <p key="time">
        <span className="font-medium">Time Efficiency:</span> Your average time-to-hire is {data.timeToHire.averageDays} days, which is 
        {data.timeToHire.averageDays <= 14 
          ? " excellent and below industry average." 
          : data.timeToHire.averageDays <= 30 
            ? " in line with industry standards." 
            : " longer than the typical 2-4 week timeframe. Consider streamlining your process."}
      </p>
    );
  }
  
  return insights;
};

export default PipelinePerformance;