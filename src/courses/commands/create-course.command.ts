import {
    CommandInteraction,
    ModalBuilder,
    SlashCommandBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} from 'discord.js';
import { logger } from '../../config/logger';

export const data = new SlashCommandBuilder()
    .setName('create-course')
    .setDescription('Créer une nouvelle formation');

export async function execute(interaction: CommandInteraction) {    
    try {        
        const modal = new ModalBuilder()
            .setCustomId('create-course-modal-from-slash')
            .setTitle('Créer une nouvelle formation');

        const nameInput = new TextInputBuilder()
            .setCustomId('courseName')
            .setLabel('Nom de la formation')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: Développeur web')
            .setRequired(true)
            .setMinLength(3)
            .setMaxLength(50);

            const isCertifiedInput = new TextInputBuilder()
            .setCustomId('isCertified')
            .setLabel('Formation certifiante ? (true/false)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Écrivez true ou false')
            .setRequired(true)
            .setMinLength(4)
            .setMaxLength(5);

        const firstActionRow = new ActionRowBuilder<TextInputBuilder>()
            .addComponents(nameInput);
        const secondActionRow = new ActionRowBuilder<TextInputBuilder>()
            .addComponents(isCertifiedInput);

        modal.addComponents(firstActionRow, secondActionRow);

        return await interaction.showModal(modal);

    } catch (error) {
        logger.error(error, 'Erreur lors de la création du modal de formation');
        await interaction.reply({
            content: '❌ Une erreur est survenue lors de la création du formulaire.',
            ephemeral: true
        });
    }
} 