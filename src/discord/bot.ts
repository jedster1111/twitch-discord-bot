import { Client, Events, GatewayIntentBits } from "discord.js";
import { loadEnvVars } from "../loadEnvVars.js";

const {discordBotToken} = loadEnvVars();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.login(discordBotToken);
