import { ApiClient, HelixStream, HelixUser } from '@twurple/api';
import { AppTokenAuthProvider } from '@twurple/auth';
import { EventSubHttpListener, ReverseProxyAdapter, } from '@twurple/eventsub-http';
import { EmbedBuilder, WebhookClient } from 'discord.js';
import { waitToExist } from './waitFor';

type EventSubStreamOnlineEventHandler = Parameters<EventSubHttpListener["onStreamOnline"]>[1];
type EventSubStreamOnlineEvent = Parameters<EventSubStreamOnlineEventHandler>[0];

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const secret = process.env.SECRET;
const hostName = process.env.HOST_NAME;
const port = process.env.PORT;
const discordWebHookUrls = process.env.DISCORD_WEBHOOK_URLS?.split(",");

if (!clientId || !clientSecret || !secret || !hostName || !port || !discordWebHookUrls || discordWebHookUrls.length === 0) throw new Error();

const usersToSubscribeTo = ["kobert", "jedster1111", "hot_cross_bun"];
const discordWebhookClients = discordWebHookUrls.map(url => new WebhookClient({ url }))

const authProvider = new AppTokenAuthProvider(clientId, clientSecret);
const apiClient = new ApiClient({ authProvider });

const adapter = new ReverseProxyAdapter({
  hostName,
  port: Number(port)
});


const listener = new EventSubHttpListener({ apiClient, adapter, secret });

listener.start();

console.log(`Started twitch-discord-bot on port ${port}!`)

listener.onSubscriptionCreateSuccess((event, subscription) => {
  console.log(`Subscription (${subscription.id}) made successfully. status - ${subscription.status}, type - ${subscription.type}`)
})

listener.onSubscriptionCreateFailure((event, error) => {
  console.log(`Subscription failed. error - ${error.message}`)
})

listener.onVerify((isSuccess, subscription) => {
  if (isSuccess) console.log(`Subscription (${subscription.id}) verified.`);
  else console.warn(`Subscription (${subscription.id}) failed to verify.`);
})

apiClient.users.getUsersByNames(usersToSubscribeTo)
  .then(users => {
    users.forEach(user => {
      if (!user) throw new Error(`Failed to find one of the specified users.`);

      console.log(`Subscribing to events from ${user.displayName} - ${user.id}`)

      listener.onStreamOnline(user, async (event) => {
        console.log(`${event.broadcasterDisplayName} is online! ${event.startDate}`)
        const stream = await waitToExist(() => event.getStream(), 7500, 5);
        SendTwitchStreamStartedDiscordMessage(event, user, stream)
      })

      listener.onStreamOffline(user, event => {
        console.log(`${event.broadcasterDisplayName} is offline!`)
      })
    })
  });

function SendTwitchStreamStartedDiscordMessage(event: EventSubStreamOnlineEvent, user: HelixUser, stream: HelixStream | null) {
  try {
    const embed = new EmbedBuilder()
      .setTitle(`${user.displayName} just went live!`)
      .setURL(`https://twitch.tv/${event.broadcasterName}`)
      .setDescription(stream?.title || null)
      .setColor(0x00FF00)
      .setThumbnail(user.profilePictureUrl);

    discordWebhookClients.forEach(client => {
      client.send({
        embeds: [embed]
      })
    })
  } catch (error) {
    console.error("Error sending Discord Webhook", error)
  }
}
