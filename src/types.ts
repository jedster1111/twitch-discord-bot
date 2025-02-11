import { EventSubHttpListener } from "@twurple/eventsub-http";
import { WebhookClient } from "discord.js";

export type EventSubStreamOnlineEventHandler = Parameters<EventSubHttpListener["onStreamOnline"]>[1];
export type EventSubStreamOnlineEvent = Parameters<EventSubStreamOnlineEventHandler>[0];

export type DiscordMessageConfig = {
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

export type DiscordServerInfo = {
  discordWebhook: string,
  twitchChannelNamesToWatch: string[],
  discordMessageConfig?: DiscordMessageConfig
}

export type SaturatedDiscordServerInfo = DiscordServerInfo & { discordWebhookClient: WebhookClient };

export type TwitchNameToDiscordWebhookMap = { [twitchName: string]: string[] };
export type SaturatedDiscordServerInfoMappedByWebhook = { [discordWebhook: string]: SaturatedDiscordServerInfo };
