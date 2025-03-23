import React from 'react';

const RecruitmentFunnel = ({ applications, vacancy }) => {
  // Early return if no applications
  if (!applications || applications.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No applications available to visualize the recruitment funnel.
      </div>
    );
  }

  // Define recruitment stages in order
  const stages = [
    { key: 'applied', label: 'Applied' },
    { key: 'reviewed', label: 'Reviewed' },
    { key: 'interviewed', label: 'Interviewed' },
    { key: 'accepted', label: 'Accepted' }
  ];

  // Count applications in each stage
  const stageCounts = stages.map(stage => {
    const count = applications.filter(app => app.status === stage.key).length;
    const percentage = applications.length > 0 ? Math.round((count / applications.length) * 100) : 0;
    return {
      ...stage,
      count,
      percentage,
      // Calculate width for visualization (min 10% for visibility)
      width: Math.max(10, percentage)
    };
  });

  // Calculate drop-off rates between stages
  for (let i = 1; i < stageCounts.length; i++) {
    const prevCount = stageCounts[i-1].count;
    const currentCount = stageCounts[i].count;
    stageCounts[i].dropOffRate = prevCount > 0 ? 
      Math.round(((prevCount - currentCount) / prevCount) * 100) : 0;
    stageCounts[i].passRate = prevCount > 0 ? 
      Math.round((currentCount / prevCount) * 100) : 0;
  }

  // Calculate funnel metrics
  const totalApplications = applications.length;
  const hiredCount = stageCounts[stageCounts.length - 1].count;
  const overallConversionRate = totalApplications > 0 ? 
    Math.round((hiredCount / totalApplications) * 100) : 0;

  const getConversionColor = (rate) => {
    if (rate >= 70) return 'text-green-600';
    if (rate >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Recruitment Funnel</h2>
      
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Total Applicants: {totalApplications}</span>
          <span className="text-sm font-medium">Overall Conversion: 
            <span className={getConversionColor(overallConversionRate)}> {overallConversionRate}%</span>
          </span>
        </div>
      </div>
      
      {/* Funnel Visualization */}
      <div className="space-y-2 mb-6">
        {stageCounts.map((stage, index) => (
          <div key={stage.key} className="relative">
            {/* Stage bar */}
            <div 
              className={`h-12 flex items-center justify-between px-4 rounded-md ${
                stage.key === 'applied' ? 'bg-blue-500' :
                stage.key === 'reviewed' ? 'bg-indigo-500' :
                stage.key === 'interviewed' ? 'bg-purple-500' :
                'bg-green-500'
              }`}
              style={{ width: `${stage.width}%` }}
            >
              <span className="font-medium text-white">{stage.label}</span>
              <span className="font-medium text-white">{stage.count}</span>
            </div>
            
            {/* Drop-off indicator for all stages except first */}
            {index > 0 && (
              <div className="absolute -top-2 right-0 bg-white px-2 py-1 rounded-full shadow text-xs">
                {stage.passRate}% pass rate
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Stage Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        {stageCounts.map((stage) => (
          <div key={`metrics-${stage.key}`} className="bg-gray-50 p-3 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700">{stage.label} Stage</h3>
            <p className="text-xl font-bold">{stage.count} <span className="text-sm font-normal text-gray-500">({stage.percentage}%)</span></p>
            {stage.dropOffRate !== undefined && (
              <p className="text-xs mt-1">
                <span className={stage.dropOffRate > 70 ? 'text-red-500' : stage.dropOffRate > 50 ? 'text-yellow-500' : 'text-green-500'}>
                  {stage.dropOffRate}% drop-off
                </span> from previous stage
              </p>
            )}
          </div>
        ))}
      </div>
      
      {/* Insights */}
      <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
        <h3 className="text-md font-medium text-indigo-900 mb-2">Funnel Insights</h3>
        <div className="text-sm text-gray-700">
          {generateFunnelInsights(stageCounts, totalApplications)}
        </div>
      </div>
    </div>
  );
};

// Helper function to generate funnel insights
const generateFunnelInsights = (stageCounts, totalApplications) => {
  if (totalApplications === 0) {
    return <p>No applications available for analysis.</p>;
  }

  const insights = [];
  
  // Overall funnel health
  const overallConversionRate = stageCounts[stageCounts.length - 1].percentage;
  
  if (overallConversionRate < 5) {
    insights.push(
      <p key="overall-low" className="mb-2">
        <span className="font-medium">Low Overall Conversion:</span> Only {overallConversionRate}% of applicants reach the offer stage, below the industry average of 5-10%. Consider reviewing your selection criteria or interview process.
      </p>
    );
  } else if (overallConversionRate > 20) {
    insights.push(
      <p key="overall-high" className="mb-2">
        <span className="font-medium">High Overall Conversion:</span> {overallConversionRate}% of applicants reach the offer stage, which is above industry averages. This indicates either highly targeted recruiting or potentially low selectivity.
      </p>
    );
  } else {
    insights.push(
      <p key="overall-good" className="mb-2">
        <span className="font-medium">Healthy Overall Conversion:</span> {overallConversionRate}% of applicants reach the offer stage, which is within industry benchmarks.
      </p>
    );
  }
  
  // Identify the stage with the highest drop-off
  let highestDropOffStage = null;
  let highestDropOffRate = 0;
  
  for (let i = 1; i < stageCounts.length; i++) {
    if (stageCounts[i].dropOffRate > highestDropOffRate) {
      highestDropOffRate = stageCounts[i].dropOffRate;
      highestDropOffStage = stageCounts[i];
    }
  }
  
  if (highestDropOffStage && highestDropOffRate > 50) {
    insights.push(
      <p key="bottleneck" className="mb-2">
        <span className="font-medium">Funnel Bottleneck:</span> Your highest drop-off ({highestDropOffRate}%) occurs at the {highestDropOffStage.label} stage. This indicates a potential issue with your {highestDropOffStage.key === 'reviewed' ? 'initial screening' : highestDropOffStage.key === 'interviewed' ? 'candidate selection or interview process' : 'offer terms or closing process'}.
      </p>
    );
  }
  
  // Add recommendation based on overall funnel shape
  const reviewStagePercentage = stageCounts[1].percentage;
  const interviewStagePercentage = stageCounts[2].percentage;
  
  if (reviewStagePercentage > 70 && interviewStagePercentage < 30) {
    insights.push(
      <p key="rec-review">
        <span className="font-medium">Recommendation:</span> Your initial screening accepts {reviewStagePercentage}% of applicants, but only {interviewStagePercentage}% reach the interview stage. Consider implementing a more selective initial screening to improve efficiency.
      </p>
    );
  } else if (reviewStagePercentage < 30 && interviewStagePercentage < 15) {
    insights.push(
      <p key="rec-attract">
        <span className="font-medium">Recommendation:</span> Both your screening ({reviewStagePercentage}%) and interview ({interviewStagePercentage}%) conversion rates are low. Review your job description and requirements to attract more qualified applicants.
      </p>
    );
  }
  
  return insights;
};

export default RecruitmentFunnel;