import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const welcomeEmail = (firstName) => {
    const content = `
        <h1 style="${emailStyles.h1}">Bienvenue sur ESTT Community, ${firstName} ! 🎉</h1>
        
        <p style="${emailStyles.paragraph}">
            Votre compte est prêt, et toute la communauté de l'EST de Tétouan vous attend. 
            Avec ESTT Community, les clubs, les événements, les ressources pédagogiques et les actus du campus sont réunis au même endroit.
        </p>
        
        <div style="${emailStyles.highlightBox}">
            <p style="margin: 0 0 12px 0; font-weight: 600; color: #0f172a;">Pour bien démarrer, suivez ces 3 étapes :</p>
            <ol style="padding-left: 20px; margin: 0; color: #334155;">
                <li style="margin-bottom: 10px;">
                    <strong>Complétez votre profil.</strong> Ajoutez votre filière, votre promotion et une photo pour être facilement identifié par vos camarades.
                </li>
                <li style="margin-bottom: 10px;">
                    <strong>Rejoignez un club.</strong> C'est le meilleur moyen de vous intégrer et de vivre pleinement la vie étudiante.
                </li>
                <li>
                    <strong>Explorez les ressources.</strong> Retrouvez les cours, TD et examens partagés par et pour les étudiants de l'école.
                </li>
            </ol>
        </div>
        
        <p style="${emailStyles.paragraph}">
            La communauté ne demande qu'à vous accueillir. Explorez les clubs, participez aux événements et n'hésitez pas à contribuer : chaque partage aide vos camarades.
        </p>
        
        <div style="text-align: center;">
            <a href="https://estt.ma/clubs" style="${emailStyles.button}">Découvrir les clubs</a>
        </div>
        
        <p style="${emailStyles.small}">
            Une question ou un problème ? Répondez simplement à cet email : nous sommes là pour vous aider.
        </p>
        
        <p style="${emailStyles.paragraph}">
            À très vite sur le campus,<br>
            <strong>L'équipe ESTT Community</strong>
        </p>
    `;

    return baseLayout(content);
};