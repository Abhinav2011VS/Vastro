const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Octokit } = require('@octokit/rest');

// Helper function to replace placeholders in the template
function replacePlaceholders(template, data) {
  return template.replace(/{{(\w+)}}/g, (_, key) => data[key] || '');
}

module.exports = (createCommand) => {
  createCommand
    .command('electron-app <projectName>')
    .description('Create a new Electron app')
    .action(async (projectName) => {
      if (!/^[a-z]+$/.test(projectName)) {
        console.error('Error: The project name must be all lowercase letters.');
        process.exit(1);
      }

      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'author',
          message: 'What is your name?'
        },
        {
          type: 'input',
          name: 'gitRepo',
          message: 'What is the GitHub repository name that should be created?'
        },
        {
          type: 'input',
          name: 'version',
          message: 'Enter the initial version (format: x.x.x, xx.xx.xx, etc.):',
          validate: function(value) {
            const versionRegex = /^(\d{1,2}\.\d{1,2}\.\d{1,2})$/;
            if (versionRegex.test(value)) {
              return true;
            }
            return 'Invalid version format. Please enter in the format x.x.x, xx.xx.xx, etc.';
          }
        },
        {
          type: 'confirm',
          name: 'multiOS',
          message: 'Do you need multi-OS compatibility?',
          default: true
        },
        {
          type: 'confirm',
          name: 'autoUpdate',
          message: 'Do you want to enable auto-update feature?',
          default: true
        }
      ]);

      const { author, gitRepo, version, multiOS, autoUpdate } = answers;

      // GitHub authentication
      const octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN
      });

      // Check if the repository name is already taken
      try {
        await octokit.repos.get({
          owner: process.env.GITHUB_USERNAME,
          repo: gitRepo
        });
        console.error('Error: The repository name is already in use.');
        process.exit(1);
      } catch (error) {
        if (error.status !== 404) {
          console.error('Error checking repository name:', error);
          process.exit(1);
        }
      }

      // Create the repository
      try {
        await octokit.repos.createForAuthenticatedUser({
          name: gitRepo,
          private: false // Default to public, you can add an option to set this
        });
        console.log(`GitHub repository '${gitRepo}' created successfully!`);
      } catch (error) {
        console.error('Error creating repository:', error);
        process.exit(1);
      }

      const projectPath = path.join(process.cwd(), projectName);

      // Create project directory
      if (!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath);
      }

      // Read and modify the template package.json
      const packageTemplatePath = path.join(__dirname, '../templates/package-template.json');
      const packageTemplateContent = fs.readFileSync(packageTemplatePath, 'utf-8');

      const packageJsonContent = replacePlaceholders(packageTemplateContent, {
        projectName,
        version,
        githubUsername: process.env.GITHUB_USERNAME,
        gitRepo,
        author
      });

      fs.writeFileSync(
        path.join(projectPath, 'package.json'),
        packageJsonContent
      );

      // Read and modify the template index.html
      const indexTemplatePath = path.join(__dirname, '../templates/index-template.html');
      const indexTemplateContent = fs.readFileSync(indexTemplatePath, 'utf-8');

      const indexHtmlContent = replacePlaceholders(indexTemplateContent, {
        projectName
      });

      // Create src directory and index.js, index.html
      const srcPath = path.join(projectPath, 'src');
      if (!fs.existsSync(srcPath)) {
        fs.mkdirSync(srcPath);
      }

      fs.writeFileSync(
        path.join(srcPath, 'index.html'),
        indexHtmlContent
      );

      // Read and copy the template index.js
      const mainTemplatePath = path.join(__dirname, '../templates/index-template.js');
      const mainTemplateContent = fs.readFileSync(mainTemplatePath, 'utf-8');

      fs.writeFileSync(
        path.join(srcPath, 'index.js'),
        mainTemplateContent
      );

      // If auto-update is enabled, create the dev-app-update.yml
      if (autoUpdate) {
        const updateTemplatePath = path.join(__dirname, '../templates/dev-app-update-template.yml');
        const updateTemplateContent = fs.readFileSync(updateTemplatePath, 'utf-8');

        const updateYmlContent = replacePlaceholders(updateTemplateContent, {
          githubUsername: process.env.GITHUB_USERNAME,
          gitRepo
        });

        fs.writeFileSync(
          path.join(projectPath, 'dev-app-update.yml'),
          updateYmlContent
        );
      }

      // Initialize Git repository and make the initial commit
      execSync('git init', { cwd: projectPath });
      execSync('git add .', { cwd: projectPath });
      execSync(`git commit -m "Initial commit"`, { cwd: projectPath });

      // Link the local repo to the GitHub repo
      execSync(`git remote add origin https://github.com/${process.env.GITHUB_USERNAME}/${gitRepo}.git`, { cwd: projectPath });
      execSync('git push -u origin master', { cwd: projectPath });

      console.log(`Electron app '${projectName}' created and pushed to GitHub successfully!`);
    });
};
