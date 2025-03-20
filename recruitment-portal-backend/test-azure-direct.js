// test-azure-direct.js
require('dotenv').config();
const axios = require('axios');

async function testAzureOpenAI() {
  console.log("Testing Azure OpenAI connection with direct Axios requests");
  console.log(`Endpoint: ${process.env.AZURE_OPENAI_ENDPOINT}`);
  console.log(`Deployment: ${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`);
  console.log(`API Key: ${process.env.AZURE_OPENAI_API_KEY.substring(0, 5)}...`);

  // Remove trailing slash if present
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT.endsWith('/') 
    ? process.env.AZURE_OPENAI_ENDPOINT.slice(0, -1) 
    : process.env.AZURE_OPENAI_ENDPOINT;

  // Try multiple URL formats
  const urlFormats = [
    `${endpoint}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=2023-05-15`,
    `${endpoint}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}/completions?api-version=2023-05-15`,
    `${endpoint}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=2022-12-01`,
  ];

  for (const [index, url] of urlFormats.entries()) {
    console.log(`\nAttempting format ${index + 1}: ${url}`);
    
    try {
      const response = await axios.post(
        url,
        {
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: "Hello world" }
          ],
          max_tokens: 50,
          temperature: 0.7
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': process.env.AZURE_OPENAI_API_KEY
          }
        }
      );
      
      console.log("SUCCESS! Response:");
      console.log(response.data.choices[0].message);
      console.log("\nWorking URL format is:", url);
      return true;
    } catch (error) {
      console.error(`Error with format ${index + 1}:`);
      console.error(`Status: ${error.response?.status}`);
      console.error(`Message: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  console.log("\nAll formats failed. Let's try checking available deployments:");
  
  // Try to list deployments to see what's actually available
  try {
    const listUrl = `${endpoint}/openai/deployments?api-version=2022-12-01`;
    const response = await axios.get(listUrl, {
      headers: {
        'api-key': process.env.AZURE_OPENAI_API_KEY
      }
    });
    
    console.log("Available deployments:");
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("Error listing deployments:");
    console.error(`Status: ${error.response?.status}`);
    console.error(`Message: ${error.response?.data?.error?.message || error.message}`);
  }

  return false;
}

// Install axios if you don't have it: npm install axios
testAzureOpenAI();