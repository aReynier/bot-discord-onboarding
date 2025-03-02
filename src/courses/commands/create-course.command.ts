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
        const guild = interaction.guild;
        if (!guild) {
            throw new Error('Guild not found');
        }

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

        const firstActionRow = new ActionRowBuilder<TextInputBuilder>()
            .addComponents(nameInput);

        modal.addComponents(firstActionRow);

        return await interaction.showModal(modal);

    } catch (error) {
        logger.error(error, 'Erreur lors de la création du modal de formation');
        await interaction.reply({
            content: '❌ Une erreur est survenue lors de la création du formulaire.',
            ephemeral: true
        });
    }
} 