
import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const ticketConfirmationEmail = (ticket, eventName, clubName) => {
    // Generate QR code URL (using a public API for now, e.g., goqr.me or similar)
    // In production, you might generate this server-side or use a library.
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticket.id}`;

    const content = `
        <h1 style="${emailStyles.h1}">Confirmation de votre billet</h1>
        
        <p style="${emailStyles.paragraph}">
            Votre billet pour l'événement <strong>${eventName}</strong> organisé par <strong>${clubName}</strong> est confirmé.
        </p>
        
        <div style="${emailStyles.highlightBox}; text-align: center;">
            <p style="${emailStyles.paragraph}; margin-bottom: 20px;">
                <strong>Votre billet numérique</strong>
            </p>
            
            <img src="${qrCodeUrl}" alt="QR Code du billet" style="width: 150px; height: 150px; border: 4px solid #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            
            <p style="${emailStyles.code}; margin-top: 20px; display: inline-block;">
                ID: ${ticket.id}
            </p>
        </div>
        
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 6px;">
            <h2 style="${emailStyles.h2}; margin-top: 0;">Détails</h2>
            <p style="margin: 5px 0;"><strong>Participant :</strong> ${ticket.firstName} ${ticket.lastName}</p>
            <p style="margin: 5px 0;"><strong>Type :</strong> ${ticket.type || 'Standard'}</p>
            <p style="margin: 5px 0;"><strong>Statut :</strong> <span style="color: #ea580c; font-weight: bold;">En attente de validation</span></p>
        </div>
        
        <p style="${emailStyles.paragraph}; margin-top: 20px;">
            Veuillez présenter ce QR code à l'entrée de l'événement.
        </p>
    `;

    return baseLayout(content);
};
