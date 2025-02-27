import { logger } from '../../config/logger';

interface Course {
    uuidCourse: string;
    name: string;
    isCertified: boolean;
}

export class CourseService {
    private apiUrl: string;

    constructor() {
        this.apiUrl = process.env.API_URL || 'http://localhost:3000';
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
            const response = await fetch(`${this.apiUrl}/courses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, isCertified }),
            });

            if (!response.ok) throw new Error('Erreur lors de la création de la formation');
            return await response.json();
        } catch (error) {
            logger.error(error, 'Erreur lors de la création de la formation');
            throw error;
        }
    }
      
}
