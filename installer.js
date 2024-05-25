#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to copy the Vastro files to the global bin directory
function copyFilesToBinDirectory() {
  const binDirectory = process.env.npm_config_prefix ? path.join(process.env.npm_config_prefix, 'bin') : '/usr/local/bin';
  const vastroExecutablePath = path.join(__dirname, 'index.js');

  try {
    fs.copyFileSync(vastroExecutablePath, path.join(binDirectory, 'vastro'));
    fs.chmodSync(path.join(binDirectory, 'vastro'), '755');
  } catch (error) {
    console.error('Error copying files to bin directory:', error);
    process.exit(1);
  }
}

// Function to run the installation logic
function installVastro() {
  console.log('Installing Vastro...');

  // Copy Vastro executable to bin directory
  copyFilesToBinDirectory();

  console.log('Vastro has been installed successfully!');
}

// Run the installation logic
installVastro();
