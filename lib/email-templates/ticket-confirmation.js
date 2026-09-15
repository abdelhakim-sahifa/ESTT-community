import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const ticketConfirmationEmail = (ticket, eventName, clubName) => {
    // Generate QR code URL (using a public API for now, e.g., goqr.me or similar)
    // In production, you might generate this server-side or use a library.
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${ticket.id}`;

    const content = `
        <h1 style="${emailStyles.h1}">Confirmation de votre billet</h1>
        
        <p style="${emailStyles.paragraph}">
            Votre inscription est confirmée ! Vous êtes attendu à l'événement <strong>${eventName}</strong>, organisé par <strong>${clubName}</strong>. Voici votre billet numérique :
        </p>
        
        <div style="${emailStyles.highlightBox}; text-align: center; padding: 28px 24px;">
            <p style="${emailStyles.paragraph}; margin-bottom: 20px;">
                <strong>Votre billet numérique</strong>
            </p>
            
            <img src="${qrCodeUrl}" alt="QR Code du billet" style="width: 150px; height: 150px; border: 4px solid #ffffff; box-shadow: 0 4px 10px rgba(15, 23, 42, 0.12); border-radius: 10px;">
            
            <p style="${emailStyles.code}; margin-top: 20px; display: inline-block;">
                ID: ${ticket.id}
            </p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; border: 1px solid #eef2f6; border-radius: 12px;">
            <h2 style="${emailStyles.h2}; margin-top: 0;">Détails de l'événement</h2>
            <p style="margin: 5px 0;"><strong>Événement :</strong> ${eventName}</p>
            <p style="margin: 5px 0;"><strong>Date :</strong> ${ticket.eventDate || 'À confirmer'}</p>
            ${ticket.eventTime ? `<p style="margin: 5px 0;"><strong>Heure :</strong> ${ticket.eventTime}</p>` : ''}
            ${ticket.eventLocation ? `<p style="margin: 5px 0;"><strong>Lieu :</strong> ${ticket.eventLocation}</p>` : ''}
            <p style="margin: 10px 0 0 0; border-top: 1px solid #e2e8f0; padding-top: 12px;"><strong>Participant :</strong> ${ticket.firstName ? `${ticket.firstName} ${ticket.lastName || ''}` : (ticket.userName || 'Participant')}</p>
            <p style="margin: 5px 0;"><strong>Statut :</strong> <span style="color: #b45309; background-color: #fffbeb; border: 1px solid #fde68a; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;">En attente de validation</span></p>
        </div>
        
        <p style="${emailStyles.paragraph}; margin-top: 20px;">
            Votre billet est actuellement <strong>en attente de validation</strong> par l'équipe du club. Vous recevrez un email dès qu'il sera validé.
        </p>
        
        <p style="${emailStyles.paragraph}">
            Le jour de l'événement, présentez simplement ce QR code à l'entrée. Pensez à arriver quelques minutes en avance pour un accès sans stress !
        </p>
    `;

    return baseLayout(content);
};