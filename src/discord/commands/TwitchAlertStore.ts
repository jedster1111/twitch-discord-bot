import { HelixStream, HelixUser } from "@twurple/api";
import { Guild, TextChannel } from "discord.js";
import { twitchApiClient, twitchEventSubListener } from "../../createTwitchListener.js";
import { waitToExist } from "../../waitFor.js";
import { EventSubHttpListener } from "@twurple/eventsub-http";
import { DiscordMessageConfig, DiscordMessageConfigDTO, discordMessageConfigToDto, hydrateDiscordMessageConfig } from "../../types.js";
import { discordClient } from "../client.js";
import { StoreBase } from "./StoreBase.js";

export type StreamOnlineHandler = (guildDatas: GuildData[], stream: HelixStream | null, twitchChannel: HelixUser) => Promise<void>;
export type StreamOfflineHandler = (guildDatas: GuildData[], twitchChannel: HelixUser) => Promise<void>;

type TwitchEventSubscription = ReturnType<EventSubHttpListener["onStreamOnline"]>

export type GuildData = {
  guild: Guild;
  subscribedTwitchChannels: { [twitchChannelName: string]: HelixUser };
  messageConfig: DiscordMessageConfig;
};

export type GuildDataDTO = {
  guildId: string;
  subscribedTwitchChannelNames: string[];
  messageConfig: DiscordMessageConfigDTO;
}

const guildDataToDto = (guildData: GuildData): GuildDataDTO => {
  return {
    guildId: guildData.guild.id,
    subscribedTwitchChannelNames: Object.values(guildData.subscribedTwitchChannels).map(channel => channel.name),
    messageConfig: discordMessageConfigToDto(guildData.messageConfig)
  }
}

export type ChannelData = {
  channel: HelixUser;
  guildsToAlert: Set<string>;
  onStreamOnlineHandle?: TwitchEventSubscription;
  onStreamOfflineHandle?: TwitchEventSubscription;
};

type TwitchAlertStoreDTO = {
  guildData: GuildDataDTO[]
}

export class TwitchAlertStore extends StoreBase<TwitchAlertStoreDTO, "twitchAlert"> {
  getKey() { return "twitchAlert" as const }

  override toDto(): TwitchAlertStoreDTO {
    return { guildData: Object.values(this.guildDataMap).map(guildDataToDto) }
  }

  /**
   * For safety, only call this after the discord client has marked itself as ready
   */
  override async hydrateFromDto(twitchAlertStoreDto: TwitchAlertStoreDTO) {
    const guildData = twitchAlertStoreDto.guildData;
    try {
      const usernames = new Set(guildData.flatMap(dto => dto.subscribedTwitchChannelNames));
      const twitchChannels = await twitchApiClient.users.getUsersByNames(Array.from(usernames));
      const twitchChannelMapByName = twitchChannels.reduce<{ [twitchChannelName: string]: HelixUser }>(
        (accum, channel) => {
          accum[channel.name] = channel;
          return accum;
        }, {}
      )

      for (const guildDataDto of guildData) {
        // This cache will only be populated after the discord client 'ready' event, and will be populated with guilds the bot has been invited to
        const guild = discordClient.guilds.cache.get(guildDataDto.guildId);
        if (!guild) {
          console.warn(`Could not find cache entry for guild with id "${guildDataDto.guildId}. Has the bot been removed possibly?"`);
          continue;
        }

        for (const twitchChannelName of guildDataDto.subscribedTwitchChannelNames) {
          const twitchChannel = twitchChannelMapByName[twitchChannelName];
          if (!twitchChannel) {
            console.warn(`Could not find twitch channel with the name ${twitchChannelName}. Have they changed their name recently?`);
            continue;
          }

          this.addTwitchChannelSubscription(guild, twitchChannel, hydrateDiscordMessageConfig(guildDataDto.messageConfig));
        }
      }
    } catch (e) {
      console.error("Failed to hydrate from DTO", e)
    }
  }

  private messages: { [guildId: string]: string; } = {};

