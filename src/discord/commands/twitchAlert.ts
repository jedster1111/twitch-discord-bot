import { CacheType, ChannelType, ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { Command, CommandConfig } from "./types.js";
import { UsageStore } from "../store/timestampStore.js";
import { TwitchAlertStore } from "./TwitchAlertStore.js";
import { twitchApiClient } from "../../createTwitchListener.js";
import { buildEmbed, buildMessageData } from "../../discordEmbed.js";
import { DiscordMessageConfig } from "../../types.js";
import { TWITCH_ICON_URL } from "../../constants.js";

const config: CommandConfig = {
  cooldown: 3_000
}

const commandJson = new SlashCommandBuilder()
  .setName("twitch-alert")
  .setDescription("Manage twitch alerts.")
  .addSubcommandGroup(scg => scg.setName("config").setDescription("Manage twitch alert configuration")
    .addSubcommand(sc => sc.setName("get").setDescription("Get config for twitch alerts"))
    .addSubcommand(sc => sc.setName("set").setDescription("Set config for twitch alerts")
      .addStringOption(o => o.setName("bot-name").setDescription("The name the bot should make the alert posts with"))
      .addStringOption(o => o.setName("bot-avatar-url").setDescription("The url for the avatar the bot should make the alert posts with"))
      .addStringOption(o => o.setName("embed-title-template").setDescription("The title to be used in embed. Must include %s to be replaced with Twitch name."))
      .addStringOption(o => o.setName("pre-embed-content").setDescription("The message to be posted before the embed."))
      .addChannelOption(o => o.setName("channel").setDescription("The channel to send Twitch alerts to").addChannelTypes(ChannelType.GuildText))
    )
    .addSubcommand(sc => sc.setName("unset").setDescription("Unset specific config for twitch alerts. Mark config with true to unset it.")
      .addBooleanOption(o => o.setName("bot-name").setDescription("The name the bot should make the alert posts with"))
      .addBooleanOption(o => o.setName("bot-avatar-url").setDescription("The url for the avatar the bot should make the alert posts with"))
      .addBooleanOption(o => o.setName("embed-title-template").setDescription("The title to be used in embed. Must include %s to be replaced with Twitch name."))
      .addBooleanOption(o => o.setName("pre-embed-content").setDescription("The message to be posted before the embed."))
      .addBooleanOption(o => o.setName("channel").setDescription("The channel to send Twitch alerts to"))
    )
  )
  .addSubcommandGroup(scg => scg.setName("channels").setDescription("Manage the twitch channels to subscribe to")
    .addSubcommand(sc => sc.setName("add").setDescription("Subscribe to a twitch channel's online and offline events")
      .addStringOption(o => o.setName("twitch-channel").setDescription("The Twitch channel to subscribe to").setRequired(true)))
    .addSubcommand(sc => sc.setName("remove").setDescription("Remove a Twitch channel subscription from this server")
      .addStringOption(o => o.setName("twitch-channel").setDescription("Unsubscribe from this Twitch channel").setRequired(true)))
    .addSubcommand(sc => sc.setName("get").setDescription("Get the twitch channels subscribe to in this server"))
  )
  .toJSON();

const twitchAlertStore = new TwitchAlertStore();

twitchAlertStore.setHandleStreamOnline(async (guildDatas, stream, twitchChannel) => {
  for (const guildData of guildDatas) {
    const messageConfig = guildData.messageConfig;
    if (!messageConfig.channelToAlert) {
      console.warn("No channel to send alerts to for guild!", guildData.guild.name);
      return;
    }

    if (!messageConfig.webhookToAlert) {
      console.warn("No webhook to send alerts to for guild!", guildData.guild.name);
      return;
    }

    const embed = buildEmbed(messageConfig, buildMessageData(twitchChannel, stream))
    await messageConfig.webhookToAlert.send({
      username: messageConfig.botName,
      avatarURL: messageConfig.avatarPictureUrl || TWITCH_ICON_URL,
      content: messageConfig.preEmbedContent,
      embeds: [embed]
    })
  }
})

twitchAlertStore.setHandleStreamOffline(async (guildDatas, twitchChannel) => {
  for (const guildData of guildDatas) {
    const messageConfig = guildData.messageConfig;
    if (!messageConfig.channelToAlert) {
      console.warn("No channel to send alerts to for guild!", guildData.guild.name);
      return;
    }

    if (!messageConfig.webhookToAlert) {
      console.warn("No webhook to send alerts to for guild!", guildData.guild.name);
      return;
    }
    // TODO: Update online message
  }
})

const handler = async (interaction: ChatInputCommandInteraction<CacheType>) => {
  const subCommand = interaction.options.getSubcommand();
  const subCommandGroup = interaction.options.getSubcommandGroup();

  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply({ content: "I can't do that! This command only works within a server/guild.", flags: MessageFlags.Ephemeral });
    return;
  }

  if (subCommandGroup === "config") {
    if (subCommand === "get") {
      const messageConfig = twitchAlertStore.getMessageConfig(guild);

      await interaction.reply({ content: messageConfigToString(messageConfig), flags: MessageFlags.Ephemeral })
    } else if (subCommand === "set") {
      const botName = interaction.options.getString("bot-name");
      const botAvatarUrl = interaction.options.getString("bot-avatar-url");
      const embedTitleTemplate = interaction.options.getString("embed-title-template");
      const preEmbedContent = interaction.options.getString("pre-embed-content");
      const channel = interaction.options.getChannel("channel", false, [ChannelType.GuildText]);

      await twitchAlertStore.setMessageConfig(guild, botName, botAvatarUrl, embedTitleTemplate, preEmbedContent, channel);

      await interaction.reply({ content: "Updated config!", flags: MessageFlags.Ephemeral })
    } else if (subCommand === "unset") {
      const botName = interaction.options.getBoolean("bot-name");
      const botAvatarUrl = interaction.options.getBoolean("bot-avatar-url");
      const embedTitleTemplate = interaction.options.getBoolean("embed-title-template");
      const preEmbedContent = interaction.options.getBoolean("pre-embed-content");
      const channel = interaction.options.getBoolean("channel");

      twitchAlertStore.unsetMessageConfig(guild, botName, botAvatarUrl, embedTitleTemplate, preEmbedContent, channel);

      await interaction.reply({ content: "Unset specified config", flags: MessageFlags.Ephemeral })
    }
  }
  else if (subCommandGroup === "channels") {
    if (subCommand === "add") {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const twitchName = interaction.options.getString("twitch-channel", true);
      const twitchChannel = await twitchApiClient.users.getUserByName(twitchName);

      if (!twitchChannel) {
        await interaction.followUp({ content: `Couldn't find twitch user with name ${twitchName}. Double check your spelling?`, flags: MessageFlags.Ephemeral });
      } else {
        twitchAlertStore.addTwitchChannelSubscription(interaction.guild, twitchChannel);

        await interaction.followUp({ content: `Subscribed to ${twitchName}` })
      }
    }
    if (subCommand === "remove") {
      const twitchName = interaction.options.getString("twitch-channel", true);
      twitchAlertStore.removeTwitchChannelSubscription(guild, twitchName);
      await interaction.reply({ content: `Removed subscription to ${twitchName}`, flags: MessageFlags.Ephemeral })
    }
    if (subCommand === "get") {
      const twitchSubscriptions = twitchAlertStore.getTwitchChannelSubscriptions(guild);

      if (!twitchSubscriptions || twitchSubscriptions.length === 0) {
        await interaction.reply({ content: `Not currently subscribed to any Twitch channels`, flags: MessageFlags.Ephemeral });
      } else {
        const channels = twitchSubscriptions.map(sub => `${sub.displayName}`).join(", ")
        await interaction.reply({ content: `Subscribed to ${channels}.`, flags: MessageFlags.Ephemeral })
      }
    }
  }
}

function messageConfigToString(messageConfig: DiscordMessageConfig | undefined): string | undefined {
  const NOT_SET = "Not set"
  return `__**Current config**__\n**Channel to alert**: *${messageConfig?.channelToAlert?.name || NOT_SET}*,\n**Bot name**: *${messageConfig?.botName || NOT_SET}*,\n**Bot avatar url**: *${messageConfig?.avatarPictureUrl || NOT_SET}*,\n**Embed title template**: *${messageConfig?.embedTitleTemplate || NOT_SET}*,\n**Pre embed content**: *${messageConfig?.preEmbedContent || NOT_SET}*`;
}

const usageStore = new UsageStore();
const command: Command = {
  config,
  commandJson,
  handler,
  stores: {
    [usageStore.getKey()]: usageStore,
    [twitchAlertStore.getKey()]: twitchAlertStore
  }
}

export default command;
