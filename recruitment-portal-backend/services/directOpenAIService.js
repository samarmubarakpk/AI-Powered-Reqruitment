// services/directOpenAIService.js
const axios = require('axios');

/**
 * Calculates match score between candidate and vacancy using direct OpenAI API
 * Mirror implementation of the working Azure version but using OpenAI API directly
 * @param {Object} candidate - Complete candidate data including CV text and details
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
    
    // IMPORTANT: Mirror the exact data preparation from the working Azure implementation
    // Extract candidate information like the Azure implementation
    const candidateName = `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim();
    const cvText = candidate.cvRawText || 'No CV text available';
    
    // Extract skills as a fallback if full CV text isn't available
    const candidateSkills = (candidate.skills || []).join(', ');
    
    // Calculate derived metrics exactly as in the Azure implementation
    const experienceYears = typeof candidate.experienceYears === 'number' 
      ? candidate.experienceYears 
      : (candidate.experience && Array.isArray(candidate.experience)) 
        ? estimateTotalExperience(candidate.experience)
        : 0;
        
    // Prepare education and experience summaries as fallbacks
    let educationSummary = '';
    let educationLevel = '';
    if (candidate.education && candidate.education.length > 0) {
      educationSummary = candidate.education.map(edu => 
        `${edu.degree || ''} in ${edu.field || ''} from ${edu.institution || ''}`
      ).join('; ');
      
      // Get highest education level if available
      educationLevel = getHighestEducationLevel(candidate.education);
    }
    
    let experienceSummary = '';
    if (candidate.experience && candidate.experience.length > 0) {
      experienceSummary = candidate.experience.map(exp => 
        `${exp.position || ''} at ${exp.company || ''} (${exp.description || ''})`
      ).join('; ');
    }
    
    // Job details - format exactly like the Azure implementation
    const jobTitle = job.title || 'Unnamed Position';
    const jobDescription = job.description || 'No description available';
    const requiredSkills = (job.requiredSkills || []).join(', ');
    const requiredExperience = job.experienceRequired || 0;
    
    // Use the EXACT same prompt as the Azure implementation
    const prompt = `
I need you to analyze how well this candidate matches the job position. Provide a detailed assessment using all available information.
the CV and Job description will be in spanish(most of the time).

JOB DETAILS:
Title: ${jobTitle}
Description: ${jobDescription}
Required Skills: ${requiredSkills}
Years of Experience Required: ${requiredExperience}

CANDIDATE INFORMATION:
Name: ${candidateName}

CANDIDATE CV TEXT:
${cvText}

${cvText === 'No CV text available' ? `ADDITIONAL CANDIDATE INFORMATION (use this since full CV text is not available):
Skills: ${candidateSkills}
Education: ${educationSummary}
Experience: ${experienceSummary}` : ''}

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
  "missing_skills": [array of strings - important skills from job requirements the candidate lacks],
  "strengths": [array of strings - candidate's key strengths for this role],
  "gaps": [array of strings - areas where candidate falls short],
  "analysis_summary": string (brief summary of the match)
}

Please ensure your response is ONLY the JSON object with no other text before or after it.
Prioritize meaningful qualitative analysis over simple keyword matching. Consider context and the actual relevance of the candidate's background to the specific job requirements.`;

    console.log('Making OpenAI request for candidate match analysis with CV data');
    
    // Make the request to OpenAI API - increase max_tokens to match richness of response
    const response = await axios.post(
      endpointUrl,
      {
        model: 'gpt-4', // You can also use 'gpt-3.5-turbo' if preferred
        messages: [
          { role: 'system', content: 'You are an expert HR analytics assistant that specializes in candidate matching and recruitment. Return only valid JSON in your responses with no other text.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3, // Lower temperature for more deterministic results
        max_tokens: 2000 // Increase token limit to handle rich response
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
    console.log('Raw OpenAI response first 100 chars:', responseContent.substring(0, 100) + '...');
    
    // Helper function to fix truncated JSON
    function fixTruncatedJson(jsonStr) {
      // Count opening and closing braces/brackets to detect imbalance
      const openBraces = (jsonStr.match(/\{/g) || []).length;
      const closeBraces = (jsonStr.match(/\}/g) || []).length;
      const openBrackets = (jsonStr.match(/\[/g) || []).length;
      const closeBrackets = (jsonStr.match(/\]/g) || []).length;
      
      let fixedJson = jsonStr;
      
      // Add missing closing brackets
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        fixedJson += ']';
      }
      
      // Add missing closing braces
      for (let i = 0; i < openBraces - closeBraces; i++) {
        fixedJson += '}';
      }
      
      return fixedJson;
    }
    
    // Helper function to attempt to recover partial JSON data - identical to Azure implementation
    function recoverPartialJson(text) {
      // Extract what looks like valid keys and values
      const keyValuePattern = /"([^"]+)"\s*:\s*(?:"([^"]*)"|\[([^\]]*)\]|(\d+))/g;
      const matches = [...text.matchAll(keyValuePattern)];
      
      if (matches.length === 0) {
        return null;
      }
      
      // Attempt to build an object from the key-value pairs
      const recoveredObject = {};
      
      matches.forEach(match => {
        const key = match[1];
        // Determine the type of value (string, array, number)
        if (match[2] !== undefined) {
          // String value
          recoveredObject[key] = match[2];
        } else if (match[3] !== undefined) {
          // Array value (might be incomplete)
          try {
            recoveredObject[key] = JSON.parse('[' + match[3] + ']');
          } catch {
            recoveredObject[key] = [];
          }
        } else if (match[4] !== undefined) {
          // Number value
          recoveredObject[key] = Number(match[4]);
        }
      });
      
      return recoveredObject;
    }
    
    // Multi-approach JSON parsing with backup plans - identical to Azure implementation
    let matchDetails;
    try {
      // First try to parse the entire response as JSON
      matchDetails = JSON.parse(responseContent);
      console.log("Successfully parsed complete JSON response");
    } catch (parseError) {
      console.log("Couldn't parse entire response as JSON, trying alternative extraction methods");
      
      try {
        // Handle code blocks with ```json
        const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/;
        const codeBlockMatch = responseContent.match(codeBlockRegex);
        
        if (codeBlockMatch && codeBlockMatch[1]) {
          const jsonContent = codeBlockMatch[1].trim();
          console.log("Found code block, attempting to parse its content");
          
          try {
            matchDetails = JSON.parse(jsonContent);
            console.log("Successfully parsed JSON from code block");
          } catch (codeBlockParseError) {
            console.log("Code block content isn't valid JSON, attempting to fix truncated JSON");
            const fixedJson = fixTruncatedJson(jsonContent);
            matchDetails = JSON.parse(fixedJson);
            console.log("Successfully parsed fixed JSON from code block");
          }
        } else {
          // Look for any JSON-like structure in the text
          console.log("No code block found, looking for JSON object in raw text");
          const jsonRegex = /\{[\s\S]*\}/;
          const jsonMatch = responseContent.match(jsonRegex);
          
          if (jsonMatch && jsonMatch[0]) {
            console.log("Found JSON-like structure in text, attempting to parse");
            try {
              matchDetails = JSON.parse(jsonMatch[0]);
              console.log("Successfully parsed JSON from raw text");
            } catch (jsonParseError) {
              console.log("JSON structure isn't valid, attempting to fix truncated JSON");
              const fixedJson = fixTruncatedJson(jsonMatch[0]);
              try {
                matchDetails = JSON.parse(fixedJson);
                console.log("Successfully parsed fixed JSON from raw text");
              } catch (fixedJsonError) {
                throw new Error("Could not parse even after fixing JSON");
              }
            }
          } else {
            // Last resort: try to extract partial data
            console.log("No complete JSON structure found, attempting to recover partial data");
            matchDetails = recoverPartialJson(responseContent);
            
            if (!matchDetails) {
              throw new Error("Could not extract any valid JSON data from response");
            }
            console.log("Recovered partial JSON data");
          }
        }
      } catch (allExtractionError) {
        console.error("All JSON extraction methods failed:", allExtractionError);
        console.error("Full response:", responseContent);
        
        // Create default object
        console.log("Using default values as fallback");
        matchDetails = {
          overall_match_score: 50,
          skills_match_score: 50,
          experience_match_score: 50,
          education_match_score: 50,
          matched_skills: [],
          missing_skills: [],
          strengths: ["Unable to perform detailed analysis"],
          gaps: ["Error in AI analysis"],
          analysis_summary: "Unable to parse response data"
        };
      }
    }
    
    // Transform to the expected output format - match the Azure implementation exactly
    return {
      overallScore: matchDetails.overall_match_score ,
      skillsScore: matchDetails.skills_match_score ,
      experienceScore: matchDetails.experience_match_score ,
      educationScore: matchDetails.education_match_score ,
      matchDetails: {
        matchedSkills: matchDetails.matched_skills || [],
        missingSkills: matchDetails.missing_skills || [],
        strengths: matchDetails.strengths || [],
        gaps: matchDetails.gaps || []
      },
      analysisSummary: matchDetails.analysis_summary || "Analysis not available"
    };
  } catch (error) {
    console.error('OpenAI API Error:', error.message);
    // Provide error details for debugging
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      
      // Log additional details if available
      if (error.response.data && error.response.data.error) {
        console.error('Error details:', error.response.data.error);
      }
    }
    
    // Return a fallback basic analysis - match the Azure implementation format
    return {
      overallScore: 50, // Neutral score
      skillsScore: 50,
      experienceScore: 50,
      educationScore: 50,
      matchDetails: {
        matchedSkills: [],
        missingSkills: [],
        strengths: ["Unable to perform detailed analysis"],
        gaps: ["Error in AI analysis"]
      },
      analysisSummary: "Error performing AI-powered match analysis. Please try again."
    };
  }
}

/**
 * Helper function to estimate total experience years from experience array
 * Added to match functionality from the Azure implementation
 */
