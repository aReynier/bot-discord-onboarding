import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChannelType, Client, ModalSubmitInteraction, StringSelectMenuBuilder, StringSelectMenuInteraction, StringSelectMenuOptionBuilder } from 'discord.js';
import { logger } from '../../config/logger';
import { CourseService } from '../services/course.service';

export class CourseInteractionsHandler {
    private courseService: CourseService;
    private courseData: Map<string, { name: string, isCertified?: boolean, selectedStocks?: string[]; }> = new Map();

    constructor(client: Client) {
        this.courseService = new CourseService(client);
    }

    async handleModalSubmit(interaction: ModalSubmitInteraction) {
        if (interaction.customId === 'create-course-modal-from-slash') {            
            try {
                const courseName = interaction.fields.getTextInputValue('courseName');

                this.courseData.set(interaction.user.id, { 
                    name: courseName,
                    selectedStocks: []
                });

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

    async handleCertificationSelect(interaction: StringSelectMenuInteraction) {
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

    async handleValidateCertification(interaction: ButtonInteraction) {
        try {
            const userData = this.courseData.get(interaction.user.id);
            if (!userData) {
                throw new Error('Données de formation non trouvées');
            }

            await this.courseService.createCourse(
                userData.name,
                userData.isCertified ?? false,
            );

            const stockCategoryId = "1344320786722455552";
            const stockChannels = interaction.guild?.channels.cache.filter(channel => 
                channel.parentId === stockCategoryId
            );

            if (!stockChannels || stockChannels.size === 0) {
                await interaction.update({
                    content: '❌ Aucun stock disponible.',
                    components: []
                });
                return;
            }

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('stock_select')
                .setPlaceholder('Sélectionner un titre')
                .addOptions(
                    stockChannels.map(channel => 
                        new StringSelectMenuOptionBuilder()
                            .setLabel(channel.name)
                            .setValue(channel.id)
                            .setDescription(`Stock: ${channel.name}`)
                    )
                );

             const validateButton = new ButtonBuilder()
                .setCustomId('validate_stock')
                .setLabel('Valider')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(false);

            const row = new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(selectMenu);

            const buttonRow = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(validateButton);

            await interaction.update({
                content: `✅ Formation "${userData.name}" créée avec succès !\nVeuillez maintenant sélectionner un channel du stock :`,
                components: [row, buttonRow]
            });

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

    private createStockSelect(disabled: boolean = false) {

    } 

    async handleStockSelect(interaction: StringSelectMenuInteraction) {
        if (interaction.customId === 'stock_select') {
            try {
                const selectedStockId = interaction.values[0];
                const stockCategoryId = "1344320786722455552";

            logger.debug({
                selectedStockId,
                stockCategoryId,
                availableChannels: interaction.guild?.channels.cache
                    .filter(channel => channel.parentId === stockCategoryId)
                    .map(c => ({ id: c.id, name: c.name }))
            }, 'Debugging stock selection');

            const selectedStock = interaction.guild?.channels.cache.get(selectedStockId);

            if (!selectedStock) {
                throw new Error('Stock not found');
            }

                const validateButton = new ButtonBuilder()
                    .setCustomId('validate_stock')
                    .setLabel('Valider')
                    .setStyle(ButtonStyle.Primary);

                const addMoreButton = new ButtonBuilder()
                    .setCustomId('add_more_stock')
                    .setLabel('Ajouter un autre post')
                    .setStyle(ButtonStyle.Secondary);

                const buttonRow = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(addMoreButton, validateButton);
        
                    const userData = this.courseData.get(interaction.user.id);
                if (userData) {
                    this.courseData.set(interaction.user.id, {
                        ...userData,
                        selectedStocks: [...(userData.selectedStocks || []), selectedStock.name]
                    });
                }
                    
                await interaction.update({
                    content: `✅ Channel du stock sélectionné : ${selectedStock.name}`,
                    components: [buttonRow]
                });
    
            } catch (error) {
                logger.error(error, 'Erreur lors de la sélection du stock');
                await interaction.reply({
                    content: '❌ Une erreur est survenue.',
                    ephemeral: true
                });
            }
        }
    }

    async handleAddMoreStock(interaction: ButtonInteraction) {
        try {
            const stockCategoryId = "1344320786722455552";
            const stockChannels = interaction.guild?.channels.cache.filter(channel => 
                channel.parentId === stockCategoryId
            );
    
            if (!stockChannels || stockChannels.size === 0) {
                throw new Error('No stock channels available');
            }
    
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('stock_select')
                .setPlaceholder('Sélectionner un stock')
                .addOptions(
                    stockChannels.map(channel => 
                        new StringSelectMenuOptionBuilder()
                            .setLabel(channel.name)
                            .setValue(channel.id)
                            .setDescription(`Stock: ${channel.name}`)
                    )
                );

            const validateButton = new ButtonBuilder()
                .setCustomId('validate_stock')
                .setLabel('Valider')
                .setStyle(ButtonStyle.Primary);
    
            const row = new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(selectMenu);

            const buttonRow = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(validateButton);
    
            await interaction.update({
                content: `Posts déjà sélectionnés : ${this.courseData.get(interaction.user.id)?.selectedStocks?.join(', ')}\nSélectionnez un autre post :`,
                components: [row, buttonRow]
            });
    
        } catch (error) {
            logger.error(error, 'Erreur lors de l\'ajout d\'un nouveau stock');
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                ephemeral: true
            });
        }
    }

    async handleValidateStock(interaction: ButtonInteraction) {
        try {
            const userData = this.courseData.get(interaction.user.id);
            if (!userData || !userData.selectedStocks || userData.selectedStocks.length === 0) {
                throw new Error('Aucun stock sélectionné');
            }

            logger.debug({
                selectedStocks: userData.selectedStocks
            }, 'Stocks sélectionnés pour création');    
    
            const forumCategoryId = "1344811915301490748";
            const forumChannel = interaction.guild?.channels.cache.filter(
                channel => 
                    channel.parentId === forumCategoryId && 
                    channel.type === ChannelType.GuildForum
            )
            .sort((a:any, b:any) => b.createdTimestamp - a.createdTimestamp)
            .first();
            

            logger.debug({
                forumCategoryId,
                forumChannelFound: !!forumChannel,
                forumChannelType: forumChannel?.type,
                availableForumChannels: interaction.guild?.channels.cache
                    .filter(channel => channel.parentId === forumCategoryId)
                    .map(c => ({ id: c.id, name: c.name, type: c.type }))
            }, 'Forum channel debug');
    
            const forumId = forumChannel?.id;

            logger.debug({
                forumId,
                forumName: forumChannel?.name
            }, 'Forum ID récupéré');

            if (!forumChannel || forumChannel.type !== ChannelType.GuildForum) {
                throw new Error('Forum channel not found');
            }
    
            for (const stockName of userData.selectedStocks) {
                await forumChannel.threads.create({
                    name: stockName,
                    message: {
                        content: `Post créé à partir du template : ${stockName}`
                    }
                });
            }
    
            await interaction.update({
                content: `✅ ${userData.selectedStocks.length} posts créé avec succès dans le forum !`,
                components: []
            });
        } catch (error) {
            logger.error(error, 'Erreur lors de la validation du stock');
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                ephemeral: true
            });
        }
    }

    async handleButton(interaction: ButtonInteraction) {
        switch (interaction.customId) {
            case 'validate_certification':
                await this.handleValidateCertification(interaction);
                break;
            case 'validate_stock':
                await this.handleValidateStock(interaction);
                break;
            case 'add_more_stock':
                await this.handleAddMoreStock(interaction);
            break;
            default:
                logger.warn(`Bouton inconnu: ${interaction.customId}`);
        }
    }

    async handleSelectMenu(interaction: StringSelectMenuInteraction) {
        try {
            switch (interaction.customId) {
                case 'certification_select':
                    await this.handleCertificationSelect(interaction);
                    break;
                case 'stock_select':
                    await this.handleStockSelect(interaction);
                    break;
                default:
                    logger.warn(`Select menu inconnu: ${interaction.customId}`);
            }
        } catch (error) {
            logger.error(error, 'Erreur lors du traitement du select menu');
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Une erreur est survenue.',
                    ephemeral: true
                });
            }
        }
    }
}