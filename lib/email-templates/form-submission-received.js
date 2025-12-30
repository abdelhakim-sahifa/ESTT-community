
import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const formSubmissionReceivedEmail = (formTitle, clubName) => {
    const content = `
        <h1 style="${emailStyles.h1}">Réponse enregistrée</h1>
        
        <p style="${emailStyles.paragraph}">
            Nous avons bien reçu ta réponse pour le formulaire "<strong>${formTitle}</strong>" du club <strong>${clubName}</strong>.
        </p>
        
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <p style="color: #166534; margin: 0; font-weight: bold;">
                <span style="font-size: 20px; vertical-align: middle; margin-right: 5px;">✓</span>
                Confirmation de réception
            </p>
        </div>
        
        <p style="${emailStyles.paragraph}">
            Si ce formulaire nécessite une action de la part du club (comme une inscription à un atelier), tu seras recontacté bientôt.
        </p>
    `;

    return baseLayout(content);
};
