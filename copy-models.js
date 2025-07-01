const fs = require('fs');
const path = require('path');

// Source directory (where the models are already downloaded)
const sourceDir = path.join(__dirname, 'public', 'models');

// Destination directories
const destDirs = [
  path.join(__dirname, 'models'),              // Root models directory
  path.join(__dirname, 'dist', 'models'),      // Distribution directory
  path.join(__dirname, 'src', 'models'),       // Source directory
  path.join(__dirname, 'node_modules', 'face-api.js', 'weights') // face-api.js weights directory
];

console.log(`Looking for models in: ${sourceDir}`);

// Create destination directories if they don't exist
destDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Copy files from source to all destination directories
const copyFiles = () => {
  try {
    // Check if source directory exists
    if (!fs.existsSync(sourceDir)) {
      console.error(`Source directory does not exist: ${sourceDir}`);
      console.log('Please make sure models are in the public/models directory');
      return;
    }
    
    // Get all files in the source directory
    const files = fs.readdirSync(sourceDir);
    
    console.log(`Found ${files.length} files in ${sourceDir}`);
    
    if (files.length === 0) {
      console.error('No model files found in source directory');
      return;
    }
    
    // Copy each file to all destination directories
    let totalCopied = 0;
    
    files.forEach(file => {
      const sourcePath = path.join(sourceDir, file);
      
      // Check if it's a file or directory
      const stats = fs.statSync(sourcePath);
      
      if (stats.isFile()) {
        // Copy the file to each destination
        destDirs.forEach(destDir => {
          // Skip source directory to avoid copying to itself
          if (destDir === sourceDir) return;
          
          const destPath = path.join(destDir, file);
          
          try {
            fs.copyFileSync(sourcePath, destPath);
            totalCopied++;
          } catch (error) {
            console.error(`Error copying ${file} to ${destDir}: ${error.message}`);
          }
        });
      } else if (stats.isDirectory()) {
        // Handle subdirectories
        const subDir = file;
        
        destDirs.forEach(destDir => {
          // Skip source directory to avoid copying to itself
          if (destDir === sourceDir) return;
          
          const destSubDir = path.join(destDir, subDir);
          
          // Create subdirectory if it doesn't exist
          if (!fs.existsSync(destSubDir)) {
            fs.mkdirSync(destSubDir, { recursive: true });
          }
          
          // Copy files from subdirectory
          try {
            const subFiles = fs.readdirSync(path.join(sourceDir, subDir));
            
            subFiles.forEach(subFile => {
              const subSourcePath = path.join(sourceDir, subDir, subFile);
              const subDestPath = path.join(destDir, subDir, subFile);
              
              if (fs.statSync(subSourcePath).isFile()) {
                fs.copyFileSync(subSourcePath, subDestPath);
                totalCopied++;
              }
            });
          } catch (error) {
            console.error(`Error copying subdirectory ${subDir} to ${destDir}: ${error.message}`);
          }
        });
      }
    });
    
    console.log(`Successfully copied ${totalCopied} model files to ${destDirs.length} locations`);
  } catch (error) {
    console.error('Error copying model files:', error);
  }
};

// Execute the copy operation
copyFiles(); 