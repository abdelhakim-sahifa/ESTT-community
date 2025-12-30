
import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const adminNotificationEmail = (adminName, actionType, details, actionLink) => {
    const content = `
        <h1 style="${emailStyles.h1}">Action requise : ${actionType}</h1>
        
        <p style="${emailStyles.paragraph}">
            Bonjour <strong>${adminName || 'Admin'}</strong>,
        </p>
        
        <div style="background-color: #f0f9ff; border-left: 4px solid #0369a1; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #075985; font-weight: bold;">Un nouvel élément nécessite votre attention :</p>
            <p style="margin: 10px 0 0 0; color: #0c4a6e;">${details}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${actionLink}" style="${emailStyles.button}">
                Accéder au tableau de bord
            </a>
        </div>
        
        <p style="${emailStyles.paragraph}">
            Cet email est généré automatiquement car le système de notification est actif.
        </p>
    `;

    return baseLayout(content);
};
