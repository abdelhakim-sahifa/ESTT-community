import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const membershipAcceptedEmail = (memberName, clubName, certificateLink) => {
    const content = `
        <h1 style="${emailStyles.h1}">Félicitations, ${memberName} ! 🎉</h1>
        
        <p style="${emailStyles.paragraph}">
            Votre demande d'adhésion au club <strong>${clubName}</strong> a été acceptée. Bienvenue dans la communauté !
        </p>
        
        <div style="${emailStyles.highlightBox}">
            <p style="margin: 0;">
                Vous faites désormais partie du club. Présentez-vous dans les discussions, découvrez les projets en cours et proposez vos idées : votre place compte.
            </p>
        </div>
        
        <p style="${emailStyles.paragraph}">
            En tant que membre officiel, vous pouvez dès à présent télécharger votre <strong>Certificat d'Adhésion</strong>, officiel et signé numériquement — un bel atout pour votre CV !
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${certificateLink}" style="${emailStyles.button}">Télécharger mon Certificat</a>
        </div>
        
        <p style="${emailStyles.paragraph}">
            À très vite parmi nous,<br>
            L'équipe ESTT Community & ${clubName}
        </p>
    `;

    return baseLayout(content);
};