  getMessage(guildId: string): string | undefined { return this.messages[guildId]; }
  setMessage(guildId: string, message: string) { this.messages[guildId] = message; }
  removeMessage(guildId: string) { delete this.messages[guildId]; }

  private guildDataMap: { [guildId: string]: GuildData; } = {};
  private twitchChannelDataMap: { [channelName: string]: ChannelData; } = {};

  private handleStreamOnline: StreamOnlineHandler = async () => { };
  private handleStreamOffline: StreamOfflineHandler = async () => { };

  setHandleStreamOnline(handleStreamOnline: StreamOnlineHandler) {
    this.handleStreamOnline = handleStreamOnline;
  }

  setHandleStreamOffline(handleStreamOffline: StreamOfflineHandler) {
    this.handleStreamOffline = handleStreamOffline;
  }

  addTwitchChannelSubscription(guild: Guild, twitchChannel: HelixUser, messageConfig?: DiscordMessageConfig) {
    const newGuildData = this.guildDataMap[guild.id] ??= { guild, subscribedTwitchChannels: {}, messageConfig: messageConfig || {} };
    newGuildData.subscribedTwitchChannels[twitchChannel.name] = twitchChannel;

    const twitchChannelData = this.twitchChannelDataMap[twitchChannel.name] ??= { channel: twitchChannel, guildsToAlert: new Set(), onStreamOnlineHandle: undefined, onStreamOfflineHandle: undefined };
    twitchChannelData.guildsToAlert.add(guild.id);

    twitchChannelData.onStreamOnlineHandle ??= twitchEventSubListener.onStreamOnline(twitchChannel, async (event) => {
      console.log(`${event.broadcasterDisplayName} is online! ${event.startDate}`);
      const twitchStream = await waitToExist(() => event.getStream(), 7500, 5);
      this.handleStreamOnline(this.getGuildDatas(twitchChannel), twitchStream, twitchChannel);
    });

    twitchChannelData.onStreamOfflineHandle ??= twitchEventSubListener.onStreamOffline(twitchChannel, event => {
      console.log(`${event.broadcasterDisplayName} is offline!`);
      this.handleStreamOffline(this.getGuildDatas(twitchChannel), twitchChannel);
    });
  }

  removeTwitchChannelSubscription(guild: Guild, twitchChannelName: string): void {
    const guildData = this.guildDataMap[guild.id];
    delete guildData?.subscribedTwitchChannels[twitchChannelName];

    const twitchChannelData = this.twitchChannelDataMap[twitchChannelName];
    const didRemoveGuild = twitchChannelData?.guildsToAlert.delete(guild.id);
    if (twitchChannelData && didRemoveGuild && twitchChannelData.guildsToAlert.size === 0) {
      console.log(`No more servers to alert for ${twitchChannelName}, stopping subscriptions`)
      twitchChannelData.onStreamOnlineHandle?.stop();
      twitchChannelData.onStreamOfflineHandle?.stop();

      delete this.twitchChannelDataMap[twitchChannelName];
    }
  }

  getTwitchChannelSubscriptions(guild: Guild): Array<HelixUser> | undefined {
    return Object.values(this.guildDataMap[guild.id]?.subscribedTwitchChannels || []);
  }

  setChannelToSendTwitchAlerts(guild: Guild, channel: TextChannel) {
    const newGuildData = this.guildDataMap[guild.id] ??= { guild, subscribedTwitchChannels: {}, messageConfig: {} };
    newGuildData.messageConfig.channelToAlert = channel;
  }

  getChannelToSendTwitchAlerts(guild: Guild): TextChannel | undefined {
    return this.guildDataMap[guild.id]?.messageConfig.channelToAlert;
  }

  private getGuildDatas(twitchChannel: HelixUser): GuildData[] {
    const guildDatas: GuildData[] = [];
    for (const guild of this.twitchChannelDataMap[twitchChannel.name]?.guildsToAlert ?? []) {
      const guildData = this.guildDataMap[guild];
      if (!guildData) continue;
      guildDatas.push(guildData);
    }
    return guildDatas;
  }
}
