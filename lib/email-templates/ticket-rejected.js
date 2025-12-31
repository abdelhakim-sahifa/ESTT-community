
import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const ticketRejectedEmail = (ticket, eventName, clubName, reason) => {
    const content = `
        <h1 style="${emailStyles.h1}">Mise à jour sur votre billet</h1>
        
        <p style="${emailStyles.paragraph}">
            Bonjour <strong>${ticket.firstName ? ticket.firstName : (ticket.userName || 'Participant')}</strong>,
        </p>
        
        <p style="${emailStyles.paragraph}">
            Votre billet pour l'événement <strong>${eventName}</strong> organisé par <strong>${clubName}</strong> ne peut pas être validé.
        </p>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b; font-weight: bold;">Raison du refus :</p>
            <p style="margin: 5px 0 0 0; color: #7f1d1d; font-style: italic;">"${reason || 'Non spécifiée'}"</p>
        </div>
        
        <p style="${emailStyles.paragraph}">
            Si vous pensez qu'il s'agit d'une erreur, veuillez contacter directement les organisateurs du club.
        </p>
    `;

    return baseLayout(content);
};
