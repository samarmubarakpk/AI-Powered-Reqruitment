// routes/companies.js
const express = require('express');
const router = express.Router();
const { CosmosClient } = require('@azure/cosmos');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

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

// Delete a vacancy
router.delete('/vacancies/:id', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
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
      return res.status(403).json({ message: 'Not authorized to delete this vacancy' });
    }
    
    // Delete vacancy
    await vacanciesContainer.item(id).delete();
    
    res.json({
      message: 'Vacancy deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting vacancy:', error);
    res.status(500).json({ message: 'Server error' });
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

module.exports = router;