// startup.js
const fs = require('fs');

try {
  // Create a log directory if it doesn't exist
  if (!fs.existsSync('/home/LogFiles')) {
    fs.mkdirSync('/home/LogFiles', { recursive: true });
  }
  
  // Log startup attempt
  fs.appendFileSync('/home/LogFiles/startup-log.txt', `Startup attempt: ${new Date().toISOString()}\n`);
  
  // Try to load environment variables
  const envKeys = Object.keys(process.env).filter(key => !key.includes('PASSWORD') && !key.includes('SECRET') && !key.includes('KEY'));
  const safeEnv = {};
  envKeys.forEach(key => { safeEnv[key] = process.env[key]; });
  fs.appendFileSync('/home/LogFiles/startup-log.txt', `Environment variables: ${JSON.stringify(safeEnv, null, 2)}\n`);
  
  // Try to start the actual server
  fs.appendFileSync('/home/LogFiles/startup-log.txt', 'Attempting to start server.js\n');
  require('./server');
} catch (error) {
  // Log any errors
  fs.appendFileSync('/home/LogFiles/startup-log.txt', `ERROR: ${error.message}\n${error.stack}\n`);
  process.exit(1);
}