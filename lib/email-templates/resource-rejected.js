
import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const resourceRejectedEmail = (userName, resourceTitle, reason) => {
    const content = `
        <h1 style="${emailStyles.h1}">Mise à jour sur ta contribution</h1>
        
        <p style="${emailStyles.paragraph}">
            Bonjour <strong>${userName}</strong>,
        </p>
        
        <p style="${emailStyles.paragraph}">
            Nous avons examiné ta ressource "<strong>${resourceTitle}</strong>". Malheureusement, nous n'avons pas pu la valider pour le moment.
        </p>
        
        ${reason ? `
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b; font-weight: bold;">Raison du refus :</p>
            <p style="margin: 5px 0 0 0; color: #7f1d1d; font-style: italic;">"${reason}"</p>
        </div>
        ` : ''}

        <p style="${emailStyles.paragraph}">
            Les raisons possibles incluent : fichier illisible, contenu inapproprié, doublon, ou droits d'auteur.
        </p>
        
        <p style="${emailStyles.paragraph}">
            N'hésite pas à vérifier ton fichier et à réessayer si tu penses qu'il s'agit d'une erreur.
        </p>
    `;

    return baseLayout(content);
};
