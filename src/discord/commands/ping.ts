import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command, CommandConfig } from "./types.js";
import { UsageStore } from "../store/timestampStore.js";

const config: CommandConfig = {
  cooldown: 20_000
}

const builder = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Replies with Pong!");

const handler = async (interaction: ChatInputCommandInteraction<CacheType>) => {
  await interaction.reply('Pong!')
}

const pingCommand: Command = {
  config,
  builder,
  handler,
  usageStore: new UsageStore()
}

export default pingCommand;
