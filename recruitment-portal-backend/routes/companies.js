// routes/companies.js
const express = require('express');
const router = express.Router();
const { CosmosClient } = require('@azure/cosmos');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const { searchCandidates } = require('../services/cognitiveSearch');
const { predictCandidateMatch } = require('../services/azureOpenaiMatching');


// Initialize Cosmos DB client
const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY
});
const database = cosmosClient.database(process.env.COSMOS_DATABASE);
const companiesContainer = database.container('Companies');
const vacanciesContainer = database.container('Vacancies');
const applicationsContainer = database.container('Applications');
const candidatesContainer = database.container('Candidates');

// Get company profile
router.get('/profile', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    const { resources } = await companiesContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.userId = @userId",
        parameters: [{ name: "@userId", value: req.user.id }]
      })
      .fetchAll();
    
    if (resources.length === 0) {
      return res.status(404).json({ message: 'Company profile not found' });
    }
    
    const company = resources[0];
    
    res.json({
      company: {
        id: company.id,
        userId: company.userId,
        name: company.name,
        email: company.email,
        industry: company.industry,
        description: company.description
      }
    });
  } catch (error) {
    console.error('Error fetching company profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update company profile
router.put('/profile', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    const { name, industry, description } = req.body;
    
    const { resources } = await companiesContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.userId = @userId",
        parameters: [{ name: "@userId", value: req.user.id }]
      })
      .fetchAll();
    
    if (resources.length === 0) {
      return res.status(404).json({ message: 'Company profile not found' });
    }
    
    const company = resources[0];
    
    // Update company
    const updatedCompany = {
      ...company,
      name: name || company.name,
      industry: industry || company.industry,
      description: description || company.description,
      updatedAt: new Date().toISOString()
    };
    
    await companiesContainer.item(company.id).replace(updatedCompany);
    
    res.json({
      message: 'Profile updated successfully',
      company: {
        id: updatedCompany.id,
        userId: updatedCompany.userId,
        name: updatedCompany.name,
        email: updatedCompany.email,
        industry: updatedCompany.industry,
        description: updatedCompany.description
      }
    });
  } catch (error) {
    console.error('Error updating company profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// Create a vacancy
router.post('/vacancies', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    const { title, description, requiredSkills, experienceRequired, closingDate } = req.body;
    
    // Get company
    const { resources: companyResources } = await companiesContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.userId = @userId",
        parameters: [{ name: "@userId", value: req.user.id }]
      })
      .fetchAll();
    
    if (companyResources.length === 0) {
      return res.status(404).json({ message: 'Company profile not found' });
    }
    
    const company = companyResources[0];
    
    // Create vacancy
    const newVacancy = {
      id: new Date().getTime().toString(),
      companyId: company.id,
      title,
      description,
      requiredSkills: requiredSkills || [],
      experienceRequired: experienceRequired || 0,
      postingDate: new Date().toISOString(),
      closingDate: closingDate || null,
      status: 'open'
    };
    
    await vacanciesContainer.items.create(newVacancy);
    
    res.status(201).json({
      message: 'Vacancy created successfully',
      vacancy: newVacancy
    });
  } catch (error) {
    console.error('Error creating vacancy:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all company vacancies
router.get('/vacancies', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    // Get company
    const { resources: companyResources } = await companiesContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.userId = @userId",
        parameters: [{ name: "@userId", value: req.user.id }]
      })
      .fetchAll();
    
    if (companyResources.length === 0) {
      return res.status(404).json({ message: 'Company profile not found' });
    }
    
    const company = companyResources[0];
    
    // Get vacancies
    const { resources: vacancies } = await vacanciesContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.companyId = @companyId",
        parameters: [{ name: "@companyId", value: company.id }]
      })
      .fetchAll();
    
    res.json({
      vacancies
    });
  } catch (error) {
    console.error('Error fetching vacancies:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific vacancy
router.get('/vacancies/:id', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get vacancy
    const { resource: vacancy } = await vacanciesContainer.item(id).read();
    
    if (!vacancy) {
      return res.status(404).json({ message: 'Vacancy not found' });
    }
    
    // Get company
    const { resources: companyResources } = await companiesContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.userId = @userId",
        parameters: [{ name: "@userId", value: req.user.id }]
      })
      .fetchAll();
    
    if (companyResources.length === 0) {
      return res.status(404).json({ message: 'Company profile not found' });
    }
    
    const company = companyResources[0];
    
    // Check if vacancy belongs to company
    if (vacancy.companyId !== company.id) {
      return res.status(403).json({ message: 'Not authorized to access this vacancy' });
    }
    
    res.json({
      vacancy
    });
  } catch (error) {
    console.error('Error fetching vacancy:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/vacancies/public', async (req, res) => {
  try {
    // Get all open vacancies
    const { resources: vacancies } = await vacanciesContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.status = 'open'"
      })
      .fetchAll();
    
    // For each vacancy, get the company name
    const vacanciesWithCompanyInfo = await Promise.all(
      vacancies.map(async (vacancy) => {
        try {
          const { resource: company } = await companiesContainer.item(vacancy.companyId).read();
          return {
            ...vacancy,
            companyName: company?.name || 'Unknown Company',
            industry: company?.industry || 'Unknown Industry'
          };
        } catch (err) {
          return {
            ...vacancy,
            companyName: 'Unknown Company',
            industry: 'Unknown Industry'
          };
        }
      })
    );
    
    res.json({
      vacancies: vacanciesWithCompanyInfo
    });
  } catch (error) {
    console.error('Error fetching public vacancies:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Enhanced endpoint to fetch applications with candidate data
router.get('/vacancies/:id/applications', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Received request for applications of vacancy ${id}`);
    
    // Get applications for this vacancy
    const { resources: applications } = await applicationsContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.vacancyId = @vacancyId",
        parameters: [{ name: "@vacancyId", value: id }]
      })
      .fetchAll();
    
    console.log(`Found ${applications.length} applications for vacancy ${id}`);
    
    // For each application, get the candidate details
    const applicationsWithCandidates = await Promise.all(
      applications.map(async (application) => {
        try {
          // Get candidate details
          const { resources: candidates } = await candidatesContainer.items
            .query({
              query: "SELECT * FROM c WHERE c.id = @candidateId",
              parameters: [{ name: "@candidateId", value: application.candidateId }]
            })
            .fetchAll();
          
          const candidate = candidates.length > 0 ? candidates[0] : null;
          
          // Return application with candidate details
          return {
            ...application,
            candidate: candidate ? {
              id: candidate.id,
              firstName: candidate.firstName,
              lastName: candidate.lastName,
              email: candidate.email,
              cvUrl: candidate.cvUrl,
              skills: candidate.skills || [],
              // Include other relevant candidate information
            } : null
          };
        } catch (err) {
          console.error(`Error fetching candidate for application ${application.id}:`, err);
          return application; // Return original application if candidate fetch fails
        }
      })
    );
    
    // Return applications with candidate details
    res.json({
      applications: applicationsWithCandidates
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a vacancy
router.put('/vacancies/:id', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, requiredSkills, experienceRequired, closingDate, status } = req.body;
    
    // Get vacancy
    const { resource: vacancy } = await vacanciesContainer.item(id).read();
    
    if (!vacancy) {
      return res.status(404).json({ message: 'Vacancy not found' });
    }
    
    // Get company
    const { resources: companyResources } = await companiesContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.userId = @userId",
        parameters: [{ name: "@userId", value: req.user.id }]
      })
      .fetchAll();
    
    if (companyResources.length === 0) {
      return res.status(404).json({ message: 'Company profile not found' });
    }
    
    const company = companyResources[0];
    
    // Check if vacancy belongs to company
    if (vacancy.companyId !== company.id) {
      return res.status(403).json({ message: 'Not authorized to update this vacancy' });
    }
    
    // Update vacancy
    const updatedVacancy = {
      ...vacancy,
      title: title || vacancy.title,
      description: description || vacancy.description,
      requiredSkills: requiredSkills || vacancy.requiredSkills,
      experienceRequired: experienceRequired !== undefined ? experienceRequired : vacancy.experienceRequired,
      closingDate: closingDate || vacancy.closingDate,
      status: status || vacancy.status,
      updatedAt: new Date().toISOString()
    };
    
    await vacanciesContainer.item(id).replace(updatedVacancy);
    
    res.json({
      message: 'Vacancy updated successfully',
      vacancy: updatedVacancy
    });
  } catch (error) {
    console.error('Error updating vacancy:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Improved vacancy deletion route in routes/companies.js
router.delete('/vacancies/:id', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      console.error('Delete vacancy request missing ID param');
      return res.status(400).json({ message: 'Vacancy ID is required' });
    }
    
    console.log(`Processing request to delete vacancy ID: ${id}`);
    
    // Get vacancy - but handle case where it might not exist
    try {
      // Check if vacancy exists first
      const queryResponse = await vacanciesContainer.items
        .query({
          query: "SELECT * FROM c WHERE c.id = @id",
          parameters: [{ name: "@id", value: id }]
        })
        .fetchAll();
      
      if (queryResponse.resources.length === 0) {
        console.log(`Vacancy not found with ID: ${id}`);
        return res.status(404).json({ message: 'Vacancy not found' });
      }
      
      const vacancy = queryResponse.resources[0];
      
      // Get company
      const { resources: companyResources } = await companiesContainer.items
        .query({
          query: "SELECT * FROM c WHERE c.userId = @userId",
          parameters: [{ name: "@userId", value: req.user.id }]
        })
        .fetchAll();
      
      if (companyResources.length === 0) {
        return res.status(404).json({ message: 'Company profile not found' });
      }
      
      const company = companyResources[0];
      
      // Check if vacancy belongs to company
      if (vacancy.companyId !== company.id) {
        return res.status(403).json({ message: 'Not authorized to delete this vacancy' });
      }
      
      // Delete vacancy
      await vacanciesContainer.item(id, id).delete();
      
      // Also delete any applications for this vacancy
      const { resources: applications } = await applicationsContainer.items
        .query({
          query: "SELECT * FROM c WHERE c.vacancyId = @vacancyId",
          parameters: [{ name: "@vacancyId", value: id }]
        })
        .fetchAll();
      
      // Delete each application
      for (const application of applications) {
        await applicationsContainer.item(application.id, application.id).delete();
      }
      
      console.log(`Successfully deleted vacancy ${id} and ${applications.length} associated applications`);
      
      res.json({
        message: 'Vacancy deleted successfully',
        deletedApplications: applications.length
      });
      
    } catch (resourceError) {
      console.error(`Error retrieving vacancy ${id}:`, resourceError);
      return res.status(500).json({ 
        message: 'Error retrieving vacancy', 
        details: resourceError.message 
      });
    }
  } catch (error) {
    console.error('Error deleting vacancy:', error);
    res.status(500).json({ 
      message: 'Server error during vacancy deletion', 
      details: error.message 
    });
  }
});


// Update application status
router.put('/applications/:id', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Get application
    const { resource: application } = await applicationsContainer.item(id).read();
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Get vacancy
    const { resource: vacancy } = await vacanciesContainer.item(application.vacancyId).read();
    
    // Get company
    const { resources: companyResources } = await companiesContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.userId = @userId",
        parameters: [{ name: "@userId", value: req.user.id }]
      })
      .fetchAll();
    
    if (companyResources.length === 0) {
      return res.status(404).json({ message: 'Company profile not found' });
    }
    
    const company = companyResources[0];
    
    // Check if vacancy belongs to company
    if (vacancy.companyId !== company.id) {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }
    
    // Update application
    await applicationsContainer.item(id).patch([
      { op: 'replace', path: '/status', value: status },
      { op: 'replace', path: '/updatedAt', value: new Date().toISOString() }
    ]);
    
    res.json({
      message: 'Application status updated successfully'
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Add this route to routes/companies.js (before the route for '/vacancies/:id')

// Public endpoint for open vacancies - Make sure this route is above the wildcard routes!
router.get('/vacancies/public', async (req, res) => {
  try {
    // Get all open vacancies
    const { resources: vacancies } = await vacanciesContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.status = 'open'"
      })
      .fetchAll();
    
    // For each vacancy, get the company name
    const vacanciesWithCompanyInfo = await Promise.all(
      vacancies.map(async (vacancy) => {
        try {
          const { resource: company } = await companiesContainer.item(vacancy.companyId).read();
          return {
            ...vacancy,
            companyName: company?.name || 'Unknown Company',
            industry: company?.industry || 'Unknown Industry'
          };
        } catch (err) {
          return {
            ...vacancy,
            companyName: 'Unknown Company',
            industry: 'Unknown Industry'
          };
        }
      })
    );
    
    res.json({
      vacancies: vacanciesWithCompanyInfo
    });
  } catch (error) {
    console.error('Error fetching public vacancies:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Configure AI interview questions for a vacancy (placeholder)
router.post('/vacancies/:id/interview-config', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { questions } = req.body;
    
    // Get vacancy
    const { resource: vacancy } = await vacanciesContainer.item(id).read();
    
    if (!vacancy) {
      return res.status(404).json({ message: 'Vacancy not found' });
    }
    
    // Get company
    const { resources: companyResources } = await companiesContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.userId = @userId",
        parameters: [{ name: "@userId", value: req.user.id }]
      })
      .fetchAll();
    
    if (companyResources.length === 0) {
      return res.status(404).json({ message: 'Company profile not found' });
    }
    
    const company = companyResources[0];
    
    // Check if vacancy belongs to company
    if (vacancy.companyId !== company.id) {
      return res.status(403).json({ message: 'Not authorized to configure interviews for this vacancy' });
    }
    
    // Update vacancy with interview configuration
    await vacanciesContainer.item(id).patch([
      { op: 'replace', path: '/interviewQuestions', value: questions },
      { op: 'replace', path: '/updatedAt', value: new Date().toISOString() }
    ]);
    
    res.json({
      message: 'Interview questions configured successfully'
    });
  } catch (error) {
    console.error('Error configuring interview questions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add to routes/companies.js
const { findMatchingCandidates } = require('../services/jobMatching');

// Add a new route to get candidate matches for a vacancy
router.get('/vacancies/:id/matches', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get vacancy
    const { resource: vacancy } = await vacanciesContainer.item(id).read();
    
    if (!vacancy) {
      return res.status(404).json({ message: 'Vacancy not found' });
    }
    
    // Get company
    const { resources: companyResources } = await companiesContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.userId = @userId",
        parameters: [{ name: "@userId", value: req.user.id }]
      })
      .fetchAll();
    
    if (companyResources.length === 0) {
      return res.status(404).json({ message: 'Company profile not found' });
    }
    
    const company = companyResources[0];
    
    // Check if vacancy belongs to company
    if (vacancy.companyId !== company.id) {
      return res.status(403).json({ message: 'Not authorized to access matches for this vacancy' });
    }
    
    // Get matching candidates
    const matches = await findMatchingCandidates(id);
    
    res.json({
      vacancy: {
        id: vacancy.id,
        title: vacancy.title
      },
      matches
    });
  } catch (error) {
    console.error('Error fetching candidate matches:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// In routes/companies.js

// Get a candidate profile
router.get('/candidates/:id', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get candidate
    const { resource: candidate } = await candidatesContainer.item(id).read();
    
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    
    // Remove sensitive information
    const { cvRawText, ...candidateInfo } = candidate;
    
    res.json({
      candidate: candidateInfo
    });
  } catch (error) {
    console.error('Error fetching candidate profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific candidate match for a vacancy
router.get('/vacancies/:vacancyId/matches/:candidateId', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    const { vacancyId, candidateId } = req.params;
    
    // Get vacancy
    const { resource: vacancy } = await vacanciesContainer.item(vacancyId).read();
    
    if (!vacancy) {
      return res.status(404).json({ message: 'Vacancy not found' });
    }
    
    // Get company
    const { resources: companyResources } = await companiesContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.userId = @userId",
        parameters: [{ name: "@userId", value: req.user.id }]
      })
      .fetchAll();
    
    if (companyResources.length === 0) {
      return res.status(404).json({ message: 'Company profile not found' });
    }
    
    const company = companyResources[0];
    
    // Check if vacancy belongs to company
    if (vacancy.companyId !== company.id) {
      return res.status(403).json({ message: 'Not authorized to access matches for this vacancy' });
    }
    
    // Get candidate
    const { resource: candidate } = await candidatesContainer.item(candidateId).read();
    
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    
    // Calculate match score
    const { calculateMatchScore } = require('../services/jobMatching');
    const matchScore = calculateMatchScore(candidate, vacancy);
    
    res.json({
      match: matchScore
    });
  } catch (error) {
    console.error('Error fetching candidate match:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Advanced candidate search
router.post('/candidates/search', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    const searchParams = req.body;
    
    // Use Azure Cognitive Search for advanced search
    const searchResults = await searchCandidates(searchParams);
    
    res.json({
      candidates: searchResults.candidates,
      totalCount: searchResults.count
    });
  } catch (error) {
    console.error('Error searching candidates:', error);
    res.status(500).json({ message: 'Server error during search' });
  }
});
// Match candidates to a specific vacancy with additional filtering
router.post('/vacancies/:id/match', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    const { id: vacancyId } = req.params;
    const { minMatchScore, maxCandidates } = req.body;
    
    // Get vacancy details
    const { resource: vacancy } = await vacanciesContainer.item(vacancyId).read();
    
    if (!vacancy) {
      return res.status(404).json({ message: 'Vacancy not found' });
    }
    
    // Get all candidates
    const { resources: candidates } = await candidatesContainer.items.readAll().fetchAll();
    
    // Use Azure ML to get match predictions for each candidate
    const matchPromises = candidates.map(async (candidate) => {
      // Extract candidate features
      const candidateFeatures = {
        skills: candidate.skills || [],
        experienceYears: estimateTotalExperience(candidate.experience || []),
        educationLevel: getHighestEducationLevel(candidate.education || [])
      };
      
      // Extract job features
      const jobFeatures = {
        requiredSkills: vacancy.requiredSkills || [],
        experienceRequired: vacancy.experienceRequired || 0,
        title: vacancy.title || '',
        description: vacancy.description || ''
      };
      
      // Get prediction from Azure ML
      const matchPrediction = await predictCandidateMatch(candidateFeatures, jobFeatures);
      
      return {
        candidateId: candidate.id,
        candidateName: `${candidate.firstName} ${candidate.lastName}`,
        candidateEmail: candidate.email,
        cvUrl: candidate.cvUrl,
        matchScore: matchPrediction.overallScore,
        skillsScore: matchPrediction.skillsScore,
        experienceScore: matchPrediction.experienceScore,
        educationScore: matchPrediction.educationScore,
        culturalFitScore: matchPrediction.culturalFitScore,
        matchedSkills: matchPrediction.matchDetails?.matchedSkills || [],
        missingSkills: matchPrediction.matchDetails?.missingSkills || [],
        confidence: matchPrediction.confidence
      };
    });
    
    const matchResults = await Promise.all(matchPromises);
    
    // Apply filters and sorting
    let filteredMatches = matchResults;
    
    if (minMatchScore) {
      filteredMatches = filteredMatches.filter(match => match.matchScore >= minMatchScore);
    }
    
    // Sort by match score (descending)
    filteredMatches.sort((a, b) => b.matchScore - a.matchScore);
    
    // Limit results if specified
    if (maxCandidates && maxCandidates > 0) {
      filteredMatches = filteredMatches.slice(0, maxCandidates);
    }
    
    res.json({
      vacancy: {
        id: vacancyId,
        title: vacancy.title,
        requiredSkills: vacancy.requiredSkills
      },
      matches: filteredMatches,
      totalMatches: matchResults.length,
      filteredMatches: filteredMatches.length
    });
  } catch (error) {
    console.error('Error matching candidates to vacancy:', error);
    res.status(500).json({ message: 'Server error during matching' });
  }
});

// routes/companies.js - Add this route to your existing companies.js file

// Enhanced candidate search route that combines general search with AI matching
router.post('/candidates/enhanced-search', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    const {
      skills = [],
      experienceMin,
      experienceMax,
      education,
      location,
      fuzzyMatching = true,
      minMatchScore = 0,
      maxMatchScore = 100,
      sortBy = 'matchScore',
      maxResults = 100
    } = req.body;
    
    console.log(`Processing enhanced candidate search with ${skills.length} skills and fuzzyMatching=${fuzzyMatching}`);
    
    // Get all candidates from database
    const { resources: candidates } = await candidatesContainer.items.readAll().fetchAll();
    console.log(`Found ${candidates.length} total candidates in the database`);
    
    // Build match scores for each candidate
    const matchResults = await Promise.all(candidates.map(async (candidate) => {
      try {
        // Extract candidate features
        const candidateFeatures = {
          skills: candidate.skills || [],
          experienceYears: estimateTotalExperience(candidate.experience || []),
          educationLevel: getHighestEducationLevel(candidate.education || [])
        };
        
        // Extract job features from search params
        const jobFeatures = {
          requiredSkills: skills,
          experienceRequired: experienceMin || 0,
          title: 'Custom Search',
          description: `Custom search for candidates with skills in ${skills.join(', ')}`
        };
        
        // Calculate scores using job matching service
        let matchDetails;
        try {
          // First try with the AI matching service
          matchDetails = await predictCandidateMatch(candidateFeatures, jobFeatures);
        } catch (aiError) {
          console.warn('AI matching service error, falling back to local matching:', aiError.message);
          // Fall back to rule-based matching if AI service fails
          const { calculateMatchScore } = require('../services/jobMatching');
          matchDetails = await calculateMatchScore(candidate, { requiredSkills: skills, experienceRequired: experienceMin || 0 });
        }
        
        // Apply additional filters
        let matchesFilters = true;
        
        // Experience filter
        if (experienceMin !== undefined) {
          const totalYears = estimateTotalExperience(candidate.experience || []);
          if (totalYears < experienceMin) {
            matchesFilters = false;
          }
        }
        
        if (experienceMax !== undefined) {
          const totalYears = estimateTotalExperience(candidate.experience || []);
          if (totalYears > experienceMax) {
            matchesFilters = false;
          }
        }
        
        // Education filter
        if (education) {
          const highestEducation = getHighestEducationLevel(candidate.education || []);
          const eduLevels = {
            'high school': 1,
            'associate': 2,
            'bachelor': 3,
            'master': 4,
            'doctorate': 5,
            'phd': 5
          };
          
          const requiredLevel = eduLevels[education.toLowerCase()] || 0;
          const candidateLevel = eduLevels[highestEducation.toLowerCase()] || 0;
          
          if (candidateLevel < requiredLevel) {
            matchesFilters = false;
          }
        }
        
        // Location filter (simple text match for now)
        if (location && candidate.location) {
          if (!candidate.location.toLowerCase().includes(location.toLowerCase())) {
            matchesFilters = false;
          }
        }
        
        // Match score filters
        if (matchDetails.totalScore < minMatchScore || matchDetails.totalScore > maxMatchScore) {
          matchesFilters = false;
        }
        
        // Only include candidates that match all filters
        if (!matchesFilters) {
          return null;
        }
        
        // Return standardized result format
        return {
          candidateId: candidate.id,
          candidateName: `${candidate.firstName} ${candidate.lastName}`,
          candidateEmail: candidate.email,
          cvUrl: candidate.cvUrl,
          matchScore: matchDetails.totalScore,
          skillsScore: matchDetails.skillsScore,
          experienceScore: matchDetails.experienceScore,
          educationScore: matchDetails.educationScore,
          matchedSkills: matchDetails.matchedSkills || [],
          missingSkills: matchDetails.missingSkills || [],
          analysis: {
            experience: matchDetails.analysis ? matchDetails.analysis.experience : null
          }
        };
      } catch (candidateError) {
        console.error(`Error processing candidate ${candidate.id}:`, candidateError);
        return null; // Skip candidates that cause errors
      }
    }));
    
    // Filter out null results and sort
    const validResults = matchResults.filter(result => result !== null);
    console.log(`Found ${validResults.length} matching candidates after filtering`);
    
    // Sort results
    const sortedResults = [...validResults].sort((a, b) => {
      switch (sortBy) {
        case 'skillsScore':
          return b.skillsScore - a.skillsScore;
        case 'experienceScore':
          return b.experienceScore - a.experienceScore;
        case 'educationScore':
          return b.educationScore - a.educationScore;
        case 'matchScore':
        default:
          return b.matchScore - a.matchScore;
      }
    });
    
    // Limit results
    const limitedResults = sortedResults.slice(0, maxResults);
    
    res.json({
      candidates: limitedResults,
      totalCount: validResults.length,
      filteredCount: limitedResults.length
    });
  } catch (error) {
    console.error('Error in enhanced candidate search:', error);
    res.status(500).json({ message: 'Server error during search' });
  }
});

// Enhanced vacancy matching endpoint with more flexible filtering
router.post('/vacancies/:id/match', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    const { id: vacancyId } = req.params;
    const { 
      minMatchScore = 0, 
      maxMatchScore = 100,
      fuzzyMatching = true,
      skillFilters = [],
      experienceMin,
      experienceMax,
      education,
      location,
      maxResults = 100
    } = req.body;
    
    // Get vacancy details
    const { resource: vacancy } = await vacanciesContainer.item(vacancyId).read();
    
    if (!vacancy) {
      return res.status(404).json({ message: 'Vacancy not found' });
    }
    
    // Get all candidates
    const { resources: candidates } = await candidatesContainer.items.readAll().fetchAll();
    
    // Use Azure ML to get match predictions for each candidate
    const matchPromises = candidates.map(async (candidate) => {
      try {
        // Extract candidate features
        const candidateFeatures = {
          skills: candidate.skills || [],
          experienceYears: estimateTotalExperience(candidate.experience || []),
          educationLevel: getHighestEducationLevel(candidate.education || [])
        };
        
        // Extract job features
        const jobFeatures = {
          requiredSkills: vacancy.requiredSkills || [],
          experienceRequired: vacancy.experienceRequired || 0,
          title: vacancy.title || '',
          description: vacancy.description || ''
        };
        
        // Get prediction from Azure ML (or fallback to local matching)
        let matchPrediction;
        try {
          matchPrediction = await predictCandidateMatch(candidateFeatures, jobFeatures);
        } catch (aiError) {
          console.warn('AI matching service error, falling back to local matching:', aiError.message);
          // Fall back to rule-based matching
          const { calculateMatchScore } = require('../services/jobMatching');
          matchPrediction = await calculateMatchScore(candidate, vacancy);
        }
        
        // Apply additional filters
        let matchesFilters = true;
        
        // Match score filter
        if (matchPrediction.overallScore < minMatchScore || matchPrediction.overallScore > maxMatchScore) {
          matchesFilters = false;
        }
        
        // Skill filters - if specific skills are required to be present
        if (skillFilters.length > 0) {
          const candidateSkills = candidate.skills.map(s => s.toLowerCase());
          const missingRequiredSkills = skillFilters.some(skill => 
            !candidateSkills.some(cs => 
              cs.includes(skill.toLowerCase()) || 
              skill.toLowerCase().includes(cs)
            )
          );
          
          if (missingRequiredSkills) {
            matchesFilters = false;
          }
        }
        
        // Experience filters
        if (experienceMin !== undefined) {
          const totalYears = estimateTotalExperience(candidate.experience || []);
          if (totalYears < experienceMin) {
            matchesFilters = false;
          }
        }
        
        if (experienceMax !== undefined) {
          const totalYears = estimateTotalExperience(candidate.experience || []);
          if (totalYears > experienceMax) {
            matchesFilters = false;
          }
        }
        
        // Education filter
        if (education) {
          const highestEducation = getHighestEducationLevel(candidate.education || []);
          if (!highestEducation.toLowerCase().includes(education.toLowerCase())) {
            matchesFilters = false;
          }
        }
        
        // Location filter
        if (location && candidate.location) {
          if (!candidate.location.toLowerCase().includes(location.toLowerCase())) {
            matchesFilters = false;
          }
        }
        
        // Only return candidates that match all filters
        if (!matchesFilters) {
          return null;
        }
        
        return {
          candidateId: candidate.id,
          candidateName: `${candidate.firstName} ${candidate.lastName}`,
          candidateEmail: candidate.email,
          cvUrl: candidate.cvUrl,
          matchScore: matchPrediction.overallScore,
          skillsScore: matchPrediction.skillsScore,
          experienceScore: matchPrediction.experienceScore,
          educationScore: matchPrediction.educationScore,
          culturalFitScore: matchPrediction.culturalFitScore,
          matchedSkills: matchPrediction.matchDetails?.matchedSkills || [],
          missingSkills: matchPrediction.matchDetails?.missingSkills || [],
          confidence: matchPrediction.confidence,
          analysis: {
            experience: {
              totalYears: estimateTotalExperience(candidate.experience || []),
              requiredYears: vacancy.experienceRequired || 0,
              relevance: matchPrediction.experienceScore,
              recency: 80 // Default value as a placeholder
            }
          }
        };
      } catch (candidateError) {
        console.error(`Error analyzing candidate ${candidate.id}:`, candidateError);
        return null; // Skip candidates with errors
      }
    });
    
    // Wait for all matches to complete
    const matchResults = await Promise.all(matchPromises);
    
    // Filter out null results (failed or filtered out)
    const validResults = matchResults.filter(result => result !== null);
    
    // Sort by match score (descending)
    validResults.sort((a, b) => b.matchScore - a.matchScore);
    
    // Limit results if requested
    const limitedResults = maxResults ? validResults.slice(0, maxResults) : validResults;
    
    res.json({
      vacancy: {
        id: vacancyId,
        title: vacancy.title,
        requiredSkills: vacancy.requiredSkills
      },
      matches: limitedResults,
      totalMatches: candidates.length,
      filteredMatches: validResults.length
    });
  } catch (error) {
    console.error('Error matching candidates to vacancy:', error);
    res.status(500).json({ message: 'Server error during matching' });
  }
});

// Skill gap analysis endpoint
router.post('/vacancies/:id/skill-gap-analysis', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    const { id: vacancyId } = req.params;
    const { candidateIds = [] } = req.body;
    
    // Get vacancy details
    const { resource: vacancy } = await vacanciesContainer.item(vacancyId).read();
    
    if (!vacancy) {
      return res.status(404).json({ message: 'Vacancy not found' });
    }
    
    if (!vacancy.requiredSkills || vacancy.requiredSkills.length === 0) {
      return res.status(400).json({ message: 'Vacancy has no required skills defined' });
    }
    
    // Get candidates to analyze
    let candidates = [];
    
    if (candidateIds.length > 0) {
      // Get specific candidates
      const candidatesPromises = candidateIds.map(id => candidatesContainer.item(id).read());
      const candidateResponses = await Promise.all(candidatesPromises);
      candidates = candidateResponses.map(response => response.resource).filter(c => c !== undefined);
    } else {
      // Get all candidates who have applied to this vacancy
      const { resources: applications } = await applicationsContainer.items
        .query({
          query: "SELECT * FROM c WHERE c.vacancyId = @vacancyId",
          parameters: [{ name: "@vacancyId", value: vacancyId }]
        })
        .fetchAll();
      
      const applicantIds = applications.map(app => app.candidateId);
      
      if (applicantIds.length > 0) {
        const candidatesPromises = applicantIds.map(id => candidatesContainer.item(id).read());
        const candidateResponses = await Promise.all(candidatesPromises);
        candidates = candidateResponses.map(response => response.resource).filter(c => c !== undefined);
      }
    }
    
    if (candidates.length === 0) {
      return res.status(404).json({ message: 'No candidates found for analysis' });
    }
    
    // Analyze skill gaps
    const skillGapAnalysis = vacancy.requiredSkills.map(skill => {
      // Count candidates with this skill
      const candidatesWithSkill = candidates.filter(candidate => 
        (candidate.skills || []).some(candidateSkill => 
          candidateSkill.toLowerCase().includes(skill.toLowerCase()) || 
          skill.toLowerCase().includes(candidateSkill.toLowerCase())
        )
      );
      
      const percentage = Math.round((candidatesWithSkill.length / candidates.length) * 100);
      
      return {
        skill,
        count: candidatesWithSkill.length,
        percentage,
        candidates: candidatesWithSkill.map(c => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`
        }))
      };
    });
    
    // Sort by coverage (ascending - most problematic skills first)
    skillGapAnalysis.sort((a, b) => a.percentage - b.percentage);
    
    // Calculate overall statistics
    const totalSkills = vacancy.requiredSkills.length;
    const averageCoverage = Math.round(
      skillGapAnalysis.reduce((sum, item) => sum + item.percentage, 0) / totalSkills
    );
    
    // Identify skill gaps (skills with < 30% coverage)
    const skillGaps = skillGapAnalysis.filter(item => item.percentage < 30).map(item => item.skill);
    
    // Identify skills with good coverage (> 70%)
    const wellCoveredSkills = skillGapAnalysis.filter(item => item.percentage > 70).map(item => item.skill);
    
    res.json({
      vacancy: {
        id: vacancyId,
        title: vacancy.title
      },
      skillAnalysis: skillGapAnalysis,
      statistics: {
        totalCandidates: candidates.length,
        totalSkills,
        averageCoverage,
        skillGaps,
        wellCoveredSkills
      },
      recommendations: skillGaps.length > 0 ? [
        "Consider broadening your search criteria or adjusting requirements for hard-to-find skills.",
        "These skill gaps may indicate a need for training existing candidates or recruiting from different sources.",
        "Consider offering training programs or mentorship for candidates with potential but lacking specific skills."
      ] : [
        "Your candidate pool has good coverage of the required skills.",
        "Consider focusing on other factors like cultural fit and experience quality."
      ]
    });
  } catch (error) {
    console.error('Error analyzing skill gaps:', error);
    res.status(500).json({ message: 'Server error during skill gap analysis' });
  }
});


