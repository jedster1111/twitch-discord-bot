import { HelixStream, HelixUser } from "@twurple/api";
import { Channel, Guild } from "discord.js";
import { twitchEventSubListener } from "../../createTwitchListener.js";
import { waitToExist } from "../../waitFor.js";
import { EventSubHttpListener } from "@twurple/eventsub-http";

export type StreamOnlineHandler = (guildDatas: ValidatedGuildData[], stream: HelixStream | null, twitchChannel: HelixUser) => Promise<void>;
export type StreamOfflineHandler = (guildDatas: ValidatedGuildData[], twitchChannel: HelixUser) => Promise<void>;

type TwitchEventSubscription = ReturnType<EventSubHttpListener["onStreamOnline"]>

export type GuildData = {
  guild: Guild;
  channel?: Channel;
  subscribedTwitchChannels: Set<HelixUser>;
};

export type ValidatedGuildData = GuildData & {
  channel: NonNullable<GuildData['channel']>
}

export type ChannelData = {
  channel: HelixUser;
  guildsToAlert: Set<Guild>;
  onStreamOnlineHandle?: TwitchEventSubscription;
  onStreamOfflineHandle?: TwitchEventSubscription;
};

export class TwitchAlertStore {
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

  addTwitchChannelSubscription(guild: Guild, twitchChannel: HelixUser) {
    const newGuildData = this.guildDataMap[guild.id] ??= { guild, channel: undefined, subscribedTwitchChannels: new Set() };
    newGuildData.subscribedTwitchChannels.add(twitchChannel);

    const twitchChannelData = this.twitchChannelDataMap[twitchChannel.name] ??= { channel: twitchChannel, guildsToAlert: new Set(), onStreamOnlineHandle: undefined, onStreamOfflineHandle: undefined };
    twitchChannelData.guildsToAlert.add(guild);

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

  setChannelToSendTwitchAlerts(guild: Guild, channel: Channel) {
    if (!channel.isSendable()) { 
      console.warn(`Can't configure alerts to be sent to a non-sendable channel: ${channel.name}.`)  
      return;
     }

    const newGuildData = this.guildDataMap[guild.id] ??= { guild, channel: undefined, subscribedTwitchChannels: new Set() };
    newGuildData.channel = channel;
  }

  private getGuildDatas(twitchChannel: HelixUser): ValidatedGuildData[] {
    const guildDatas: ValidatedGuildData[] = [];
    for (const guild of this.twitchChannelDataMap[twitchChannel.name]?.guildsToAlert ?? []) {
      const guildData = this.guildDataMap[guild.id];
      if (!guildData) continue;
      if (!guildData || !this.validateGuildData(guildData)) continue;
      guildDatas.push(guildData);
    }
    return guildDatas;
  }

  private validateGuildData(data: GuildData): data is ValidatedGuildData {
    if (!data.channel) {
      console.warn(`Discord channel hasn't been set for twitch alert for guild: ${data.guild.name}`);
      return false;
    }
    else
      return true;
  }
}
