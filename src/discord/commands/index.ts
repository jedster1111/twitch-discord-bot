import ping from "./ping.js";
import { Command } from "./types.js";

export const commands = [
  ping
];

export const commandsMap: Record<string, Command> = commands.reduce<Record<string, Command>>((accum, command) => {
  accum[command.builder.name] = command;
  return accum;
}, {})
