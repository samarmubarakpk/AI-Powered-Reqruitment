// startup.js
require('./env-fix');
const fs = require('fs');

// Define logDir at the top level so it's accessible in catch block
const logDir = '/home/LogFiles';

try {
  // Create log directory
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  fs.writeFileSync(`${logDir}/startup-log.txt`, `Startup attempt: ${new Date().toISOString()}\n`);
  
  // Log safe env vars for debugging
  const safeEnv = {
    PORT: process.env.PORT,
    WEBSITE_HOSTNAME: process.env.WEBSITE_HOSTNAME,
    NODE_ENV: process.env.NODE_ENV
  };
  
  fs.appendFileSync(`${logDir}/startup-log.txt`, `Environment: ${JSON.stringify(safeEnv)}\n`);
  
  // Start the server
  fs.appendFileSync(`${logDir}/startup-log.txt`, 'Attempting to start server.js\n');
  require('./server');
  
} catch (error) {
  // Now logDir is in scope
  fs.appendFileSync(`${logDir}/startup-log.txt`, `ERROR: ${error.message}\n${error.stack}\n`);
  console.error('Startup error:', error);
  
  // Exit with error after a short delay to ensure logs are written
  setTimeout(() => process.exit(1), 1000);
}