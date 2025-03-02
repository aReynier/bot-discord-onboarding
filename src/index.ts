import { Client, Events, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { logger } from './config/logger';
import { InteractionHandler } from './handlers/interaction.handler';

dotenv.config();

logger.info('🚀 Démarrage du bot...');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
    ]
});

const interactionHandler = new InteractionHandler(client);

client.once(Events.ClientReady, (readyClient) => {
    logger.info(`✅ Bot connecté en tant que ${readyClient.user.tag}`);
});

// Gestion des interactions
client.on(Events.InteractionCreate, async (interaction) => {
    await interactionHandler.handleInteraction(interaction);
});

client.on(Events.Error, (error) => {
    logger.error(error, 'Une erreur est survenue avec le client Discord');
});

client.login(process.env.BOT_TOKEN)
    .catch((error) => {
        logger.fatal(error, 'Impossible de connecter le bot');
        process.exit(1);
    });