// services/blobStorage.js
const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');

// Initialize Blob Service Client
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);

// Container name for CVs
const containerName = 'candidate-cvs';

// Create container if it doesn't exist
const createContainerIfNotExists = async () => {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists();
    console.log(`Container "${containerName}" created or exists already.`);
  } catch (error) {
    console.error(`Error creating container: ${error.message}`);
    throw error;
  }
};

// Initialize on module load
createContainerIfNotExists().catch(console.error);

// Upload a CV file
const uploadCV = async (fileBuffer, contentType, candidateId) => {
  try {
    // Generate a unique name for the blob
    const blobName = `${candidateId}/${uuidv4()}.pdf`;
    
    // Get a block blob client
    const containerClient = blobServiceClient.getContainerClient(containerName);
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
    const containerClient = blobServiceClient.getContainerClient(containerName);
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
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    const downloadBlockBlobResponse = await blockBlobClient.download(0);
    
    return {
      stream: downloadBlockBlobResponse.readableStreamBody,
      contentType: downloadBlockBlobResponse.contentType,
      contentLength: downloadBlockBlobResponse.contentLength,
    };
  } catch (error) {
    console.error(`Error getting CV: ${error.message}`);
    throw error;
  }
};

module.exports = {
  uploadCV,
  deleteCV,
  getCV
};