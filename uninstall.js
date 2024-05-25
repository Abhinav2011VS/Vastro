#!/usr/bin/env node

const inquirer = require('inquirer');

async function uninstall() {
  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to uninstall Vastro? This action cannot be undone.'
    }
  ]);

  if (answers.confirm) {
    console.log('Vastro has been uninstalled.');
    // Add your uninstall logic here
  } else {
    console.log('Uninstallation cancelled.');
  }
}

uninstall();
