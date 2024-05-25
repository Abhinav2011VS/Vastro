const electronApp = require('./electron-app');

module.exports = (program) => {
  const createCommand = program.command('create')
    .description('Create a new project');

  // Register the electron-app sub-command
  electronApp(createCommand);
};
