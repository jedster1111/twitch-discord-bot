export type EnvConfig = {
  clientId: string,
  clientSecret: string,
  secret: string,
  hostName: string,
  port: string,
  JedServerDiscordWebhook: string,
  TheBakeryServerDiscordWebhook: string,
  KobertServerDiscordWebhook: string,
}

export const loadEnvVars = (): EnvConfig => {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const secret = process.env.SECRET;
  const hostName = process.env.HOST_NAME;
  const port = process.env.PORT;
  const JedServerDiscordWebhook = process.env.JED_GAMEZ_SERVER_DISCORD_WEBHOOK;
  const TheBakeryServerDiscordWebhook = process.env.THE_BAKERY_SERVER_DISCORD_WEBHOOK;
  const KobertServerDiscordWebhook = process.env.KOBERT_SERVER_DISCORD_WEBHOOK;

  if (!clientId || !clientSecret || !secret || !hostName || !port || !JedServerDiscordWebhook || !TheBakeryServerDiscordWebhook || !KobertServerDiscordWebhook) throw new Error();

  return {
    clientId,
    clientSecret,
    secret,
    hostName,
    port,
    JedServerDiscordWebhook,
    TheBakeryServerDiscordWebhook,
    KobertServerDiscordWebhook
  }
}
