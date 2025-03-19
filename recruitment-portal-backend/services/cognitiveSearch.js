// services/cognitiveSearch.js
const { SearchClient, AzureKeyCredential } = require('@azure/search-documents');

// Initialize the Search client
const searchClient = new SearchClient(
  process.env.AZURE_SEARCH_ENDPOINT,
  process.env.AZURE_SEARCH_INDEX_NAME,
  new AzureKeyCredential(process.env.AZURE_SEARCH_API_KEY)
);

/**
 * Search candidates using Azure Cognitive Search
 * @param {Object} searchCriteria - Search parameters
 * @returns {Array} Search results
 */
async function searchCandidates(searchCriteria) {
  try {
    let searchOptions = {
      includeTotalCount: true,
      select: ['id', 'firstName', 'lastName', 'email', 'skills', 'experience', 'education', 'cvUrl'],
      orderBy: []
    };
    
    // Add sorting options
    if (searchCriteria.sortBy === 'experience') {
      searchOptions.orderBy.push('totalExperience desc');
    } else if (searchCriteria.sortBy === 'recentActivity') {
      searchOptions.orderBy.push('updatedAt desc');
    }
    
    // Add filters
    let filters = [];
    
    if (searchCriteria.experienceMin !== undefined) {
      filters.push(`totalExperience ge ${searchCriteria.experienceMin}`);
    }
    
    if (searchCriteria.experienceMax !== undefined) {
      filters.push(`totalExperience le ${searchCriteria.experienceMax}`);
    }
    
    if (searchCriteria.location) {
      filters.push(`location eq '${searchCriteria.location}'`);
    }
    
    if (filters.length > 0) {
      searchOptions.filter = filters.join(' and ');
    }
    
    // Build the search query - searchCriteria.skills is used for full-text search
    let searchText = searchCriteria.skills && searchCriteria.skills.length > 0 
      ? searchCriteria.skills.join(' OR ') 
      : '*';
    
    // Execute search
    const searchResults = await searchClient.search(searchText, searchOptions);

    // Process results
    const candidates = [];
    for await (const result of searchResults.results) {
      candidates.push(result.document);
    }
    
    return {
      candidates,
      count: searchResults.count
    };
  } catch (error) {
    console.error('Error searching candidates:', error);
    throw error;
  }
}

module.exports = {
  searchCandidates
};