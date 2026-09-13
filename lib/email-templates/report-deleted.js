import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const reportDeletedEmail = (userName, resourceTitle) => {
    const content = `
        <h1 style="${emailStyles.h1}">Action suite à votre signalement</h1>
        
        <p style="${emailStyles.paragraph}">
            Bonjour <strong>${userName}</strong>,
        </p>
        
        <p style="${emailStyles.paragraph}">
            Suite à votre signalement, la ressource "<strong>${resourceTitle}</strong>" a été examinée puis supprimée de la plateforme. La règle applicable a bien été prise en compte.
        </p>
        
        <p style="${emailStyles.paragraph}">
            Un grand merci pour votre contribution : votre signalement a directement protégé la qualité et la sécurité de la communauté ESTT Community.
        </p>
        
        <p style="${emailStyles.paragraph}">
            L'équipe ESTT Community
        </p>
    `;

    return baseLayout(content);
};