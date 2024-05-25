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
      // Check if GitHub username is available
      if (!process.env.GITHUB_USERNAME) {
        console.error('Error: GitHub username is not set. Please log in and link your account.');
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
          type: 'input',
          name: 'category',
          message: 'Enter the category of the app:'
        },
        {
          type: 'input',
          name: 'description',
          message: 'Enter the description of the app:'
        }
      ]);

      const { author, gitRepo, version, category, description } = answers;

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

      // Create .github/workflows directory and build.yml file
      const workflowsPath = path.join(projectPath, '.github', 'workflows');
      if (!fs.existsSync(workflowsPath)) {
        fs.mkdirSync(workflowsPath, { recursive: true });
      }

      const buildYmlContent = fs.readFileSync(path.join(__dirname, '../templates/build.yml'), 'utf-8');
      fs.writeFileSync(
        path.join(workflowsPath, 'build.yml'),
        buildYmlContent
      );

      // Initialize Git repository and make the initial commit
      execSync('git init', { cwd: projectPath });
      execSync('git add .', { cwd: projectPath });
      execSync(`git commit -m "Initial commit"`, { cwd: projectPath });

      console.log(`Git repository initialized successfully!`);

      // Link the local repo to the GitHub repo
      execSync(`git remote add origin https://github.com/${process.env.GITHUB_USERNAME}/${gitRepo}.git`, { cwd: projectPath });
      execSync('git push -u origin master', { cwd: projectPath });

      console.log(`GitHub repository '${gitRepo}' linked successfully!`);

      // Create the .github/workflows directory
      const githubDir = path.join(projectPath, '.github');
      const workflowsDir = path.join(githubDir, 'workflows');
      if (!fs.existsSync(githubDir)) {
        fs.mkdirSync(githubDir);
      }
      if (!fs.existsSync(workflowsDir)) {
        fs.mkdirSync(workflowsDir);
      }

      // Write the build.yml file
      const buildYmlContent = `name: Build

on: push

jobs:
  release:
    runs-on: \${{ matrix.os }}

    permissions:
      contents: write

    strategy:
      matrix:
        os: [macos-latest, ubuntu-latest, windows-latest]

    steps:
      - name: Check out Git repository
        uses: actions/checkout@v3

      - name: Set up Node
        uses: actions/setup-node@v3
        with:
          node-version: 20

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: 3.x

      - name: Install Dependencies
        run: npm ci
        shell: bash

      - name: Build
        env:
          GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        run: npm run dist
        shell: bash
      
      - name: Upload Artifacts
        uses: actions/upload-artifact@v2
        with:
          name: built-files
          path: |
            dist/**/*.dmg
            dist/**/*.exe
            dist/**/*.msi
            dist/**/*.AppImage
            dist/**/*.deb`;

      fs.writeFileSync(path.join(workflowsDir, 'build.yml'), buildYmlContent);

      console.log('GitHub Actions workflow file created successfully!');
    });
};
