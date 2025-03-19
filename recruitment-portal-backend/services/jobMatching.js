// recruitment-portal-backend/services/jobMatching.js
const { CosmosClient } = require('@azure/cosmos');

// Initialize Cosmos DB client
const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY
});
const database = cosmosClient.database(process.env.COSMOS_DATABASE);
const candidatesContainer = database.container('Candidates');
const vacanciesContainer = database.container('Vacancies');

/**
 * Calculates match score between candidate and vacancy
 * @param {Object} candidate - Candidate data
 * @param {Object} vacancy - Vacancy data
 * @returns {Object} Match score and details
 */
function calculateMatchScore(candidate, vacancy) {
  // Initialize scores
  let skillsScore = 0;
  let experienceScore = 0;
  let educationScore = 0;
  
  const matchDetails = {
    totalScore: 0,
    skillsScore: 0,
    experienceScore: 0,
    educationScore: 0,
    matchedSkills: [],
    missingSkills: []
  };
  
  // Skills matching (50% of total score)
  if (vacancy.requiredSkills && vacancy.requiredSkills.length > 0) {
    const candidateSkills = (candidate.skills || []).map(s => s.toLowerCase());
    
    for (const skill of vacancy.requiredSkills) {
      const skillLower = skill.toLowerCase();
      
      // Check for exact matches
      if (candidateSkills.includes(skillLower)) {
        skillsScore += 1;
        matchDetails.matchedSkills.push(skill);
      } else {
        // Check for partial matches (e.g., "JavaScript" would partially match "JavaScript Development")
        const partialMatch = candidateSkills.some(cs => 
          cs.includes(skillLower) || skillLower.includes(cs));
        
        if (partialMatch) {
          skillsScore += 0.5;
          matchDetails.matchedSkills.push(`${skill} (partial)`);
        } else {
          matchDetails.missingSkills.push(skill);
        }
      }
    }
    
    // Normalize score to percentage
    matchDetails.skillsScore = (skillsScore / vacancy.requiredSkills.length) * 100;
  } else {
    // No required skills specified
    matchDetails.skillsScore = 100;
  }
  
  // Experience matching (30% of total score)
  if (vacancy.experienceRequired > 0 && candidate.experience && candidate.experience.length > 0) {
    // Estimate total years of experience
    const totalYears = estimateTotalExperience(candidate.experience);
    
    if (totalYears >= vacancy.experienceRequired) {
      experienceScore = 100;
    } else {
      // Partial score for experience
      experienceScore = (totalYears / vacancy.experienceRequired) * 100;
    }
  } else if (!vacancy.experienceRequired) {
    // No experience required
    experienceScore = 100;
  }
  
  matchDetails.experienceScore = experienceScore;
  
  // Education matching (20% of total score)
  if (candidate.education && candidate.education.length > 0) {
    // Simple scoring - having any education gives points
    educationScore = 100;
  }
  
  matchDetails.educationScore = educationScore;
  
  // Calculate total score with weightings
  matchDetails.totalScore = (
    (matchDetails.skillsScore * 0.5) + 
    (matchDetails.experienceScore * 0.3) + 
    (matchDetails.educationScore * 0.2)
  );
  
  return matchDetails;
}

/**
 * Estimates total years of experience from experience entries
 * @param {Array} experience - Experience entries
 * @returns {number} Estimated years of experience
 */
function estimateTotalExperience(experience) {
  let totalYears = 0;
  
  for (const entry of experience) {
    // Try to extract years from dates
    if (entry.startDate && (entry.endDate || entry.current)) {
      // Parse dates
      const startDate = new Date(entry.startDate);
      const endDate = entry.current ? new Date() : new Date(entry.endDate);
      
      // Calculate years difference
      const yearsDiff = (endDate - startDate) / (1000 * 60 * 60 * 24 * 365);
      
      if (yearsDiff > 0) {
        totalYears += yearsDiff;
      }
    } else if (entry.dates) {
      // If we only have a text representation of dates, try to extract years
      const years = entry.dates.match(/\b(19|20)\d{2}\b/g);
      
      if (years && years.length >= 2) {
        const yearsDiff = parseInt(years[1]) - parseInt(years[0]);
        
        if (yearsDiff > 0) {
          totalYears += yearsDiff;
        }
      }
    }
  }
  
  return Math.round(totalYears * 10) / 10; // Round to 1 decimal place
}

/**
 * Finds candidates matching a vacancy
 * @param {string} vacancyId - Vacancy ID
 * @returns {Array} Matching candidates with scores
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
    
    // Calculate match scores for each candidate
    const matchResults = candidates.map(candidate => {
      const matchScore = calculateMatchScore(candidate, vacancy);
      
      return {
        candidateId: candidate.id,
        candidateName: `${candidate.firstName} ${candidate.lastName}`,
        candidateEmail: candidate.email,
        cvUrl: candidate.cvUrl,
        matchScore: matchScore.totalScore,
        skillsScore: matchScore.skillsScore,
        experienceScore: matchScore.experienceScore,
        educationScore: matchScore.educationScore,
        matchedSkills: matchScore.matchedSkills,
        missingSkills: matchScore.missingSkills
      };
    });
    
    // Sort by match score (descending)
    return matchResults.sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    console.error("Error finding matching candidates:", error);
    throw error;
  }
}

module.exports = {
  calculateMatchScore,
  findMatchingCandidates
};