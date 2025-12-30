
import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const clubRequestApprovedEmail = (clubName, logoUrl) => {
    const content = `
        <h1 style="${emailStyles.h1}">Félicitations ! Votre club est approuvé.</h1>
        
        <p style="${emailStyles.paragraph}">
            Votre demande de création pour le club <strong>${clubName}</strong> a été acceptée par l'administration.
        </p>
        
        <div style="${emailStyles.highlightBox}; text-align: center;">
            ${logoUrl ? `<img src="${logoUrl}" alt="${clubName}" style="${emailStyles.clubLogo}">` : ''}
            <h2 style="${emailStyles.h2}; margin-top: 5px;">${clubName}</h2>
            <p style="color: #166534; font-weight: bold;">Statut : ACTIF</p>
        </div>
        
        <p style="${emailStyles.paragraph}">
            Vous avez désormais accès à l'espace d'administration de votre club où vous pouvez :
        </p>
        
        <ul style="color: #334155;">
            <li>Gérer les membres et l'organigramme</li>
            <li>Publier des événements et des actualités</li>
            <li>Créer des formulaires et une billetterie</li>
        </ul>
        
        <div style="text-align: center;">
            <a href="https://estt-community.vercel.app/clubs" style="${emailStyles.button}">Accéder à mon club</a>
        </div>
    `;

    return baseLayout(content);
};
