import { CacheType, ChannelType, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command, CommandConfig } from "./types.js";
import { UsageStore } from "../store/timestampStore.js";
import { wait } from "../../waitFor.js";

const OPTION_RESPONSE = 'response';
const OPTION_CHANNEL = 'response';

const config: CommandConfig = {
  cooldown: 3_000
}

const commandJson = new SlashCommandBuilder()
  .setName("send message")
  .setDescription("Replies with Ping!")
  .addStringOption(
    option => option
      .setName(OPTION_RESPONSE)
      .setDescription("What custom response would you like the bot to make?")
      .setRequired(true)
  ).addChannelOption(option => option
    .setName(OPTION_CHANNEL)
    .setDescription("The channel to send the message to")
    .setRequired(true)
    .addChannelTypes(ChannelType.GuildText)
  ).toJSON()

const handler = async (interaction: ChatInputCommandInteraction<CacheType>) => {
  const optionResponse = interaction.options.getString(OPTION_RESPONSE);
  const channelResponse = interaction.options.getChannel<ChannelType.GuildText>(OPTION_CHANNEL);

  if (!optionResponse || !channelResponse) throw new Error("Missing options")

  await interaction.deferReply();
  await channelResponse.send(optionResponse);
  await wait(3000);
  await interaction.followUp('Message sent!')
}

const command: Command = {
  config,
  commandJson,
  handler,
  usageStore: new UsageStore()
}

export default command;
