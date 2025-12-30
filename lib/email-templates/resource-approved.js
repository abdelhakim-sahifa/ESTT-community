
import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const resourceApprovedEmail = (userName, resourceTitle, resourceUrl) => {
    const content = `
        <h1 style="${emailStyles.h1}">Ta ressource est en ligne !</h1>
        
        <p style="${emailStyles.paragraph}">
            Félicitations <strong>${userName}</strong> ! Ta contribution "<strong>${resourceTitle}</strong>" a été validée et est maintenant disponible pour toute la communauté.
        </p>
        
        <div style="text-align: center;">
            <a href="${resourceUrl}" style="${emailStyles.button}">Voir ma ressource</a>
        </div>
        
        <p style="${emailStyles.paragraph}">
            Merci d'aider tes camarades à réussir. Continue comme ça !
        </p>
    `;

    return baseLayout(content);
};
