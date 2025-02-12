import { format } from "node:util";

import { HelixUser, HelixStream } from "@twurple/api";
import { EmbedBuilder } from "discord.js";
import { DiscordMessageConfig, EventSubStreamOnlineEvent } from "./types.js";
import { DEFAULT_TITLE_TEMPLATE } from "./constants.js";

export function buildEmbed(messageConfig: DiscordMessageConfig | undefined, event: EventSubStreamOnlineEvent, user: HelixUser, stream: HelixStream | null): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(generateTitle(messageConfig, user))
    .setURL(`https://twitch.tv/${event.broadcasterName}`)
    .setDescription(generateDescription(stream))
    .setColor(0x00FF00)
    .setThumbnail(user.profilePictureUrl);
}

function generateTitle(messageConfig: DiscordMessageConfig | undefined, user: HelixUser): string {
  return format(messageConfig?.titleTemplate || DEFAULT_TITLE_TEMPLATE, user.displayName)
}

function generateDescription(stream: HelixStream | null): string {
  const firstLine = `${stream?.title || "Come join!"}`
  const secondLine = `*Streaming **${stream?.gameName || "???"}***`
  const description = `${firstLine}\n\n${secondLine}`

  return description;
}
