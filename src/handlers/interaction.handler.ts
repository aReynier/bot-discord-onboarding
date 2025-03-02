import { Interaction, CommandInteraction, Client } from 'discord.js';
import { logger } from '../config/logger';
import { execute as executeCreateCampus } from '../campuses/commands/create-campus.command';
import { execute as executeModifyCampus } from '../campuses/commands/modify-campus.command';
import { execute as executeDeleteCampus } from '../campuses/commands/delete-campus.command';
import { execute as executeShowCampusForm } from '../campuses/commands/show-campus-form.command';
import { execute as executeSetupIdentification } from '../identification_requests/commands/setupIdentificationButton';
import { execute as executeCreateCourse } from "../courses/commands/create-course.command";
import { execute as executeDeleteCourse } from "../courses/commands/delete-course.command";
import { CampusInteractionsHandler } from '../campuses/events/campus-interactions.handler';
import { CourseInteractionsHandler } from '../courses/events/course-interactions.handler';


export class InteractionHandler {
    private campusInteractions: CampusInteractionsHandler;
    private courseInteractions: CourseInteractionsHandler;

    constructor(client: Client) {
        this.campusInteractions = new CampusInteractionsHandler();
        this.courseInteractions = new CourseInteractionsHandler(client);
    }

    async handleInteraction(interaction: Interaction): Promise<void> {
        try {
            // Gestion des interactions modales, boutons et menus
            if (interaction.isModalSubmit() || interaction.isStringSelectMenu() || interaction.isButton()) {
                if (interaction.isModalSubmit()) {
                    if (interaction.customId === 'identification-form') {
                        const { execute } = await import('../identification_requests/events/handleIdentificationForm');
                        await execute(interaction);
                        return;
                    }
                    if (interaction.customId === 'create-course-modal-from-slash') {
                        await this.courseInteractions.handleModalSubmit(interaction);
                        return;
                    }
                    await this.campusInteractions.handleModalSubmit(interaction);
                    return;
                }
                else if (interaction.isStringSelectMenu()) {
                    if (interaction.customId.startsWith('role-select-')) {
                        const { execute } = await import('../identification_requests/events/handleRoleSelection');
                        await execute(interaction);
                        return;
                    }
                    if (interaction.customId === 'certification_select' || 
                        interaction.customId === 'stock_select' || 
                        interaction.customId === 'delete-course-select') {
                        await this.courseInteractions.handleSelectMenu(interaction);
                        return;
                    }
                    await this.campusInteractions.handleSelectMenu(interaction);
                    return;
                }
                else if (interaction.isButton()) {
                    if (interaction.customId === 'request-identification') {
                        // Gérer le bouton d'identification
                        const { execute } = await import('../identification_requests/events/handleIdentificationButton');
                        await execute(interaction);
                        return;
                    } else if (interaction.customId.startsWith('rgpd-accept-')) {
                        const { execute } = await import('../identification_requests/events/handleRGPDAcceptance');
                        await execute(interaction);
                        return;
                    } else if (interaction.customId.startsWith('rules-accept-')) {
                        const { execute } = await import('../identification_requests/events/handleRulesAcceptance');
                        await execute(interaction);
                        return;
                    } else if (interaction.customId === 'validate_stock' || 
                        interaction.customId === 'add_more_stock' || 
                        interaction.customId === 'confirm-delete-course' || 
                        interaction.customId === 'cancel-delete-course') {
                        await this.courseInteractions.handleButton(interaction);
                        return;
                    }
                    await this.campusInteractions.handleButton(interaction);
                    return;
                }
            }

            // Gestion des commandes slash
            if (interaction.isChatInputCommand()) {
                await this.handleSlashCommand(interaction);
            }
        } catch (error) {
            logger.error(error, 'Erreur lors du traitement de l\'interaction');
            
            // Vérifier si l'interaction n'a pas déjà reçu une réponse
            if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
                try {
                    await interaction.reply({
                        content: '❌ Une erreur est survenue lors du traitement de la commande.',
                        ephemeral: true
                    });
                } catch (replyError) {
                    // Si on ne peut pas répondre, on log simplement l'erreur
                    logger.error(replyError, 'Impossible d\'envoyer le message d\'erreur');
                }
            }
        }
    }

    private async handleSlashCommand(interaction: CommandInteraction): Promise<void> {
        const { commandName } = interaction;
        
        logger.debug({
            command: commandName,
            user: interaction.user.tag
        }, 'Commande slash reçue');

        try {
            switch (commandName) {
                case 'create-campus':
                    await executeCreateCampus(interaction);
                    break;
                case 'modify-campus':
                    await executeModifyCampus(interaction);
                    break;
                case 'delete-campus':
                    await executeDeleteCampus(interaction);
                    break;
                case 'campus-form':
                    await executeShowCampusForm(interaction);
                    break;
                case 'setup-identification':
                    await executeSetupIdentification(interaction);
                    break;
                case 'create-course':
                    await executeCreateCourse(interaction);
                    break;
                case 'delete-course':
                    await executeDeleteCourse(interaction);
                break;
                default:
                    if (!interaction.replied && !interaction.deferred) {
                        logger.warn(`Commande inconnue: ${commandName}`);
                        await interaction.reply({ 
                            content: 'Commande inconnue',
                            ephemeral: true 
                        });
                    }
            }
        } catch (error) {
            // On laisse l'erreur remonter au gestionnaire principal
            throw error;
        }
    }
} 