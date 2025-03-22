// services/smartMatchingService.js - Enhanced version
const axios = require('axios');

/**
 * Performs an intelligent match analysis between a candidate and a job using Azure OpenAI
 * This improved version uses the full CV text and job details for a more holistic comparison
 * 
 * @param {Object} candidate - The complete candidate object with CV text
 * @param {Object} job - The complete job vacancy object
 * @returns {Object} Detailed matching analysis
 */
async function predictCandidateMatch(candidate, job) {
  try {
    // Get the OpenAI endpoint and configuration
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiVersion = "2024-02-15-preview";
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
    
    // Construct the API URL
    const apiUrl = `${endpoint}openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;
    
    console.log(`Making OpenAI request to: ${apiUrl}`);
    
    // Extract candidate information
    const candidateName = `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim();
    const cvText = candidate.cvRawText || 'No CV text available';
    
    // Extract skills as a fallback if full CV text isn't available
    const candidateSkills = (candidate.skills || []).join(', ');
    
    // Prepare education and experience summaries as fallbacks
    let educationSummary = '';
    if (candidate.education && candidate.education.length > 0) {
      educationSummary = candidate.education.map(edu => 
        `${edu.degree || ''} in ${edu.field || ''} from ${edu.institution || ''}`
      ).join('; ');
    }
    
    let experienceSummary = '';
    if (candidate.experience && candidate.experience.length > 0) {
      experienceSummary = candidate.experience.map(exp => 
        `${exp.position || ''} at ${exp.company || ''} (${exp.description || ''})`
      ).join('; ');
    }
    
    // Job details
    const jobTitle = job.title || 'Unnamed Position';
    const jobDescription = job.description || 'No description available';
    const requiredSkills = (job.requiredSkills || []).join(', ');
    const requiredExperience = job.experienceRequired || 0;
    
    // Construct a comprehensive prompt that allows for holistic analysis
    const prompt = `
I need you to analyze how well this candidate matches the job position. Provide a detailed assessment using all available information.

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

    // Make the API call to Azure OpenAI
    const response = await axios.post(
      apiUrl,
      {
        messages: [
          { role: "system", content: "You are an expert HR analytics assistant that specializes in candidate matching and recruitment. Return only valid JSON in your responses with no other text." },
          { role: "user", content: prompt }
        ],
        max_tokens: 200,
        temperature: 0.3
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.AZURE_OPENAI_API_KEY
        }
      }
    );

    // Extract the response
    const responseContent = response.data.choices[0].message.content;
    
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
    
    // Helper function to attempt to recover partial JSON data
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
    
    // Multi-approach JSON parsing with backup plans
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
              matchDetails = JSON.parse(fixedJson);
              console.log("Successfully parsed fixed JSON from raw text");
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
    
    // Transform to the expected output format used by the rest of the application
    return {
      overallScore: matchDetails.overall_match_score || 50,
      skillsScore: matchDetails.skills_match_score || 50,
      experienceScore: matchDetails.experience_match_score || 50,
      educationScore: matchDetails.education_match_score || 50,
      matchDetails: {
        matchedSkills: matchDetails.matched_skills || [],
        missingSkills: matchDetails.missing_skills || [],
        strengths: matchDetails.strengths || [],
        gaps: matchDetails.gaps || []
      },
      analysisSummary: matchDetails.analysis_summary || "Analysis not available"
    };
  } catch (error) {
    console.error("Azure OpenAI Error:", error.message);
    // Provide error details for debugging
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
    
    // Return a fallback basic analysis
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

module.exports = { predictCandidateMatch };