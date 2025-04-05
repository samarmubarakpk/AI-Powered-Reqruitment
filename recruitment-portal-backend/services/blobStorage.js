// services/blobStorage.js with SAS token generation and interview recording support
const { 
  BlobServiceClient, 
  StorageSharedKeyCredential, 
  generateBlobSASQueryParameters, 
  BlobSASPermissions 
} = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');

// Extract account info from connection string
function extractStorageAccountInfo(connectionString) {
  const regex = {
    accountName: /AccountName=([^;]+)/i,
    accountKey: /AccountKey=([^;]+)/i,
    endpointSuffix: /EndpointSuffix=([^;]+)/i
  };
  
  const accountName = (connectionString.match(regex.accountName) || [])[1];
  const accountKey = (connectionString.match(regex.accountKey) || [])[1];
  const endpointSuffix = (connectionString.match(regex.endpointSuffix) || [])[1] || 'core.windows.net';
  
  return { accountName, accountKey, endpointSuffix };
}

// Extract account information
const { accountName, accountKey } = extractStorageAccountInfo(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);

// Initialize Blob Service Client
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);

// Container names
const cvContainerName = 'candidate-cvs';
const interviewRecordingsContainerName = 'interview-recordings';

// Create container if it doesn't exist
const createContainerIfNotExists = async (containerName) => {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists();
    console.log(`Container "${containerName}" created or exists already.`);
  } catch (error) {
    console.error(`Error creating container: ${error.message}`);
    throw error;
  }
};

// Initialize containers on module load
const initializeContainers = async () => {
  await createContainerIfNotExists(cvContainerName);
  await createContainerIfNotExists(interviewRecordingsContainerName);
};

initializeContainers().catch(console.error);

