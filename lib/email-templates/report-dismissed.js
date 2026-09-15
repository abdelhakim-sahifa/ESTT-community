import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const reportDismissedEmail = (userName, resourceTitle) => {
    const content = `
        <h1 style="${emailStyles.h1}">Mise à jour de votre signalement</h1>
        
        <p style="${emailStyles.paragraph}">
            Bonjour <strong>${userName}</strong>,
        </p>
        
        <p style="${emailStyles.paragraph}">
            Après examen de votre signalement concernant la ressource "<strong>${resourceTitle}</strong>", notre équipe a décidé de conserver ce contenu : il ne semble pas enfreindre les règles de la communauté.
        </p>
        
        <p style="${emailStyles.paragraph}">
            Merci pour votre vigilance. C'est grâce aux membres qui signalent que la plateforme reste un espace sain et bienveillant pour tous.
        </p>
        
        <p style="${emailStyles.paragraph}">
            L'équipe ESTT Community
        </p>
    `;

    return baseLayout(content);
};