import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command, CommandConfig } from "./types.js";
import { UsageStore } from "../store/timestampStore.js";

const config: CommandConfig = {
  cooldown: 20_000
}

const commandJson = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Replies with Pong!")
  .toJSON();

const handler = async (interaction: ChatInputCommandInteraction<CacheType>) => {
  await interaction.reply('Pong!')
}

const command: Command = {
  config,
  commandJson,
  handler,
  usageStore: new UsageStore()
}

export default command;
