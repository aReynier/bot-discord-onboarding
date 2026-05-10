import { 
    SlashCommandBuilder, 
    CommandInteraction,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
} from 'discord.js';
import { logger } from '../../config/logger';

export const data = new SlashCommandBuilder()
    .setName('create-campus')
    .setDescription('Create a new campus');

export async function execute(interaction: CommandInteraction) {
    try {
        // Création du modal
        const modal = new ModalBuilder()
            .setCustomId('create-campus-modal-from-slash')
            .setTitle('Créer un nouveau campus');

        // Champ pour le nom du campus
        const nameInput = new TextInputBuilder()
            .setCustomId('campusName')
            .setLabel('Nom du campus')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: Lille')
            .setRequired(true)
            .setMinLength(3)
            .setMaxLength(50);

        // Création de la rangée pour le modal
        const firstActionRow = new ActionRowBuilder<TextInputBuilder>()
            .addComponents(nameInput);

        // Ajout de la rangée au modal
        modal.addComponents(firstActionRow);

        // Affichage du modal
        await interaction.showModal(modal);

        logger.debug({
            user: interaction.user.tag,
            command: 'créer-campus'
        }, 'Modal de création de campus affiché');

    } catch (error) {
        logger.error(error, 'Erreur lors de la création du modal de campus');
        await interaction.reply({
            content: '❌ Une erreur est survenue lors de la création du formulaire.',
            ephemeral: true
        });
    }
} 