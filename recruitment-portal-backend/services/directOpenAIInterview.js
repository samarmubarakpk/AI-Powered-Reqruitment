// services/directOpenAIInterview.js
const axios = require('axios');

/**
 * Generates interview questions for a candidate using direct OpenAI API
 * @param {string} candidateName - The candidate's full name
 * @param {Array} skills - The candidate's skills
 * @param {string} jobTitle - The job title
 * @param {string} jobDescription - The job description
 * @param {Array} requiredSkills - The required skills for the job
 * @param {number} questionCount - Number of questions to generate (default: 5)
 * @returns {Promise<Array>} Array of generated interview questions
 */
async function generateInterviewQuestionsOpenAI(candidateName, skills, jobTitle, jobDescription, requiredSkills, questionCount = 5) {
  try {
    // OpenAI API configuration
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured.');
    }
    
    const endpointUrl = 'https://api.openai.com/v1/chat/completions';
    
    // Format the skills arrays for better prompt construction
    const candidateSkillsText = skills && skills.length > 0 ? skills.join(', ') : 'No specific skills provided';
    const requiredSkillsText = requiredSkills && requiredSkills.length > 0 ? requiredSkills.join(', ') : 'No specific skills required';
    
    // Format the prompt for question generation
    const prompt = `
Generate ${questionCount} personalized interview questions in Spanish langauge for ${candidateName} applying for ${jobTitle}.

CANDIDATE SKILLS: ${candidateSkillsText}
JOB DESCRIPTION: ${jobDescription}
REQUIRED SKILLS: ${requiredSkillsText}

Create a diverse set of questions including:
- Technical questions related to their skills
- Behavioral questions relevant to the job
- Situational questions
- Questions about their experience

For each question, provide:
1. The question category (Technical, Behavioral, Situational, or Experience)
2. The actual question text
3. A brief explanation of why you're asking it

Be specific and tailor questions to the candidate's skills and job requirements.
Format the response as a JSON array with this structure:
[
  {
    "category": "Technical",
    "question": "Question text here",
    "explanation": "Brief explanation here"
  },
  ...
]

Return EXACTLY ${questionCount} questions total. Make sure all required fields are included for each question.
`;

    console.log(`Generating ${questionCount} interview questions using OpenAI API for ${candidateName}`);
    
    // Make the request to OpenAI API
    const response = await axios.post(
      endpointUrl,
      {
        model: 'gpt-3.5-turbo', // You can also use 'gpt-4' for higher quality
        messages: [
          { role: 'system', content: 'You are an expert HR manager specializing in technical interviews. You create well-structured, specific questions tailored to candidate profiles and job requirements.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7, // Higher temperature for more creative questions
        max_tokens: 2000, // Allow more tokens for detailed questions and explanations
        top_p: 0.9
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    // Extract and parse the response
    const responseContent = response.data.choices[0].message.content;
    
    // Try to parse the JSON
    try {
      // Look for a JSON array in the response
      const jsonMatch = responseContent.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const jsonString = jsonMatch[0];
        const questions = JSON.parse(jsonString);
        
        // Validate the questions have the required fields
        const validQuestions = questions.filter(q => 
          q && q.category && q.question && q.explanation
        );
        
        if (validQuestions.length === 0) {
          throw new Error('No valid questions found in the response');
        }
        
        console.log(`Successfully generated ${validQuestions.length} interview questions`);
        return validQuestions;
      } else {
        throw new Error('No valid JSON found in the response');
      }
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Raw response:', responseContent);
      
      // Generate fallback questions
      return generateFallbackQuestions(candidateName, skills, jobTitle, questionCount);
    }
  } catch (error) {
    console.error('OpenAI API Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    
    // Generate fallback questions
    return generateFallbackQuestions(candidateName, skills, jobTitle, questionCount);
  }
}

/**
 * Generate fallback questions if the API fails
 * @param {string} candidateName - The candidate's name
 * @param {Array} skills - The candidate's skills
 * @param {string} jobTitle - The job title
 * @param {number} count - Number of questions to generate
 * @returns {Array} Array of generated interview questions
 */
function generateFallbackQuestions(candidateName, skills, jobTitle, count = 5) {
  console.log(`Generating ${count} fallback interview questions`);
  
  // Get first name to personalize questions
  const firstName = candidateName.split(' ')[0] || 'candidate';
  
  // Use skills if available, otherwise use default skills
  const skillsToUse = skills && skills.length > 0 ? skills : ['problem-solving', 'teamwork', 'communication'];
  
  // Define a pool of questions to draw from
  const questionPool = [
    {
      category: "Technical",
      question: `Based on your experience with ${skillsToUse[0] || 'technical skills'}, what approach would you take to solve a complex problem in that area?`,
      explanation: "Evaluates technical depth and problem-solving in their primary skill area."
    },
    {
      category: "Behavioral",
      question: `Tell me about a time when you had to work under pressure to meet a deadline. How did you handle it?`,
      explanation: "Assesses how they perform under pressure and their time management skills."
    },
    {
      category: "Situational",
      question: `How would you handle a situation where project requirements change mid-development?`,
      explanation: "Tests adaptability and problem-solving skills in changing circumstances."
    },
    {
      category: "Experience",
      question: `What do you consider your most significant professional achievement and why?`,
      explanation: "Reveals values, motivations, and what they consider important in their work."
    },
    {
      category: "Technical",
      question: `How do you stay current with the latest developments in ${skillsToUse[1] || 'your field'}?`,
      explanation: "Evaluates their commitment to continuous learning and professional development."
    },
    {
      category: "Behavioral",
      question: `Describe a situation where you had to collaborate with a difficult team member. How did you handle it?`,
      explanation: "Assesses interpersonal skills and ability to work well with diverse personalities."
    },
    {
      category: "Situational",
      question: `If you noticed a colleague was struggling with their workload, what would you do?`,
      explanation: "Tests empathy, teamwork, and willingness to support others."
    },
    {
      category: "Experience",
      question: `How has your previous experience prepared you for this ${jobTitle} role?`,
      explanation: "Evaluates their understanding of the role and ability to apply past experience."
    },
    {
      category: "Technical",
      question: `What methods do you use to ensure code quality and prevent bugs?`,
      explanation: "Assesses their approach to quality assurance and attention to detail."
    },
    {
      category: "Behavioral",
      question: `Tell me about a time when you received difficult feedback. How did you respond?`,
      explanation: "Evaluates their ability to accept feedback and grow professionally."
    }
  ];
  
  // Return the requested number of questions (or all if we don't have enough)
  return questionPool.slice(0, Math.min(count, questionPool.length));
}

module.exports = { generateInterviewQuestionsOpenAI };