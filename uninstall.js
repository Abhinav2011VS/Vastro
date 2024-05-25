#!/usr/bin/env node

const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');

// Function to remove Vastro files from the global bin directory
function removeFilesFromBinDirectory() {
  const binDirectory = process.env.npm_config_prefix ? path.join(process.env.npm_config_prefix, 'bin') : '/usr/local/bin';
  const vastroExecutablePath = path.join(binDirectory, 'vastro');

  try {
    fs.unlinkSync(vastroExecutablePath);
  } catch (error) {
    console.error('Error removing files from bin directory:', error);
    process.exit(1);
  }
}

// Function to run the uninstallation logic
async function uninstallVastro() {
  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to uninstall Vastro? This action cannot be undone.'
    }
  ]);

  if (answers.confirm) {
    console.log('Uninstalling Vastro...');
    
    // Remove Vastro executable from bin directory
    removeFilesFromBinDirectory();

    console.log('Vastro has been uninstalled.');
  } else {
    console.log('Uninstallation cancelled.');
  }
}

// Run the uninstallation logic
uninstallVastro();
