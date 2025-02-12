import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export const pingCommand = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Replies with Pong!");

export const handlePingCommand = async (interaction: ChatInputCommandInteraction<CacheType>) => {
  await interaction.reply('Pong!')
}