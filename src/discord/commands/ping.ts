import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command, CommandConfig } from "./types.js";

const config: CommandConfig = {
  cooldown: 5
}

const commandBuilder = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Replies with Pong!");

const commandHandler = async (interaction: ChatInputCommandInteraction<CacheType>) => {
  await interaction.reply('Pong!')
}

const pingCommand: Command = {
  config,
  commandBuilder,
  commandHandler
}

export default pingCommand;
