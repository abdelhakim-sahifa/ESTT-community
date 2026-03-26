import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const resourceContactRequestEmail = (userName, resourceTitle, adminMessage, replyUrl, resourceStatus) => {
    const content = `
        <h1 style="${emailStyles.h1}">Question concernant ta ressource</h1>

        <p style="${emailStyles.paragraph}">
            Bonjour <strong>${userName}</strong>,
        </p>

        <p style="${emailStyles.paragraph}">
            Un administrateur a besoin d'une precision a propos de ta ressource
            "<strong>${resourceTitle}</strong>" (${resourceStatus}).
        </p>

        <div style="${emailStyles.highlightBox}">
            <p style="margin: 0 0 10px 0; font-weight: 700; color: #0f172a;">Message admin</p>
            <p style="margin: 0; white-space: pre-wrap; color: #334155;">${adminMessage}</p>
        </div>

        <p style="${emailStyles.paragraph}">
            Clique sur le bouton ci-dessous pour ouvrir la room, repondre a la question et envoyer ta reponse.
        </p>

        <div style="text-align: center; margin-top: 30px;">
            <a href="${replyUrl}" style="${emailStyles.button}">Repondre a l'administrateur</a>
        </div>

        <p style="${emailStyles.paragraph}">
            Si le bouton ne fonctionne pas, tu peux aussi utiliser ce lien :
            <br />
            <a href="${replyUrl}" style="${emailStyles.link}">${replyUrl}</a>
        </p>
    `;

    return baseLayout(content);
};
