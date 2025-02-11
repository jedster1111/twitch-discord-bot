import { WebhookClient } from "discord.js"
import { DiscordServerInfo, TwitchNameToDiscordWebhookMap, SaturatedDiscordServerInfoMappedByWebhook } from "./types"
import { EnvConfig } from "./loadEnvVars"

type Return = {
  discordServerInfos: DiscordServerInfo[],
  twitchNameToDiscordWebhooksMap: TwitchNameToDiscordWebhookMap,
  saturatedDiscordServerInfoMap: SaturatedDiscordServerInfoMappedByWebhook,
  uniqueUsersToSubscribeTo: string[]
}

export const generateStaticDataAtStartup = ({ JedServerDiscordWebhook, TheBakeryServerDiscordWebhook, KobertServerDiscordWebhook }: EnvConfig): Return => {
  const discordServerInfos: DiscordServerInfo[] = [
    {
      discordWebhook: JedServerDiscordWebhook,
      twitchChannelNamesToWatch: ["kobert", "jedster1111", "hotcrossbuntv", "thelightsider"]
    },
    { discordWebhook: TheBakeryServerDiscordWebhook, twitchChannelNamesToWatch: ["hotcrossbuntv"] },
    {
      discordWebhook: KobertServerDiscordWebhook,
      twitchChannelNamesToWatch: ["kobert"],
      discordMessageConfig: {
        botName: "Anna Hown Sminth",
        avatarPictureUrl: "https://i.imgur.com/PMu18WI.png",
        titleTemplate: "%s is live and feeling purposeful! holy cow! join before he loses it!"
      }
    },
  ]

  // Construct a map of twitch channels to discord webhooks that need to be alerted when that channel goes live
  const twitchNameToDiscordWebhooksMap = discordServerInfos
    .reduce<TwitchNameToDiscordWebhookMap>((accum, { discordWebhook, twitchChannelNamesToWatch }) => {
      twitchChannelNamesToWatch.forEach(name => {
        if (!accum[name]) { accum[name] = [discordWebhook] }
        else { accum[name].push(discordWebhook) }
      })
      return accum;
    }, {})

  // Construct a map of discord webhook urls to discord webhook clients
  const saturatedDiscordServerInfoMap = discordServerInfos
    .reduce<SaturatedDiscordServerInfoMappedByWebhook>((accum, discordServerInfo) => {
      accum[discordServerInfo.discordWebhook] = {
        ...discordServerInfo,
        discordWebhookClient: new WebhookClient({ url: discordServerInfo.discordWebhook })
      }
      return accum;
    }, {})

  const uniqueUsersToSubscribeTo = Object.keys(twitchNameToDiscordWebhooksMap);

  return {
    discordServerInfos,
    twitchNameToDiscordWebhooksMap,
    saturatedDiscordServerInfoMap,
    uniqueUsersToSubscribeTo
  }
}