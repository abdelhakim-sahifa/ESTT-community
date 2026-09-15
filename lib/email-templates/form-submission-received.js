import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const formSubmissionReceivedEmail = (formTitle, clubName) => {
    const content = `
        <h1 style="${emailStyles.h1}">Réponse enregistrée ✓</h1>
        
        <p style="${emailStyles.paragraph}">
            Merci ! Nous avons bien reçu ta réponse pour le formulaire "<strong>${formTitle}</strong>" du club <strong>${clubName}</strong>.
        </p>
        
        <div style="${emailStyles.successBox}; text-align: center; padding: 22px;">
            <p style="color: #065f46; margin: 0; font-weight: bold;">
                <span style="font-size: 20px; vertical-align: middle; margin-right: 5px;">✓</span>
                Confirmation de réception
            </p>
        </div>
        
        <p style="${emailStyles.paragraph}">
            Selon le contenu du formulaire (inscription à un atelier, sélection, etc.), l'équipe du club pourrait te recontacter. Surveille tes notifications et tes emails !
        </p>
        
        <p style="${emailStyles.paragraph}">
            À très bientôt !
        </p>
    `;

    return baseLayout(content);
};