// utilities/cosmosDbUtils.js
const { CosmosClient } = require('@azure/cosmos');

/**
 * Safely creates a new document in Cosmos DB with retry logic
 * @param {object} container - Cosmos DB container
 * @param {object} document - Document to create
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<object>} - Created document
 */
async function safeCreateDocument(container, document, maxRetries = 3) {
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
}

/**
 * Safely deletes a document in Cosmos DB with retry logic
 * @param {object} container - Cosmos DB container
 * @param {string} id - Document ID
 * @param {string} partitionKey - Partition key value
 * @returns {Promise<boolean>} - True if deletion succeeded or document not found
 */
async function safeDeleteDocument(container, id, partitionKey) {
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
}

/**
 * Finds a document by a field value with retry logic
 * @param {object} container - Cosmos DB container
 * @param {string} fieldName - Field name to search by
 * @param {any} fieldValue - Value to match
 * @returns {Promise<object|null>} - Found document or null
 */
async function findDocumentByField(container, fieldName, fieldValue) {
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
}

module.exports = {
  safeCreateDocument,
  safeDeleteDocument,
  findDocumentByField
};