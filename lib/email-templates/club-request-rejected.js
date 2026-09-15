import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const clubRequestRejectedEmail = (clubName, reason) => {
    const content = `
        <h1 style="${emailStyles.h1}">Mise à jour concernant votre demande</h1>
        
        <p style="${emailStyles.paragraph}">
            Bonjour,
        </p>
        
        <p style="${emailStyles.paragraph}">
            Nous avons bien examiné votre demande de création pour le club <strong>${clubName}</strong>. Malheureusement, nous ne pouvons pas y donner suite pour le moment.
        </p>
        
        <div style="${emailStyles.dangerBox}">
            ${reason ? `<p style="margin: 0 0 6px 0; font-weight: bold;">Motif du refus :</p>
            <p style="margin: 0; font-style: italic;">"${reason}"</p>` : '<p style="margin: 0;">Votre demande n\'a pas pu être approuvée.</p>'}
        </div>
        
        <p style="${emailStyles.paragraph}">
            Les motifs les plus fréquents : un dossier incomplet, un doublon avec un club existant ou un non-respect des directives de la plateforme.
        </p>
        
        <p style="${emailStyles.paragraph}">
            Vous pouvez corriger votre dossier et soumettre une nouvelle demande à tout moment — et pour toute question, notre équipe reste disponible.
        </p>
    `;

    return baseLayout(content);
};