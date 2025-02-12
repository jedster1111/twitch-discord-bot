import ping from "./ping.js";
import pong from "./pong.js";
import { Command } from "./types.js";

export const commands = [
  ping,
  pong
];

export const commandsMap: Record<string, Command> = commands.reduce<Record<string, Command>>((accum, command) => {
  accum[command.builder.name] = command;
  return accum;
}, {})