function estimateTotalExperience(experienceArray) {
  if (!Array.isArray(experienceArray) || experienceArray.length === 0) {
    return 0;
  }
  
  let totalYears = 0;
  
  experienceArray.forEach(exp => {
    // Skip if missing start date
    if (!exp.startDate) return;
    
    const startDate = new Date(exp.startDate);
    let endDate;
    
    if (exp.current) {
      // If current position, use today's date
      endDate = new Date();
    } else if (exp.endDate) {
      endDate = new Date(exp.endDate);
    } else {
      // If no end date and not current, skip
      return;
    }
    
    // Calculate years difference
    const yearsDiff = (endDate - startDate) / (1000 * 60 * 60 * 24 * 365.25);
    
    // Only add if it's a positive value and seems reasonable
    if (yearsDiff > 0 && yearsDiff < 100) {
      totalYears += yearsDiff;
    }
  });
  
  return Math.round(totalYears);
}

/**
 * Helper function to determine highest education level
 * Added to match functionality from the Azure implementation
 */
function getHighestEducationLevel(educationArray) {
  if (!Array.isArray(educationArray) || educationArray.length === 0) {
    return '';
  }
  
  // Define education levels in order of hierarchy
  const educationLevels = {
    'high school': 1,
    'associate': 2,
    'bachelor': 3,
    'undergraduate': 3,
    'master': 4,
    'mba': 4,
    'doctorate': 5,
    'phd': 5
  };
  
  let highestLevel = '';
  let highestScore = 0;
  
  educationArray.forEach(edu => {
    if (!edu.degree) return;
    
    // Look for education level keywords in the degree
    const degreeLower = edu.degree.toLowerCase();
    
    for (const [level, score] of Object.entries(educationLevels)) {
      if (degreeLower.includes(level) && score > highestScore) {
        highestScore = score;
        highestLevel = level;
      }
    }
  });
  
  return highestLevel.charAt(0).toUpperCase() + highestLevel.slice(1);
}

module.exports = { predictCandidateMatchDirect };