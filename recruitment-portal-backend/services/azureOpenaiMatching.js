// services/azureOpenaiMatching.js
const STRICT_AZURE_AI_MODE = process.env.STRICT_AZURE_AI_MODE === 'true';

const { OpenAI } = require("openai");

// Initialize OpenAI client with Azure configuration - UPDATED CONFIGURATION
const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { "api-version": "2024-02-01" },  // Update to latest API version
  defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY }
});

/**
 * Uses Azure OpenAI to predict candidate-job match score
 * @param {Object} candidateFeatures - Extracted features from candidate
 * @param {Object} jobFeatures - Features from the job posting
 * @returns {Object} Match prediction with scores
 */
async function predictCandidateMatch(candidateFeatures, jobFeatures) {
  try {
    // Prepare the prompt for OpenAI
    const prompt = `
I need to assess how well a candidate matches a job position. Please analyze and provide scores for the following:

CANDIDATE INFORMATION:
- Skills: ${candidateFeatures.skills.join(', ')}
- Total years of experience: ${candidateFeatures.experienceYears || 0} years
- Education level: ${candidateFeatures.educationLevel || 'Not specified'}

JOB REQUIREMENTS:
- Title: ${jobFeatures.title}
- Required skills: ${jobFeatures.requiredSkills.join(', ')}
- Required experience: ${jobFeatures.experienceRequired || 0} years
- Description: ${jobFeatures.description}

Please calculate and return the following match scores (0-100%):
1. Overall match score
2. Skills match score
3. Experience match score
4. Education match score 
5. Identify which skills from required skills are matched in candidate skills
6. Identify which required skills are missing from candidate skills

Return your analysis in the following JSON format:
{
  "overall_match_score": number,
  "skills_match_score": number,
  "experience_match_score": number,
  "education_match_score": number,
  "matched_skills": [string],
  "missing_skills": [string]
}
`;

    const response = await openai.chat.completions.create({
      // Don't set model here - it's already in the URL
      // model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,  // Remove this line
      messages: [
        { role: "system", content: "You are an AI assistant that specializes in HR analytics and candidate matching." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 800
    });

    // Extract the response content
    const responseContent = response.choices[0].message.content;
    
    // Parse the JSON from the response
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const matchDetails = JSON.parse(jsonMatch[0]);
      
      return {
        overallScore: matchDetails.overall_match_score,
        skillsScore: matchDetails.skills_match_score,
        experienceScore: matchDetails.experience_match_score,
        educationScore: matchDetails.education_match_score,
        matchDetails: {
          matchedSkills: matchDetails.matched_skills || [],
          missingSkills: matchDetails.missing_skills || []
        }
      };
    } else {
      throw new Error('Could not parse matching results from Azure OpenAI response');
    }
  } catch (error) {
    console.error('Error calling Azure OpenAI:', error);
    
    if (STRICT_AZURE_AI_MODE) {
      throw new Error(`Azure AI matching service error: ${error.message}`);
    } else {
      return fallbackMatchScoring(candidateFeatures, jobFeatures);
    }
  }
  }





module.exports = {
  predictCandidateMatch
};