const { AzureKeyCredential, DocumentAnalysisClient } = require("@azure/ai-form-recognizer");

// Initialize Form Recognizer client (now called Document Analysis client)
const documentAnalysisClient = new DocumentAnalysisClient(
  process.env.FORM_RECOGNIZER_ENDPOINT,
  new AzureKeyCredential(process.env.FORM_RECOGNIZER_API_KEY)
);

/**
 * Analyzes a PDF document and extracts CV information
 * @param {Buffer} documentBuffer - The CV document buffer
 * @returns {Object} Extracted CV information
 */
async function analyzeCVDocument(documentBuffer) {
  try {
    console.log("Analyzing CV document...");
    
    // Start document analysis (API has changed from beginAnalyzeDocument to beginAnalyzeDocument)
    const poller = await documentAnalysisClient.beginAnalyzeDocument(
      "prebuilt-document", // Using the prebuilt document model
      documentBuffer
    );
    
    // Get analysis result
    const result = await poller.pollUntilDone();
    
    // Extract relevant information
    const extractedInfo = extractCVInformation(result);
    
    return extractedInfo;
  } catch (error) {
    console.error("Error analyzing CV document:", error);
    throw error;
  }
}

/**
 * Extracts structured CV information from analysis results
 * @param {Object} analysisResult - Form Recognizer analysis result
 * @returns {Object} Structured CV information
 */
function extractCVInformation(analysisResult) {
  // Initialize structured data
  const cvInfo = {
    personalInfo: {},
    skills: [],
    education: [],
    experience: [],
    languages: [],
    rawText: ""
  };
  
  try {
    // Extract full text
    cvInfo.rawText = analysisResult.content;
    
    // Extract structured data using content and key-value pairs
    // This is a simplified version - in production you would use more sophisticated parsing
    const content = analysisResult.content.toLowerCase();
    const paragraphs = analysisResult.paragraphs || [];
    
    // Extract skills
    const skillsSection = findSection(paragraphs, ["skills", "technical skills"]);
    if (skillsSection) {
      const skillText = skillsSection.content;
      cvInfo.skills = extractListItems(skillText);
    }
    
    // Extract education
    const educationSection = findSection(paragraphs, ["education", "academic background"]);
    if (educationSection) {
      cvInfo.education = parseEducation(educationSection.content);
    }
    
    // Extract experience
    const experienceSection = findSection(paragraphs, ["experience", "work experience", "professional experience"]);
    if (experienceSection) {
      cvInfo.experience = parseExperience(experienceSection.content);
    }
    
    // Extract personal information
    // This would typically come from the top of the CV
    // In a real implementation, you'd use more sophisticated parsing
    
    return cvInfo;
  } catch (error) {
    console.error("Error extracting CV information:", error);
    return cvInfo;
  }
}

/**
 * Finds a section in the document by potential section titles
 */
function findSection(paragraphs, possibleTitles) {
  for (const paragraph of paragraphs) {
    const text = paragraph.content.toLowerCase();
    
    for (const title of possibleTitles) {
      if (text.includes(title)) {
        // Found a section
        return paragraph;
      }
    }
  }
  
  return null;
}

/**
 * Extracts list items from text
 */
function extractListItems(text) {
  // This is a simplified version - in production you would use more sophisticated parsing
  const items = text.split(/[,•\n]/);
  return items
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

/**
 * Parses education information
 */
function parseEducation(text) {
  // Simplified implementation
  // In production, you would use NLP and pattern matching
  const education = [];
  
  // Simple pattern: Look for degree names and institutions
  const degreePatterns = [
    "bachelor", "master", "phd", "doctorate", "bsc", "msc", "ba", "ma", "mba"
  ];
  
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  for (const line of lines) {
    const entry = {
      institution: "",
      degree: "",
      field: "",
      dates: ""
    };
    
    // Attempt to extract institution and degree
    for (const pattern of degreePatterns) {
      if (line.toLowerCase().includes(pattern)) {
        entry.degree = pattern;
        
        // Simple date extraction
        const dateMatch = line.match(/\b(19|20)\d{2}\b/g);
        if (dateMatch && dateMatch.length > 0) {
          entry.dates = dateMatch.join(" - ");
        }
        
        education.push(entry);
        break;
      }
    }
  }
  
  return education;
}

/**
 * Parses work experience information
 */
function parseExperience(text) {
  // Simplified implementation
  // In production, you would use NLP and pattern matching
  const experience = [];
  
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  let currentEntry = null;
  
  for (const line of lines) {
    // Check if this line potentially starts a new entry
    const dateMatch = line.match(/\b(19|20)\d{2}\b/g);
    
    if (dateMatch && dateMatch.length > 0) {
      // This might be a new experience entry
      if (currentEntry) {
        experience.push(currentEntry);
      }
      
      currentEntry = {
        company: "",
        position: "",
        description: "",
        dates: dateMatch.join(" - ")
      };
      
      // Try to extract position and company
      const parts = line.split(/\s+at\s+|\s+\-\s+/);
      if (parts.length > 1) {
        currentEntry.position = parts[0].trim();
        currentEntry.company = parts[1].trim();
      }
    } else if (currentEntry) {
      // This might be a description for the current entry
      currentEntry.description += line.trim() + " ";
    }
  }
  
  // Add the last entry if it exists
  if (currentEntry) {
    experience.push(currentEntry);
  }
  
  return experience;
}

module.exports = {
  analyzeCVDocument
};