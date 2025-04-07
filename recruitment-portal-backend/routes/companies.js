// routes/companies.js
const express = require('express');
const router = express.Router();
const { CosmosClient } = require('@azure/cosmos');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const { searchCandidates } = require('../services/cognitiveSearch');
const { predictCandidateMatch } = require('../services/azureOpenaiMatching');
const { sendInterviewInvite } = require('../services/emailService');
const { analyzeInterviewRecording } = require('../services/videoAnalysisService');



const axios = require('axios');

// Change this import
const { OpenAI } = require("openai");


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
// Add this container for interviews
const interviewsContainer = database.container('Interviews');

// Replace the OpenAI configuration with this
const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { "api-version": "2023-12-01-preview" },
  defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY }
});

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
// Get candidate profile
router.get('/candidates/:id', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching candidate with ID: ${id}`);
    
    // Get candidate using query approach
    const { resources } = await candidatesContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: id }]
      })
      .fetchAll();
    
    if (resources.length === 0) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    
    const candidate = resources[0];
    res.json({ candidate });
  } catch (error) {
    console.error('Error fetching candidate:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Update your schedule interview endpoint to find and merge with existing question data
router.post('/vacancies/:vacancyId/candidates/:candidateId/schedule', 
  authMiddleware, 
  authorizeRoles('company', 'admin'), 
  async (req, res) => {
    try {
      const { vacancyId, candidateId } = req.params;
      const { scheduledAt, notifyCandidate = true } = req.body; // Default to true
      
      console.log(`Processing interview schedule for vacancy ${vacancyId} and candidate ${candidateId}`);
      console.log('Request body:', req.body);
      
      // Get candidate info - with better error handling
      let candidate = null;
      try {
        const { resources: candidateResources } = await candidatesContainer.items
          .query({
            query: "SELECT * FROM c WHERE c.id = @id",
            parameters: [{ name: "@id", value: candidateId }]
          })
          .fetchAll();
        
        if (candidateResources.length === 0) {
          return res.status(404).json({ message: 'Candidate not found' });
        }
        
        candidate = candidateResources[0];
        console.log(`Found candidate: ${candidate.firstName} ${candidate.lastName}`);
      } catch (candidateError) {
        console.error('Error fetching candidate:', candidateError);
        return res.status(500).json({ message: 'Error retrieving candidate data' });
      }
      
      // Get vacancy info - with better error handling
      let vacancy = null;
      try {
        const { resources: vacancyResources } = await vacanciesContainer.items
          .query({
            query: "SELECT * FROM c WHERE c.id = @id",
            parameters: [{ name: "@id", value: vacancyId }]
          })
          .fetchAll();
        
        if (vacancyResources.length === 0) {
          return res.status(404).json({ message: 'Vacancy not found' });
        }
        
        vacancy = vacancyResources[0];
        console.log(`Found vacancy: ${vacancy.title}`);
      } catch (vacancyError) {
        console.error('Error fetching vacancy:', vacancyError);
        return res.status(500).json({ message: 'Error retrieving vacancy data' });
      }
      
      // Safety check
      if (!vacancy || !vacancy.title) {
        console.error('Vacancy object is invalid:', vacancy);
        return res.status(500).json({ message: 'Invalid vacancy data' });
      }
      
      // Create or update interview record
      const interview = {
        id: `${vacancyId}-${candidateId}-${new Date().getTime()}`,
        vacancyId,
        candidateId,
        scheduledAt,
        vacancyTitle: vacancy.title,
        status: 'scheduled',
        createdAt: new Date().toISOString()
      };
      
      await interviewsContainer.items.create(interview);
      console.log('Interview record created:', interview.id);
      
      // Send email notification if requested
      let emailSent = false;
      if (notifyCandidate) {
        try {
          // Import email service if not already imported
          const emailService = require('../services/emailService');
          
          // Prepare interview object with needed properties
          const interviewForEmail = {
            ...interview,
            scheduledAt: scheduledAt
          };
          
          await emailService.sendInterviewInvite(candidate, interviewForEmail);
          console.log(`Email notification sent to ${candidate.email} for interview`);
          emailSent = true;
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
          // Continue despite email error - don't fail the whole operation
        }
      }
      
      // Update application status if it exists
      try {
        const { resources: applications } = await applicationsContainer.items
          .query({
            query: "SELECT * FROM c WHERE c.vacancyId = @vacancyId AND c.candidateId = @candidateId",
            parameters: [
              { name: "@vacancyId", value: vacancyId },
              { name: "@candidateId", value: candidateId }
            ]
          })
          .fetchAll();
        
        if (applications.length > 0) {
          const application = applications[0];
          application.status = 'interviewed';
          application.updatedAt = new Date().toISOString();
          
          await applicationsContainer.item(application.id).replace(application);
          console.log(`Updated application status to 'interviewed'`);
        }
      } catch (appError) {
        console.error('Error updating application status:', appError);
      }
      
      res.json({
        message: 'Interview scheduled successfully',
        interview,
        emailSent
      });
    } catch (error) {
      console.error('Error scheduling interview:', error);
      res.status(500).json({ 
        message: 'Failed to schedule interview', 
        error: error.message 
      });
    }
  }
);

// Add this to your routes/companies.js

router.post('/vacancies/:vacancyId/candidates/:candidateId/interview-questions', 
  authMiddleware, 
  authorizeRoles('company', 'admin'), 
  async (req, res) => {
    try {
      const { vacancyId, candidateId } = req.params;
      const { candidateName, skills, jobTitle, jobDescription, requiredSkills } = req.body;
      
      console.log(`Generating interview questions for candidate ${candidateId} and vacancy ${vacancyId}`);
      
      // Get Azure OpenAI API details from environment variables
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
      const apiKey = process.env.AZURE_OPENAI_API_KEY;
      const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
      
      if (!endpoint || !apiKey || !deploymentName) {
        return res.status(500).json({ 
          message: 'Azure OpenAI configuration missing. Check server environment variables.' 
        });
      }
      
      // Create prompt for interview questions
      const prompt = `
Generate 2 personalized interview questions for ${candidateName} applying for ${jobTitle}.

Candidate skills: ${skills.join(', ')}
Job description: ${jobDescription}
Required skills: ${requiredSkills.join(', ')}

Generate 3 technical questions related to their skills, 3 behavioral questions relevant to the job, 2 situational questions, and 2 questions about their experience.
For each question, provide a brief explanation of why you're asking it.
Format the response as a JSON array with this structure:
[
  {
    "category": "Technical",
    "question": "Question text here",
    "explanation": "Explanation of why this question is relevant"
  },
  ...
]
`;
      
      // Make API call to Azure OpenAI
      const apiUrl = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2023-12-01-preview`;
      
      const response = await axios.post(apiUrl, {
        messages: [
          { role: "system", content: "You are an assistant that specializes in HR analytics and candidate matching." },
          { role: "user", content: prompt }
        ],
        max_tokens: 200,
        temperature: 0.7
      }, {
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        }
      });
      
      // Parse the response
      const content = response.data.choices[0].message.content.trim();
      let questions;
      
    // Replace the JSON parsing section in routes/companies.js with this robust version:

      try {
        // Extract content from code blocks if present
        const jsonRegex = /```(?:json)?\s*([\s\S]*?)(?:```|$)/;
        const codeMatch = content.match(jsonRegex);
        
        let jsonContent = codeMatch && codeMatch[1] ? codeMatch[1].trim() : content.trim();
        console.log("Extracted content for parsing:", jsonContent.substring(0, 100) + "...");
        
        // Try standard JSON parsing first
        try {
          questions = JSON.parse(jsonContent);
          console.log("Standard JSON parsing successful");
        } catch (standardParseError) {
          console.error("Standard JSON parsing failed:", standardParseError.message);
          
          // Extract complete questions using regex - this handles truncated JSON
          console.log("Attempting to extract individual complete questions");
          const questionObjects = [];
          const objectRegex = /\{\s*"category":\s*"([^"]+)",\s*"question":\s*"([^"]+)",\s*"explanation":\s*"([^"]+)"\s*\}/g;
          
          let match;
          while ((match = objectRegex.exec(jsonContent)) !== null) {
            questionObjects.push({
              category: match[1],
              question: match[2],
              explanation: match[3]
            });
          }
          
          // If we found at least one complete question object
          if (questionObjects.length > 0) {
            console.log(`Successfully extracted ${questionObjects.length} complete question objects`);
            questions = questionObjects;
          } else {
            // If regex failed, try manual extraction of array elements
            console.log("Regex extraction failed, attempting manual recovery");
            
            // Try to find the array start
            if (jsonContent.includes('[')) {
              jsonContent = jsonContent.substring(jsonContent.indexOf('['));
              
              // Split by objects and process each one that's complete
              const objects = jsonContent.split(/\}\s*,\s*\{/).map(obj => obj.trim());
              
              for (const obj of objects) {
                // Clean up the object fragment
                let cleanObj = obj.replace(/^\[\s*\{/, '{').replace(/\}\s*\]$/, '}');
                
                // Check if it has all required fields
                if (cleanObj.includes('"category"') && 
                    cleanObj.includes('"question"') && 
                    cleanObj.includes('"explanation"')) {
                  
                  try {
                    // Try to fix and parse the object
                    if (!cleanObj.endsWith('}')) cleanObj += '}';
                    const fixedObj = '{' + cleanObj.split('{')[1];
                    const parsedObj = JSON.parse(fixedObj);
                    
                    if (parsedObj.category && parsedObj.question && parsedObj.explanation) {
                      questionObjects.push(parsedObj);
                    }
                  } catch (objParseError) {
                    console.error("Failed to parse individual object:", objParseError.message);
                  }
                }
              }
              
              if (questionObjects.length > 0) {
                console.log(`Manually recovered ${questionObjects.length} question objects`);
                questions = questionObjects;
              } else {
                throw new Error("Could not recover any valid question objects");
              }
            } else {
              throw new Error("No array structure found in response");
            }
          }
        }
        
        console.log(`Successfully parsed/recovered ${questions.length} questions`);
      
  // Ensure we have at least the minimum required fields in each question
  questions = questions.filter(q => 
    q && typeof q === 'object' && q.category && q.question && q.explanation
  );
  
  if (questions.length === 0) {
    throw new Error("No valid questions after filtering");
  }
} catch (parseError) {
  console.error("All JSON parsing attempts failed:", parseError.message);
  console.log("Raw response fragment:", content.substring(0, 500));
  
  // Fallback questions using candidate skills if available
  const skillsToUse = skills && skills.length > 0 ? 
    skills : ["WordPress", "content marketing", "social media"];
  
  questions = [
    {
      category: "Technical",
      question: `Given your experience with ${skillsToUse[0]}, how would you approach optimizing content for both search engines and user engagement?`,
      explanation: "This assesses technical depth in their primary skill."
    },
    {
      category: "Behavioral",
      question: "Tell me about a time when you had to adapt your content strategy based on unexpected feedback or performance metrics.",
      explanation: "This evaluates adaptability and responsiveness to data."
    },
    {
      category: "Situational",
      question: "How would you handle a situation where stakeholders request content changes that you believe would negatively impact SEO performance?",
      explanation: "This tests ability to balance stakeholder requirements with technical best practices."
    }
  ];
  
  console.log("Using fallback questions instead");
}
      
      res.json({
        questions,
        success: true
      });
    } catch (error) {
      console.error('Error generating interview questions:', error);
      res.status(500).json({ 
        message: 'Failed to generate interview questions', 
        error: error.message 
      });
    }
  }
);

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

