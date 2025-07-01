const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to check if environment variables are set
function checkEnvVariables() {
  const requiredVars = ['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    console.error('\nPlease ensure these variables are set in your .env file:');
    console.error(`
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=${process.env.GITHUB_OWNER || 'your_github_username'}
GITHUB_REPO=${process.env.GITHUB_REPO || 'your_repo_name'}
    `);
    process.exit(1);
  }
}

// Function to set environment variables for the current process
function setEnvVariables() {
  try {
    require('dotenv').config();
    
    // Check if variables are properly set
    checkEnvVariables();
    
    // Test GitHub token
    try {
      execSync(`curl -H "Authorization: token ${process.env.GITHUB_TOKEN}" https://api.github.com/user`, { stdio: 'pipe' });
      console.log('✅ GitHub token is valid');
    } catch (error) {
      console.error('❌ GitHub token is invalid or has insufficient permissions');
      console.error('Please ensure your token has the following permissions:');
      console.error('- repo (Full control of private repositories)');
      console.error('- workflow (Update GitHub Action workflows)');
      process.exit(1);
    }

    console.log('✅ Environment variables are properly set');
  } catch (error) {
    console.error('❌ Error setting up environment:', error.message);
    process.exit(1);
  }
}

// Run the setup
setEnvVariables(); 