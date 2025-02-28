import { Client, GatewayIntentBits, Events, Collection, ChatInputCommandInteraction, ModalSubmitInteraction, MessageFlags } from 'discord.js';
import dotenv from 'dotenv';

import { ChannelInteractionHandler } from './channels/events/channels-interaction.handler';
import { logger } from './config/logger';
import { execute as executeAddPost } from './channels/commands/create-stock-post.command';
import { execute as listPostsCommand } from './channels/commands/list-stock-posts.command';
import { execute as updatePostCommand } from './channels/commands/modify-stock-channel.command';
import { execute as deletePostCommand } from './channels/commands/delete-stock-post.command';
import { ChannelService } from './channels/services/channels-service';
import { InteractionHandler } from './handlers/interaction.handler';
import { InteractionHandler } from './campuses/events/interaction.handler';
import { InteractionHandler as CourseInteractionHandler } from './courses/events/interaction.handler';

dotenv.config();

logger.info('🚀 Démarrage du bot...');
 
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// Vérification des variables d'environnement requises
const requiredEnvVars = {
    'BOT_TOKEN': process.env.BOT_TOKEN,
    'CLIENT_ID': process.env.CLIENT_ID,
    'GUILD_ID': process.env.GUILD_ID,
    'STOCK_ID': process.env.STOCK_ID
};

const missingEnvVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

if (missingEnvVars.length > 0) {
    logger.fatal(`❌ Variables d'environnement manquantes : ${missingEnvVars.join(', ')}`);
    logger.fatal('Veuillez vérifier votre fichier .env');
    process.exit(1);
}

// Ajouter une collection pour stocker les commandes
client.commands = new Collection();
client.commands.set('add-post', { execute: executeAddPost });
client.commands.set('list-stock-posts', { execute: listPostsCommand });
client.commands.set('update-post', { execute: updatePostCommand });
client.commands.set('delete-post', { execute: deletePostCommand });

logger.info("Commandes chargées dans le bot :", [...client.commands.keys()]);

const interactionHandler = new InteractionHandler();
let channelInteractionHandler: ChannelInteractionHandler;
const courseInteractionHandler = new CourseInteractionHandler(client);

client.once(Events.ClientReady, async (readyClient) => {
    logger.info(`✅ Bot connecté en tant que ${readyClient.user.tag}`);

    try {
        const guild = await client.guilds.fetch(process.env.GUILD_ID!);
        
        if (!guild) {
            logger.fatal("❌ Aucun serveur trouvé pour ce bot !");
            process.exit(1);
        }

        // Initialiser les gestionnaires d'interactions
        channelInteractionHandler = new ChannelInteractionHandler(client, guild);
        
        const channelService = new ChannelService(client, guild);
        const isValid = await channelService.validateStockCategory();
        
        if (!isValid) {
            logger.fatal("❌ La catégorie stock n'existe pas ou n'est pas valide !");
            process.exit(1);
        }
    } catch (error) {
        logger.fatal("❌ Erreur lors de l'initialisation du bot :", error);
        process.exit(1);
    }
});

// Gestion des interactions
client.on(Events.InteractionCreate, async (interaction) => {
    try {
        if (interaction.isStringSelectMenu()) {
            logger.info(`📥 Sélection du channel détectée : ${interaction.customId}, valeur : ${interaction.values}`);
            await channelInteractionHandler.handleSelectMenu(interaction);
            return;
        }
        
        if (interaction.isModalSubmit()) {
            await channelInteractionHandler.handleModalSubmit(interaction);
            return;
        }

        if (interaction.isChatInputCommand()) {
            logger.info(`📥 Commande reçue : ${interaction.commandName}`);
            const command = client.commands.get(interaction.commandName);
            if (!command) {
                await interaction.reply({ content: "❌ Commande inconnue", flags: MessageFlags.Ephemeral });
                return;
            }
            await command.execute(interaction);
            return;
        }

        await interactionHandler.handleInteraction(interaction);
    } catch (error) {
        logger.error(`❌ Erreur lors de l'exécution d'une interaction :`, error);

        if (
            (interaction.isChatInputCommand() || interaction.isModalSubmit()) &&
            !(interaction as ChatInputCommandInteraction | ModalSubmitInteraction).replied &&
            !(interaction as ChatInputCommandInteraction | ModalSubmitInteraction).deferred
        ) {
            await (interaction as ChatInputCommandInteraction | ModalSubmitInteraction).reply({
                content: "❌ Une erreur est survenue.",
                flags: MessageFlags.Ephemeral
            });
        }
    }
});

// Écoute des messages
client.on(Events.MessageCreate, (message) => {
    if (message.author.bot) return;
    
    logger.debug({
        author: message.author.tag,
        content: message.content,
        channel: message.channel.id
    }, 'Message reçu');
    
    if (message.content === '!ping') {
        message.reply('Pong! 🏓');
        logger.info({
            command: 'ping',
            user: message.author.tag
        }, 'Commande exécutée');
    }
});

// Gestion des erreurs globales
    await interactionHandler.handleInteraction(interaction);
});

client.on(Events.InteractionCreate, async (interaction) => {
    await courseInteractionHandler.handleInteraction(interaction);
});

client.on(Events.Error, (error) => {
    logger.error(error, 'Une erreur est survenue avec le client Discord');
});

// Handler pour les warnings Node.js
process.on('warning', (warning) => {
    logger.warn('⚠️ Warning Node.js détecté:', {
        name: warning.name,
        message: warning.message,
        stack: warning.stack
    });
});

// Connexion du bot à Discord
client.login(process.env.BOT_TOKEN)
    .then(() => {
        logger.info('✅ Token validé, connexion en cours...');
    })
    .catch((error) => {
        logger.fatal('❌ Impossible de connecter le bot', error);
        process.exit(1);
    });
