const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get the version argument
const newVersion = process.argv[2];

if (!newVersion) {
  console.error('❌ Please provide a version number');
  console.error('Example: npm run publish-version 1.0.1');
  process.exit(1);
}

// Validate version format
if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error('❌ Invalid version format. Please use semantic versioning (e.g., 1.0.1)');
  process.exit(1);
}

try {
  // Read package.json
  const packagePath = path.join(__dirname, '..', 'package.json');
  const package = require(packagePath);
  const oldVersion = package.version;

  // Update version in package.json
  package.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(package, null, 2) + '\n');

  console.log(`✅ Updated version from ${oldVersion} to ${newVersion} in package.json`);

  // Create git commit and tag
  try {
    // Stage package.json
    execSync('git add package.json', { stdio: 'inherit' });
    
    // Create commit
    execSync(`git commit -m "Release version ${newVersion}"`, { stdio: 'inherit' });
    
    // Create tag
    execSync(`git tag v${newVersion}`, { stdio: 'inherit' });
    
    // Push changes and tag
    execSync('git push', { stdio: 'inherit' });
    execSync('git push --tags', { stdio: 'inherit' });
    
    console.log('✅ Created git commit and tag');
  } catch (error) {
    console.error('❌ Error with git operations:', error.message);
    process.exit(1);
  }

  // Run the publish command
  console.log('📦 Publishing to GitHub...');
  execSync('npm run publish', { stdio: 'inherit' });

  console.log(`
✨ Successfully published version ${newVersion}!
   
   Next steps:
   1. Check your GitHub repository for the new release
   2. Verify the release assets were uploaded correctly
   3. The app will automatically detect this update on next launch
`);

} catch (error) {
  console.error('❌ Error during publishing:', error.message);
  process.exit(1);
} 