// Updated getRecommendations route in routes/companies.js
router.get('/recommendations', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    // Get max candidates parameter from query string (default to 2)
    const maxTopCandidates = parseInt(req.query.maxCandidates) || 2;
    
    // Get company ID
    const { resources: companyResources } = await companiesContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.userId = @userId",
        parameters: [{ name: "@userId", value: req.user.id }]
      })
      .fetchAll();
    
    if (companyResources.length === 0) {
      return res.status(404).json({ message: 'Company profile not found' });
    }
    
    const company = companyResources[0];
    
    // Get all active vacancies for the company
    const { resources: vacancies } = await vacanciesContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.companyId = @companyId AND c.status = 'open'",
        parameters: [{ name: "@companyId", value: company.id }]
      })
      .fetchAll();
    
    if (vacancies.length === 0) {
      return res.json({
        message: 'No active vacancies found',
        recommendationsByVacancy: [],
        versatileCandidates: []
      });
    }
    
    // Process each vacancy to get recommendations
    const recommendationsPromises = vacancies.map(async vacancy => {
      try {
        // Get applications for this vacancy directly - this contains all the match data we need
        const { resources: applications } = await applicationsContainer.items
          .query({
            query: "SELECT * FROM c WHERE c.vacancyId = @vacancyId",
            parameters: [{ name: "@vacancyId", value: vacancy.id }]
          })
          .fetchAll();
        
        // Check if we have any applications
        if (applications.length === 0) {
          return {
            vacancyId: vacancy.id,
            vacancyTitle: vacancy.title,
            applicantCount: 0,
            topCandidates: []
          };
        }
        
        // Convert applications to candidate format, including match score
        const candidates = await Promise.all(applications.map(async application => {
          // Get candidate info (either from application.candidate, application.candidateInfo or by ID lookup)
          let candidateInfo = application.candidate || application.candidateInfo;
          
          if (!candidateInfo && application.candidateId) {
            try {
              const { resource } = await candidatesContainer.item(application.candidateId).read();
              candidateInfo = resource;
            } catch (err) {
              console.error(`Error fetching candidate ${application.candidateId}:`, err);
              // Create minimal candidateInfo if lookup fails
              candidateInfo = { 
                id: application.candidateId,
                firstName: 'Unknown',
                lastName: 'Candidate',
                email: 'unknown@example.com'
              };
            }
          }
          
          // Extract suitability score - looking in all possible locations
          const suitabilityScore = 
            application.suitabilityScore?.overall || 
            application.matchScore || 
            (typeof application.suitabilityScore === 'number' ? application.suitabilityScore : 0);
          
          return {
            candidateId: application.candidateId,
            candidateName: candidateInfo ? `${candidateInfo.firstName} ${candidateInfo.lastName}` : 'Unknown Candidate',
            candidateEmail: candidateInfo?.email || 'unknown@example.com',
            cvUrl: candidateInfo?.cvUrl,
            matchScore: suitabilityScore,
            status: application.status,
            appliedAt: application.appliedAt
          };
        }));
        
        // Sort candidates by match score (highest first)
        candidates.sort((a, b) => b.matchScore - a.matchScore);
        
        // Return the top N candidates
        return {
          vacancyId: vacancy.id,
          vacancyTitle: vacancy.title,
          applicantCount: applications.length,
          topCandidates: candidates.slice(0, maxTopCandidates)
        };
      } catch (error) {
        console.error(`Error processing vacancy ${vacancy.id}:`, error);
        return {
          vacancyId: vacancy.id,
          vacancyTitle: vacancy.title,
          applicantCount: 0,
          topCandidates: []
        };
      }
    });
    
    const recommendationsByVacancy = await Promise.all(recommendationsPromises);
    
    // Find candidates that appear in multiple vacancies (versatile candidates)
    const candidateVacancyMatches = {};
    
    recommendationsByVacancy.forEach(vacancyRec => {
      vacancyRec.topCandidates.forEach(candidate => {
        if (!candidateVacancyMatches[candidate.candidateId]) {
          candidateVacancyMatches[candidate.candidateId] = {
            candidate: candidate,
            vacancyMatches: []
          };
        }
        
        candidateVacancyMatches[candidate.candidateId].vacancyMatches.push({
          vacancyId: vacancyRec.vacancyId,
          vacancyTitle: vacancyRec.vacancyTitle,
          matchScore: candidate.matchScore
        });
      });
    });
    
    // Get candidates that match multiple vacancies
    const versatileCandidates = Object.values(candidateVacancyMatches)
      .filter(item => item.vacancyMatches.length > 1)
      .map(item => ({
        candidateId: item.candidate.candidateId,
        candidateName: item.candidate.candidateName,
        candidateEmail: item.candidate.candidateEmail,
        cvUrl: item.candidate.cvUrl,
        matchedVacancies: item.vacancyMatches
      }))
      .sort((a, b) => b.matchedVacancies.length - a.matchedVacancies.length);
    
    res.json({
      recommendationsByVacancy: recommendationsByVacancy,
      versatileCandidates: versatileCandidates
    });
  } catch (error) {
    console.error('Error getting candidate recommendations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/candidates/:candidateId/cv', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    const { candidateId } = req.params;
    console.log(`[CV Access] Request for candidateId: ${candidateId} by user: ${req.user.id}`);
    
    // Get candidate by query instead of direct item lookup
    try {
      // Use query instead of direct lookup
      const { resources } = await candidatesContainer.items
        .query({
          query: "SELECT * FROM c WHERE c.id = @candidateId",
          parameters: [{ name: "@candidateId", value: candidateId }]
        })
        .fetchAll();
      
      const candidate = resources.length > 0 ? resources[0] : null;
      
      console.log(`[CV Access] Found candidate:`, {
        id: candidate?.id,
        name: candidate ? `${candidate.firstName} ${candidate.lastName}` : 'N/A',
        cvBlobName: candidate?.cvBlobName || 'MISSING',
        cvUrl: candidate?.cvUrl || 'MISSING',
        fields: candidate ? Object.keys(candidate) : []
      });
      
      if (!candidate) {
        return res.status(404).json({ message: 'Candidate not found' });
      }
      
      if (!candidate.cvBlobName && !candidate.cvUrl) {
        return res.status(404).json({ 
          message: 'CV not found',
          details: 'Candidate record does not contain CV information'
        });
      }
      
      // Use cvUrl directly if available and no cvBlobName exists
      if (candidate.cvUrl && !candidate.cvBlobName) {
        console.log(`[CV Access] Redirecting to direct cvUrl: ${candidate.cvUrl}`);
        return res.redirect(candidate.cvUrl);
      }
      
      // Get the CV from blob storage
      console.log(`[CV Access] Attempting to load CV from blob: ${candidate.cvBlobName}`);
      const { getCV } = require('../services/blobStorage');
      const cvData = await getCV(candidate.cvBlobName);
      
      // Set appropriate headers
      res.setHeader('Content-Type', cvData.contentType);
      res.setHeader('Content-Length', cvData.contentLength);
      res.setHeader('Content-Disposition', `inline; filename="cv-${candidateId}.pdf"`);
      
      // Stream the file data to the response
      cvData.stream.pipe(res);
      
    } catch (queryError) {
      console.error(`[CV Access] Database query error: ${queryError.message}`);
      return res.status(500).json({ 
        message: 'Error retrieving candidate data',
        error: queryError.message
      });
    }
  } catch (error) {
    console.error(`[CV Access] General error: ${error.message}`);
    res.status(500).json({ message: 'Error retrieving CV', error: error.message });
  }
});

