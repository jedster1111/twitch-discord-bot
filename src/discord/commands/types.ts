import { CacheType, ChatInputCommandInteraction, RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js"
import { UsageStore } from "../store/timestampStore.js"

export type CommandConfig = {
  /**
   * Rate limit of cooldown in ms
   */
  cooldown?: number
}

export type CommandHandler = (interaction: ChatInputCommandInteraction<CacheType>) => Promise<void>

export type Command = {
  config?: CommandConfig,
  commandJson: RESTPostAPIChatInputApplicationCommandsJSONBody,
  handler: CommandHandler,
  usageStore: UsageStore
}
