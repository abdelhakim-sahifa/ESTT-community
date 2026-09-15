import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const resourceUpdatedEmail = (userName, resourceTitle, resourceUrl, changes = []) => {
    const changesList = changes.length > 0
        ? `<ul style="padding-left: 20px; margin: 0 0 16px 0; color: #334155;">
            ${changes.map(c => `<li style="margin-bottom: 6px;"><strong>${c.label}</strong> : de "${c.old}" à "${c.new}"</li>`).join('')}
           </ul>`
        : `<p style="${emailStyles.paragraph}">Des informations ont été mises à jour pour améliorer la précision de la ressource.</p>`;

    const content = `
        <h1 style="${emailStyles.h1}">Ta ressource a été mise à jour</h1>
        
        <p style="${emailStyles.paragraph}">
            Bonjour <strong>${userName}</strong>,
        </p>
        
        <p style="${emailStyles.paragraph}">
            Ta contribution "<strong>${resourceTitle}</strong>" a été mise à jour par un administrateur pour améliorer sa visibilité ou sa précision. Voici ce qui a changé :
        </p>
        
        ${changesList}
        
        <p style="${emailStyles.paragraph}">
            Elle reste consultable par toute la communauté :
        </p>
        
        <div style="text-align: center; margin-top: 24px;">
            <a href="${resourceUrl}" style="${emailStyles.button}">Voir ma ressource</a>
        </div>
        
        <p style="${emailStyles.paragraph}">
            Merci pour ta contribution — elle aide tes camarades à réussir !
        </p>
    `;

    return baseLayout(content);
};