import { ApiClient } from '@twurple/api';
import { AppTokenAuthProvider } from '@twurple/auth';
import { EventSubHttpListener, ReverseProxyAdapter, } from '@twurple/eventsub-http';
import { EmbedBuilder, WebhookClient } from 'discord.js';

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const secret = process.env.SECRET;
const hostName = process.env.HOST_NAME;
const port = process.env.PORT;
const discordWebHookUrl = process.env.DISCORD_WEBHOOK_URL;

if (!clientId || !clientSecret || !secret || !hostName || !port || !discordWebHookUrl) throw new Error();

const usersToSubscribeTo = ["kobert", "jedster1111"];
const webhookClient = new WebhookClient({ url: discordWebHookUrl });

const authProvider = new AppTokenAuthProvider(clientId, clientSecret);
const apiClient = new ApiClient({ authProvider });

const adapter = new ReverseProxyAdapter({
  hostName,
  port: Number(port)
});


const listener = new EventSubHttpListener({ apiClient, adapter, secret });


listener.start();

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
      if (!user) throw new Error();

      console.log(`Found user id for ${user.displayName} - ${user.id}`)

      listener.onStreamOnline(user, event => {
        console.log(`${event.broadcasterDisplayName} is online! ${event.startDate}`)
        SendTwitchStreamStartedDiscordMessage(event.broadcasterDisplayName, event.broadcasterName)
      })

      listener.onStreamOffline(user, event => {
        console.log(`${event.broadcasterDisplayName} is offline!`)
        SendTwitchStreamEndedDiscordMessage(event.broadcasterDisplayName, event.broadcasterName)
      })
    })
  });


function SendTwitchStreamStartedDiscordMessage(userDisplayName: string, channelName: string) {
  const embed = new EmbedBuilder()
    .setTitle(`${userDisplayName} is live on Twitch!`)
    .setURL(`https://twitch.tv/${channelName}`)
    .setColor(0x00FF00);

  webhookClient.send({
    embeds: [embed]
  });
}

function SendTwitchStreamEndedDiscordMessage(userDisplayName: string, channelName: string) {
  const embed = new EmbedBuilder()
    .setTitle(`${userDisplayName} has gone offline.`)
    .setURL(`https://twitch.tv/${channelName}`)
    .setColor(0xCC0000);

  webhookClient.send({
    embeds: [embed]
  });
}
