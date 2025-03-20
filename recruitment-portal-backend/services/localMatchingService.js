// services/localMatchingService.js
function predictCandidateMatchLocally(candidateFeatures, jobFeatures) {
    // Skills matching
    const candidateSkills = candidateFeatures.skills.map(s => s.toLowerCase());
    const requiredSkills = jobFeatures.requiredSkills.map(s => s.toLowerCase());
    
    const matchedSkills = [];
    const missingSkills = [];
    
    for (const skill of requiredSkills) {
      // Check for exact, partial, or semantic matches
      if (candidateSkills.some(cs => cs.includes(skill) || skill.includes(cs))) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    }
    
    // Calculate scores with improved logic
    const skillsScore = requiredSkills.length > 0 ? 
      (matchedSkills.length / requiredSkills.length) * 100 : 100;
    
    // Experience score with diminishing returns for extra experience
    const experienceYears = candidateFeatures.experienceYears || 0;
    const requiredExperience = jobFeatures.experienceRequired || 0;
    const experienceRatio = requiredExperience > 0 ? 
      Math.min(experienceYears / requiredExperience, 1.5) / 1.5 : 1;
    const experienceScore = experienceRatio * 100;
    
    // Education score
    let educationScore = 50; // baseline
    if (candidateFeatures.educationLevel) {
      const eduLevels = {
        'high school': 30,
        'associate': 50,
        'bachelor': 75,
        'master': 90,
        'doctorate': 100,
        'phd': 100
      };
      
      for (const [level, score] of Object.entries(eduLevels)) {
        if (candidateFeatures.educationLevel.toLowerCase().includes(level)) {
          educationScore = score;
          break;
        }
      }
    }
    
    // Final weighted score
    const overallScore = (
      (skillsScore * 0.5) + 
      (experienceScore * 0.3) + 
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
  
  module.exports = { predictCandidateMatchLocally };