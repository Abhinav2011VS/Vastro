const fs = require('fs');
const path = require('path');

// Define paths
const vastroDir = path.join(__dirname, '..'); // Assuming Vastro is in the parent directory
const installDir = '/usr/local/bin'; // Install Vastro in /usr/local/bin (or any other desired location)

// Copy Vastro files to the install directory
fs.copyFileSync(path.join(vastroDir, 'vastro.js'), path.join(installDir, 'vastro.js'));
fs.copyFileSync(path.join(vastroDir, 'package.json'), path.join(installDir, 'package.json'));

console.log('Vastro installed successfully!');
