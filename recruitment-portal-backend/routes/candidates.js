// routes/candidates.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CosmosClient } = require('@azure/cosmos');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const { uploadCV, deleteCV } = require('../services/blobStorage');

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

// Initialize Cosmos DB client
const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY
});
const database = cosmosClient.database(process.env.COSMOS_DATABASE);
const candidatesContainer = database.container('Candidates');
const applicationsContainer = database.container('Applications');

// Utility functions for Cosmos DB
const safeCreateDocument = async (container, document, maxRetries = 3) => {
  let retryCount = 0;
  let lastError = null;
  
  while (retryCount < maxRetries) {
    try {
      const { resource } = await container.items.create(document);
      return resource;
    } catch (error) {
      lastError = error;
      
      // If this is a conflict (409) or throttling (429), retry
      if (error.code === 409 || error.code === 429) {
        retryCount++;
        
        // Exponential backoff
        const delay = Math.pow(2, retryCount) * 100;
        console.log(`Retry attempt ${retryCount} for document creation after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // For other errors, don't retry
        break;
      }
    }
  }
  
  // If we exhausted all retries or encountered a non-retriable error
  throw lastError;
};

const safeDeleteDocument = async (container, id, partitionKey) => {
  try {
    await container.item(id, partitionKey).delete();
    return true;
  } catch (error) {
    // If document not found (404), consider it a success
    if (error.code === 404) {
      return true;
    }
    throw error;
  }
};

const findDocumentByField = async (container, fieldName, fieldValue) => {
  try {
    const querySpec = {
      query: `SELECT * FROM c WHERE c.${fieldName} = @value`,
      parameters: [{ name: "@value", value: fieldValue }]
    };
    
    const { resources } = await container.items.query(querySpec).fetchAll();
    return resources.length > 0 ? resources[0] : null;
  } catch (error) {
    console.error(`Error finding document by ${fieldName}: ${error.message}`);
    return null;
  }
};

// Get candidate profile
router.get('/profile', authMiddleware, authorizeRoles('candidate'), async (req, res) => {
  try {
    const candidate = await findDocumentByField(candidatesContainer, 'userId', req.user.id);
    
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate profile not found' });
    }
    
    res.json({
      candidate: {
        id: candidate.id,
        userId: candidate.userId,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        cvUrl: candidate.cvUrl,
        skills: candidate.skills || [],
        experience: candidate.experience || [],
        education: candidate.education || []
      }
    });
  } catch (error) {
    console.error('Error fetching candidate profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update candidate profile
router.put('/profile', authMiddleware, authorizeRoles('candidate'), async (req, res) => {
  try {
    const { firstName, lastName, skills, experience, education } = req.body;
    
    const existingCandidate = await findDocumentByField(candidatesContainer, 'userId', req.user.id);
    
    if (!existingCandidate) {
      return res.status(404).json({ message: 'Candidate profile not found' });
    }
    
    // Create a new document instead of updating the existing one
    const updatedCandidate = {
      ...existingCandidate,
      firstName: firstName || existingCandidate.firstName,
      lastName: lastName || existingCandidate.lastName,
      skills: skills || existingCandidate.skills,
      experience: experience || existingCandidate.experience,
      education: education || existingCandidate.education,
      updatedAt: new Date().toISOString()
    };
    
    // Generate a new ID for the updated document
    const newDocId = new Date().getTime().toString();
    updatedCandidate.id = newDocId;
    
    // Create the new document
    await safeCreateDocument(candidatesContainer, updatedCandidate);
    
    // Delete the old document
    await safeDeleteDocument(candidatesContainer, existingCandidate.id, existingCandidate.id);
    
    res.json({
      message: 'Profile updated successfully',
      candidate: {
        id: updatedCandidate.id,
        userId: updatedCandidate.userId,
        firstName: updatedCandidate.firstName,
        lastName: updatedCandidate.lastName,
        email: updatedCandidate.email,
        cvUrl: updatedCandidate.cvUrl,
        skills: updatedCandidate.skills || [],
        experience: updatedCandidate.experience || [],
        education: updatedCandidate.education || []
      }
    });
  } catch (error) {
    console.error('Error updating candidate profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// CV upload route that avoids .replace() operations
// CV upload route that avoids .replace() operations
router.post('/cv', authMiddleware, authorizeRoles('candidate'), upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const userId = req.user.id;
    console.log(`Processing CV upload for user ${userId}`);
    
    // Generate a timestamp-based ID for the new document
    const newDocId = new Date().getTime().toString();
    console.log(`Generated new document ID: ${newDocId}`);
    
    // First, upload the CV to blob storage
    let blobResult;
    try {
      blobResult = await uploadCV(
        req.file.buffer,
        req.file.mimetype,
        newDocId
      );
      console.log(`Successfully uploaded CV to blob: ${blobResult.blobName}`);
    } catch (blobError) {
      console.error(`Error uploading CV to blob storage: ${blobError.message}`);
      return res.status(500).json({ message: 'Failed to upload CV' });
    }
    
    // Get existing candidate data if available
    let existingData = {
      skills: [],
      experience: [],
      education: []
    };
    
    try {
      const { resources } = await candidatesContainer.items
        .query({
          query: "SELECT * FROM c WHERE c.userId = @userId",
          parameters: [{ name: "@userId", value: userId }]
        })
        .fetchAll();
      
      if (resources.length > 0) {
        console.log(`Found existing candidate record with ID: ${resources[0].id}`);
        existingData.skills = resources[0].skills || [];
        existingData.experience = resources[0].experience || [];
        existingData.education = resources[0].education || [];
        
        // Attempt to delete the old document
        try {
          await candidatesContainer.item(resources[0].id, resources[0].id).delete();
          console.log(`Successfully deleted old candidate record with ID: ${resources[0].id}`);
          
          // Also try to delete the old blob if it exists
          if (resources[0].cvBlobName) {
            try {
              await deleteCV(resources[0].cvBlobName);
              console.log(`Successfully deleted old CV blob: ${resources[0].cvBlobName}`);
            } catch (deleteError) {
              console.warn(`Failed to delete old CV blob, but continuing: ${deleteError.message}`);
            }
          }
        } catch (deleteError) {
          console.warn(`Failed to delete old record, but continuing: ${deleteError.message}`);
        }
      }
    } catch (queryError) {
      console.warn(`Error querying for existing record: ${queryError.message}`);
      // Continue with creating a new record
    }
    
    // Create a completely new document with the existing data
    const newCandidate = {
      id: newDocId,
      userId: userId,
      firstName: req.user.firstName || '',
      lastName: req.user.lastName || '',
      email: req.user.email,
      cvUrl: blobResult.url,
      cvBlobName: blobResult.blobName,
      skills: existingData.skills,
      experience: existingData.experience,
      education: existingData.education,
      createdAt: new Date().toISOString()
    };
    
    // Create new document
    try {
      await candidatesContainer.items.create(newCandidate);
      console.log(`Successfully created new candidate record with ID: ${newDocId}`);
      
      res.status(200).json({
        message: 'CV uploaded successfully',
        cvUrl: blobResult.url
      });
    } catch (createError) {
      console.error(`Error creating new candidate record: ${createError.message}`);
      
      // Try to clean up the blob we just uploaded
      try {
        await deleteCV(blobResult.blobName);
      } catch (deleteError) {
        console.warn(`Failed to delete blob after failed record creation: ${deleteError.message}`);
      }
      
      res.status(500).json({ message: 'Failed to create candidate record' });
    }
  } catch (error) {
    console.error(`Error in CV upload process: ${error.message}`);
    res.status(500).json({ message: 'Server error uploading CV' });
  }
});

// Add a new route to proxy CV downloads
router.get('/cv/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, verify this user has permission to access this CV
    const candidate = await findDocumentByField(candidatesContainer, 'userId', req.user.id);
    
    if (!candidate || !candidate.cvBlobName) {
      return res.status(404).json({ message: 'CV not found' });
    }
    
    // Get the CV from blob storage
    const cvData = await getCV(candidate.cvBlobName);
    
    // Set appropriate headers
    res.setHeader('Content-Type', cvData.contentType);
    res.setHeader('Content-Length', cvData.contentLength);
    res.setHeader('Content-Disposition', `inline; filename="cv-${id}.pdf"`);
    
    // Stream the file data to the response
    cvData.stream.pipe(res);
  } catch (error) {
    console.error(`Error retrieving CV: ${error.message}`);
    res.status(500).json({ message: 'Error retrieving CV' });
  }
});

// Apply for a vacancy
// Replace the existing endpoint with this implementation in routes/candidates.js
router.post('/apply/:vacancyId', authMiddleware, authorizeRoles('candidate'), async (req, res) => {
  try {
    const { vacancyId } = req.params;
    
    // Get candidate
    const candidate = await findDocumentByField(candidatesContainer, 'userId', req.user.id);
    
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate profile not found' });
    }
    
    // Check if CV exists
    if (!candidate.cvUrl) {
      return res.status(400).json({ message: 'Please upload your CV before applying' });
    }
    
    // Check if already applied
    const { resources: applicationResources } = await applicationsContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.candidateId = @candidateId AND c.vacancyId = @vacancyId",
        parameters: [
          { name: "@candidateId", value: candidate.id },
          { name: "@vacancyId", value: vacancyId }
        ]
      })
      .fetchAll();
    
    if (applicationResources.length > 0) {
      return res.status(400).json({ message: 'You have already applied for this vacancy' });
    }
    
    // Get vacancy details
    const { resource: vacancy } = await database.container('Vacancies').item(vacancyId).read();
    
    // Create application with more candidate information
    const newApplication = {
      id: new Date().getTime().toString(),
      candidateId: candidate.id,
      vacancyId: vacancyId,
      status: 'applied',
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Store essential candidate information directly in the application
      candidateInfo: {
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        cvUrl: candidate.cvUrl
      },
      // Store vacancy title for reference
      vacancyTitle: vacancy ? vacancy.title : 'Unknown Position'
    };
    
    await applicationsContainer.items.create(newApplication);
    
    res.status(201).json({
      message: 'Application submitted successfully',
      application: {
        id: newApplication.id,
        vacancyId: newApplication.vacancyId,
        status: newApplication.status,
        appliedAt: newApplication.appliedAt,
        vacancyTitle: newApplication.vacancyTitle
      }
    });
  } catch (error) {
    console.error('Error applying for vacancy:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add this to your routes/candidates.js file
router.get('/public-vacancies', async (req, res) => {
  try {
    const vacanciesContainer = database.container('Vacancies');
    const { resources } = await vacanciesContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.status = 'open'"
      })
      .fetchAll();
    
    res.json({
      vacancies: resources
    });
  } catch (error) {
    console.error('Error fetching public vacancies:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get candidate applications
router.get('/applications', authMiddleware, authorizeRoles('candidate'), async (req, res) => {
  try {
    // Get candidate
    const candidate = await findDocumentByField(candidatesContainer, 'userId', req.user.id);
    
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate profile not found' });
    }
    
    // Get applications
    const { resources: applications } = await applicationsContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.candidateId = @candidateId",
        parameters: [{ name: "@candidateId", value: candidate.id }]
      })
      .fetchAll();
    
    res.json({
      applications
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete account
router.delete('/account', authMiddleware, authorizeRoles('candidate'), async (req, res) => {
  try {
    // Get candidate
    const candidate = await findDocumentByField(candidatesContainer, 'userId', req.user.id);
    
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate profile not found' });
    }
    
    // Delete CV if exists
    if (candidate.cvBlobName) {
      await deleteCV(candidate.cvBlobName);
    }
    
    // Delete candidate
    await safeDeleteDocument(candidatesContainer, candidate.id, candidate.id);
    
    // Delete user (from Users container)
    const usersContainer = database.container('Users');
    await safeDeleteDocument(usersContainer, req.user.id, req.user.id);
    
    res.json({
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;