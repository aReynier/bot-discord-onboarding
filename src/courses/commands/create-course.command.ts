import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('create-course')
    .setDescription('Créer une nouvelle formation');

export async function execute(interaction: any) {
    await interaction.reply('La création de formation est en cours de développement');
} 