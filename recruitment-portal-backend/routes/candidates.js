// routes/candidates.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CosmosClient } = require('@azure/cosmos');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const { uploadCV, deleteCV } = require('../services/blobStorage');
const { predictCandidateMatch } = require('../services/smartMatchingService');

const { estimateTotalExperience, getHighestEducationLevel } = require('../services/jobMatching');

// Multer setup for file uploads
const storage = multer.memoryStorage();
// Define cvUpload
const cvUpload = multer({
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

// Define recordingUpload
const recordingUpload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    // Accept common video and audio formats
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video and audio files are allowed'), false);
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
const interviewsContainer = database.container('Interviews');
const vacanciesContainer = database.container('Vacancies');  // Add this line



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

// Get specific interview details
router.get('/interviews/:id', authMiddleware, authorizeRoles('candidate'), async (req, res) => {
  try {
    const { id: interviewId } = req.params;
    const { id: userId } = req.user;
    
    // Get candidate
    const { resources: candidateResources } = await candidatesContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.userId = @userId",
        parameters: [{ name: "@userId", value: userId }]
      })
      .fetchAll();
    
    if (candidateResources.length === 0) {
      return res.status(404).json({ message: 'Candidate profile not found' });
    }
    
    const candidate = candidateResources[0];
    
    // Get interview
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
    
    // Verify that the interview belongs to this candidate
    if (interview.candidateId !== candidate.id) {
      return res.status(403).json({ message: 'Not authorized to access this interview' });
    }
    
    // Get vacancy details
    const { resources: vacancyResources } = await vacanciesContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @vacancyId",
        parameters: [{ name: "@vacancyId", value: interview.vacancyId }]
      })
      .fetchAll();
    
    const vacancy = vacancyResources.length > 0 ? vacancyResources[0] : null;
    
    // Return interview with vacancy details
    res.json({
      ...interview,
      vacancyTitle: vacancy ? vacancy.title : 'Unknown Position',
      companyName: vacancy ? vacancy.companyName : 'Unknown Company'
    });
  } catch (error) {
    console.error('Error fetching interview details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Get scheduled interviews for a candidate
router.get('/scheduled-interviews', authMiddleware, authorizeRoles('candidate'), async (req, res) => {
  try {
    const { id: userId } = req.user;
    
    // Get candidate
    const { resources: candidateResources } = await candidatesContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.userId = @userId",
        parameters: [{ name: "@userId", value: userId }]
      })
      .fetchAll();
    
    if (candidateResources.length === 0) {
      return res.status(404).json({ message: 'Candidate profile not found' });
    }
    
    const candidate = candidateResources[0];
    
    // Get scheduled interviews
    const { resources: interviews } = await interviewsContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.candidateId = @candidateId AND c.status = 'scheduled'",
        parameters: [{ name: "@candidateId", value: candidate.id }]
      })
      .fetchAll();
    
    // For each interview, get the vacancy details
    const interviewsWithDetails = await Promise.all(
      interviews.map(async (interview) => {
        try {
          // Get vacancy details
          const { resources: vacancyResources } = await vacanciesContainer.items
            .query({
              query: "SELECT * FROM c WHERE c.id = @vacancyId",
              parameters: [{ name: "@vacancyId", value: interview.vacancyId }]
            })
            .fetchAll();
          
          const vacancy = vacancyResources.length > 0 ? vacancyResources[0] : null;
          
          return {
            ...interview,
            vacancyTitle: vacancy ? vacancy.title : 'Unknown Position',
            companyName: vacancy ? vacancy.companyName : 'Unknown Company'
          };
        } catch (err) {
          console.error(`Error fetching vacancy details for interview ${interview.id}:`, err);
          return interview;
        }
      })
    );
    
    res.json({
      interviews: interviewsWithDetails
    });
  } catch (error) {
    console.error('Error fetching scheduled interviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Upload interview recording
router.post('/interview-recording', authMiddleware, authorizeRoles('candidate'), recordingUpload.single('interviewRecording'), async (req, res) => {
  try {
    console.log('=== STARTING INTERVIEW RECORDING UPLOAD PROCESS ===');
    
    if (!req.file) {
      console.log('ERROR: No file received in the request');
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    console.log('File received:', {
      mimetype: req.file.mimetype,
      size: req.file.size || (req.file.buffer ? req.file.buffer.length : 'unknown'),
      originalName: req.file.originalname
    });
    
    const { interviewId, questionIndex } = req.body;
    console.log('Request params:', { interviewId, questionIndex });
    
    const { id: userId } = req.user;
    console.log('User ID:', userId);
    
    if (!interviewId || questionIndex === undefined) {
      console.log('ERROR: Missing required fields');
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Get candidate
    console.log(`Querying for candidate with userId: ${userId}`);
    const { resources: candidateResources } = await candidatesContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.userId = @userId",
        parameters: [{ name: "@userId", value: userId }]
      })
      .fetchAll();
    
    console.log(`Found ${candidateResources.length} candidate records`);
    
    if (candidateResources.length === 0) {
      console.log('ERROR: Candidate profile not found');
      return res.status(404).json({ message: 'Candidate profile not found' });
    }
    
    const candidate = candidateResources[0];
    console.log(`Candidate found: ID=${candidate.id}, Name=${candidate.firstName} ${candidate.lastName}`);
    
    // Get interview using a more flexible query
    console.log(`Querying for interview with candidateId: ${candidate.id} and related fields`);
    const { resources: interviewResources } = await interviewsContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.candidateId = @candidateId ORDER BY c._ts DESC",
        parameters: [{ name: "@candidateId", value: candidate.id }]
      })
      .fetchAll();

    console.log(`Found ${interviewResources.length} interview records`);

    if (interviewResources.length === 0) {
      console.log(`No existing interview found, creating a new interview record`);
      
      // Create a new interview record
      const newInterview = {
        id: interviewId, // Use the provided ID
        candidateId: candidate.id,
        status: "in-progress",
        recordings: [{
          questionIndex: parseInt(questionIndex),
          blobUrl: uploadResult.url,
          blobName: uploadResult.blobName,
          uploadedAt: new Date().toISOString()
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log(`Creating new interview with ID: ${newInterview.id}`);
      try {
        const { resource } = await interviewsContainer.items.create(newInterview);
        console.log('Interview document created successfully');
        
        return res.json({
          message: 'Recording uploaded successfully and new interview record created',
          recordingUrl: uploadResult.url
        });
      } catch (createError) {
        console.error('ERROR creating interview document:', createError);
        throw new Error(`Failed to create interview document: ${createError.message}`);
      }
    }

    const interview = interviewResources[0];
    console.log(`Interview found: ID=${interview.id}, Status=${interview.status}`);

// Skip the candidateId verification since we already queried by candidateId
    

    
    // Upload the interview recording to blob storage
    console.log('=== STARTING BLOB STORAGE UPLOAD ===');
    console.log('Container: interview-recordings');
    console.log(`Blob path: ${interviewId}/${questionIndex}.webm`);
    console.log(`MIME type: ${req.file.mimetype}`);
    console.log(`Buffer size: ${req.file.buffer.length} bytes`);
    
    try {
      const { uploadInterviewRecording } = require('../services/blobStorage');
      console.log('uploadInterviewRecording function imported successfully');
      
      const uploadResult = await uploadInterviewRecording(
        req.file.buffer,
        req.file.mimetype,
        interviewId,
        questionIndex
      );
      
      console.log('Blob upload successful. Result:', uploadResult);
      
      // Update the interview record
      console.log('=== UPDATING INTERVIEW RECORD ===');
      if (!interview.recordings) {
        console.log('Initializing recordings array');
        interview.recordings = [];
      }
      
      // Check if recording for this question index already exists
      const existingRecordingIndex = interview.recordings.findIndex(
        (recording) => recording.questionIndex === parseInt(questionIndex)
      );
      
      if (existingRecordingIndex !== -1) {
        console.log(`Updating existing recording at index ${existingRecordingIndex}`);
        interview.recordings[existingRecordingIndex] = {
          questionIndex: parseInt(questionIndex),
          blobUrl: uploadResult.url,
          blobName: uploadResult.blobName,
          uploadedAt: new Date().toISOString()
        };
      } else {
        console.log('Adding new recording entry');
        interview.recordings.push({
          questionIndex: parseInt(questionIndex),
          blobUrl: uploadResult.url,
          blobName: uploadResult.blobName,
          uploadedAt: new Date().toISOString()
        });
      }
      
      console.log(`Now have ${interview.recordings.length} recordings`);
      
      // Sort recordings by question index
      interview.recordings.sort((a, b) => a.questionIndex - b.questionIndex);
      
      // Check if all questions have been answered
      const totalQuestions = interview.questions ? interview.questions.length : 0;
      console.log(`Questions: ${totalQuestions}, Recordings: ${interview.recordings.length}`);
      
      if (interview.recordings.length === totalQuestions && totalQuestions > 0) {
        console.log('All questions answered, marking interview as completed');
        interview.status = 'completed';
        interview.completedAt = new Date().toISOString();
      }
      
      // Update the interview record
      console.log(`Updating interview document with ID: ${interview.id}`);
      try {
        await interviewsContainer.item(interview.id, interview.id).replace(interview);
        console.log('Interview document updated successfully');
      } catch (docUpdateError) {
        console.error('ERROR updating interview document:', docUpdateError);
        // Add fallback: try to create a new document if update fails
        console.log('Update failed, trying to create a new document');
        try {
          // Remove system properties before creating a new document
          const { _rid, _self, _etag, _attachments, _ts, ...cleanInterview } = interview;
          
          // Create a new clean interview document
          const newDocument = {
            ...cleanInterview,
            id: interviewId, // Use the provided ID
            updatedAt: new Date().toISOString()
          };
          
          const { resource } = await interviewsContainer.items.create(newDocument);
          console.log('Created new interview document as fallback');
        } catch (createError) {
          console.error('ERROR creating fallback document:', createError);
          throw new Error('Failed to update or create interview document');
        }
      }
            
      console.log('=== UPLOAD PROCESS COMPLETED SUCCESSFULLY ===');
      
      res.json({
        message: 'Recording uploaded successfully',
        recordingUrl: uploadResult.url
      });
    } catch (blobError) {
      console.error('=== BLOB STORAGE ERROR ===');
      console.error('Error type:', blobError.constructor.name);
      console.error('Error message:', blobError.message);
      console.error('Error stack:', blobError.stack);
      
      if (blobError.code) {
        console.error('Azure Storage Error Code:', blobError.code);
      }
      
      if (blobError.details) {
        console.error('Azure Storage Error Details:', blobError.details);
      }
      
      throw blobError; // Re-throw to be caught by the outer catch
    }
  } catch (error) {
    console.error('=== GENERAL UPLOAD ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

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
const { analyzeCVDocument } = require('../services/formRecognizer');

// routes/candidates.js - Updated CV upload route

// routes/candidates.js - Updated CV upload route

router.post('/cv', authMiddleware, authorizeRoles('candidate'), cvUpload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const userId = req.user.id;
    console.log(`Processing CV upload for user ${userId}`);
    
    // First, find the existing candidate record
    let existingCandidate = null;
    try {
      const { resources } = await candidatesContainer.items
        .query({
          query: "SELECT * FROM c WHERE c.userId = @userId",
          parameters: [{ name: "@userId", value: userId }]
        })
        .fetchAll();
      
      if (resources.length > 0) {
        console.log(`Found existing candidate record with ID: ${resources[0].id}`);
        existingCandidate = resources[0];
        
        // If there's an existing CV, delete it from blob storage
        if (existingCandidate.cvBlobName) {
          try {
            await deleteCV(existingCandidate.cvBlobName);
            console.log(`Deleted old CV blob: ${existingCandidate.cvBlobName}`);
          } catch (deleteError) {
            console.warn(`Warning: Failed to delete old CV blob: ${deleteError.message}`);
            // Continue anyway - this is not a critical error
          }
        }
      }
    } catch (queryError) {
      console.warn(`Error querying for existing record: ${queryError.message}`);
      // Continue anyway - we'll create a new record if needed
    }
    
    // Upload the new CV to blob storage
    let blobResult;
    try {
      // Use the existing candidate ID or create a new one
      const candidateId = existingCandidate ? existingCandidate.id : new Date().getTime().toString();
      
      blobResult = await uploadCV(
        req.file.buffer,
        req.file.mimetype,
        candidateId
      );
      console.log(`Successfully uploaded CV to blob: ${blobResult.blobName}`);
    } catch (blobError) {
      console.error(`Error uploading CV to blob storage: ${blobError.message}`);
      return res.status(500).json({ message: 'Failed to upload CV' });
    }
    
    // Analyze the CV using Form Recognizer
    let cvAnalysis;
    try {
      cvAnalysis = await analyzeCVDocument(req.file.buffer);
      console.log("CV analysis completed successfully");
    } catch (analysisError) {
      console.error(`Error analyzing CV: ${analysisError.message}`);
      // Continue without analysis results
      cvAnalysis = null;
    }
    
    // Prepare candidate data, preserving existing data
    const updatedCandidate = {
      id: existingCandidate ? existingCandidate.id : new Date().getTime().toString(),
      userId: userId,
      firstName: req.user.firstName || (existingCandidate ? existingCandidate.firstName : ''),
      lastName: req.user.lastName || (existingCandidate ? existingCandidate.lastName : ''),
      email: req.user.email,
      cvUrl: blobResult.url,
      cvBlobName: blobResult.blobName,
      
      // Preserve existing data or use extracted data
      skills: existingCandidate ? existingCandidate.skills : [],
      experience: existingCandidate ? existingCandidate.experience : [],
      education: existingCandidate ? existingCandidate.education : [],
      
      // Add extracted raw text for future analysis
      cvRawText: cvAnalysis?.rawText || '',
      
      // Add analysis metadata
      cvAnalyzed: !!cvAnalysis,
      cvAnalyzedAt: cvAnalysis ? new Date().toISOString() : null,
      
      updatedAt: new Date().toISOString(),
      createdAt: existingCandidate ? existingCandidate.createdAt : new Date().toISOString()
    };
    
    // If we have CV analysis results, merge them with existing data
    if (cvAnalysis) {
      if (cvAnalysis.skills?.length > 0) {
        // Merge with existing skills without duplicates
        const allSkills = new Set([...updatedCandidate.skills, ...cvAnalysis.skills]);
        updatedCandidate.skills = Array.from(allSkills);
      }
      
      if (cvAnalysis.experience?.length > 0) {
        // Add new experience entries
        updatedCandidate.experience = [...updatedCandidate.experience, ...cvAnalysis.experience];
      }
      
      if (cvAnalysis.education?.length > 0) {
        // Add new education entries
        updatedCandidate.education = [...updatedCandidate.education, ...cvAnalysis.education];
      }
    }
    
    // Update or create the candidate record
    try {
      if (existingCandidate) {
        try {
          // First try to update existing record
          console.log(`Attempting to replace document with ID: ${existingCandidate.id}`);
          const { resource } = await candidatesContainer.item(existingCandidate.id, existingCandidate.id).replace(updatedCandidate);
          console.log(`Successfully updated candidate record with ID: ${existingCandidate.id}`);
        } catch (replaceError) {
          console.warn(`Replace operation failed: ${replaceError.message}`);
          
          // If replace fails, try to delete and create
          try {
            console.log(`Attempting to delete document with ID: ${existingCandidate.id}`);
            await candidatesContainer.item(existingCandidate.id, existingCandidate.id).delete();
            
            // Then create a new document with the same ID
            console.log(`Creating new document with ID: ${updatedCandidate.id}`);
            const { resource } = await candidatesContainer.items.create(updatedCandidate);
            console.log(`Successfully created new candidate record with ID: ${updatedCandidate.id}`);
          } catch (deleteCreateError) {
            console.error(`Delete/Create operation failed: ${deleteCreateError.message}`);
            throw deleteCreateError; // Re-throw to be caught by outer catch
          }
        }
      } else {
        // Create new record
        console.log(`Creating brand new candidate record with ID: ${updatedCandidate.id}`);
        const { resource } = await candidatesContainer.items.create(updatedCandidate);
        console.log(`Successfully created new candidate record with ID: ${updatedCandidate.id}`);
      }
      
      res.status(200).json({
        message: 'CV uploaded successfully',
        cvUrl: blobResult.url
      });
    } catch (dbError) {
      console.error(`Error updating/creating candidate record: ${dbError.message}`);
      
      // Try to clean up the blob we just uploaded
      try {
        await deleteCV(blobResult.blobName);
      } catch (deleteError) {
        console.warn(`Failed to delete blob after failed record update: ${deleteError.message}`);
      }
      
      res.status(500).json({ message: 'Failed to update candidate record' });
    }
  } catch (error) {
    console.error(`Error in CV upload process: ${error.message}`);
    console.error(error.stack); // Log the full stack trace
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
// Apply for a vacancy
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

    // Get vacancy details using query instead of direct ID lookup
    const { resources } = await database.container('Vacancies').items
      .query({
        query: "SELECT * FROM c WHERE c.id = @vacancyId",
        parameters: [{ name: "@vacancyId", value: vacancyId }]
      })
      .fetchAll();
    const vacancy = resources.length > 0 ? resources[0] : null;
    if (!vacancy) {
      console.error(`Vacancy not found with ID: ${vacancyId}`);
      return res.status(404).json({ message: 'Vacancy not found' });
    }

    // Calculate suitability score using Azure ML
    const candidateFeatures = {
      skills: candidate.skills || [],
      experienceYears: estimateTotalExperience(candidate.experience || []),
      educationLevel: getHighestEducationLevel(candidate.education || [])
    };
    const jobFeatures = {
      requiredSkills: vacancy.requiredSkills || [],
      experienceRequired: vacancy.experienceRequired || 0,
      title: vacancy.title || '',
      description: vacancy.description || ''
    };

    try {
      // Try to get match prediction from Azure
      const matchPrediction = await predictCandidateMatch(candidateFeatures, jobFeatures);

      // Create application with match data
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
        vacancyTitle: vacancy.title,
        // Store suitability scores
        suitabilityScore: {
          overall: matchPrediction.overallScore,
          skills: matchPrediction.skillsScore,
          experience: matchPrediction.experienceScore,
          education: matchPrediction.educationScore,
          matchedSkills: matchPrediction.matchDetails?.matchedSkills || [],
          missingSkills: matchPrediction.matchDetails?.missingSkills || []
        }
      };

      await applicationsContainer.items.create(newApplication);

      res.status(201).json({
        message: 'Application submitted successfully',
        application: newApplication
      });
    } catch (aiError) {
      // Specifically handle AI service errors
      console.error('Azure AI matching service error:', aiError);
      return res.status(503).json({
        message: 'Azure AI matching service is currently unavailable. Please try again later.',
        error: aiError.message,
        serviceIssue: true // Flag to identify this as a service issue
      });
    }
  } catch (error) {
    // Handle other errors
    console.error('Error applying for vacancy:', error);
    res.status(500).json({ message: 'Server error during application' });
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