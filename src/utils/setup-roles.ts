import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { logger } from '../config/logger';

dotenv.config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const requiredRoles = [
    {
        name: 'Admin',
        color: '#FF0000',
        reason: 'Rôle administrateur pour la gestion des campus'
    },
    {
        name: 'Directeur',
        color: '#0000FF',
        reason: 'Rôle directeur pour la gestion des campus'
    },
    {
        name: 'Chargé de projet',
        color: '#00FF00',
        reason: 'Rôle chargé de projet pour la gestion des campus'
    }
];

async function setupRoles() {
    try {
        const guild = client.guilds.cache.get(process.env.GUILD_ID!);
        if (!guild) {
            throw new Error('Guild not found');
        }

        logger.info('Début de la configuration des rôles...');

        for (const roleData of requiredRoles) {
            const existingRole = guild.roles.cache.find(role => role.name === roleData.name);
            
            if (!existingRole) {
                await guild.roles.create({
                    name: roleData.name,
                    color: roleData.color as any,
                    reason: roleData.reason
                });
                logger.info(`✅ Rôle "${roleData.name}" créé avec succès`);
            } else {
                logger.info(`Le rôle "${roleData.name}" existe déjà`);
            }
        }

        logger.info('✅ Configuration des rôles terminée');
        process.exit(0);
    } catch (error) {
        logger.error(error, 'Erreur lors de la configuration des rôles');
        process.exit(1);
    }
}

client.once('ready', () => {
    setupRoles();
});

client.login(process.env.BOT_TOKEN); 