import { EventSubHttpListener } from "@twurple/eventsub-http";
import { ChannelType, TextChannel, WebhookClient } from "discord.js";
import { twitchApiClient } from "./createTwitchListener.js";
import { discordClient } from "./discord/client.js";

export type EventSubStreamOnlineEventHandler = Parameters<EventSubHttpListener["onStreamOnline"]>[1];
export type EventSubStreamOnlineEvent = Parameters<EventSubStreamOnlineEventHandler>[0];

export type DiscordMessageConfig = {
  channelToAlert?: TextChannel,
  botName?: string,
  avatarPictureUrl?: string,
  shouldTagEveryone?: boolean,
  /**
  * `%s` will be replaced with the User's name.
  * `%s` must be found within titleTemplate, or 
  * the user's name will be appended to the end
  * of the resulting string.
  */
  titleTemplate?: string
}

export type DiscordMessageConfigDTO = {
  channelToAlertId: string | undefined,
  botName: string | undefined,
  avatarPictureUrl: string | undefined,
  shouldTagEveryone: boolean | undefined,
  titleTemplate: string | undefined
}

export const discordMessageConfigToDto = (obj: DiscordMessageConfig): DiscordMessageConfigDTO => {
  return {
    channelToAlertId: obj.channelToAlert?.id,
    avatarPictureUrl: obj.avatarPictureUrl,
    botName: obj.botName,
    shouldTagEveryone: obj.shouldTagEveryone,
    titleTemplate: obj.titleTemplate
  }
}

export const hydrateDiscordMessageConfig = (obj: DiscordMessageConfigDTO): DiscordMessageConfig => {
  return {
    channelToAlert: obj.channelToAlertId ? getTextChannelFromId(obj.channelToAlertId) : undefined,
    avatarPictureUrl: obj.avatarPictureUrl,
    botName: obj.botName,
    shouldTagEveryone: obj.shouldTagEveryone,
    titleTemplate: obj.titleTemplate
  }
}

const getTextChannelFromId = (channelId: string): TextChannel | undefined => {
  const channel = discordClient.channels.cache.get(channelId);
  if (!channel) return undefined;
  return channel.type === ChannelType.GuildText ? channel : undefined
}

export type DiscordServerInfo = {
  discordWebhook: string,
  twitchChannelNamesToWatch: string[],
  discordMessageConfig?: DiscordMessageConfig
}


export type SaturatedDiscordServerInfo = DiscordServerInfo & { discordWebhookClient: WebhookClient };

export type TwitchNameToDiscordWebhookMap = { [twitchName: string]: string[] };
export type SaturatedDiscordServerInfoMappedByWebhook = { [discordWebhook: string]: SaturatedDiscordServerInfo };

export type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

export type NonNullableField<T, K extends keyof T> = T &
  NonNullableFields<Pick<T, K>>;
