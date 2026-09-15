import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const resourceApprovedEmail = (userName, resourceTitle, resourceUrl) => {
    const content = `
        <h1 style="${emailStyles.h1}">Ta ressource est en ligne ! 🎉</h1>
        
        <p style="${emailStyles.paragraph}">
            Félicitations <strong>${userName}</strong> ! Ta contribution "<strong>${resourceTitle}</strong>" a été validée et est désormais accessible à toute la communauté.
        </p>
        
        <div style="text-align: center;">
            <a href="${resourceUrl}" style="${emailStyles.button}">Voir ma ressource</a>
        </div>
        
        <p style="${emailStyles.paragraph}">
            C'est grâce à des contributeurs comme toi que la plateforme reste utile à tous. Continue comme ça, et n'hésite pas à partager d'autres documents !
        </p>
        
        <p style="${emailStyles.paragraph}">
            À bientôt sur ESTT Community !
        </p>
    `;

    return baseLayout(content);
};