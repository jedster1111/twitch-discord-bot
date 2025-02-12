import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js"

export type CommandConfig = {
  cooldown?: number
}

export type Command = {
  config?: CommandConfig,
  commandBuilder: SlashCommandBuilder,
  commandHandler: (interaction: ChatInputCommandInteraction<CacheType>) => Promise<void>
}