// This should be in your routes/companies.js file
router.get('/vacancies/:id', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching vacancy with ID: ${id}`);
    
    // Use query approach for more reliable retrieval with CosmosDB
    const { resources } = await vacanciesContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: id }]
      })
      .fetchAll();
    
    console.log(`Query returned ${resources.length} results for vacancy ID: ${id}`);
    
    if (resources.length === 0) {
      console.log(`No vacancy found with ID: ${id}`);
      return res.status(404).json({ message: 'Vacancy not found' });
    }
    
    const vacancy = resources[0];
    console.log(`Found vacancy: ${vacancy.title}`);
    
    res.json({
      vacancy: vacancy
    });
  } catch (error) {
    console.error(`Error fetching vacancy ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Also modify the function that saves interview questions:
router.post('/vacancies/:vacancyId/candidates/:candidateId/save-interview', 
  authMiddleware, 
  authorizeRoles('company', 'admin'), 
  async (req, res) => {
    try {
      const { vacancyId, candidateId } = req.params;
      const { questions } = req.body;
      
      // Check if an interview already exists
      const { resources } = await interviewsContainer.items
        .query({
          query: "SELECT * FROM c WHERE c.vacancyId = @vacancyId AND c.candidateId = @candidateId",
          parameters: [
            { name: "@vacancyId", value: vacancyId },
            { name: "@candidateId", value: candidateId }
          ]
        })
        .fetchAll();
      
      if (resources.length > 0) {
        // Update existing interview instead of creating a new one
        const interview = resources[0];
        interview.questions = questions;
        interview.updatedAt = new Date().toISOString();
        
        // Don't change the status if already scheduled
        if (!interview.scheduledAt) {
          interview.status = 'draft';
        }
        
        await interviewsContainer.item(interview.id).replace(interview);
        
        res.json({ 
          message: 'Interview questions saved successfully',
          id: interview.id
        });
      } else {
        // Create new interview (without scheduling information)
        const interview = {
          id: `${vacancyId}-${candidateId}-${new Date().getTime()}`,
          vacancyId,
          candidateId,
          questions,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft'
        };
        
        await interviewsContainer.items.create(interview);
        
        res.json({ 
          message: 'Interview questions saved successfully',
          id: interview.id
        });
      }
    } catch (error) {
      console.error('Error saving interview questions:', error);
      res.status(500).json({ message: 'Failed to save interview questions' });
    }
  }
);

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


// Add these routes to routes/companies.js in the backend

// Get all interviews with recordings for the company
router.get('/interview-recordings', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
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
    
    // Get all vacancies for this company
    const { resources: vacancies } = await vacanciesContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.companyId = @companyId",
        parameters: [{ name: "@companyId", value: company.id }]
      })
      .fetchAll();
    
    // Get all interviews with recordings across all vacancies
    const vacancyIds = vacancies.map(vacancy => vacancy.id);
    
    if (vacancyIds.length === 0) {
      return res.json({ interviews: [] });
    }
    
    // Query interviews with recordings
    const { resources: interviews } = await interviewsContainer.items
      .query({
        query: "SELECT * FROM c WHERE ARRAY_CONTAINS(@vacancyIds, c.vacancyId) AND IS_DEFINED(c.recordings)",
        parameters: [{ name: "@vacancyIds", value: vacancyIds }]
      })
      .fetchAll();
    
    // Filter to only include interviews that actually have recordings
    const interviewsWithRecordings = interviews.filter(
      interview => interview.recordings && interview.recordings.length > 0
    );
    
    // Enrich with candidate data
    const enrichedInterviews = await Promise.all(
      interviewsWithRecordings.map(async (interview) => {
        try {
          // Get candidate details
          const { resources: candidates } = await candidatesContainer.items
            .query({
              query: "SELECT * FROM c WHERE c.id = @candidateId",
              parameters: [{ name: "@candidateId", value: interview.candidateId }]
            })
            .fetchAll();
          
          const candidate = candidates.length > 0 ? candidates[0] : null;
          
          // Find vacancy to get title
          const vacancy = vacancies.find(v => v.id === interview.vacancyId);
          
          return {
            ...interview,
            candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Unknown Candidate',
            vacancyTitle: vacancy ? vacancy.title : 'Unknown Position'
          };
        } catch (err) {
          console.error(`Error fetching details for interview ${interview.id}:`, err);
          return interview;
        }
      })
    );
    
    // Sort by most recent first
    enrichedInterviews.sort((a, b) => {
      const dateA = new Date(a.recordings[0].uploadedAt || a.createdAt);
      const dateB = new Date(b.recordings[0].uploadedAt || b.createdAt);
      return dateB - dateA;
    });
    
    res.json({
      interviews: enrichedInterviews
    });
  } catch (error) {
    console.error('Error fetching interview recordings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a secure URL to access a specific interview recording
router.get('/interview-recordings/:interviewId/:questionIndex/url', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    const { interviewId, questionIndex } = req.params;
    
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
    
    // Get the interview
    const { resources: interviewResources } = await interviewsContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: interviewId }]
      })
      .fetchAll();
    
    if (interviewResources.length === 0) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    
    const interview = interviewResources[0];
    
    // Check if the recording exists
    if (!interview.recordings || !interview.recordings.length) {
      return res.status(404).json({ message: 'No recordings found for this interview' });
    }
    
    // Find the specific recording by question index
    const recording = interview.recordings.find(r => r.questionIndex == questionIndex);
    
    if (!recording) {
      return res.status(404).json({ message: `Recording for question ${questionIndex} not found` });
    }
    
    // Verify this company has access to the interview's vacancy
    const { resources: vacancyResources } = await vacanciesContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id AND c.companyId = @companyId",
        parameters: [
          { name: "@id", value: interview.vacancyId },
          { name: "@companyId", value: company.id }
        ]
      })
      .fetchAll();
    
    if (vacancyResources.length === 0) {
      return res.status(403).json({ message: 'Not authorized to access this recording' });
    }
    
    // Generate a SAS URL for the recording with a 30-minute expiry
    const { generateInterviewRecordingSasUrl } = require('../services/blobStorage');
    const sasUrl = await generateInterviewRecordingSasUrl(interviewId, questionIndex, 30);
    
    res.json({
      url: sasUrl,
      recordingDetails: recording
    });
  } catch (error) {
    console.error('Error generating recording URL:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get details for a specific interview with its recordings
router.get('/interviews/:id/recordings', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
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
    
    // Get the interview
    const { resources: interviewResources } = await interviewsContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: id }]
      })
      .fetchAll();
    
    if (interviewResources.length === 0) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    
    const interview = interviewResources[0];
    
    // Verify this company has access to the interview's vacancy
    const { resources: vacancyResources } = await vacanciesContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id AND c.companyId = @companyId",
        parameters: [
          { name: "@id", value: interview.vacancyId },
          { name: "@companyId", value: company.id }
        ]
      })
      .fetchAll();
    
    if (vacancyResources.length === 0) {
      return res.status(403).json({ message: 'Not authorized to access this interview' });
    }
    
    // Get candidate details
    const { resources: candidates } = await candidatesContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @candidateId",
        parameters: [{ name: "@candidateId", value: interview.candidateId }]
      })
      .fetchAll();
    
    const candidate = candidates.length > 0 ? candidates[0] : null;
    
    // Get recording details from blob storage
    let recordingsDetails = [];
    
    if (interview.recordings && interview.recordings.length > 0) {
      const { getInterviewRecordings } = require('../services/blobStorage');
      try {
        recordingsDetails = await getInterviewRecordings(interview.id);
      } catch (blobError) {
        console.error(`Error getting recording details from blob storage:`, blobError);
        // Continue with the data we have from the database
        recordingsDetails = interview.recordings;
      }
    }
    
    // Enrich the interview with additional details
    const enrichedInterview = {
      ...interview,
      candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Unknown Candidate',
      candidateEmail: candidate?.email || 'No email',
      vacancyTitle: vacancyResources[0]?.title || 'Unknown Position',
      recordings: recordingsDetails
    };
    
    res.json({
      interview: enrichedInterview
    });
  } catch (error) {
    console.error(`Error fetching interview recordings:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/interview-recordings/:interviewId/:questionIndex/analyze', 
  authMiddleware, 
  authorizeRoles('company', 'admin'), 
  async (req, res) => {
    try {
      const { interviewId, questionIndex } = req.params;
      
      // Get company to verify permissions
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
      
      // Get the interview to verify ownership and get question details
      const { resources: interviewResources } = await interviewsContainer.items
        .query({
          query: "SELECT * FROM c WHERE c.id = @id",
          parameters: [{ name: "@id", value: interviewId }]
        })
        .fetchAll();
      
      if (interviewResources.length === 0) {
        return res.status(404).json({ message: 'Interview not found' });
      }
      
      const interview = interviewResources[0];
      
      // Verify ownership through the vacancy
      const { resources: vacancyResources } = await vacanciesContainer.items
        .query({
          query: "SELECT * FROM c WHERE c.id = @id AND c.companyId = @companyId",
          parameters: [
            { name: "@id", value: interview.vacancyId },
            { name: "@companyId", value: company.id }
          ]
        })
        .fetchAll();
      
      if (vacancyResources.length === 0) {
        return res.status(403).json({ message: 'Not authorized to access this recording' });
      }
      
      // Check if this recording has already been analyzed
      const recordingIndex = interview.recordings?.findIndex(r => r.questionIndex == questionIndex);
      
      if (recordingIndex !== -1 && interview.recordings[recordingIndex].analysis && interview.recordings[recordingIndex].transcript) {
        console.log(`Using cached analysis for interview ${interviewId}, question ${questionIndex}`);
        
        return res.json({
          analysis: interview.recordings[recordingIndex].analysis,
          transcript: interview.recordings[recordingIndex].transcript
        });
      }
      
      // Get the question text for the analysis
      let questionText = "Unknown question";
      if (interview.questions && Array.isArray(interview.questions) && interview.questions.length > questionIndex) {
        questionText = interview.questions[questionIndex].question;
      } else {
        // If the interview doesn't have questions directly, try to find related interview records with questions
        const { resources: relatedInterviews } = await interviewsContainer.items
          .query({
            query: "SELECT * FROM c WHERE c.candidateId = @candidateId AND c.vacancyId = @vacancyId AND c.id != @id",
            parameters: [
              { name: "@candidateId", value: interview.candidateId },
              { name: "@vacancyId", value: interview.vacancyId },
              { name: "@id", value: interviewId }
            ]
          })
          .fetchAll();
        
        // Try to find one with questions
        const interviewWithQuestions = relatedInterviews.find(
          i => i.questions && Array.isArray(i.questions) && i.questions.length > questionIndex
        );
        
        if (interviewWithQuestions) {
          questionText = interviewWithQuestions.questions[questionIndex].question;
        }
      }
      
      console.log(`Analyzing interview ${interviewId}, question ${questionIndex}`);
      console.log(`Question text: ${questionText}`);
      
      // ****** THIS IS THE KEY PART TO FIX ******
      // Perform the analysis and IMMEDIATELY save the returned values in meaningful variables
      const analysisResult = await analyzeInterviewRecording(interviewId, questionIndex, questionText);
      
      // Extract the analysis and transcript from the result
      const { analysis, transcript } = analysisResult;
      
      // Store the analysis results and transcript in the interview document
      if (interview.recordings && recordingIndex !== -1) {
        interview.recordings[recordingIndex].analysis = analysis;
        interview.recordings[recordingIndex].transcript = transcript;
        
        try {
          // Find the document to make sure it exists
          const { resources } = await interviewsContainer.items
            .query({
              query: "SELECT * FROM c WHERE c.id = @id",
              parameters: [{ name: "@id", value: interview.id }]
            })
            .fetchAll();
          
          if (resources.length > 0) {
            // Document exists, update it
            await interviewsContainer.item(interview.id).replace(interview);
            console.log(`Updated interview ${interviewId} with analysis results`);
          } else {
            // Document doesn't exist, create it
            console.log(`Interview ${interviewId} not found, creating new document`);
            await interviewsContainer.items.create(interview);
          }
        } catch (updateError) {
          console.error(`Error updating interview ${interviewId} with analysis:`, updateError);
          // Continue anyway since we can still return the results
        }
      }
      
      // Return the analysis results
      res.json({
        analysis,
        transcript
      });
    } catch (error) {
      console.error('Error analyzing interview recording:', error);
      res.status(500).json({ 
        message: 'Error analyzing recording',
        error: error.message
      });
    }
  }
);

// Update application status
router.put('/applications/:id', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`Processing update for application ID: ${id} to status: ${status}`);
    
    // Use query instead of direct item access - this is more reliable with CosmosDB
    const querySpec = {
      query: "SELECT * FROM c WHERE c.id = @id",
      parameters: [{ name: "@id", value: id }]
    };
    
    console.log(`Querying for application with ID: ${id}`);
    const { resources } = await applicationsContainer.items
      .query(querySpec)
      .fetchAll();
    
    console.log(`Query returned ${resources.length} results`);
    
    if (resources.length === 0) {
      console.log(`No application found with ID: ${id}`);
      return res.status(404).json({ message: 'Application not found' });
    }
    
    const application = resources[0];
    console.log(`Found application for candidate: ${application.candidateInfo?.firstName || 'unknown'}`);
    
    // Update the application status with better error handling
    try {
      console.log(`Updating application ${id} to status ${status}`);
      
      // Update using patch operation - specify both id and partition key
      await applicationsContainer.item(id, id).patch([
        { op: 'replace', path: '/status', value: status },
        { op: 'replace', path: '/updatedAt', value: new Date().toISOString() }
      ]);
      
      console.log(`Successfully updated application ${id} status to ${status}`);
      
      res.json({
        message: 'Application status updated successfully',
        application: {
          id: application.id,
          status: status,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (patchError) {
      console.error(`Patch operation failed: ${patchError.message}`);
      
      // If patch fails, try using replace as a fallback
      try {
        console.log(`Trying alternative method (replace) for application ${id}`);
        
        const updatedApplication = {
          ...application,
          status: status,
          updatedAt: new Date().toISOString()
        };
        
        await applicationsContainer.item(id, id).replace(updatedApplication);
        
        console.log(`Successfully updated application ${id} using alternative method`);
        
        res.json({
          message: 'Application status updated successfully',
          application: updatedApplication
        });
      } catch (replaceError) {
        console.error(`Replace operation also failed: ${replaceError.message}`);
        console.error(replaceError);
        return res.status(500).json({ 
          message: 'Failed to update application status', 
          error: replaceError.message 
        });
      }
    }
  } catch (error) {
    console.error(`Error in application status update: ${error.message}`);
    console.error(error);
    res.status(500).json({ 
      message: 'Server error during application status update', 
      error: error.message 
    });
  }
});


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

// Add these new interview question generation endpoints
router.post('/vacancies/:vacancyId/candidates/:candidateId/interview-questions', 
  authMiddleware, 
  authorizeRoles('company', 'admin'), 
  async (req, res) => {
    try {
      const { vacancyId, candidateId } = req.params;
      const { 
        candidateName, 
        skills, 
        jobTitle, 
        jobDescription, 
        requiredSkills 
      } = req.body;
      
      // Create prompt for OpenAI
      const prompt = `
Generate 10 personalized interview questions for ${candidateName} applying for ${jobTitle}.

Candidate skills: ${skills.join(', ')}
Job description: ${jobDescription}
Required skills: ${requiredSkills.join(', ')}

Generate 3 technical questions related to their skills, 3 behavioral questions relevant to the job, 2 situational questions, and 2 questions about their experience.
For each question, provide a brief explanation of why you're asking it.
Format the response as a JSON array with this structure:
[
  {
    "category": "Technical",
    "question": "Question text here",
    "explanation": "Explanation of why this question is relevant"
  },
  ...
]
`;
      
      // Call Azure OpenAI with updated API
      const response = await openai.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
        messages: [
          { role: "system", content: "You are an assistant that specializes in HR analytics and candidate matching." },
          { role: "user", content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.7
      });
      
      // Parse the response with updated API structure
      const content = response.choices[0].message.content.trim();
      let questions;
      try {
        questions = JSON.parse(content);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        questions = [
          {
            category: "Technical",
            question: "Given your experience with " + skills[0] + ", how would you approach solving a complex problem in this area?",
            explanation: "This assesses technical depth in their primary skill."
          },
          {
            category: "Behavioral",
            question: "Tell me about a time when you had to work under pressure to meet a deadline.",
            explanation: "This evaluates how they handle stress and prioritize tasks."
          },
          {
            category: "Situational",
            question: "How would you handle a situation where project requirements change mid-development?",
            explanation: "This tests adaptability and problem-solving skills."
          }
        ];
      }
      
      // Store in database
      const interviewDocument = {
        id: new Date().getTime().toString(),
        vacancyId,
        candidateId,
        questions,
        generatedAt: new Date().toISOString(),
        status: 'draft'
      };
      
      await interviewsContainer.items.create(interviewDocument);
      
      res.json({
        questions,
        interviewId: interviewDocument.id
      });
    } catch (error) {
      console.error('Error generating interview questions:', error);
      res.status(500).json({ message: 'Failed to generate interview questions' });
    }
  }
);

// Add to routes/companies.js
// Initialize an interview session
router.post('/interviews/:id/initialize', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get interview details
    const { resources } = await interviewsContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: id }]
      })
      .fetchAll();
    
    if (resources.length === 0) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    
    const interview = resources[0];
    
    // Create a communication identity for the company interviewer
    const { createUserIdentity } = require('../services/communicationService');
    const identity = await createUserIdentity();
    
    // Update interview with communication identity
    interview.communicationIdentity = identity.user;
    interview.status = 'initialized';
    interview.initializedAt = new Date().toISOString();
    
    await interviewsContainer.item(id).replace(interview);
    
    res.json({
      message: 'Interview initialized',
      token: identity.token,
      expiresOn: identity.expiresOn
    });
  } catch (error) {
    console.error('Error initializing interview:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get token for interview
router.get('/interviews/:id/token', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get interview details
    const { resources } = await interviewsContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: id }]
      })
      .fetchAll();
    
    if (resources.length === 0) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    
    const interview = resources[0];
    
    // Refresh token if needed
    const { identityClient } = require('../services/communicationService');
    const tokenResponse = await identityClient.getToken(interview.communicationIdentity, ["voip", "chat"]);
    
    res.json({
      token: tokenResponse.token,
      expiresOn: tokenResponse.expiresOn
    });
  } catch (error) {
    console.error('Error getting interview token:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Complete an interview
router.post('/interviews/:id/complete', authMiddleware, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get interview details
    const { resources } = await interviewsContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: id }]
      })
      .fetchAll();
    
    if (resources.length === 0) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    
    const interview = resources[0];
    
    // Update interview status
    interview.status = 'completed';
    interview.completedAt = new Date().toISOString();
    
    await interviewsContainer.item(id).replace(interview);
    
    // Update application status
    const { resources: applications } = await applicationsContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.vacancyId = @vacancyId AND c.candidateId = @candidateId",
        parameters: [
          { name: "@vacancyId", value: interview.vacancyId },
          { name: "@candidateId", value: interview.candidateId }
        ]
      })
      .fetchAll();
    
    if (applications.length > 0) {
      const application = applications[0];
      application.status = 'interviewed';
      application.updatedAt = new Date().toISOString();
      
      await applicationsContainer.item(application.id).replace(application);
    }
    
    res.json({
      message: 'Interview completed successfully'
    });
  } catch (error) {
    console.error('Error completing interview:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add another endpoint to save customized interview questions
router.post('/vacancies/:vacancyId/candidates/:candidateId/save-interview', 
  authMiddleware, 
  authorizeRoles('company', 'admin'), 
  async (req, res) => {
    try {
      const { vacancyId, candidateId } = req.params;
      const { questions } = req.body;
      
      // Check if an interview already exists
      const { resources } = await interviewsContainer.items
        .query({
          query: "SELECT * FROM c WHERE c.vacancyId = @vacancyId AND c.candidateId = @candidateId",
          parameters: [
            { name: "@vacancyId", value: vacancyId },
            { name: "@candidateId", value: candidateId }
          ]
        })
        .fetchAll();
      
      if (resources.length > 0) {
        // Update existing interview
        const interview = resources[0];
        interview.questions = questions;
        interview.updatedAt = new Date().toISOString();
        interview.status = 'scheduled';
        
        await interviewsContainer.item(interview.id).replace(interview);
      } else {
        // Create new interview
        const interview = {
          id: new Date().getTime().toString(),
          vacancyId,
          candidateId,
          questions,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'scheduled'
        };
        
        await interviewsContainer.items.create(interview);
      }
      
      res.json({ 
        message: 'Interview questions saved successfully',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Schedule 1 week in future
      });
    } catch (error) {
      console.error('Error saving interview questions:', error);
      res.status(500).json({ message: 'Failed to save interview questions' });
    }
  }
);

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