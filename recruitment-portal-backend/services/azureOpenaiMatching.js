const { OpenAIClient } = require("@azure/openai");
const { AzureKeyCredential } = require("@azure/core-auth");

// Initialize Azure OpenAI client
const client = new OpenAIClient(
  process.env.AZURE_OPENAI_ENDPOINT,
  new AzureKeyCredential(process.env.AZURE_OPENAI_API_KEY)
);
const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

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

    const response = await client.getChatCompletions(
      deploymentName,
      [
        { role: "system", content: "You are an AI assistant that specializes in HR analytics and candidate matching." },
        { role: "user", content: prompt }
      ],
      {
        temperature: 0.3,
        maxTokens: 800
      }
    );

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
    
    // Fallback to a simpler rule-based scoring if Azure OpenAI fails
    return fallbackMatchScoring(candidateFeatures, jobFeatures);
  }
}

/**
 * Fallback function for basic matching if Azure OpenAI call fails
 */
function fallbackMatchScoring(candidate, job) {
  // Simple skill matching
  const candidateSkills = candidate.skills.map(s => s.toLowerCase());
  const requiredSkills = job.requiredSkills.map(s => s.toLowerCase());
  
  const matchedSkills = [];
  const missingSkills = [];
  
  for (const skill of requiredSkills) {
    if (candidateSkills.some(cs => cs.includes(skill) || skill.includes(cs))) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }
  
  // Calculate scores
  const skillsScore = requiredSkills.length > 0 ? 
    (matchedSkills.length / requiredSkills.length) * 100 : 100;
  
  const experienceScore = job.experienceRequired > 0 ?
    Math.min(100, (candidate.experienceYears / job.experienceRequired) * 100) : 100;
  
  // Basic education score (could be enhanced)
  const educationScore = candidate.educationLevel ? 70 : 30;
  
  // Overall weighted score
  const overallScore = (
    (skillsScore * 0.4) + 
    (experienceScore * 0.4) + 
    (educationScore * 0.2)
  );
  
  return {
    overallScore,
    skillsScore,
    experienceScore,
    educationScore,
    matchDetails: {
      matchedSkills,
      missingSkills
    }
  };
}

module.exports = {
  predictCandidateMatch
};