import { 
    SlashCommandBuilder, 
    CommandInteraction,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder
} from 'discord.js';
import { logger } from '../../config/logger';

export const data = new SlashCommandBuilder()
    .setName('course-form')
    .setDescription('Afficher le formulaire de gestion des formations');

    export async function execute(interaction: CommandInteraction) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('📚 Gestion des formations')
                .setDescription('Utilisez ce formulaire pour gérer les formations de Simplon HdF.')
                .addFields(
                    { name: 'Instructions', value: '1. Utilisez les boutons ci-dessous pour gérer les formations.\n2. Les modifications sont immédiates et irréversibles.\n3. La suppression d\'une formation supprimera également tous les rôles associés.' }
                )
                .setColor('#FF0000')
                .setFooter({ text: 'Bot de gestion des formations • v1.0' });
    
            const createButton = new ButtonBuilder()
                .setCustomId('show-create-course')
                .setLabel('Créer une formation')
                .setStyle(ButtonStyle.Success)
                .setEmoji('➕');

            const deleteButton = new ButtonBuilder()
                .setCustomId('show-delete-course')
                .setLabel('Supprimer une formation')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🗑️');
        
            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(createButton, deleteButton);
    
            await interaction.reply({
                embeds: [embed],
                components: [row]
            });
    
            logger.info({
                user: interaction.user.tag
            }, 'Formulaire de gestion des formations affiché');
        } catch (error) {
            logger.error(error, 'Erreur lors de l\'affichage du formulaire de gestion des formations');
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de l\'affichage du formulaire.',
                ephemeral: true
            });
        }
    } 