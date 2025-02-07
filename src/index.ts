import { ApiClient, HelixStream, HelixUser } from '@twurple/api';
import { AppTokenAuthProvider } from '@twurple/auth';
import { EventSubHttpListener, ReverseProxyAdapter, } from '@twurple/eventsub-http';
import { EmbedBuilder, WebhookClient } from 'discord.js';
import { waitToExist } from './waitFor';

type EventSubStreamOnlineEventHandler = Parameters<EventSubHttpListener["onStreamOnline"]>[1];
type EventSubStreamOnlineEvent = Parameters<EventSubStreamOnlineEventHandler>[0];

type DiscordServerInfo = {
  discordWebhook: string,
  twitchChannelNamesToWatch: string[],
  discordMessageConfig?: { botName?: string, avatarPictureUrl?: string }
}

type SaturatedDiscordServerInfo = DiscordServerInfo & { discordWebhookClient: WebhookClient };

type TwitchNameToDiscordWebhookMap = { [twitchName: string]: string[] };
type SaturatedDiscordServerInfoMappedByWebhook = { [discordWebhook: string]: SaturatedDiscordServerInfo };

const TWITCH_ICON_URL = "https://cdn.discordapp.com/attachments/480095526193201202/1337242207018680412/image.png?ex=67a6bb5a&is=67a569da&hm=4c74f81ba39e83c5f0200017f4a12aac1a8c4c3096da479a38b1d580d70b81af&"

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const secret = process.env.SECRET;
const hostName = process.env.HOST_NAME;
const port = process.env.PORT;
const JedServerDiscordWebhook = process.env.JED_GAMEZ_SERVER_DISCORD_WEBHOOK;
const TheBakeryServerDiscordWebhook = process.env.THE_BAKERY_SERVER_DISCORD_WEBHOOK;
const KobertServerDiscordWebhook = process.env.KOBERT_SERVER_DISCORD_WEBHOOK;

if (!clientId || !clientSecret || !secret || !hostName || !port || !JedServerDiscordWebhook || !TheBakeryServerDiscordWebhook || !KobertServerDiscordWebhook) throw new Error();

const discordServerInfos: DiscordServerInfo[] = [
  { discordWebhook: JedServerDiscordWebhook, twitchChannelNamesToWatch: ["kobert", "jedster1111", "hot_cross_bun", "thelightsider"] },
  { discordWebhook: TheBakeryServerDiscordWebhook, twitchChannelNamesToWatch: ["hot_cross_bun"] },
  {
    discordWebhook: KobertServerDiscordWebhook,
    twitchChannelNamesToWatch: ["kobert"],
    discordMessageConfig: { botName: "Anna Hown Sminth", avatarPictureUrl: "https://i.imgur.com/PMu18WI.png" }
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

const authProvider = new AppTokenAuthProvider(clientId, clientSecret);
const twitchApiClient = new ApiClient({ authProvider });

const adapter = new ReverseProxyAdapter({
  hostName,
  port: Number(port)
});

const twitchListener = new EventSubHttpListener({ apiClient: twitchApiClient, adapter, secret });

twitchListener.start();

console.log(`Started twitch-discord-bot on port ${port}!`)

twitchListener.onSubscriptionCreateSuccess((event, subscription) => {
  console.log(`Subscription (${subscription.id}) made successfully. status - ${subscription.status}, type - ${subscription.type}`)
})

twitchListener.onSubscriptionCreateFailure((event, error) => {
  console.log(`Subscription failed. error - ${error.message}`)
})

twitchListener.onVerify((isSuccess, subscription) => {
  if (isSuccess) console.log(`Subscription (${subscription.id}) verified.`);
  else console.warn(`Subscription (${subscription.id}) failed to verify.`);
})

twitchApiClient.users.getUsersByNames(uniqueUsersToSubscribeTo)
  .then(users => {
    users.forEach(user => {
      if (!user) {
        console.warn(`Failed to find one of the specified users.`);
        return;
      }

      console.log(`Subscribing to events from ${user.displayName} - ${user.id}`)

      twitchListener.onStreamOnline(user, async (event) => {
        console.log(`${event.broadcasterDisplayName} is online! ${event.startDate}`)
        const stream = await waitToExist(() => event.getStream(), 7500, 5);
        SendTwitchStreamStartedDiscordMessage(event, user, stream)
      })

      twitchListener.onStreamOffline(user, event => {
        console.log(`${event.broadcasterDisplayName} is offline!`)
      })
    })
  });

function SendTwitchStreamStartedDiscordMessage(event: EventSubStreamOnlineEvent, user: HelixUser, stream: HelixStream | null) {
  try {
    const embed = new EmbedBuilder()
      .setTitle(`${user.displayName} just went live!`)
      .setURL(`https://twitch.tv/${event.broadcasterName}`)
      .setDescription(generateDescription(stream))
      .setColor(0x00FF00)
      .setThumbnail(user.profilePictureUrl);

    const webhooksForUser = twitchNameToDiscordWebhooksMap[user.name];
    if (!webhooksForUser) throw new Error("Failed to find discord channels to send message to for twitch channel");

    webhooksForUser.forEach(webhook => {
      const discordServerInfo = saturatedDiscordServerInfoMap[webhook];
      if (!discordServerInfo) throw new Error("Failed to find discord server info for specified webhook")

      const webhookClient = discordServerInfo.discordWebhookClient;
      const messageConfig = discordServerInfo.discordMessageConfig;

      webhookClient.send({
        username: messageConfig?.botName,
        avatarURL: messageConfig?.avatarPictureUrl || TWITCH_ICON_URL,
        embeds: [embed]
      })
    })
  } catch (error) {
    console.error("Error sending message to Discord Webhook", error)
  }
}

function generateDescription(stream: HelixStream | null): string {
  const firstLine = `${stream?.title || "Come join!"}`
  const secondLine = `*Streaming **${stream?.gameName || "???"}***`
  const description = `${firstLine}\n\n${secondLine}`

  return description;
}
