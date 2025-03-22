// services/blobStorage.js with SAS token generation
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
    console.log(`[getCV] Accessing blob: ${blobName}`);
    const containerClient = blobServiceClient.getContainerClient(containerName);
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
const generateSasUrl = async (blobName, expiryMinutes = 15) => {
  try {
    console.log(`[generateSasUrl] Generating SAS URL for blob: ${blobName}`);
    
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

module.exports = {
  uploadCV,
  deleteCV,
  getCV,
  generateSasUrl
};