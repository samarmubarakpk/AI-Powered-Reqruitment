// services/jobMatching.js
const { CosmosClient } = require('@azure/cosmos');
const { TextAnalyticsClient, AzureKeyCredential } = require('@azure/ai-text-analytics');

// Initialize Azure Text Analytics for NLP features
const textAnalyticsClient = new TextAnalyticsClient(
  process.env.TEXT_ANALYTICS_ENDPOINT,
  new AzureKeyCredential(process.env.TEXT_ANALYTICS_KEY)
);

// Initialize Cosmos DB client
const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY
});
const database = cosmosClient.database(process.env.COSMOS_DATABASE);
const candidatesContainer = database.container('Candidates');
const vacanciesContainer = database.container('Vacancies');

/**
 * Calculates match score between candidate and vacancy with enhanced NLP
 * @param {Object} candidate - Candidate data
 * @param {Object} vacancy - Vacancy data
 * @returns {Object} Match score and details
 */
async function calculateMatchScore(candidate, vacancy) {
  // Initialize scores and match details
  const matchDetails = {
    totalScore: 0,
    skillsScore: 0,
    experienceScore: 0,
    educationScore: 0,
    culturalFitScore: 0,
    matchedSkills: [],
    missingSkills: [],
    analysis: {}
  };
  
  // 1. Skills matching (40% of total score)
  const skillsData = await skillsMatching(candidate, vacancy);
  matchDetails.skillsScore = skillsData.score;
  matchDetails.matchedSkills = skillsData.matchedSkills;
  matchDetails.missingSkills = skillsData.missingSkills;
  
  // 2. Experience matching (30% of total score)
  const experienceData = await experienceMatching(candidate, vacancy);
  matchDetails.experienceScore = experienceData.score;
  matchDetails.analysis.experience = experienceData.analysis;
  
  // 3. Education matching (20% of total score)
  const educationData = await educationMatching(candidate, vacancy);
  matchDetails.educationScore = educationData.score;
  
  // 4. Cultural fit / additional factors (10% of total score)
  const culturalData = await culturalFitAnalysis(candidate, vacancy);
  matchDetails.culturalFitScore = culturalData.score;
  
  // Calculate weighted total score
  matchDetails.totalScore = (
    (matchDetails.skillsScore * 0.4) + 
    (matchDetails.experienceScore * 0.3) + 
    (matchDetails.educationScore * 0.2) +
    (matchDetails.culturalFitScore * 0.1)
  );
  
  return matchDetails;
}

/**
 * Enhanced skills matching with semantic similarity
 */
async function skillsMatching(candidate, vacancy) {
  const result = {
    score: 0,
    matchedSkills: [],
    missingSkills: []
  };
  
  if (!vacancy.requiredSkills || vacancy.requiredSkills.length === 0) {
    // No skills required
    return { score: 100, matchedSkills: [], missingSkills: [] };
  }
  
  const candidateSkills = (candidate.skills || []).map(s => s.toLowerCase());
  
  // Check for exact and partial matches
  for (const skill of vacancy.requiredSkills) {
    const skillLower = skill.toLowerCase();
    
    // Check for exact matches
    if (candidateSkills.includes(skillLower)) {
      result.matchedSkills.push(skill);
      continue;
    }
    
    // Check for partial matches using string similarity
    const partialMatch = candidateSkills.some(cs => 
      cs.includes(skillLower) || skillLower.includes(cs));
    
    if (partialMatch) {
      result.matchedSkills.push(skill);
    } else {
      // Use Text Analytics for semantic similarity
      try {
        const keyPhrases = await extractKeyPhrases(candidateSkills.join(' '));
        const semanticMatch = keyPhrases.some(phrase => 
          calculateStringSimilarity(phrase, skillLower) > 0.7);
        
        if (semanticMatch) {
          result.matchedSkills.push(`${skill} (semantic)`);
        } else {
          result.missingSkills.push(skill);
        }
      } catch (error) {
        console.error('Error in semantic analysis:', error);
        result.missingSkills.push(skill);
      }
    }
  }
  
  // Calculate score as percentage of matched skills
  result.score = (result.matchedSkills.length / vacancy.requiredSkills.length) * 100;
  
  return result;
}

/**
 * Extract key phrases using Azure Text Analytics
 */
async function extractKeyPhrases(text) {
  if (!text || text.trim().length === 0) {
    return [];
  }
  
  try {
    const results = await textAnalyticsClient.extractKeyPhrases([{ id: "1", text }]);
    
    for (const result of results) {
      if (result.error === undefined) {
        return result.keyPhrases;
      } else {
        console.error("Error in key phrase extraction:", result.error);
        return [];
      }
    }
    
    return [];
  } catch (error) {
    console.error("Unexpected error in key phrase extraction:", error);
    return [];
  }
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const track = Array(str2.length + 1).fill(null).map(() => 
    Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator, // substitution
      );
    }
  }
  
  const distance = track[str2.length][str1.length];
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength > 0 ? 1 - distance / maxLength : 1;
}

/**
 * Experience matching with advanced analysis
 */
