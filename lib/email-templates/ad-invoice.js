import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const adInvoiceEmail = (adTitle, amount, invoiceId) => {
    const content = `
        <h1 style="${emailStyles.h1}">Confirmation & facture</h1>
        
        <p style="${emailStyles.paragraph}">
            Merci pour votre confiance ! Votre annonce <strong>"${adTitle}"</strong> est officiellement en ligne et visible par la communauté ESTT Community.
        </p>
        
        <div style="background-color: #f8fafc; border: 1px solid #eef2f6; border-radius: 14px; padding: 24px; margin: 24px 0; overflow: hidden;">
            <div style="background: linear-gradient(90deg, #0056b3, #00a8ff); margin: -24px -24px 18px -24px; padding: 14px 24px;">
                <p style="margin: 0; color: #ffffff; font-weight: 700; font-size: 16px;">Récapitulatif de votre facture</p>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">N° Facture</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">${invoiceId}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Annonce</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">${adTitle}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Montant payé</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #0f172a; font-size: 16px;">${amount} MAD</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Date</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">${new Date().toLocaleDateString('fr-FR')}</td>
                </tr>
            </table>
            <div style="border-top: 1px solid #e2e8f0; margin-top: 12px; padding-top: 14px; text-align: center;">
                <span style="color: #059669; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 4px 14px; border-radius: 999px; font-size: 12px; font-weight: 700;">PAYÉ</span>
            </div>
        </div>
        
        <p style="${emailStyles.paragraph}">
            Vous pouvez suivre les performances de votre campagne (vues, clics) en temps réel depuis votre tableau de bord.
        </p>
        
        <div style="text-align: center; margin-top: 28px;">
            <a href="https://estt.ma/ads-portal/dashboard" style="${emailStyles.button}">Accéder au Dashboard</a>
        </div>

        <p style="${emailStyles.small}; text-align: center;">
            Une question sur votre campagne ? Répondez simplement à cet email.
        </p>
    `;

    return baseLayout(content);
};