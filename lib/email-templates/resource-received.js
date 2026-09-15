import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const resourceReceivedEmail = (userName, resourceTitle) => {
    const content = `
        <h1 style="${emailStyles.h1}">Contribution reçue !</h1>
        
        <p style="${emailStyles.paragraph}">
            Merci <strong>${userName}</strong> ! Ta ressource "<strong>${resourceTitle}</strong>" a bien été enregistrée.
        </p>
        
        <p style="${emailStyles.paragraph}">
            Elle est maintenant <strong>en attente de validation</strong> par nos modérateurs — en général, cela ne prend que quelques jours.
        </p>
        
        <div style="${emailStyles.infoBox}">
            <p style="margin: 0; font-size: 14px; line-height: 1.6;">
                <strong>Pourquoi cette étape ?</strong><br>
                Chaque document est vérifié avant publication afin de garantir la qualité et la pertinence des ressources partagées avec la communauté.
            </p>
        </div>
        
        <p style="${emailStyles.paragraph}">
            Tu recevras un email dès que ta ressource sera en ligne. En attendant, merci de faire vivre la communauté !
        </p>
    `;

    return baseLayout(content);
};