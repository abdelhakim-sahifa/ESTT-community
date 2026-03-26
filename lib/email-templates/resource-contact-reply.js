import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const resourceContactReplyEmail = (resourceTitle, contributorName, replyMessage, roomUrl) => {
    const content = `
        <h1 style="${emailStyles.h1}">Nouvelle reponse sur une ressource</h1>

        <p style="${emailStyles.paragraph}">
            Le contributeur <strong>${contributorName}</strong> a repondu a propos de la ressource
            "<strong>${resourceTitle}</strong>".
        </p>

        <div style="${emailStyles.highlightBox}">
            <p style="margin: 0 0 10px 0; font-weight: 700; color: #0f172a;">Reponse recue</p>
            <p style="margin: 0; white-space: pre-wrap; color: #334155;">${replyMessage}</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
            <a href="${roomUrl}" style="${emailStyles.button}">Ouvrir la room</a>
        </div>
    `;

    return baseLayout(content);
};
