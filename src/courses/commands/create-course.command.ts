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

// const isCertifiedInput = new TextInputBuilder()
// .setCustomId('isCertified')
// .setLabel('Formation certifiante ? (true/false)')
// .setStyle(TextInputStyle.Short)
// .setPlaceholder('Écrivez true ou false')
// .setRequired(true)
// .setMinLength(4)
// .setMaxLength(5);

//--------------------------------

// export const data = new SlashCommandBuilder()
//     .setName('create-course')
//     .setDescription('Créer une nouvelle formation');

// export async function execute(interaction: ChatInputCommandInteraction) {    
//     try {
//         if (!interaction.isChatInputCommand()) return;

//         const guild = interaction.guild;
//         if (!guild) {
//             throw new Error('Guild not found');
//         }

//         // const modal = new ModalBuilder()
//         //     .setCustomId('create-course-modal-from-slash')
//         //     .setTitle('Créer une nouvelle formation');

//         const nameInput = new TextInputBuilder()
//             .setCustomId('courseName')
//             .setLabel('Nom de la formation')
//             .setStyle(TextInputStyle.Short)
//             .setPlaceholder('Ex: Développeur web')
//             .setRequired(true)
//             .setMinLength(3)
//             .setMaxLength(50);

//         const isCertifiedInput = new TextInputBuilder()
//             .setCustomId('isCertified')
//             .setLabel('Formation certifiante ? (true/false)')
//             .setStyle(TextInputStyle.Short)
//             .setPlaceholder('Écrivez true ou false')
//             .setRequired(true)
//             .setMinLength(4)
//             .setMaxLength(5);

//         const postInput = new TextInputBuilder()
//             .setCustomId('postTemplate')
//             .setLabel('Template du post')
//             .setStyle(TextInputStyle.Paragraph)
//             .setPlaceholder('Sélectionnez un post')
//             .setRequired(true);

//         const firstActionRow = new ActionRowBuilder<TextInputBuilder>()
//             .addComponents(nameInput);
//         const secondActionRow = new ActionRowBuilder<TextInputBuilder>()
//             .addComponents(isCertifiedInput);
//         const thirdActionRow = new ActionRowBuilder<TextInputBuilder>()
//             .addComponents(postInput);
        
//         // modal.addComponents(firstActionRow, secondActionRow);

//         const templateCategoryId = "1344320786722455552";
//         const templateCategory = await guild.channels.fetch(templateCategoryId);
        
//         if (!templateCategory) {
//             throw new Error('Template category not found');
//         }

//         const templateChannels = guild.channels.cache.filter(channel => 
//             channel.parentId === templateCategoryId && 
//             channel.type === ChannelType.GuildForum
//         );

//         if (templateChannels.size === 0) {
//             await interaction.reply({
//                 content: '❌ Aucun template disponible dans la catégorie.',
//                 ephemeral: true
//             });
//             return;
//         }

//         const options = templateChannels.map(channel => 
//             new StringSelectMenuOptionBuilder()
//                 .setLabel(channel.name)
//                 .setValue(channel.id)
//                 .setDescription(`Template: ${channel.name}`)
//         );

//         const selectMenu = new StringSelectMenuBuilder()
//             .setCustomId('template_select')
//             .setPlaceholder('Sélectionnez un template')
//             .addOptions(options);

//         const confirmButton = new ButtonBuilder()
//             .setCustomId('confirm_course_creation')
//             .setLabel('Créer la formation')
//             .setStyle(ButtonStyle.Primary)
//             .setDisabled(true);

//         const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>()
//             .addComponents(selectMenu);

//         const buttonRow = new ActionRowBuilder<ButtonBuilder>()
//             .addComponents(confirmButton);
        
//         await interaction.reply({
//             content: 'Veuillez sélectionner un template :',
//             components: [menuRow, buttonRow],
//             ephemeral: true
//         });

//         // return await interaction.showModal(modal);

//     } catch (error) {
//         logger.error(error, 'Erreur lors de la création du modal de formation');
//         await interaction.reply({
//             content: '❌ Une erreur est survenue lors de la création du formulaire.',
//             ephemeral: true
//         });
//     }
// } 


// export const data = new SlashCommandBuilder()
//     .setName('create-course')
//     .setDescription('Créer une nouvelle formation');

// export async function execute(interaction: ChatInputCommandInteraction) {    
//     try {
//         if (!interaction.isChatInputCommand()) return;

