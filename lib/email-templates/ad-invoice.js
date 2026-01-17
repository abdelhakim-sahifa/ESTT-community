
import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const adInvoiceEmail = (adTitle, amount, invoiceId) => {
    const content = `
        <h1 style="${emailStyles.h1}">Confirmation & Facture</h1>
        
        <p style="${emailStyles.paragraph}">
            Votre annonce <strong>"${adTitle}"</strong> est désormais en ligne ! Merci pour votre confiance.
        </p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 25px 0;">
            <p style="${emailStyles.paragraph}; margin-bottom: 10px;"><strong>Détails de la transaction :</strong></p>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">N° Facture</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #1e293b;">${invoiceId}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Montant Payé</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #1e293b;">${amount} MAD</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Date</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #1e293b;">${new Date().toLocaleDateString()}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Statut</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #10b981;">PAYÉ ❤️</td>
                </tr>
            </table>
        </div>
        
        <p style="${emailStyles.paragraph}">
            Vous pouvez consulter les statistiques de votre annonce sur votre tableau de bord.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://estt-community.vercel.app/ads-portal/dashboard" style="${emailStyles.button}">Accéder au Dashboard</a>
        </div>
    `;

    return baseLayout(content);
};
