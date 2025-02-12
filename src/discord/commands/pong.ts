import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command, CommandConfig } from "./types.js";
import { UsageStore } from "../store/timestampStore.js";

const config: CommandConfig = {
  cooldown: 3_000
}

const builder = new SlashCommandBuilder()
  .setName("pong")
  .setDescription("Replies with Ping!");

const handler = async (interaction: ChatInputCommandInteraction<CacheType>) => {
  await interaction.reply('Ping!')
}

const command: Command = {
  config,
  builder,
  handler,
  usageStore: new UsageStore()
}

export default command;
