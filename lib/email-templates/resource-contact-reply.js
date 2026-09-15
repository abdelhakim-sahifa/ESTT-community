import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const resourceContactReplyEmail = (resourceTitle, contributorName, replyMessage, roomUrl) => {
    const content = `
        <h1 style="${emailStyles.h1}">Nouvelle réponse sur une ressource</h1>

        <p style="${emailStyles.paragraph}">
            Le contributeur <strong>${contributorName}</strong> a répondu à propos de la ressource
            "<strong>${resourceTitle}</strong>".
        </p>

        <div style="${emailStyles.highlightBox}">
            <p style="margin: 0 0 10px 0; font-weight: 700; color: #0f172a;">Réponse reçue</p>
            <p style="margin: 0; white-space: pre-wrap; color: #334155;">${replyMessage}</p>
        </div>

        <p style="${emailStyles.paragraph}">
            Consulte la conversation pour poursuivre l'échange :
        </p>

        <div style="text-align: center; margin-top: 30px;">
            <a href="${roomUrl}" style="${emailStyles.button}">Ouvrir la conversation</a>
        </div>
    `;

    return baseLayout(content);
};