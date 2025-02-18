import { HelixStream, HelixUser } from '@twurple/api';
import { waitToExist } from './waitFor.js';
import { EventSubStreamOnlineEvent } from './types.js';
import { envVars } from './loadEnvVars.js';
import { generateStaticDataAtStartup } from './generateStaticDataAtStartup.js';
import { TWITCH_ICON_URL } from './constants.js';
import { buildEmbed, buildMessageData } from './discordEmbed.js';
import { twitchApiClient, twitchEventSubListener } from './createTwitchListener.js'

twitchEventSubListener.start();
console.log(`Started twitch listener on port ${envVars.twitchListenerPort}!`)

import "./discord/bot.js";
import { loadStore, writeStore } from './jsonStore.js';

await writeStore();
await loadStore();

const staticData = generateStaticDataAtStartup();

twitchEventSubListener.onSubscriptionCreateSuccess((event, subscription) => {
  console.log(`Subscription (${subscription.id}) made successfully. status - ${subscription.status}, type - ${subscription.type}`)
})

twitchEventSubListener.onSubscriptionCreateFailure((event, error) => {
  console.log(`Subscription failed. error - ${error.message}`)
})

twitchEventSubListener.onVerify((isSuccess, subscription) => {
  if (isSuccess) console.log(`Subscription (${subscription.id}) verified.`);
  else console.warn(`Subscription (${subscription.id}) failed to verify.`);
})

twitchApiClient.users.getUsersByNames(staticData.uniqueUsersToSubscribeTo)
  .then(users => {
    users.forEach(user => {
      if (!user) {
        console.warn(`Failed to find one of the specified users.`);
        return;
      }

      console.log(`Subscribing to events from ${user.displayName} - ${user.id}`)

      twitchEventSubListener.onStreamOnline(user, async (event) => {
        console.log(`${event.broadcasterDisplayName} is online! ${event.startDate}`)
        const stream = await waitToExist(() => event.getStream(), 7500, 5);
        SendTwitchStreamStartedDiscordMessage(event, user, stream)
      })

      twitchEventSubListener.onStreamOffline(user, event => {
        console.log(`${event.broadcasterDisplayName} is offline!`)
      })
    })
  });

async function SendTwitchStreamStartedDiscordMessage(event: EventSubStreamOnlineEvent, user: HelixUser, stream: HelixStream | null) {
  try {
    const webhooksForUser = staticData.twitchNameToDiscordWebhooksMap[user.name];
    if (!webhooksForUser) throw new Error("Failed to find discord channels to send message to for twitch channel");

    for (const webhook of webhooksForUser) {
      const discordServerInfo = staticData.saturatedDiscordServerInfoMap[webhook];
      if (!discordServerInfo) throw new Error("Failed to find discord server info for specified webhook")

      const webhookClient = discordServerInfo.discordWebhookClient;
      const messageConfig = discordServerInfo.discordMessageConfig || {};

      const messageData = buildMessageData(user, stream);
      const embed = buildEmbed(messageConfig, messageData);

      await webhookClient.send({
        username: messageConfig?.botName,
        avatarURL: messageConfig?.avatarPictureUrl || TWITCH_ICON_URL,
        content: messageConfig?.shouldTagEveryone ? "@everyone" : undefined,
        embeds: [embed]
      })
    }
  } catch (error) {
    console.error("Error sending message to Discord Webhook", error)
  }
}
