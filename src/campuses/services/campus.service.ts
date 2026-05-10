import { logger } from '../../config/logger';
import { Client } from 'discord.js';
import { authService } from '../../services/auth.service';

interface ApiResponse<T> {
    message: string;
    data: T;
    statusCode: number;
}

interface Campus {
    uuidCampus: string;
    name: string;
    uuidGuild: string;
    uuidRole: string;
    createdAt: string;
    updatedAt: string;
}

export class CampusService {
    private apiUrl: string;
    private client: Client;
    private isCreating: boolean = false;

    constructor(client: Client) {
        this.apiUrl = process.env.API_URL || 'http://localhost:3000';
        this.client = client;
    }

    async getAllCampuses(): Promise<Campus[]> {
        try {
            const headers = await authService.getAuthHeaders();
            const response = await fetch(`${this.apiUrl}/campuses`, { headers });
            if (!response.ok) {
                logger.error({
                    status: response.status,
                    statusText: response.statusText
                }, 'Erreur lors de la récupération des campus');
                throw new Error('Erreur lors de la récupération des campus');
            }
            const apiResponse = await response.json() as ApiResponse<Campus[]>;
            logger.debug({ apiResponse }, 'Réponse de l\'API pour getAllCampuses');
            return apiResponse.data || [];
        } catch (error) {
            logger.error(error, 'Erreur lors de la récupération des campus');
            throw error;
        }
    }

    async getCampus(id: string): Promise<Campus> {
        try {
            const headers = await authService.getAuthHeaders();
            const response = await fetch(`${this.apiUrl}/campuses/${id}`, { headers });
            if (!response.ok) {
                logger.error({
                    status: response.status,
                    statusText: response.statusText
                }, 'Erreur lors de la récupération du campus');
                throw new Error('Campus non trouvé');
            }
            const apiResponse = await response.json() as ApiResponse<Campus>;
            logger.debug({ apiResponse }, 'Réponse de l\'API pour getCampus');
            
            if (!apiResponse.data) {
                throw new Error('Campus non trouvé');
            }
            
            return apiResponse.data;
        } catch (error) {
            logger.error(error, 'Erreur lors de la récupération du campus');
            throw error;
        }
    }

