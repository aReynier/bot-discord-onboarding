import { ModalSubmitInteraction } from 'discord.js';
import { logger } from '../../config/logger';
import { CourseService } from '../services/course.service';

export class CourseInteractionsHandler {
    private courseService: CourseService;

    constructor() {
        this.courseService = new CourseService();
    }

    async handleModalSubmit(interaction: ModalSubmitInteraction) {
        if (interaction.customId === 'create-course-modal') {
            const courseName = interaction.fields.getTextInputValue('courseName');
            const isCertified = interaction.fields.getTextInputValue('isCertified') === 'true';
            
            try {
                await this.courseService.createCourse(courseName, isCertified);
                
                await interaction.reply({
                    content: `✅ La formation "${courseName}" ${isCertified ? '(certifiante)' : '(non certifiante)'} a été créée avec succès !`,
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
}