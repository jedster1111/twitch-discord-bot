import ping from "./ping.js";
import sendMessage from "./sendMessage.js";
import alertMessage from "./twitchAlert.js";
import { Command } from "./types.js";

export const commands = [ping, sendMessage, alertMessage];

export const commandsMap: Record<string, Command> = commands.reduce<
  Record<string, Command>
>((accum, command) => {
  accum[command.commandJson.name] = command;
  return accum;
}, {});
