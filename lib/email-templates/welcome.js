
import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const welcomeEmail = (firstName) => {
    const content = `
        <h1 style="${emailStyles.h1}">Bienvenue sur ESTT Community, ${firstName} !</h1>
        
        <p style="${emailStyles.paragraph}">
            Nous sommes ravis de vous compter parmi nous. ESTT Community est la plateforme centrale pour la vie étudiante à l'EST de Tétouan.
        </p>
        
        <div style="${emailStyles.highlightBox}">
            <p style="${emailStyles.paragraph}">
                <strong>Que pouvez-vous faire ici ?</strong>
            </p>
            <ul style="padding-left: 20px; color: #334155;">
                <li style="margin-bottom: 10px;">Rejoindre des clubs et participer à des événements.</li>
                <li style="margin-bottom: 10px;">Accéder à des ressources pédagogiques partagées.</li>
                <li style="margin-bottom: 10px;">Rester informé des dernières actualités du campus.</li>
            </ul>
        </div>
        
        <p style="${emailStyles.paragraph}">
            N'hésitez pas à explorer les clubs et à compléter votre profil pour tirer le meilleur parti de votre expérience.
        </p>
        
        <div style="text-align: center;">
            <a href="https://estt.community/clubs" style="${emailStyles.button}">Découvrir les clubs</a>
        </div>
        
        <p style="${emailStyles.paragraph}">
            À bientôt,<br>
            L'équipe ESTT Community
        </p>
    `;

    return baseLayout(content);
};
