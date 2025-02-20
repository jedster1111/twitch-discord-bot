import { twitchEventSubListener } from "./createTwitchListener.js";
import { envVars } from "./loadEnvVars.js";
import "./discord/bot.js";

twitchEventSubListener.onSubscriptionCreateSuccess((event, subscription) => {
  console.log(
    `Subscription (${subscription.id}) made successfully. status - ${subscription.status}, type - ${subscription.type}`,
  );
});

twitchEventSubListener.onSubscriptionCreateFailure((event, error) => {
  console.log(`Subscription failed. error - ${error.message}`);
});

twitchEventSubListener.onVerify((isSuccess, subscription) => {
  if (isSuccess) console.log(`Subscription (${subscription.id}) verified.`);
  else console.warn(`Subscription (${subscription.id}) failed to verify.`);
});

twitchEventSubListener.start();
console.log(`Started twitch listener on port ${envVars.twitchListenerPort}!`);
