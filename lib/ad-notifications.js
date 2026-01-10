const API_URL = '/api/send-email';

async function sendEmail({ to, subject, html }) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, subject, html }),
        });
        return await response.json();
    } catch (error) {
        console.error('Email sending failed:', error);
        return { success: false, error };
    }
}

export const adNotifications = {
    // 1. Submission Received
    async sendSubmissionConfirmation(userEmail, adTitle) {
        const html = `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 40px; border-radius: 12px;">
                <h1 style="color: #3b82f6;">Annonce Reçue !</h1>
                <p>Bonjour,</p>
                <p>Nous avons bien reçu votre annonce : <strong>"${adTitle}"</strong>.</p>
                <p>Notre équipe va l'examiner prochainement. Vous recevrez un e-mail dès qu'elle sera modérée.</p>
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #64748b;">
                        Vous pouvez suivre l'état de vos annonces sur votre <a href="${window.location.origin}/ads-portal/dashboard">Tableau de Bord</a>.
                    </p>
                </div>
                <p>Merci de contribuer à la communauté ESTT.</p>
            </div>
        `;
        return sendEmail({ to: userEmail, subject: 'Confirmation de réception - ESTT Ads', html });
    },

    // 2. Approved (Payment Required)
    async sendApprovalNotice(userEmail, adTitle, pricing) {
        const html = `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 40px; border-radius: 12px;">
                <h1 style="color: #10b981;">Annonce Approuvée !</h1>
                <p>Excellente nouvelle ! Votre annonce <strong>"${adTitle}"</strong> a été validée par notre équipe.</p>
                <p>Pour l'activer sur la plateforme, un paiement est requis :</p>
                <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #d1fae5;">
                    <p style="margin: 0; font-weight: bold; color: #065f46;">Détails :</p>
                    <ul style="color: #065f46;">
                        <li>Durée : ${pricing.duration} jours</li>
                        <li>Prix : ${pricing.price} MAD</li>
                    </ul>
                </div>
                <p>Veuillez vous rendre sur votre <a href="${window.location.origin}/ads-portal/dashboard">Dashboard</a> pour finaliser le paiement.</p>
            </div>
        `;
        return sendEmail({ to: userEmail, subject: 'Votre annonce a été approuvée - ESTT Ads', html });
    },

    // 3. Rejected
    async sendRejectionNotice(userEmail, adTitle, reason) {
        const html = `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 40px; border-radius: 12px;">
                <h1 style="color: #ef4444;">Annonce Refusée</h1>
                <p>Bonjour,</p>
                <p>Nous regrettons de vous informer que votre annonce <strong>"${adTitle}"</strong> n'a pas pu être acceptée.</p>
                <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #fee2e2;">
                    <p style="margin: 0; font-weight: bold; color: #991b1b;">Raison du refus :</p>
                    <p style="color: #991b1b;">${reason}</p>
                </div>
                <p>Vous pouvez modifier votre annonce selon nos critères et la soumettre à nouveau.</p>
            </div>
        `;
        return sendEmail({ to: userEmail, subject: 'Mise à jour de votre annonce - ESTT Ads', html });
    },

    // 4. Payment Confirmed / Invoice
    async sendInvoice(userEmail, adTitle, amount, invoiceId) {
        const html = `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 40px; border-radius: 12px;">
                <h1 style="color: #3b82f6;">Reçu de Paiement</h1>
                <p>Votre annonce <strong>"${adTitle}"</strong> est désormais en ligne !</p>
                <div style="border: 1px solid #eee; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>N° Facture :</strong> ${invoiceId}</p>
                    <p><strong>Montant :</strong> ${amount} MAD</p>
                    <p><strong>Date :</strong> ${new Date().toLocaleDateString()}</p>
                    <p><strong>Statut :</strong> Payé ❤️</p>
                </div>
                <p>Merci pour votre confiance.</p>
            </div>
        `;
        return sendEmail({ to: userEmail, subject: 'Facture de votre annonce - ESTT Ads', html });
    }
};
