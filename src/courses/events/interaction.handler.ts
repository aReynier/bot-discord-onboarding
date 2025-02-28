import { Client, Interaction } from "discord.js";
import { CommandInteraction } from "discord.js";
import { logger } from "../../config/logger";
import { execute as executeCreateCourse } from "../commands/create-course.command";
import { CourseInteractionsHandler } from "./course-interactions.handler";

export class InteractionHandler {
    private courseInteractions: CourseInteractionsHandler;

    constructor(client: Client) {
        this.courseInteractions = new CourseInteractionsHandler(client);
    }

    async handleInteraction(interaction: Interaction): Promise<void> {
        try {
            if (interaction.isModalSubmit() || interaction.isStringSelectMenu() || interaction.isButton()) {
                if (interaction.isModalSubmit()) {
                    await this.courseInteractions.handleModalSubmit(interaction);
                    return;
                }
                // else if (interaction.isStringSelectMenu()) {
                //     await this.courseInteractions.handleSelectMenu(interaction);
                //     return;
                // }
                // else if (interaction.isButton()) {
                //     await this.courseInteractions.handleButton(interaction);
                //     return;
                // }
            }

            if (interaction.isChatInputCommand()) {
                await this.handleSlashCommand(interaction);
            }
        } catch (error) {
            logger.error(error, 'Erreur lors du traitement de l\'interaction');
            try {
                const reply = {
                    content: '❌ Une erreur est survenue lors du traitement de la commande.',
                    ephemeral: true
                };
                
                if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
                    await interaction.reply(reply);
                }
            } catch (e) {
                logger.error(e, 'Erreur lors de la réponse d\'erreur');
            }
        }
        
    }

    private async handleSlashCommand(interaction: CommandInteraction): Promise<void> {
        const { commandName } = interaction;

        logger.debug({
            command: commandName,
            user: interaction.user.tag
        }, 'Commande slash reçue');

        switch (commandName) {
            case 'create-course':
                await executeCreateCourse(interaction);
                break;
            default:
                logger.warn(`Commande inconnue: ${commandName}`);
                await interaction.reply({
                    content: '❌ Une erreur est survenue lors du traitement de la commande.',
                    ephemeral: true
                });
        }
    }
}