export type EnvConfig = {
  twitchClientId: string,
  twitchClientSecret: string,
  /**
   * This should be a randomly generated string, but it should be the same between restarts.
   * This is not your twitch application's client secret!
   */
  twitchEventSubSecret: string,
  twitchListenerPort: string,
  hostName: string,
  JedServerDiscordWebhook: string,
  TheBakeryServerDiscordWebhook: string,
  KobertServerDiscordWebhook: string,
}

export const loadEnvVars = (): EnvConfig => {
  const twitchClientId = process.env.TWITCH_CLIENT_ID;
  const twitchClientSecret = process.env.TWITCH_CLIENT_SECRET;
  const twitchEventSubSecret = process.env.TWITCH_EVENT_SUB_SECRET;
  const twitchListenerPort = process.env.TWITCH_LISTENER_PORT;
  const hostName = process.env.HOST_NAME;
  const JedServerDiscordWebhook = process.env.JED_GAMEZ_SERVER_DISCORD_WEBHOOK;
  const TheBakeryServerDiscordWebhook = process.env.THE_BAKERY_SERVER_DISCORD_WEBHOOK;
  const KobertServerDiscordWebhook = process.env.KOBERT_SERVER_DISCORD_WEBHOOK;

  if (!twitchClientId || !twitchClientSecret || !twitchEventSubSecret || !hostName || !twitchListenerPort || !JedServerDiscordWebhook || !TheBakeryServerDiscordWebhook || !KobertServerDiscordWebhook) throw new Error();

  return {
    twitchClientId,
    twitchClientSecret,
    twitchEventSubSecret,
    twitchListenerPort,
    hostName,
    JedServerDiscordWebhook,
    TheBakeryServerDiscordWebhook,
    KobertServerDiscordWebhook
  }
}
