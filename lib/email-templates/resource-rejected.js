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
        <div style="${emailStyles.dangerBox}">
            <p style="margin: 0; font-weight: bold;">Raison du refus :</p>
            <p style="margin: 6px 0 0 0; font-style: italic;">"${reason}"</p>
        </div>
        ` : ''}

        <p style="${emailStyles.paragraph}">
            Si tu souhaites réessayer, vérifie notamment que : le fichier est lisible et complet, le contenu est pertinent et ne duplique pas un document déjà en ligne, et qu'il respecte les droits d'auteur.
        </p>
        
        <p style="${emailStyles.paragraph}">
            N'hésite pas à soumettre une version corrigée : on a hâte de la voir !
        </p>
    `;

    return baseLayout(content);
};