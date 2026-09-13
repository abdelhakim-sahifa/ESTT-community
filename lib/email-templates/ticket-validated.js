import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const ticketValidatedEmail = (ticket, eventName, clubName) => {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${ticket.id}`;

    const content = `
        <h1 style="${emailStyles.h1}">Billet validé 🎉</h1>
        
        <p style="${emailStyles.paragraph}">
            Excellente nouvelle ! Votre billet pour l'événement <strong>${eventName}</strong> a été validé par l'équipe de <strong>${clubName}</strong>. Vous êtes officiellement attendu !
        </p>
        
        <div style="${emailStyles.successBox}; text-align: center; padding: 20px;">
            <p style="color: #065f46; font-weight: bold; margin: 0; font-size: 18px;">Statut : VALIDÉ</p>
        </div>
        
        <div style="${emailStyles.highlightBox}; text-align: center; padding: 28px 24px;">
            <img src="${qrCodeUrl}" alt="QR Code du billet" style="width: 150px; height: 150px; border: 4px solid #ffffff; box-shadow: 0 4px 10px rgba(15, 23, 42, 0.12); border-radius: 10px;">
             <p style="${emailStyles.code}; margin-top: 20px; display: inline-block;">
                ID: ${ticket.id}
            </p>
        </div>
        
        <p style="${emailStyles.paragraph}">
            Le jour J, présentez ce QR code à l'accueil de l'événement. Gardez-le à portée de main, il vous permet aussi d'accéder à votre billet à tout moment depuis votre profil.
        </p>
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://estt.ma/tickets/${ticket.id}" style="${emailStyles.button}">Voir mon Ticket Digital</a>
        </div>
    `;

    return baseLayout(content);
};