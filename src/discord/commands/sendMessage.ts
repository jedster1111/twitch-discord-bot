import { CacheType, ChannelType, ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { Command, CommandConfig } from "./types.js";
import { UsageStore } from "../store/timestampStore.js";
import { wait } from "../../waitFor.js";

const SEND_MESSAGE = "send-message";
const OPTION_MESSAGE = "message";
const OPTION_CHANNEL = "channel";

const config: CommandConfig = {
  cooldown: 3_000,
};

const commandJson = new SlashCommandBuilder()
  .setName(SEND_MESSAGE)
  .setDescription("Sends a message to the specified channel")
  .addStringOption((option) =>
    option
      .setName(OPTION_MESSAGE)
      .setDescription("What custom response would you like the bot to make?")
      .setRequired(true),
  )
  .addChannelOption((option) =>
    option
      .setName(OPTION_CHANNEL)
      .setDescription("The channel to send the message to")
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildText),
  )
  .toJSON();

const handler = async (interaction: ChatInputCommandInteraction<CacheType>) => {
  const optionResponse = interaction.options.getString(OPTION_MESSAGE);
  const channelResponse = interaction.options.getChannel<ChannelType.GuildText>(OPTION_CHANNEL);

  if (!optionResponse || !channelResponse) throw new Error("Missing options");

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const sentMessage = await channelResponse.send(optionResponse);
  await wait(1_000);
  await interaction.followUp(`Message sent!\n${sentMessage.url}`);
};

const usageStore = new UsageStore();
const command: Command = {
  config,
  commandJson,
  handler,
  stores: {
    [usageStore.getKey()]: usageStore,
  },
};

export default command;