async function experienceMatching(candidate, vacancy) {
  const result = {
    score: 0,
    analysis: {}
  };
  
  // If no experience requirement or no candidate experience
  if (!vacancy.experienceRequired || vacancy.experienceRequired === 0) {
    return { score: 100, analysis: { message: "No experience required" } };
  }
  
  if (!candidate.experience || candidate.experience.length === 0) {
    return { score: 0, analysis: { message: "No experience provided" } };
  }
  
  // Calculate total years of experience
  const totalYears = estimateTotalExperience(candidate.experience);
  
  // Calculate relevance of experience (domain similarity)
  const relevance = await calculateExperienceRelevance(candidate.experience, vacancy);
  
  // Calculate recency - more weight to recent experience
  const recency = calculateExperienceRecency(candidate.experience);
  
  // Combine factors: years (60%), relevance (30%), recency (10%)
  const yearsScore = totalYears >= vacancy.experienceRequired ? 100 : (totalYears / vacancy.experienceRequired) * 100;
  
  result.score = (yearsScore * 0.6) + (relevance * 0.3) + (recency * 0.1);
  result.analysis = {
    totalYears,
    requiredYears: vacancy.experienceRequired,
    relevance,
    recency,
    yearsScore
  };
  
  return result;
}

/**
 * Calculate how relevant the candidate's experience is to the job
 */
async function calculateExperienceRelevance(experience, vacancy) {
  if (!experience || experience.length === 0 || !vacancy.description) {
    return 0;
  }
  
  try {
    // Extract experience descriptions
    const experienceText = experience
      .map(exp => `${exp.position || ''} ${exp.company || ''} ${exp.description || ''}`)
      .join(' ');
    
    // Extract key phrases from experience and job description
    const expKeyPhrases = await extractKeyPhrases(experienceText);
    const jobKeyPhrases = await extractKeyPhrases(vacancy.description);
    
    // Calculate overlap ratio
    let matchCount = 0;
    for (const expPhrase of expKeyPhrases) {
      for (const jobPhrase of jobKeyPhrases) {
        if (calculateStringSimilarity(expPhrase.toLowerCase(), jobPhrase.toLowerCase()) > 0.7) {
          matchCount++;
          break;
        }
      }
    }
    
    return jobKeyPhrases.length > 0 ? 
      (matchCount / Math.min(expKeyPhrases.length, jobKeyPhrases.length)) * 100 : 50;
  } catch (error) {
    console.error('Error calculating experience relevance:', error);
    return 50; // Default to neutral score on error
  }
}

/**
 * Calculate recency score - more weight to recent experience
 */
function calculateExperienceRecency(experience) {
  if (!experience || experience.length === 0) {
    return 0;
  }
  
  // Find the most recent experience
  const mostRecent = experience.reduce((latest, exp) => {
    // Handle 'current' positions
    if (exp.current) return { endDate: new Date().toISOString() };
    
    // Compare end dates
    if (exp.endDate && (!latest.endDate || new Date(exp.endDate) > new Date(latest.endDate))) {
      return exp;
    }
    return latest;
  }, { endDate: null });
  
  if (!mostRecent.endDate) {
    return 50; // Default score if no dates available
  }
  
  // Calculate years since most recent job
  const yearsSince = (new Date() - new Date(mostRecent.endDate)) / (1000 * 60 * 60 * 24 * 365);
  
  // Score based on recency (100 for current job, decreasing by 10 points per year)
  return Math.max(0, 100 - (yearsSince * 10));
}

/**
 * Education matching
 */
async function educationMatching(candidate, vacancy) {
  // This would be expanded based on required education level for the job
  if (!candidate.education || candidate.education.length === 0) {
    return { score: 30 }; // Base score if no education listed
  }
  
  // For now, a simple scoring model based on having education entries
  return { score: 100 };
}

/**
 * Cultural fit analysis
 */
async function culturalFitAnalysis(candidate, vacancy) {
  // This would ideally use more data points
  // For now, a placeholder implementation
  return { score: 75 };
}

/**
 * Estimates total years of experience from experience entries
 */
function estimateTotalExperience(experience) {
  let totalYears = 0;
  
  for (const entry of experience) {
    // Try to extract years from dates
    if (entry.startDate) {
      // Parse dates
      const startDate = new Date(entry.startDate);
      const endDate = entry.current ? new Date() : 
                      entry.endDate ? new Date(entry.endDate) : new Date();
      
      // Calculate years difference
      const yearsDiff = (endDate - startDate) / (1000 * 60 * 60 * 24 * 365);
      
      if (yearsDiff > 0) {
        totalYears += yearsDiff;
      }
    }
  }
  
  return Math.round(totalYears * 10) / 10; // Round to 1 decimal place
}

/**
 * Find matching candidates for a vacancy
 */
async function findMatchingCandidates(vacancyId) {
  try {
    // Get vacancy details
    const { resource: vacancy } = await vacanciesContainer.item(vacancyId).read();
    
    if (!vacancy) {
      throw new Error("Vacancy not found");
    }
    
    // Get all candidates
    const { resources: candidates } = await candidatesContainer.items.readAll().fetchAll();
    
    // Calculate match scores for each candidate (in parallel)
    const matchPromises = candidates.map(candidate => 
      calculateMatchScore(candidate, vacancy)
        .then(matchScore => ({
          candidateId: candidate.id,
          candidateName: `${candidate.firstName} ${candidate.lastName}`,
          candidateEmail: candidate.email,
          cvUrl: candidate.cvUrl,
          matchScore: matchScore.totalScore,
          skillsScore: matchScore.skillsScore,
          experienceScore: matchScore.experienceScore,
          educationScore: matchScore.educationScore,
          culturalFitScore: matchScore.culturalFitScore,
          matchedSkills: matchScore.matchedSkills,
          missingSkills: matchScore.missingSkills,
          analysis: matchScore.analysis
        }))
    );
    
    const matchResults = await Promise.all(matchPromises);
    
    // Sort by match score (descending)
    return matchResults.sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    console.error("Error finding matching candidates:", error);
    throw error;
  }
}

module.exports = {
  calculateMatchScore,
  findMatchingCandidates,
  extractKeyPhrases
};