// Upload a CV file
const uploadCV = async (fileBuffer, contentType, candidateId) => {
  try {
    // Generate a unique name for the blob
    const blobName = `${candidateId}/${uuidv4()}.pdf`;
    
    // Get a block blob client
    const containerClient = blobServiceClient.getContainerClient(cvContainerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Set the content type
    const options = { 
      blobHTTPHeaders: { 
        blobContentType: contentType 
      }
    };
    
    // Upload the file
    await blockBlobClient.upload(fileBuffer, fileBuffer.length, options);
    
    return {
      blobName,
      url: blockBlobClient.url,
    };
  } catch (error) {
    console.error(`Error uploading CV: ${error.message}`);
    throw error;
  }
};

// Delete a CV file
const deleteCV = async (blobName) => {
  try {
    const containerClient = blobServiceClient.getContainerClient(cvContainerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.delete();
    
    return true;
  } catch (error) {
    console.error(`Error deleting CV: ${error.message}`);
    throw error;
  }
};

// Get a CV file
const getCV = async (blobName) => {
  try {
    console.log(`[getCV] Accessing blob: ${blobName}`);
    const containerClient = blobServiceClient.getContainerClient(cvContainerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Check if the blob exists
    const exists = await blockBlobClient.exists();
    if (!exists) {
      console.error(`[getCV] Blob does not exist: ${blobName}`);
      throw new Error(`Blob not found: ${blobName}`);
    }
    
    const downloadBlockBlobResponse = await blockBlobClient.download(0);
    
    return {
      stream: downloadBlockBlobResponse.readableStreamBody,
      contentType: downloadBlockBlobResponse.contentType,
      contentLength: downloadBlockBlobResponse.contentLength,
    };
  } catch (error) {
    console.error(`[getCV] Error getting CV: ${error.message}`);
    throw error;
  }
};

// Generate a SAS token for a blob with limited time access
const generateSasUrl = async (blobName, containerName, expiryMinutes = 15) => {
  try {
    console.log(`[generateSasUrl] Generating SAS URL for blob: ${blobName} in container: ${containerName}`);
    
    if (!accountName || !accountKey) {
      throw new Error('Storage account credentials not configured');
    }
    
    // Create a shared key credential
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    
    // Create blob client
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Check if the blob exists
    const exists = await blockBlobClient.exists();
    if (!exists) {
      console.error(`[generateSasUrl] Blob does not exist: ${blobName}`);
      throw new Error(`Blob not found: ${blobName}`);
    }
    
    // Set start and expiry time
    const startDate = new Date();
    const expiryDate = new Date(startDate);
    expiryDate.setMinutes(startDate.getMinutes() + expiryMinutes);
    
    // Create SAS token that's valid for expiryMinutes
    const sasOptions = {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse("r"), // Read only
      startsOn: startDate,
      expiresOn: expiryDate,
    };
    
    // Generate the token
    const sasToken = generateBlobSASQueryParameters(
      sasOptions,
      sharedKeyCredential
    ).toString();
    
    // Return the full URL with SAS token
    return `${blockBlobClient.url}?${sasToken}`;
  } catch (error) {
    console.error(`[generateSasUrl] Error generating SAS URL: ${error.message}`);
    throw error;
  }
};

// Generate a SAS token for a CV blob
const generateCvSasUrl = async (blobName, expiryMinutes = 15) => {
  return generateSasUrl(blobName, cvContainerName, expiryMinutes);
};

// Upload an interview recording
// Upload an interview recording
const uploadInterviewRecording = async (fileBuffer, contentType, interviewId, questionIndex) => {
  try {
    // Generate a filename based on interview ID and question index
    const blobName = `${interviewId}/${questionIndex}.webm`;
    
    // Get a block blob client
    const containerClient = blobServiceClient.getContainerClient(interviewRecordingsContainerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Set the content type
    const options = { 
      blobHTTPHeaders: { 
        blobContentType: contentType 
      }
    };
    
    // Upload the file
    await blockBlobClient.upload(fileBuffer, fileBuffer.length, options);
    
    return {
      blobName,
      url: blockBlobClient.url,
    };
  } catch (error) {
    console.error(`Error uploading interview recording: ${error.message}`);
    throw error;
  }
};

// Get an interview recording
const getInterviewRecording = async (interviewId, questionIndex) => {
  try {
    const blobName = `${interviewId}/${questionIndex}.webm`;
    console.log(`[getInterviewRecording] Accessing blob: ${blobName}`);
    
    const containerClient = blobServiceClient.getContainerClient(interviewRecordingsContainerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Check if the blob exists
    const exists = await blockBlobClient.exists();
    if (!exists) {
      console.error(`[getInterviewRecording] Blob does not exist: ${blobName}`);
      throw new Error(`Interview recording not found: ${blobName}`);
    }
    
    const downloadBlockBlobResponse = await blockBlobClient.download(0);
    
    return {
      stream: downloadBlockBlobResponse.readableStreamBody,
      contentType: downloadBlockBlobResponse.contentType,
      contentLength: downloadBlockBlobResponse.contentLength,
    };
  } catch (error) {
    console.error(`[getInterviewRecording] Error getting interview recording: ${error.message}`);
    throw error;
  }
};

// Generate a SAS token for an interview recording
const generateInterviewRecordingSasUrl = async (interviewId, questionIndex, expiryMinutes = 30) => {
  const blobName = `${interviewId}/${questionIndex}.webm`;
  return generateSasUrl(blobName, interviewRecordingsContainerName, expiryMinutes);
};

// Get all recordings for an interview
const getInterviewRecordings = async (interviewId) => {
  try {
    const containerClient = blobServiceClient.getContainerClient(interviewRecordingsContainerName);
    
    // List all blobs with the interview ID prefix
    const prefix = `${interviewId}/`;
    const blobItems = [];
    
    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
      blobItems.push(blob);
    }
    
    // Generate SAS URLs for each blob
    const recordings = await Promise.all(
      blobItems.map(async (blob) => {
        const fileName = blob.name.split('/').pop();
        const questionIndex = parseInt(fileName.split('.')[0]);
        
        const sasUrl = await generateSasUrl(blob.name, interviewRecordingsContainerName, 60);
        
        return {
          questionIndex,
          blobName: blob.name,
          url: sasUrl,
          contentLength: blob.properties.contentLength,
          contentType: blob.properties.contentType,
          createdOn: blob.properties.createdOn
        };
      })
    );
    
    // Sort by question index
    recordings.sort((a, b) => a.questionIndex - b.questionIndex);
    
    return recordings;
  } catch (error) {
    console.error(`Error getting interview recordings: ${error.message}`);
    throw error;
  }
};



// Delete an interview recording
const deleteInterviewRecording = async (interviewId, questionIndex) => {
  try {
    const blobName = `${interviewId}/${questionIndex}.webm`;
    const containerClient = blobServiceClient.getContainerClient(interviewRecordingsContainerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.delete();
    
    return true;
  } catch (error) {
    console.error(`Error deleting interview recording: ${error.message}`);
    throw error;
  }
};


module.exports = {
  // CV operations
  uploadCV,
  deleteCV,
  getCV,
  generateCvSasUrl,
  
  // Interview recording operations
  uploadInterviewRecording,
  getInterviewRecording,
  generateInterviewRecordingSasUrl,
  getInterviewRecordings,
  deleteInterviewRecording,
  
  // General SAS URL generation (kept for backward compatibility)
  generateSasUrl
};