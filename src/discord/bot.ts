import { CacheType, ChatInputCommandInteraction, Client, Events, GatewayIntentBits, MessageFlags } from "discord.js";
import { envVars } from "../loadEnvVars.js";
import { Command } from "./commands/types.js";
import { commandsMap } from "./commands/index.js";

const { discordBotToken } = envVars;

const DEFAULT_COOLDOWN = 3_000;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

console.log("Trying to login discord bot")
client.login(discordBotToken);

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = commandsMap[interaction.commandName];
	if (command) {
		await executeCommand(command)(interaction);
	} else {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}
})

function executeCommand(command: Command) {
	return async (interaction: ChatInputCommandInteraction<CacheType>) => {
		try {
			if (isCommandOnCooldown(command, interaction.user.id)) {
				handleRateLimitHit(interaction);
				return;
			}

			command.usageStore.addUsageByUser(interaction.user.id, Date.now(), command.config?.cooldown);

			await command.handler(interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
			}
		}
	}
}

const isCommandOnCooldown = (command: Command, userId: string): boolean => {
	const lastUsageTimestamp = command.usageStore.getLastUsageByUser(userId);
	const cooldown = command.config?.cooldown ?? DEFAULT_COOLDOWN;
	return Boolean(lastUsageTimestamp && (Date.now() < (lastUsageTimestamp + cooldown)))
}

async function handleRateLimitHit(interaction: ChatInputCommandInteraction<CacheType>) {
	await interaction.reply({ content: "Woah, woah there! You'll have to wait a bit before you can use that command again!", flags: MessageFlags.Ephemeral });
}
