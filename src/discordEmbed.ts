import { format } from "node:util";

import { EmbedBuilder } from "discord.js";
import { DiscordMessageConfig } from "./types.js";
import { DEFAULT_TITLE_TEMPLATE } from "./constants.js";
import { HelixStream, HelixUser } from "@twurple/api";

export type MessageData = {
  twitchChannelName: string,
  twitchChannelDisplayName: string,
  streamTitle: string | undefined,
  streamGame: string | undefined,
  twitchChannelProfilePicture: string
}

export function buildEmbed(messageConfig: DiscordMessageConfig, messageData: MessageData): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(generateTitle(messageConfig, messageData))
    .setURL(`https://twitch.tv/${messageData.twitchChannelName}`)
    .setDescription(generateDescription(messageData))
    .setColor(0x00FF00)
    .setThumbnail(messageData.twitchChannelProfilePicture);
}

function generateTitle(messageConfig: DiscordMessageConfig, messageData: MessageData): string {
  return format(messageConfig.embedTitleTemplate || DEFAULT_TITLE_TEMPLATE, messageData.twitchChannelDisplayName)
}

function generateDescription(messageData: MessageData): string {
  const firstLine = `${messageData.streamTitle || "Come join!"}`
  const secondLine = `*Streaming **${messageData.streamGame || "???"}***`
  const description = `${firstLine}\n\n${secondLine}`

  return description;
}

export function buildMessageData(user: HelixUser, stream: HelixStream | null | undefined): MessageData {
  return {
    streamGame: stream?.gameName,
    streamTitle: stream?.title,
    twitchChannelName: user.name,
    twitchChannelDisplayName: user.displayName,
    twitchChannelProfilePicture: user.profilePictureUrl
  }
}
