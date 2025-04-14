// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { CosmosClient } = require('@azure/cosmos');

// Import routes
const { router: authRoutes } = require('./routes/auth');
const candidateRoutes = require('./routes/candidates');
const companyRoutes = require('./routes/companies');
const adminRoutes = require('./routes/admin');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Initialize Cosmos DB
const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY
});

// Initialize database and containers
const initializeCosmosDB = async () => {
  try {
    console.log('Initializing Cosmos DB...');
    
    // Create database if not exists
    const { database } = await cosmosClient.databases.createIfNotExists({
      id: process.env.COSMOS_DATABASE
    });
    console.log(`Database '${database.id}' ready`);
    
    // Create containers if not exist
    const containers = [
      { id: 'Users', partitionKey: { paths: ['/id'] } },
      { id: 'Candidates', partitionKey: { paths: ['/id'] } },
      { id: 'Companies', partitionKey: { paths: ['/id'] } },
      { id: 'Vacancies', partitionKey: { paths: ['/id'] } },
      { id: 'Applications', partitionKey: { paths: ['/id'] } }
    ];
    
    for (const containerDef of containers) {
      const { container } = await database.containers.createIfNotExists(containerDef);
      console.log(`Container '${container.id}' ready`);
    }
    
    console.log('Cosmos DB initialized successfully');
    
    // Check if admin user exists, create default admin if not
    const defaultAdmin = await createDefaultAdminIfNotExists(database);
    if (defaultAdmin) {
      console.log('Default admin user created');
    }
    
    return database;
  } catch (error) {
    console.error('Error initializing Cosmos DB:', error);
    throw error;
  }
};

// Create default admin user if not exists
const createDefaultAdminIfNotExists = async (database) => {
  try {
    const usersContainer = database.container('Users');
    
    // Check if any admin exists
    const { resources } = await usersContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.userType = 'admin'"
      })
      .fetchAll();
    
    if (resources.length === 0) {
      // No admin exists, create default admin
      const bcrypt = require('bcrypt');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123', salt);
      
      const newAdmin = {
        id: new Date().getTime().toString(),
        email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@recruitmentapp.com',
        password: hashedPassword,
        userType: 'admin',
        firstName: 'System',
        lastName: 'Administrator',
        createdAt: new Date().toISOString(),
        lastLogin: null
      };
      
      await usersContainer.items.create(newAdmin);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error creating default admin:', error);
    return false;
  }
};

// Initialize database on startup
initializeCosmosDB().catch(error => {
  console.error('Failed to initialize application:', error);
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/admin', adminRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Recruitment Portal API' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

