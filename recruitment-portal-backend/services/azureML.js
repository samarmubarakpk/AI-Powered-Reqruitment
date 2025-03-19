// services/azureML.js
const { DefaultAzureCredential } = require('@azure/identity');
const { AzureMLClient, AMLKeyCredential } = require('@azure/ai-ml');

// Initialize Azure ML client
const mlClient = new AzureMLClient(
  process.env.AZURE_ML_ENDPOINT,
  new AMLKeyCredential(process.env.AZURE_ML_API_KEY)
);

/**
 * Uses Azure ML to predict candidate-job match score
 * @param {Object} candidateFeatures - Extracted features from candidate
 * @param {Object} jobFeatures - Features from the job posting
 * @returns {Object} Match prediction with scores
 */
async function predictCandidateMatch(candidateFeatures, jobFeatures) {
  try {
    // Prepare input data
    const inputData = {
      candidate_skills: candidateFeatures.skills || [],
      candidate_experience_years: candidateFeatures.experienceYears || 0,
      candidate_education_level: candidateFeatures.educationLevel || '',
      job_required_skills: jobFeatures.requiredSkills || [],
      job_required_experience: jobFeatures.experienceRequired || 0,
      job_title: jobFeatures.title || '',
      job_description: jobFeatures.description || ''
    };

    // Call Azure ML endpoint
    const prediction = await mlClient.endpoints.invoke(
      process.env.AZURE_ML_ENDPOINT_NAME,
      { data: inputData }
    );

    return {
      overallScore: prediction.result.overall_match_score,
      skillsScore: prediction.result.skills_match_score,
      experienceScore: prediction.result.experience_match_score,
      educationScore: prediction.result.education_match_score,
      culturalFitScore: prediction.result.cultural_fit_score,
      confidence: prediction.result.confidence,
      matchDetails: prediction.result.match_details
    };
  } catch (error) {
    console.error('Error calling Azure ML:', error);
    
    // Fallback to our rule-based scoring if ML fails
    const { calculateMatchScore } = require('./jobMatching');
    const matchDetails = await calculateMatchScore(
      { skills: candidateFeatures.skills, experience: [] }, 
      { requiredSkills: jobFeatures.requiredSkills, experienceRequired: jobFeatures.experienceRequired }
    );
    
    return matchDetails;
  }
}

module.exports = {
  predictCandidateMatch
};