import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const resourceContactRequestEmail = (userName, resourceTitle, adminMessage, replyUrl, resourceStatus) => {
    const content = `
        <h1 style="${emailStyles.h1}">Question concernant ta ressource</h1>

        <p style="${emailStyles.paragraph}">
            Bonjour <strong>${userName}</strong>,
        </p>

        <p style="${emailStyles.paragraph}">
            Un administrateur a besoin d'une précision à propos de ta ressource
            "<strong>${resourceTitle}</strong>" (statut : ${resourceStatus}).
        </p>

        <div style="${emailStyles.highlightBox}">
            <p style="margin: 0 0 10px 0; font-weight: 700; color: #0f172a;">Message de l'administrateur</p>
            <p style="margin: 0; white-space: pre-wrap; color: #334155;">${adminMessage}</p>
        </div>

        <p style="${emailStyles.paragraph}">
            Clique sur le bouton ci-dessous pour ouvrir la conversation, répondre à la question et envoyer ta réponse.
        </p>

        <div style="text-align: center; margin-top: 30px;">
            <a href="${replyUrl}" style="${emailStyles.button}">Répondre à l'administrateur</a>
        </div>

        <p style="${emailStyles.small}">
            Le bouton ne fonctionne pas ? Tu peux aussi ouvrir la conversation directement via ce lien :
            <br />
            <a href="${replyUrl}" style="${emailStyles.link}">${replyUrl}</a>
        </p>
    `;

    return baseLayout(content);
};