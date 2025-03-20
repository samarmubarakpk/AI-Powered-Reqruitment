// test-azure-openai.js
require('dotenv').config();
const { OpenAI } = require("openai");

async function testAzureOpenAI() {
  console.log("Testing Azure OpenAI connection with these settings:");
  console.log(`Endpoint: ${process.env.AZURE_OPENAI_ENDPOINT}`);
  console.log(`Deployment: ${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`);
  console.log(`API Key: ${process.env.AZURE_OPENAI_API_KEY.substring(0, 5)}...`);

  // Remove trailing slash if present
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT.endsWith('/') 
    ? process.env.AZURE_OPENAI_ENDPOINT.slice(0, -1) 
    : process.env.AZURE_OPENAI_ENDPOINT;

  const openai = new OpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    baseURL: `${endpoint}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions`,
    defaultQuery: { "api-version": "2023-05-15" }, // Try an older API version
    defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY }
  });

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello world" }
      ],
      max_tokens: 50
    });
    
    console.log("Success! Response:");
    console.log(completion.choices[0].message);
    return true;
  } catch (error) {
    console.error("Error testing Azure OpenAI:");
    console.error(error);
    return false;
  }
}

testAzureOpenAI();