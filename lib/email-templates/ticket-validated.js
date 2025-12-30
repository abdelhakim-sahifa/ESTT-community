
import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const ticketValidatedEmail = (ticket, eventName, clubName) => {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticket.id}`;

    const content = `
        <h1 style="${emailStyles.h1}">Billet Validé !</h1>
        
        <p style="${emailStyles.paragraph}">
            Bonne nouvelle ! Votre billet pour l'événement <strong>${eventName}</strong> a été validé par l'équipe de <strong>${clubName}</strong>.
        </p>
        
        <div style="background-color: #dcfce7; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
            <p style="color: #166534; font-weight: bold; margin: 0; font-size: 18px;">Statut : VALIDÉ</p>
        </div>
        
        <div style="${emailStyles.highlightBox}; text-align: center;">
            <img src="${qrCodeUrl}" alt="QR Code du billet" style="width: 150px; height: 150px; border: 4px solid #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
             <p style="${emailStyles.code}; margin-top: 20px; display: inline-block;">
                ID: ${ticket.id}
            </p>
        </div>
        
        <p style="${emailStyles.paragraph}">
            Vous pouvez maintenant accéder à l'événement en présentant ce QR code.
        </p>
    `;

    return baseLayout(content);
};
