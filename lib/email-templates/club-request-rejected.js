
import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const clubRequestRejectedEmail = (clubName, reason) => {
    const content = `
        <h1 style="${emailStyles.h1}">Mise à jour concernant votre demande</h1>
        
        <p style="${emailStyles.paragraph}">
            Nous avons examiné votre demande de création pour le club <strong>${clubName}</strong>.
        </p>
        
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #991b1b; margin: 0; font-weight: bold; margin-bottom: 5px;">
                Malheureusement, nous ne pouvons pas donner suite à votre demande pour le moment.
            </p>
            ${reason ? `<p style="color: #7f1d1d; margin: 5px 0 0 0; font-style: italic;">Raison : "${reason}"</p>` : ''}
        </div>
        
        <p style="${emailStyles.paragraph}">
            Cela peut être dû à un dossier incomplet, un doublon avec un club existant, ou un non-respect des directives.
        </p>
        
        <p style="${emailStyles.paragraph}">
            N'hésitez pas à nous contacter pour plus d'informations ou à soumettre une nouvelle demande corrigée.
        </p>
    `;

    return baseLayout(content);
};
