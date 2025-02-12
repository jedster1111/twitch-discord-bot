import { Client, Events, GatewayIntentBits, MessageFlags } from "discord.js";
import { envVars } from "../loadEnvVars.js";
import { handlePingCommand } from "./commands/ping.js";

const { discordBotToken } = envVars;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

console.log("Trying to login discord bot")
client.login(discordBotToken);

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	// TODO: Middleware pattern?
	if (interaction.commandName === "ping") {
		try {
			await handlePingCommand(interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
			}
		}
	} else {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}
})