// Get a SAS URL to access a candidate's CV directly
router.get('/candidates/:candidateId/cv-url', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    const { candidateId } = req.params;
    console.log(`[SAS CV URL] Request for candidateId: ${candidateId} by user: ${req.user.id}`);
    
    // Get candidate by query instead of direct item lookup
    try {
      // Use query instead of direct lookup
      const { resources } = await candidatesContainer.items
        .query({
          query: "SELECT * FROM c WHERE c.id = @candidateId",
          parameters: [{ name: "@candidateId", value: candidateId }]
        })
        .fetchAll();
      
      const candidate = resources.length > 0 ? resources[0] : null;
      
      console.log(`[SAS CV URL] Found candidate:`, {
        id: candidate?.id,
        name: candidate ? `${candidate.firstName} ${candidate.lastName}` : 'N/A',
        cvBlobName: candidate?.cvBlobName || 'MISSING',
        cvUrl: candidate?.cvUrl || 'MISSING'
      });
      
      if (!candidate) {
        return res.status(404).json({ message: 'Candidate not found' });
      }
      
      // If we have direct URL but no blob name, just return the URL
      if (!candidate.cvBlobName && candidate.cvUrl) {
        console.log(`[SAS CV URL] Returning direct CV URL: ${candidate.cvUrl}`);
        return res.json({ url: candidate.cvUrl });
      }
      
      if (!candidate.cvBlobName) {
        return res.status(404).json({ 
          message: 'CV not found',
          details: 'Candidate record does not contain CV information'
        });
      }
      
      // Generate a SAS URL with a 30-minute expiry
      const { generateSasUrl } = require('../services/blobStorage');
      const sasUrl = await generateSasUrl(candidate.cvBlobName, 30);
      
      console.log(`[SAS CV URL] Generated SAS URL for ${candidate.cvBlobName}`);
      
      // Return the secure URL
      res.json({ url: sasUrl });
    } catch (queryError) {
      console.error(`[SAS CV URL] Database query error: ${queryError.message}`);
      return res.status(404).json({ 
        message: 'Error retrieving candidate data',
        error: queryError.message
      });
    }
  } catch (error) {
    console.error(`[SAS CV URL] General error: ${error.message}`);
    res.status(500).json({ message: 'Error generating CV URL', error: error.message });
  }
});

function getHighestEducationLevel(education) {
  const educationLevels = {
    'high school': 1,
    'associate': 2,
    'bachelor': 3,
    'master': 4,
    'doctorate': 5,
    'phd': 5
  };
  
  let highestLevel = 0;
  let highestDegree = '';
  
  for (const edu of education) {
    const degreeText = edu.degree?.toLowerCase() || '';
    
    for (const [level, value] of Object.entries(educationLevels)) {
      if (degreeText.includes(level) && value > highestLevel) {
        highestLevel = value;
        highestDegree = level;
      }
    }
  }
  
  return highestDegree;
}


module.exports = router;