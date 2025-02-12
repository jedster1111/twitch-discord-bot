export type EnvConfig = {
  environment: "dev" | "prod",
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

  discordBotToken: string,

  /**
   * This is only used to enable running the app locally for development purposes.
   * Only used when the `ENVIRONMENT` env variable is set to `dev`.
   */
  ngrokAuthToken: string | undefined
}

export const loadEnvVars = (): EnvConfig => {
  const environment = process.env.ENVIRONMENT || "prod";
  const twitchClientId = process.env.TWITCH_CLIENT_ID;
  const twitchClientSecret = process.env.TWITCH_CLIENT_SECRET;
  const twitchEventSubSecret = process.env.TWITCH_EVENT_SUB_SECRET;
  const twitchListenerPort = process.env.TWITCH_LISTENER_PORT;
  const hostName = process.env.HOST_NAME;
  const JedServerDiscordWebhook = process.env.JED_GAMEZ_SERVER_DISCORD_WEBHOOK;
  const TheBakeryServerDiscordWebhook = process.env.THE_BAKERY_SERVER_DISCORD_WEBHOOK;
  const KobertServerDiscordWebhook = process.env.KOBERT_SERVER_DISCORD_WEBHOOK;

  const discordBotToken = process.env.DISCORD_BOT_TOKEN;

  const ngrokAuthToken = process.env.NGROK_AUTH_TOKEN;

  if (!twitchClientId || !twitchClientSecret || !twitchEventSubSecret || !hostName || !twitchListenerPort || !JedServerDiscordWebhook || !TheBakeryServerDiscordWebhook || !KobertServerDiscordWebhook || !discordBotToken) throw new Error();
  if (!(environment === "dev" || environment === "prod")) throw new Error("ENVIRONMENT variable was not either 'dev' or 'prod'!");

  return {
    environment,
    twitchClientId,
    twitchClientSecret,
    twitchEventSubSecret,
    twitchListenerPort,
    hostName,
    JedServerDiscordWebhook,
    TheBakeryServerDiscordWebhook,
    KobertServerDiscordWebhook,
    discordBotToken,
    ngrokAuthToken
  }
}
