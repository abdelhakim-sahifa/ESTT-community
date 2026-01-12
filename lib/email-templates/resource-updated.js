
import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const resourceUpdatedEmail = (userName, resourceTitle, resourceUrl, changes = []) => {
    const changesList = changes.length > 0
        ? `<ul style="${emailStyles.paragraph} list-style-type: disc; margin-left: 20px;">
            ${changes.map(c => `<li><strong>${c.label}</strong>: de "${c.old}" à "${c.new}"</li>`).join('')}
           </ul>`
        : `<p style="${emailStyles.paragraph}">Des informations ont été mises à jour pour améliorer la précision de la ressource.</p>`;

    const content = `
        <h1 style="${emailStyles.h1}">Ta ressource a été mise à jour</h1>
        
        <p style="${emailStyles.paragraph}">
            Bonjour <strong>${userName}</strong> ! Ta contribution "<strong>${resourceTitle}</strong>" a été mise à jour par un administrateur pour améliorer sa visibilité ou sa précision. Les modifications suivantes ont été apportées :
        </p>
        
        ${changesList}
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="${resourceUrl}" style="${emailStyles.button}">Voir ma ressource</a>
        </div>
        
        <p style="${emailStyles.paragraph}">
            Merci encore pour ton aide précieuse à la communauté.
        </p>
    `;

    return baseLayout(content);
};
