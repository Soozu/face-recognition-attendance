const fs = require('fs');
const path = require('path');

// This script helps create icon files for the installer
// You can use online converters or tools like ImageMagick to convert PNG to ICO

console.log('Icon Setup Instructions:');
console.log('======================');
console.log('');
console.log('1. Your PNG icon has been copied to: assets/icon.png');
console.log('');
console.log('2. For Windows ICO format, you need to convert PNG to ICO:');
console.log('   - Visit: https://convertio.co/png-ico/ or https://icoconvert.com/');
console.log('   - Upload: assets/icon.png');
console.log('   - Download the ICO file as: assets/icon.ico');
console.log('');
console.log('3. For macOS ICNS format (if you plan to build for Mac):');
console.log('   - Visit: https://convertio.co/png-icns/');
console.log('   - Upload: assets/icon.png');
console.log('   - Download the ICNS file as: assets/icon.icns');
console.log('');
console.log('4. After creating the icon files, run:');
console.log('   npm run make');
console.log('');
console.log('Current icon files in assets folder:');

// Check what icon files exist
const assetsDir = path.join(__dirname, 'assets');
const iconFiles = ['icon.png', 'icon.ico', 'icon.icns'];

iconFiles.forEach(file => {
  const filePath = path.join(assetsDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✓ ${file} - EXISTS`);
  } else {
    console.log(`   ✗ ${file} - MISSING`);
  }
});

console.log('');
console.log('Once you have icon.ico, your installer will be created with the icon!'); 