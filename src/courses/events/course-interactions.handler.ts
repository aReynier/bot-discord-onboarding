import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Client, ModalSubmitInteraction, StringSelectMenuBuilder, StringSelectMenuInteraction, StringSelectMenuOptionBuilder } from 'discord.js';
import { logger } from '../../config/logger';
import { CourseService } from '../services/course.service';

export class CourseInteractionsHandler {
    private courseService: CourseService;
    private courseData: Map<string, { name: string, isCertified?: boolean }> = new Map();

    constructor(client: Client) {
        this.courseService = new CourseService(client);
    }

    private createCertificationSelect(disabled: boolean = false) {
        return new StringSelectMenuBuilder()
            .setCustomId('certification_select')
            .setPlaceholder('Formation certifiante ?')
            .addOptions([
                new StringSelectMenuOptionBuilder()
                    .setLabel('Certifiante')
                    .setValue('true')
                    .setDescription('Formation avec certification'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Non certifiante')
                    .setValue('false')
                    .setDescription('Formation sans certification')
            ])
            .setDisabled(disabled);
    }        

    async handleModalSubmit(interaction: ModalSubmitInteraction) {
        if (interaction.customId === 'create-course-modal-from-slash') {            
            try {
                const courseName = interaction.fields.getTextInputValue('courseName');

                this.courseData.set(interaction.user.id, { name: courseName });

                const validateButton = new ButtonBuilder()
                    .setCustomId('validate_certification')
                    .setLabel('Valider')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true);

                const row = new ActionRowBuilder<StringSelectMenuBuilder>()
                    .addComponents(this.createCertificationSelect());

                const buttonRow = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(validateButton);
                
                await interaction.reply({
                    content: `Configuration de la formation "${courseName}"\nLa formation est-elle certifiante ?`,
                    components: [row, buttonRow],
                    ephemeral: true
                });
                
                logger.info({
                    action: 'course_create',
                    courseName,
                    userId: interaction.user.id
                }, 'Nouvelle formation créée');
            } catch (error) {
                logger.error(error, 'Erreur lors de la création de la formation');
                await interaction.reply({
                    content: '❌ Une erreur est survenue lors de la création de la formation.',
                    ephemeral: true
                });
            }
        }
    }

    async handleSelectMenu(interaction: StringSelectMenuInteraction) {
        if (interaction.customId === 'certification_select') {
            try {
                const isCertified = interaction.values[0] === 'true';
                const userData = this.courseData.get(interaction.user.id);
                if (userData) {
                    this.courseData.set(interaction.user.id, {
                        ...userData,
                        isCertified
                    });
                }

                const validateButton = new ButtonBuilder()
                    .setCustomId('validate_certification')
                    .setLabel('Valider')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(false);

                const row = new ActionRowBuilder<StringSelectMenuBuilder>()
                    .addComponents(this.createCertificationSelect(true));

                const buttonRow = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(validateButton);

                await interaction.update({
                    content: `Configuration de la formation\nType sélectionné : ${isCertified ? 'Certifiante' : 'Non certifiante'}`,
                    components: [row, buttonRow]
                });
            } catch (error) {
                logger.error(error, 'Erreur lors de la sélection du type de formation');
                await interaction.reply({
                    content: '❌ Une erreur est survenue.',
                    ephemeral: true
                });
            }
        }
    }

    async handleButton(interaction: ButtonInteraction) {
        if (interaction.customId === 'validate_certification') {
            try {
                const userData = this.courseData.get(interaction.user.id);
                if (!userData) {
                    throw new Error('Données de formation non trouvées');
                }

                await this.courseService.createCourse(
                    userData.name,
                    userData.isCertified ?? false,
                );

                await interaction.update({
                    content: `✅ Formation "${userData.name}" créée avec succès !`,
                    components: []
                });

                this.courseData.delete(interaction.user.id);

                logger.info({
                    action: 'course_create_complete',
                    courseName: userData.name,
                    isCertified: userData.isCertified,
                    userId: interaction.user.id
                }, 'Formation créée avec succès');

            } catch (error) {
                logger.error(error, 'Erreur lors de la validation de la formation');
                await interaction.reply({
                    content: '❌ Une erreur est survenue.',
                    ephemeral: true
                });
            }
        }
    }
}