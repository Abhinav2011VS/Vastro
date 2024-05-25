#!/usr/bin/env node

const { program } = require('commander');
const create = require('./commands/create');

program
  .version('0.0.1')
  .description('Vastro CLI');

// Register the create command
create(program);

program.parse(process.argv);
