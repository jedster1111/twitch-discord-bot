import { EventSubHttpListener } from "@twurple/eventsub-http";
import { ChannelType, TextChannel, Webhook, WebhookClient } from "discord.js";
import { discordClient } from "./discord/client.js";
import { DEFAULT_WEBHOOK_NAME, TWITCH_ICON_URL } from "./constants.js";
import { AcceptableChannels } from "./discord/commands/TwitchAlertStore.js";

export type EventSubStreamOnlineEventHandler = Parameters<EventSubHttpListener["onStreamOnline"]>[1];
export type EventSubStreamOnlineEvent = Parameters<EventSubStreamOnlineEventHandler>[0];

export type DiscordMessageConfig = {
  channelToAlert: AcceptableChannels | undefined;
  webhookToAlert: Webhook | undefined;
  botName: string | undefined;
  avatarPictureUrl: string | undefined;
  /**
   * `%s` will be replaced with the User's name.
   * `%s` must be found within titleTemplate, or
   * the user's name will be appended to the end
   * of the resulting string.
   */
  embedTitleTemplate: string | undefined;
  preEmbedContent: string | undefined;
};

export function createEmptyDiscordMessageConfig(): DiscordMessageConfig {
  return {
    channelToAlert: undefined,
    webhookToAlert: undefined,
    botName: undefined,
    avatarPictureUrl: undefined,
    embedTitleTemplate: undefined,
    preEmbedContent: undefined,
  };
}

export type DiscordMessageConfigDTO = {
  channelToAlertId: string | undefined;
  botName: string | undefined;
  avatarPictureUrl: string | undefined;
  embedTitleTemplate: string | undefined;
  preEmbedContent: string | undefined;
};

export const discordMessageConfigToDto = (obj: DiscordMessageConfig): DiscordMessageConfigDTO => {
  return {
    channelToAlertId: obj.channelToAlert?.id,
    avatarPictureUrl: obj.avatarPictureUrl,
    botName: obj.botName,
    embedTitleTemplate: obj.embedTitleTemplate,
    preEmbedContent: obj.preEmbedContent,
  };
};

export const hydrateDiscordMessageConfig = async (obj: DiscordMessageConfigDTO): Promise<DiscordMessageConfig> => {
  const channelToAlert = obj.channelToAlertId ? getTextChannelFromId(obj.channelToAlertId) : undefined;
  return {
    channelToAlert: channelToAlert,
    webhookToAlert: channelToAlert ? await getWebhookFromChannel(channelToAlert) : undefined,
    avatarPictureUrl: obj.avatarPictureUrl,
    botName: obj.botName,
    embedTitleTemplate: obj.embedTitleTemplate,
    preEmbedContent: obj.preEmbedContent,
  };
};

function getTextChannelFromId(channelId: string): TextChannel | undefined {
  const channel = discordClient.channels.cache.get(channelId);
  if (!channel) return undefined;
  return channel.type === ChannelType.GuildText ? channel : undefined;
}

export async function getWebhookFromChannel(channel: AcceptableChannels): Promise<Webhook> {
  const channelWebhooks = await channel.fetchWebhooks();
  return (
    channelWebhooks
      .filter((webhook) => webhook.owner?.id === channel.client.user.id)
      .find((webhook) => webhook.name === DEFAULT_WEBHOOK_NAME) ||
    (await channel.createWebhook({
      name: DEFAULT_WEBHOOK_NAME,
      avatar: TWITCH_ICON_URL,
    }))
  );
}

export type DiscordServerInfo = {
  discordWebhook: string;
  twitchChannelNamesToWatch: string[];
  discordMessageConfig?: DiscordMessageConfig;
};

export type SaturatedDiscordServerInfo = DiscordServerInfo & {
  discordWebhookClient: WebhookClient;
};

export type TwitchNameToDiscordWebhookMap = { [twitchName: string]: string[] };
export type SaturatedDiscordServerInfoMappedByWebhook = {
  [discordWebhook: string]: SaturatedDiscordServerInfo;
};

export type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

export type NonNullableField<T, K extends keyof T> = T & NonNullableFields<Pick<T, K>>;
