import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const adminNotificationEmail = (adminName, actionType, details, actionLink) => {
    const content = `
        <h1 style="${emailStyles.h1}">Action requise : ${actionType}</h1>
        
        <p style="${emailStyles.paragraph}">
            Bonjour <strong>${adminName || 'Admin'}</strong>,
        </p>
        
        <div style="${emailStyles.infoBox}">
            <p style="margin: 0 0 6px 0; font-weight: bold;">Un nouvel élément demande votre attention :</p>
            <p style="margin: 0;">${details}</p>
        </div>
        
        <p style="${emailStyles.paragraph}">
            Connectez-vous à votre espace pour traiter cet élément :
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${actionLink}" style="${emailStyles.button}">
                Accéder au tableau de bord
            </a>
        </div>
        
        <p style="${emailStyles.small}">
            Cet email a été généré automatiquement par le système de notifications de la plateforme.
        </p>
    `;

    return baseLayout(content);
};