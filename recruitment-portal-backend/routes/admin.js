// routes/admin.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { CosmosClient } = require('@azure/cosmos');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

// Initialize Cosmos DB client
const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY
});
const database = cosmosClient.database(process.env.COSMOS_DATABASE);
const usersContainer = database.container('Users');
const companiesContainer = database.container('Companies');
const candidatesContainer = database.container('Candidates');

// Get all users
router.get('/users', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  try {
    const { resources } = await usersContainer.items
      .query({
        query: "SELECT c.id, c.email, c.userType, c.createdAt, c.lastLogin FROM c"
      })
      .fetchAll();
    
    res.json({
      users: resources
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific user
router.get('/users/:id', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const { resource: user } = await usersContainer.item(id).read();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't return password hash
    const { password, ...userWithoutPassword } = user;
    
    res.json({
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new admin user
router.post('/users/admin', authMiddleware, authorizeRoles('admin'), async (req, res) => {
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
      userType: 'admin',
      firstName,
      lastName,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };
    
    const { resource: createdUser } = await usersContainer.items.create(newUser);
    
    // Don't return password hash
    const { password: _, ...userWithoutPassword } = createdUser;
    
    res.status(201).json({
      message: 'Admin user created successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a company account
router.post('/companies', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  try {
    const { companyName, companyEmail, password, industry, description } = req.body;
    
    // Check if company already exists
    const { resources } = await usersContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: companyEmail }]
      })
      .fetchAll();
    
    if (resources.length > 0) {
      return res.status(400).json({ message: 'Company is already registered' });
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
      lastLogin: null
    };
    
    const { resource: createdUser } = await usersContainer.items.create(newUser);
    
    // Create entry in Companies collection
    const newCompany = {
      id: new Date().getTime().toString(),
      userId: createdUser.id,
      name: companyName,
      email: companyEmail,
      industry,
      description,
      createdAt: new Date().toISOString()
    };
    
    await companiesContainer.items.create(newCompany);
    
    res.status(201).json({
      message: 'Company account created successfully',
      company: newCompany
    });
  } catch (error) {
    console.error('Error creating company account:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a user
router.put('/users/:id', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, userType } = req.body;
    
    const { resource: user } = await usersContainer.item(id).read();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user
    const updatedUser = {
      ...user,
      email: email || user.email,
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      userType: userType || user.userType,
      updatedAt: new Date().toISOString()
    };
    
    await usersContainer.item(id).replace(updatedUser);
    
    // Don't return password hash
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.json({
      message: 'User updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error updating user:', error);
    console.error('', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a user
router.delete('/users/:id', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Admin attempting to delete user: ${id}`);
    
    // Check if user exists
    let user;
    try {
      const { resource } = await usersContainer.item(id, id).read();
      user = resource;
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      console.error(`Error reading user: ${error.message}`);
      return res.status(404).json({ message: 'User not found or could not be read' });
    }
    
    // If user is a candidate, delete candidate profile first
    if (user.userType === 'candidate') {
      try {
        const { resources } = await candidatesContainer.items
          .query({
            query: "SELECT * FROM c WHERE c.userId = @userId",
            parameters: [{ name: "@userId", value: id }]
          })
          .fetchAll();
        
        if (resources.length > 0) {
          console.log(`Deleting candidate profile: ${resources[0].id}`);
          await candidatesContainer.item(resources[0].id, resources[0].id).delete();
        }
      } catch (err) {
        console.warn(`Warning: Could not delete candidate profile: ${err.message}`);
        // Continue with user deletion even if candidate deletion fails
      }
    }
    
    // If user is a company, delete company profile first
    if (user.userType === 'company') {
      try {
        const { resources } = await companiesContainer.items
          .query({
            query: "SELECT * FROM c WHERE c.userId = @userId",
            parameters: [{ name: "@userId", value: id }]
          })
          .fetchAll();
        
        if (resources.length > 0) {
          const companyId = resources[0].id;
          console.log(`Deleting company profile: ${companyId}`);
          
          // First, delete all vacancies associated with this company
          const vacanciesContainer = database.container('Vacancies');
          const { resources: vacancies } = await vacanciesContainer.items
            .query({
              query: "SELECT * FROM c WHERE c.companyId = @companyId",
              parameters: [{ name: "@companyId", value: companyId }]
            })
            .fetchAll();
          
          console.log(`Found ${vacancies.length} vacancies to delete`);
          
          // Delete each vacancy
          for (const vacancy of vacancies) {
            console.log(`Deleting vacancy: ${vacancy.id}`);
            await vacanciesContainer.item(vacancy.id, vacancy.id).delete();
            
            // Optionally, also delete applications for this vacancy
            try {
              const applicationsContainer = database.container('Applications');
              const { resources: applications } = await applicationsContainer.items
                .query({
                  query: "SELECT * FROM c WHERE c.vacancyId = @vacancyId",
                  parameters: [{ name: "@vacancyId", value: vacancy.id }]
                })
                .fetchAll();
              
              for (const application of applications) {
                await applicationsContainer.item(application.id, application.id).delete();
              }
            } catch (appErr) {
              console.warn(`Warning: Could not delete applications for vacancy ${vacancy.id}: ${appErr.message}`);
            }
          }
          
          // Now delete the company profile
          await companiesContainer.item(companyId, companyId).delete();
        }
      } catch (err) {
        console.warn(`Warning: Could not delete company profile or vacancies: ${err.message}`);
        // Continue with user deletion even if company deletion fails
      }
    }
    
    // Now delete the user
    console.log(`Deleting user: ${id}`);
    await usersContainer.item(id, id).delete();
    
    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error(`Error deleting user: ${error.message}`);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// Reset user password
router.post('/users/:id/reset-password', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    const { resource: user } = await usersContainer.item(id).read();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    await usersContainer.item(id).patch([
      { op: 'replace', path: '/password', value: hashedPassword },
      { op: 'replace', path: '/updatedAt', value: new Date().toISOString() }
    ]);
    
    res.json({
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all companies
router.get('/companies', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  try {
    const { resources } = await companiesContainer.items
      .query({
        query: "SELECT * FROM c"
      })
      .fetchAll();
    
    res.json({
      companies: resources
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