//         const guild = interaction.guild;
//         if (!guild) {
//             throw new Error('Guild not found');
//         }

//         // const modal = new ModalBuilder()
//         //     .setCustomId('create-course-modal-from-slash')
//         //     .setTitle('Créer une nouvelle formation');

//         const nameInput = new TextInputBuilder()
//             .setCustomId('courseName')
//             .setLabel('Nom de la formation')
//             .setStyle(TextInputStyle.Short)
//             .setPlaceholder('Ex: Développeur web')
//             .setRequired(true)
//             .setMinLength(3)
//             .setMaxLength(50);

//         const isCertifiedInput = new TextInputBuilder()
//             .setCustomId('isCertified')
//             .setLabel('Formation certifiante ? (true/false)')
//             .setStyle(TextInputStyle.Short)
//             .setPlaceholder('Écrivez true ou false')
//             .setRequired(true)
//             .setMinLength(4)
//             .setMaxLength(5);

//         const postInput = new TextInputBuilder()
//             .setCustomId('postTemplate')
//             .setLabel('Template du post')
//             .setStyle(TextInputStyle.Paragraph)
//             .setPlaceholder('Sélectionnez un post')
//             .setRequired(true);

//         const firstActionRow = new ActionRowBuilder<TextInputBuilder>()
//             .addComponents(nameInput);
//         const secondActionRow = new ActionRowBuilder<TextInputBuilder>()
//             .addComponents(isCertifiedInput);
//         const thirdActionRow = new ActionRowBuilder<TextInputBuilder>()
//             .addComponents(postInput);
        
//         // modal.addComponents(firstActionRow, secondActionRow);

//         const templateCategoryId = "1344320786722455552";
//         const templateCategory = await guild.channels.fetch(templateCategoryId);
        
//         if (!templateCategory) {
//             throw new Error('Template category not found');
//         }

//         const templateChannels = guild.channels.cache.filter(channel => 
//             channel.parentId === templateCategoryId && 
//             channel.type === ChannelType.GuildForum
//         );

//         if (templateChannels.size === 0) {
//             await interaction.reply({
//                 content: '❌ Aucun template disponible dans la catégorie.',
//                 ephemeral: true
//             });
//             return;
//         }

//         const options = templateChannels.map(channel => 
//             new StringSelectMenuOptionBuilder()
//                 .setLabel(channel.name)
//                 .setValue(channel.id)
//                 .setDescription(`Template: ${channel.name}`)
//         );

//         const selectMenu = new StringSelectMenuBuilder()
//             .setCustomId('template_select')
//             .setPlaceholder('Sélectionnez un template')
//             .addOptions(options);

//         const confirmButton = new ButtonBuilder()
//             .setCustomId('confirm_course_creation')
//             .setLabel('Créer la formation')
//             .setStyle(ButtonStyle.Primary)
//             .setDisabled(true);

//         const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>()
//             .addComponents(selectMenu);

//         const buttonRow = new ActionRowBuilder<ButtonBuilder>()
//             .addComponents(confirmButton);
        
//         await interaction.reply({
//             content: 'Veuillez sélectionner un template :',
//             components: [menuRow, buttonRow],
//             ephemeral: true
//         });

//         // return await interaction.showModal(modal);

//     } catch (error) {
//         logger.error(error, 'Erreur lors de la création du modal de formation');
//         await interaction.reply({
//             content: '❌ Une erreur est survenue lors de la création du formulaire.',
//             ephemeral: true
//         });
//     }
// } 

// export async function execute(interaction: any) {
//     try {
//         if (!interaction.isChatInputCommand()) return;

//         const guild = interaction.guild;
//         if (!guild) {
//             throw new Error('Guild not found');
//         }

//         const name = interaction.options.getString('name', true);
//         // const isCertified = interaction.options.getBoolean('certified', true);

//         const templateCategoryId = "1344320786722455552";
//         const templateCategory = await guild.channels.fetch(templateCategoryId);
        
//         if (!templateCategory) {
//             throw new Error('Template category not found');
//         }   

//         await interaction.reply({
//             content: `Formation "${name}" en cours de création...`,
//         });

//     } catch (error) {
//         logger.error(error, 'Erreur lors de la création de formation');
//         await interaction.reply({
//             content: '❌ Une erreur est survenue lors de la création du formulaire.',
//             ephemeral: true
//         });
//     }
        
// }
