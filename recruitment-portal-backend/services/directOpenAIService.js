// services/directOpenAIService.js
const axios = require('axios');

/**
 * Calculates match score between candidate and vacancy using direct OpenAI API
 * @param {Object} candidate - Candidate data with skills, experience, and education
 * @param {Object} job - Job vacancy data with requirements
 * @returns {Promise<Object>} Match score details
 */
async function predictCandidateMatchDirect(candidate, job) {
  try {
    // OpenAI API configuration
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured.');
    }
    
    const endpointUrl = 'https://api.openai.com/v1/chat/completions';
    
    // Prepare candidate summary
    const candidateSkills = candidate.skills || [];
    const experienceYears = candidate.experienceYears || 0;
    const educationLevel = candidate.educationLevel || '';
    
    // Prepare job details
    const jobRequiredSkills = job.requiredSkills || [];
    const jobExperienceRequired = job.experienceRequired || 0;
    const jobTitle = job.title || '';
    const jobDescription = job.description || '';
    
    // Format the prompt for better analysis
    const prompt = `
I need you to analyze how well this candidate matches the job position. Provide a detailed assessment.

JOB DETAILS:
Title: ${jobTitle}
Description: ${jobDescription}
Required Skills: ${jobRequiredSkills.join(', ')}
Years of Experience Required: ${jobExperienceRequired}

CANDIDATE INFORMATION:
Skills: ${candidateSkills.join(', ')}
Years of Experience: ${experienceYears}
Education Level: ${educationLevel}

Please analyze the match comprehensively, considering:
1. Skills alignment (both explicit matches and related/transferable skills)
2. Experience relevance and depth
3. Education suitability
4. Overall fit

Return your analysis in the following JSON format:
{
  "overall_match_score": number (0-100),
  "skills_match_score": number (0-100),
  "experience_match_score": number (0-100),
  "education_match_score": number (0-100),
  "matched_skills": [array of strings - skills the candidate has that match job requirements],
  "missing_skills": [array of strings - important skills from job requirements the candidate lacks]
}

Your response should be ONLY valid JSON with no other text.`;

    console.log('Making OpenAI request for candidate match analysis');
    
    // Make the request to OpenAI API
    const response = await axios.post(
      endpointUrl,
      {
        model: 'gpt-4', // You can also use 'gpt-4' for higher quality
        messages: [
          { role: 'system', content: 'You are an expert HR analytics assistant that specializes in candidate matching and recruitment. Return only valid JSON in your responses with no other text.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3, // Lower temperature for more deterministic results
        max_tokens: 1500 // Adjust based on your needs
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    console.log('OpenAI response received');
    
    // Extract the response content
    const responseContent = response.data.choices[0].message.content;
    
    // Parse JSON response
    let matchDetails;
    try {
      matchDetails = JSON.parse(responseContent);
      console.log('Successfully parsed JSON response');
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      
      // Fallback to generic match scores
      return {
        overallScore: 50,
        skillsScore: 50,
        experienceScore: 50,
        educationScore: 50,
        matchDetails: {
          matchedSkills: [],
          missingSkills: []
        }
      };
    }
    
    // Transform to the expected output format
    return {
      overallScore: matchDetails.overall_match_score || 50,
      skillsScore: matchDetails.skills_match_score || 50,
      experienceScore: matchDetails.experience_match_score || 50,
      educationScore: matchDetails.education_match_score || 50,
      matchDetails: {
        matchedSkills: matchDetails.matched_skills || [],
        missingSkills: matchDetails.missing_skills || []
      }
    };
  } catch (error) {
    console.error('OpenAI API Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    
    // Return a fallback basic analysis
    return {
      overallScore: 50, // Neutral score
      skillsScore: 50,
      experienceScore: 50,
      educationScore: 50,
      matchDetails: {
        matchedSkills: [],
        missingSkills: []
      }
    };
  }
}

module.exports = { predictCandidateMatchDirect };