import {
    CommandInteraction,
    SlashCommandBuilder,
    GuildMember,
    ChannelType,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ActionRowBuilder
} from 'discord.js';
import { logger } from '../../config/logger';

const AUTHORIZED_ROLES = ['Administrateur', 'Directeur', 'CDP'];

async function checkUserPermissions(interaction: CommandInteraction): Promise<boolean> {
    const member = interaction.member as GuildMember;
    
    if (!member) {
        logger.error('Membre non trouvé');
        return false;
    }

    const hasRequiredRole = member.roles.cache.some(role => 
        AUTHORIZED_ROLES.includes(role.name)
    );

    if (!hasRequiredRole) {
        await interaction.reply({
            content: '❌ Vous devez être Administrateur, Directeur ou CDP pour supprimer une formation.',
            ephemeral: true
        });
        
        logger.warn({
            userId: member.id,
            userRoles: member.roles.cache.map(r => r.name),
            action: 'delete_course_unauthorized'
        }, 'Tentative de suppression de formation non autorisée');
        
        return false;
    }

    return true;
}

export const data = new SlashCommandBuilder()
    .setName('delete-course')
    .setDescription('Supprimer une formation existante');

export async function execute(interaction: CommandInteraction) {
    try {
        if (!await checkUserPermissions(interaction)) {
            return;
        }

        const guild = interaction.guild;
        if (!guild) {
            throw new Error('Guild not found');
        }

        const TEMPLATE_CATEGORY_ID = "1344811915301490748";

        const courses = guild.channels.cache.filter(channel => 
            channel.type === ChannelType.GuildForum && 
            channel.parentId === TEMPLATE_CATEGORY_ID
        );

        if (courses.size === 0) {
            await interaction.reply({
                content: '❌ Aucune formation à supprimer.',
                ephemeral: true
            });
            return;
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('delete-course-select')
            .setPlaceholder('Sélectionner une formation à supprimer')
            .addOptions(
                courses.map(course => 
                    new StringSelectMenuOptionBuilder()
                        .setLabel(course.name)
                        .setValue(course.id)
                        .setDescription(`Supprimer la formation: ${course.name}`)
                )
            );

        const row = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(selectMenu);

        await interaction.reply({
            content: '⚠️ Sélectionnez la formation à supprimer :',
            components: [row],
            ephemeral: true
        });

        logger.info({
            userId: interaction.user.id,
            categoryId: TEMPLATE_CATEGORY_ID,
            action: 'delete_course_menu_shown'
        }, 'Affichage du menu de suppression de formation');

    } catch (error) {
        logger.error(error, 'Erreur lors de la suppression de la formation');
        await interaction.reply({
            content: '❌ Une erreur est survenue lors de la suppression.',
            ephemeral: true
        });
    }
}