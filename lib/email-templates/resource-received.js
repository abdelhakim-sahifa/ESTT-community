
import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const resourceReceivedEmail = (userName, resourceTitle) => {
    const content = `
        <h1 style="${emailStyles.h1}">Contribution reçue !</h1>
        
        <p style="${emailStyles.paragraph}">
            Merci <strong>${userName}</strong> pour ta contribution : "<strong>${resourceTitle}</strong>".
        </p>
        
        <p style="${emailStyles.paragraph}">
            Ta ressource a bien été enregistrée et est actuellement en attente de validation par nos modérateurs.
        </p>
        
        <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
                Pourquoi modérons-nous ? Pour garantir la qualité et la pertinence des documents partagés avec la communauté.
            </p>
        </div>
        
        <p style="${emailStyles.paragraph}">
            Tu recevras un email dès qu'elle sera publiée.
        </p>
    `;

    return baseLayout(content);
};
