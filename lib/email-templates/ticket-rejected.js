import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const ticketRejectedEmail = (ticket, eventName, clubName, reason) => {
    const content = `
        <h1 style="${emailStyles.h1}">Mise à jour sur votre billet</h1>
        
        <p style="${emailStyles.paragraph}">
            Bonjour <strong>${ticket.firstName ? ticket.firstName : (ticket.userName || 'Participant')}</strong>,
        </p>
        
        <p style="${emailStyles.paragraph}">
            Nous sommes désolés, mais votre billet pour l'événement <strong>${eventName}</strong> organisé par <strong>${clubName}</strong> n'a pas pu être validé.
        </p>
        
        <div style="${emailStyles.dangerBox}">
            <p style="margin: 0; font-weight: bold;">Raison du refus :</p>
            <p style="margin: 6px 0 0 0; font-style: italic;">"${reason || 'Non spécifiée'}"</p>
        </div>
        
        <p style="${emailStyles.paragraph}">
            Cela peut arriver lorsque les places sont limitées ou qu'une information manquait dans l'inscription. Si vous pensez qu'il s'agit d'une erreur, contactez directement l'équipe du club.
        </p>
        
        <p style="${emailStyles.paragraph}">
            Ne vous découragez pas : de nombreux autres événements sont ouverts sur la plateforme. Rendez-vous peut-être au prochain !
        </p>
    `;

    return baseLayout(content);
};