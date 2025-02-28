import { ChannelType, Client } from 'discord.js';
import { logger } from '../../config/logger';

interface Course {
    uuidCourse: string;
    name: string;
    isCertified: boolean;
    uuidGuild: string;
    uuidCategory: string;
    uuidRole: string;
    createdAt: string;
    updatedAt: string;
}

interface Role {
    uuidRole: string;
    name: string;
    color: string;
    hoist: boolean;
    position: string;
    memberCount: string;
    uuidGuild: string;
    createdAt: string;
    updatedAt: string;
}


export class CourseService {
    private apiUrl: string;
    private client: Client;
    private isCreating: boolean = false;

    constructor(client: Client) {
        this.apiUrl = process.env.API_URL || 'http://localhost:3000';
        this.client = client;
    }

    async getAllCourses(): Promise<Course[]> {
        try {
            const response = await fetch(`${this.apiUrl}/courses`);
            if (!response.ok) throw new Error('Erreur lors de la récupération des formations');
            
            const courses = await response.json();
            return courses;
        } catch (error) {
            logger.error(error, 'Erreur lors de la récupération des formations');
            throw error;
        }
    }

    async getCourse(id: string): Promise<Course> {        
        try {
            const response = await fetch(`${this.apiUrl}/courses/${id}`);
            if (!response.ok) throw new Error('Formation non trouvée');
            return await response.json();
        } catch (error) {
            logger.error(error, 'Erreur lors de la récupération de la formation');
            throw error;
        }
    }

    async createCourse(name: string, isCertified: boolean): Promise<Course> {
        try {

            const guildId = process.env.GUILD_ID;
            if (!guildId) {
                throw new Error('GUILD_ID non défini dans les variables d\'environnement');
            }

            const guild = await this.client.guilds.fetch(guildId);
            if (!guild) {
                throw new Error('Impossible de trouver le serveur Discord');
            }

            const categoryId = "1344811915301490748";

            const forumName = name;
            const existingForum = guild.channels.cache.find(
                channel => channel.name === forumName && channel.type === ChannelType.GuildForum
            );
            
            if (existingForum) {
                throw new Error('Une formation avec ce nom existe déjà');
            }

            const forum = await guild.channels.create({
                name: `${name}`,
                type: ChannelType.GuildForum,
                parent: categoryId,
                reason: `Création du forum pour la formation ${name}`
            });

            let role;
            try {
                logger.debug('Création du rôle Discord...');
                role = await guild.roles.create({
                    name: `Formation ${name}`,
                    color: '#FF0000',
                    reason: `Création du rôle pour la formation ${name}`
                });
                logger.debug({ roleId: role.id }, 'Rôle Discord créé avec succès');
            } catch (error) {
                logger.error(error, 'Erreur lors de la création du rôle Discord');
                throw new Error('Impossible de créer le rôle Discord pour la formation');
            }

            const roleResponse = await fetch(`${this.apiUrl}/roles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: role.name,
                    uuidGuild: guildId,
                    uuidRole: role.id,
                    memberCount: "0",
                    rolePosition: "1",
                    hoist: role.hoist,
                    color: role.hexColor
                }),
            });
    
            if (!roleResponse.ok) {
                await role.delete().catch(e => logger.error(e, 'Erreur lors de la suppression du rôle Discord'));
                throw new Error('Erreur lors de la création du rôle dans l\'API');
            }

            const response = await fetch(`${this.apiUrl}/courses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    isCertified,
                    uuidGuild: guildId,
                    uuidCategory: categoryId,
                    uuidRole: role.id
                    // roles: [role.id]
                }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                logger.error({
                    status: response.status,
                    errorData
                }, 'Réponse d\'erreur de l\'API');
                throw new Error('Erreur lors de la création de la formation');
            }
            return await response.json();
        } catch (error) {
            logger.error(error, 'Erreur lors de la création de la formation');
            throw error;
        }
    }
      
}
