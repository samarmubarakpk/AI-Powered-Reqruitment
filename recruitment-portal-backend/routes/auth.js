// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { CosmosClient } = require('@azure/cosmos');

// Initialize Cosmos DB client
const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY
});
const database = cosmosClient.database(process.env.COSMOS_DATABASE);
const usersContainer = database.container('Users');

// Register a new candidate user
router.post('/register/candidate', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Check if user already exists
    const { resources } = await usersContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: email }]
      })
      .fetchAll();
    
    if (resources.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUser = {
      id: new Date().getTime().toString(),
      email,
      password: hashedPassword,
      userType: 'candidate',
      firstName,
      lastName,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    
    const { resource: createdUser } = await usersContainer.items.create(newUser);
    
    // Create entry in Candidates collection
    const candidatesContainer = database.container('Candidates');
    await candidatesContainer.items.create({
      id: new Date().getTime().toString(),
      userId: createdUser.id,
      firstName,
      lastName,
      email,
      createdAt: new Date().toISOString(),
      skills: [],
      experience: [],
      education: []
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { id: createdUser.id, email: createdUser.email, userType: createdUser.userType },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        userType: createdUser.userType,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login route for all user types
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const { resources } = await usersContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: email }]
      })
      .fetchAll();
    
    if (resources.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const user = resources[0];
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Update last login
    await usersContainer.item(user.id, user.id).patch([
      { op: 'replace', path: '/lastLogin', value: new Date().toISOString() }
    ]);
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Register a company (admin only)
router.post('/register/company', async (req, res) => {
  try {
    const { adminToken, companyName, companyEmail, password, industry, description } = req.body;
    
    // Verify admin token
    let decoded;
    try {
      decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Check if user is admin
    if (decoded.userType !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to create company accounts' });
    }
    
    // Check if company already exists
    const { resources } = await usersContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: companyEmail }]
      })
      .fetchAll();
    
    if (resources.length > 0) {
      return res.status(400).json({ message: 'Company account already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUser = {
      id: new Date().getTime().toString(),
      email: companyEmail,
      password: hashedPassword,
      userType: 'company',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    
    const { resource: createdUser } = await usersContainer.items.create(newUser);
    
    // Create entry in Companies collection
    const companiesContainer = database.container('Companies');
    await companiesContainer.items.create({
      id: new Date().getTime().toString(),
      userId: createdUser.id,
      name: companyName,
      email: companyEmail,
      industry,
      description,
      createdAt: new Date().toISOString()
    });
    
    res.status(201).json({
      message: 'Company account created successfully',
      company: {
        id: createdUser.id,
        email: createdUser.email,
        name: companyName,
        industry
      }
    });
  } catch (error) {
    console.error('Company registration error Try again:', error);
    res.status(500).json({ message: 'Server error during  company registration' });
  }
});

// Authentication middleware
const auth = (req, res, next) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Role-based middleware
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({ message: 'Access forbidden' });
    }
    next();
  };
};

module.exports = { router, auth, authorize };


