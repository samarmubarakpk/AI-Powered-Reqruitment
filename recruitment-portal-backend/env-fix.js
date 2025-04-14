// env-fix.js
// This script fixes Azure App Service environment variable prefixes

// Process custom connection strings (CUSTOMCONNSTR_*)
Object.keys(process.env).forEach(key => {
    if (key.startsWith('CUSTOMCONNSTR_')) {
      const actualKey = key.replace('CUSTOMCONNSTR_', '');
      process.env[actualKey] = process.env[key];
      console.log(`Mapped ${key} to ${actualKey}`);
    }
  });
  
  // Fix malformed variables
  if (process.env.COSMOS_DATABASE && process.env.COSMOS_DATABASE.startsWith('COSMOS_DATABASE=')) {
    process.env.COSMOS_DATABASE = process.env.COSMOS_DATABASE.replace('COSMOS_DATABASE=', '');
    console.log('Fixed COSMOS_DATABASE value');
  }
  
  console.log('Environment variables prepared successfully');