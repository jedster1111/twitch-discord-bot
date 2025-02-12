import { envVars } from "./loadEnvVars.js";
import { DiscordServerInfo } from "./types.js";

const { environment, JedServerDiscordWebhook, TheBakeryServerDiscordWebhook, KobertServerDiscordWebhook } = envVars;

const prodDiscordServerInfos: DiscordServerInfo[] = [
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

const devDiscordServerInfos: DiscordServerInfo[] = [
  {
    discordWebhook: JedServerDiscordWebhook,
    twitchChannelNamesToWatch: ["jedster2222"]
  }
]

const getDiscordServerInfos = () => {
  if (environment === "dev") return devDiscordServerInfos;
  else if (environment === "prod") return prodDiscordServerInfos;
  throw new Error();
}

export const discordServerInfos = getDiscordServerInfos();
