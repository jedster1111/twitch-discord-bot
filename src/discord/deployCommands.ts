import { REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes } from "discord.js";
import commands from "./commands/index.js";
import { envVars } from "../loadEnvVars.js";

const { discordBotToken, discordBotClientId } = envVars;

const deployCommands = async () => {
  const restClient = new REST().setToken(discordBotToken)

  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);
    const commandsJson: RESTPostAPIChatInputApplicationCommandsJSONBody[] = commands.map(command => command.commandBuilder.toJSON());
    const data: any = await restClient.put(
      Routes.applicationCommands(discordBotClientId),
      { body: commandsJson },
    );
    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
}

await deployCommands();
