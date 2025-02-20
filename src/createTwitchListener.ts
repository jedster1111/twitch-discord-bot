import { ApiClient } from "@twurple/api";
import { AppTokenAuthProvider } from "@twurple/auth";
import {
  EventSubHttpListener,
  ReverseProxyAdapter,
} from "@twurple/eventsub-http";
import { NgrokAdapter } from "@twurple/eventsub-ngrok";
import { envVars } from "./loadEnvVars.js";

async function createTwitchListener() {
  const authProvider = new AppTokenAuthProvider(
    envVars.twitchClientId,
    envVars.twitchClientSecret,
  );
  const twitchApiClient = new ApiClient({ authProvider });

  const twitchEventSubListener =
    await createTwitchEventSubListener(twitchApiClient);
  return { twitchApiClient, twitchEventSubListener };
}

async function createTwitchEventSubListener(twitchApiClient: ApiClient) {
  const {
    environment,
    ngrokAuthToken,
    twitchEventSubSecret,
    hostName,
    twitchListenerPort,
  } = envVars;
  switch (environment) {
    case "dev": {
      if (!ngrokAuthToken) throw new Error("No ngrok auth token provided!");

      // When using ngrok we have to ensure that existing subscriptions are deleted!
      await twitchApiClient.eventSub.deleteAllSubscriptions();

      const adapter = new NgrokAdapter({
        ngrokConfig: {
          authtoken: ngrokAuthToken,
        },
      });

      return new EventSubHttpListener({
        apiClient: twitchApiClient,
        adapter,
        secret: twitchEventSubSecret,
      });
    }

    case "prod": {
      const adapter = new ReverseProxyAdapter({
        hostName,
        port: Number(twitchListenerPort),
      });

      return new EventSubHttpListener({
        apiClient: twitchApiClient,
        adapter,
        secret: twitchEventSubSecret,
      });
    }
  }
}

export const { twitchApiClient, twitchEventSubListener } =
  await createTwitchListener();