    async createCampus(name: string): Promise<Campus> {
        const headers = await authService.getAuthHeaders();
        if (this.isCreating) {
            throw new Error('Une création de campus est déjà en cours.');
        }

        this.isCreating = true;

        try {
            logger.debug({ name }, 'Début de la création du campus');

            // Vérification de l'existence du campus
            const existingCampuses = await this.getAllCampuses();
            const existingCampus = existingCampuses.find(campus => 
                campus.name.toLowerCase() === name.toLowerCase()
            );

            if (existingCampus) {
                logger.warn({ existingCampus }, 'Tentative de création d\'un campus avec un nom existant');
                throw new Error(`Un campus nommé "${name}" existe déjà.`);
            }

            // Récupération de l'ID du serveur depuis les variables d'environnement
            const guildId = process.env.GUILD_ID;
            if (!guildId) {
                throw new Error('GUILD_ID non défini dans les variables d\'environnement');
            }

            // Récupération du serveur
            const guild = await this.client.guilds.fetch(guildId);
            if (!guild) {
                throw new Error('Impossible de trouver le serveur Discord');
            }

            // Création du rôle Discord
            let role;
            try {
                logger.debug('Création du rôle Discord...');
                role = await guild.roles.create({
                    name: `Campus ${name}`,
                    reason: `Création du rôle pour le campus ${name}`
                });
                logger.debug({ roleId: role.id }, 'Rôle Discord créé avec succès');
            } catch (error) {
                logger.error(error, 'Erreur lors de la création du rôle Discord');
                throw new Error('Impossible de créer le rôle Discord pour le campus');
            }

            try {
                logger.debug('Envoi de la requête à l\'API...');

                const response = await fetch(`${this.apiUrl}/campuses`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({
                        name: name,
                        uuidRole: role.id,
                        uuidGuild: guildId
                    })
                });
                
                if (!response.ok) {
                    // En cas d'erreur, supprimer le rôle créé
                    logger.error({
                        status: response.status,
                        statusText: response.statusText
                    }, 'Erreur lors de la création du campus dans l\'API');
                    
                    await role.delete('Échec de la création du campus dans l\'API');
                    const error = await response.json();
                    throw new Error(error.message || 'Erreur lors de la création du campus');
                }
                
                const result = await response.json();
                logger.debug({ result }, 'Campus créé avec succès dans l\'API');
                return result;
            } catch (error) {
                // En cas d'erreur lors de la création dans l'API, on s'assure de supprimer le rôle
                if (role) {
                    await role.delete('Échec de la création du campus dans l\'API').catch(e => 
                        logger.error(e, 'Erreur lors de la suppression du rôle après échec de création')
                    );
                }
                throw error;
            }
        } catch (error) {
            logger.error(error, 'Erreur lors de la création du campus');
            throw error;
        } finally {
            this.isCreating = false;
        }
    }

    async updateCampus(id: string, name: string): Promise<Campus> {
        const headers = await authService.getAuthHeaders();
        try {
            // Récupérer d'abord les informations actuelles du campus
            const currentCampus = await this.getCampus(id);
            
            // Récupérer le serveur Discord
            const guild = await this.client.guilds.fetch(currentCampus.uuidGuild);
            if (!guild) {
                throw new Error('Impossible de trouver le serveur Discord');
            }

            try {
                // Mettre à jour le rôle Discord
                const role = await guild.roles.fetch(currentCampus.uuidRole);
                if (role) {
                    await role.setName(`Campus ${name}`);
                    logger.info({
                        roleId: currentCampus.uuidRole,
                        oldName: role.name,
                        newName: `Campus ${name}`
                    }, 'Nom du rôle Discord mis à jour');
                } else {
                    logger.warn({
                        roleId: currentCampus.uuidRole
                    }, 'Rôle Discord non trouvé lors de la mise à jour du nom');
                }
            } catch (error) {
                logger.error(error, 'Erreur lors de la mise à jour du nom du rôle Discord');
                throw error;
            }

            // Mettre à jour le campus dans l'API
            const response = await fetch(`${this.apiUrl}/campuses/${id}`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify({ name })
            });
            
            if (!response.ok) throw new Error('Erreur lors de la modification du campus');
            return await response.json();
        } catch (error) {
            logger.error(error, 'Erreur lors de la modification du campus');
            throw error;
        }
    }

    async deleteCampus(id: string): Promise<void> {
        const headers = await authService.getAuthHeaders();
        try {
            // Récupérer d'abord les informations du campus
            const campus = await this.getCampus(id);
            logger.debug({ campus }, 'Informations du campus à supprimer');
            
            // Récupérer le serveur Discord
            const guild = await this.client.guilds.fetch(campus.uuidGuild);
            if (!guild) {
                throw new Error('Impossible de trouver le serveur Discord');
            }

            try {
                // Supprimer le rôle Discord
                const role = await guild.roles.fetch(campus.uuidRole);
                logger.debug({ role }, 'Rôle Discord trouvé');
                
                if (role) {
                    await role.delete('Suppression du campus');
                    logger.info({
                        roleId: campus.uuidRole,
                        campusName: campus.name
                    }, 'Rôle Discord supprimé');
                } else {
                    logger.warn({
                        roleId: campus.uuidRole
                    }, 'Rôle Discord non trouvé');
                }
            } catch (error) {
                logger.warn({
                    error,
                    roleId: campus.uuidRole
                }, 'Impossible de supprimer le rôle Discord (peut-être déjà supprimé)');
            }

            // Supprimer le campus dans l'API
            const response = await fetch(`${this.apiUrl}/campuses/${id}`, {
                headers: headers,
                method: 'DELETE',
            });
            
            if (!response.ok) {
                throw new Error('Erreur lors de la suppression du campus');
            }
            
            logger.info({
                campusId: id,
                campusName: campus.name
            }, 'Campus supprimé avec succès');
        } catch (error) {
            logger.error(error, 'Erreur lors de la suppression du campus');
            throw error;
        }
    }

    // RG28: Notification des personnes concernées
    async notifyCampusMembers(campusId: string, message: string): Promise<void> {
        const headers = await authService.getAuthHeaders();
        try {
            const response = await fetch(`${this.apiUrl}/campuses/${campusId}/notify`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ message })
            });
            
            if (!response.ok) throw new Error('Erreur lors de l\'envoi des notifications');
        } catch (error) {
            logger.error(error, 'Erreur lors de l\'envoi des notifications');
            throw error;
        }
    }
} 