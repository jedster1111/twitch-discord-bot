import { CacheType, ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { Command, CommandConfig } from "./types.js";
import { UsageStore } from "../store/timestampStore.js";

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
 */

const commandJson = new SlashCommandBuilder()
  .setName("twitch-alert")
  .setDescription("Manage twitch alerts.")
  .addSubcommandGroup(subCommandGroup => subCommandGroup
    .setName("message")
    .setDescription("Manage twitch alert message. This will appear before the embed when a user goes online.")
    .addSubcommand(subCommand => subCommand.setName("get").setDescription("Gets the current twitch alert message"))
    .addSubcommand(subCommand => subCommand
      .setName("set")
      .setDescription("Sets the twitch alert message")
      .addStringOption(option => option
        .setName("message")
        .setDescription("The message you want to send when a twitch alert fires")
        .setRequired(true)
      )
    )
    .addSubcommand(subCommand => subCommand.setName("remove").setDescription("Removes the current twitch alert message"))
  )
  .toJSON();

class TwitchAlertStore {
  private messages: { [guildId: string]: string } = {};

  getMessage(guildId: string): string | undefined { return this.messages[guildId] }
  setMessage(guildId: string, message: string) { this.messages[guildId] = message }
  removeMessage(guildId: string) { delete this.messages[guildId] }
}

const twitchAlertStore = new TwitchAlertStore();

const handler = async (interaction: ChatInputCommandInteraction<CacheType>) => {
  const subCommand = interaction.options.getSubcommand();
  const subCommandGroup = interaction.options.getSubcommandGroup();

  const guild = interaction.guild;
  if (!guild) {
    interaction.reply({ content: "I can't do that! This command only works within a server/guild.", flags: MessageFlags.Ephemeral });
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
      const message = await interaction.options.getString("message", true);
      twitchAlertStore.setMessage(guild.id, message);
      await interaction.reply({ content: `Updated message!`, flags: MessageFlags.Ephemeral });
    }
    if (subCommand === "remove") {
      twitchAlertStore.removeMessage(guild.id)
      await interaction.reply({ content: `Message has been removed`, flags: MessageFlags.Ephemeral })
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
