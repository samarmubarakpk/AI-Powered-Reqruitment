// startup.js
require('./env-fix'); // Add this at the top
const fs = require('fs');

try {
  // Create log directory
  const logDir = '/home/LogFiles';
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  fs.writeFileSync(`${logDir}/startup-log.txt`, `Startup attempt: ${new Date().toISOString()}\n`);
  
  // Log some env vars for debugging (omitting sensitive info)
  const safeKeys = ['NODE_ENV', 'PORT', 'WEBSITE_HOSTNAME'];
  const safeEnv = {};
  safeKeys.forEach(key => {
    if (process.env[key]) safeEnv[key] = process.env[key];
  });
  fs.appendFileSync(`${logDir}/startup-log.txt`, `Environment: ${JSON.stringify(safeEnv)}\n`);
  
  // Start the server
  fs.appendFileSync(`${logDir}/startup-log.txt`, 'Attempting to start server.js\n');
  require('./server');
  
} catch (error) {
  fs.appendFileSync(`${logDir}/startup-log.txt`, `ERROR: ${error.message}\n${error.stack}\n`);
  
  // Don't exit - keep the error visible in logs
  console.error('Startup error:', error);
  // We'll still exit but with an error code
  setTimeout(() => process.exit(1), 1000);
}