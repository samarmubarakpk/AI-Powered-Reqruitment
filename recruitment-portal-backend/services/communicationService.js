// This would go in a new service file: services/communicationService.js
const { CommunicationIdentityClient } = require('@azure/communication-identity');
const { CallClient, CallAgent } = require('@azure/communication-calling');

const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
const identityClient = new CommunicationIdentityClient(connectionString);

// Create a user identity for the interview (to be used by company interviewer)
async function createUserIdentity() {
  const user = await identityClient.createUser();
  const tokenResponse = await identityClient.getToken(user, ["voip", "chat"]);
  return {
    user: user,
    token: tokenResponse.token,
    expiresOn: tokenResponse.expiresOn
  };
}

// Initialize a call client (to be used in frontend)
async function initializeCallClient(token) {
  const callClient = new CallClient();
  const callAgent = await callClient.createCallAgent(token);
  return callAgent;
}

module.exports = {
  createUserIdentity,
  initializeCallClient
};