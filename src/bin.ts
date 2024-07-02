#!/usr/bin/env node

import { MAIN_ARGS } from './arg.js';
import { mainCommand } from './commands/main.command.js';

const commands = [mainCommand];

const commandMap = new Map(
  commands.map((command) => [command.name, command.build()]),
);

const firstArg = MAIN_ARGS._[0];
const commandName =
  !firstArg || firstArg.startsWith('--') ? mainCommand.name : firstArg;

const command = commandMap.get(commandName);

if (!command) {
  throw new Error(`Command ${commandName} not found`);
}

await command();
