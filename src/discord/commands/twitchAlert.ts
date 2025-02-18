import { CacheType, ChannelType, ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { Command, CommandConfig } from "./types.js";
import { UsageStore } from "../store/timestampStore.js";
import { TwitchAlertStore } from "./TwitchAlertStore.js";
import { twitchApiClient } from "../../createTwitchListener.js";

const config: CommandConfig = {
  cooldown: 3_000
}

/**
 * - twitch-alert
 *   - message
 *     - get
 *     - set
 *     - delete
 *   - channels
 *     - get
 *     - add
 *     - remove
 *   - alerts
 *     - set-channel
 *   
 */

const commandJson = new SlashCommandBuilder()
  .setName("twitch-alert")
  .setDescription("Manage twitch alerts.")
  .addSubcommandGroup(scg => scg.setName("message").setDescription("Manage twitch alert message. This will appear before the embed when a user goes online.")
    .addSubcommand(sc => sc.setName("get").setDescription("Gets the current twitch alert message"))
    .addSubcommand(sc => sc.setName("set").setDescription("Sets the twitch alert message")
      .addStringOption(o => o.setName("message").setDescription("The message you want to send when a twitch alert fires").setRequired(true))
    )
    .addSubcommand(sc => sc.setName("remove").setDescription("Removes the current twitch alert message"))
  )
  .addSubcommandGroup(scg => scg.setName("channels").setDescription("Manage the twitch channels to subscribe to")
    .addSubcommand(sc => sc.setName("add").setDescription("Subscribe to a twitch channel's online and offline events")
      .addStringOption(o => o.setName("twitch-channel").setDescription("The Twitch channel to subscribe to").setRequired(true)))
    .addSubcommand(sc => sc.setName("remove").setDescription("Remove a Twitch channel subscription from this server")
      .addStringOption(o => o.setName("twitch-channel").setDescription("Unsubscribe from this Twitch channel").setRequired(true)))
    .addSubcommand(sc => sc.setName("get").setDescription("Get the twitch channels subscribe to in this server"))
  )
  .addSubcommandGroup(scg => scg.setName("alerts-channel").setDescription("Manage the channel to which Twitch alerts are sent")
    .addSubcommand(sc => sc.setName("set").setDescription("Set the channel to which Twitch alerts are sent")
      .addChannelOption(o => o.setName("channel").setDescription("The channel to send Twitch alerts to").addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand(sc => sc.setName("get").setDescription("Get the channel to which Twitch alerts are sent"))
  )
  .toJSON();

const twitchAlertStore = new TwitchAlertStore();

twitchAlertStore.setHandleStreamOnline(async (guildDatas, stream, twitchChannel) => {
  for (const guildData of guildDatas) {
    if (guildData.channel.isSendable()) {
      await guildData.channel.send({ content: `${twitchChannel.displayName} just went online!` })
    } else {
      console.warn("Tried to send Discord message to un-sendable channel")
    }
  }
})

twitchAlertStore.setHandleStreamOffline(async (guildDatas, twitchChannel) => {
  for (const guildData of guildDatas) {
    if (guildData.channel.isSendable()) {
      await guildData.channel.send({ content: `${twitchChannel.displayName} just went offline!` })
    } else {
      console.warn("Tried to send Discord message to un-sendable channel")
    }
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

  if (subCommandGroup === "message") {
    if (subCommand === "get") {
      const message = twitchAlertStore.getMessage(guild.id);
      if (!message) {
        await interaction.reply({ content: `No message is currently set`, flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content: `**Current message:** ${message}`, flags: MessageFlags.Ephemeral })
      }
    }
    if (subCommand === "set") {
      const message = interaction.options.getString("message", true);
      twitchAlertStore.setMessage(guild.id, message);
      await interaction.reply({ content: `Updated message!`, flags: MessageFlags.Ephemeral });
    }
    if (subCommand === "remove") {
      twitchAlertStore.removeMessage(guild.id)
      await interaction.reply({ content: `Message has been removed`, flags: MessageFlags.Ephemeral })
    }
  } else if (subCommandGroup === "channels") {
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

      if (!twitchSubscriptions || twitchSubscriptions.size === 0) {
        await interaction.reply({ content: `Not currently subscribed to any Twitch channels`, flags: MessageFlags.Ephemeral });
      } else {
        const channels = Array.from(twitchSubscriptions, sub => `\`${sub}\``).join(", ")
        await interaction.reply({ content: `Subscribed to ${channels}.` })
      }
    }
  }
  else if (subCommandGroup === "alerts-channel") {
    if (subCommand === "set") {
      const channel = interaction.options.getChannel("channel", true, [ChannelType.GuildText]);

      twitchAlertStore.setChannelToSendTwitchAlerts(interaction.guild, channel);

      await interaction.reply({ content: `Twitch alerts will be sent to ${channel.name} from now on!`, flags: MessageFlags.Ephemeral });
    }
    if (subCommand === "get") {
      const channel = twitchAlertStore.getChannelToSendTwitchAlerts(guild);

      if (!channel) {
        await interaction.reply({ content: `No channel is currently set. Please set a channel to receive Twitch alerts!`, flags: MessageFlags.Ephemeral })
        return;
      } else {
        await interaction.reply({ content: `Twitch alerts will be sent to ${channel.name}`, flags: MessageFlags.Ephemeral })
      }
    }
  }
}

const command: Command = {
  config,
  commandJson,
  handler,
  usageStore: new UsageStore()
}

export default command;
