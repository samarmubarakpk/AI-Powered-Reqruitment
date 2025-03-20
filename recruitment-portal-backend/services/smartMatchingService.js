// services/azureOpenaiMatching.js
const axios = require('axios');

async function predictCandidateMatch(candidateFeatures, jobFeatures) {
  try {
    // Get the base endpoint (just the domain)
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiVersion = "2024-02-15-preview";
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
    
    // Construct the proper URL - using the correct format that worked in your test
    const apiUrl = `${endpoint}openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;
    
    console.log(`Making request to: ${apiUrl}`);
    
    // Prepare the prompt
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
}`;

    // Make the API call
    const response = await axios.post(
      apiUrl,
      {
        messages: [
          { role: "system", content: "You are an AI assistant that specializes in HR analytics and candidate matching." },
          { role: "user", content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.3
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.AZURE_OPENAI_API_KEY
        }
      }
    );

    // Extract and process the response
    const responseContent = response.data.choices[0].message.content;
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
    console.error("Azure OpenAI Error:", error);
    throw error;
  }
}

module.exports = { predictCandidateMatch };