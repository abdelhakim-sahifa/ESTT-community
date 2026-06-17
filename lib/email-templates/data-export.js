import { baseLayout } from './layout';
import { emailStyles } from './styles';

/**
 * Email sent to the user after requesting a personal data export.
 * The downloadUrl is a one-time link valid for 24 hours.
 *
 * @param {object} params
 * @param {string} params.firstName
 * @param {string} params.email
 * @param {string} params.downloadUrl - One-time secure download link
 * @param {string} params.exportDate  - Formatted date string
 */
export const dataExportEmail = ({ firstName, email, downloadUrl, exportDate, screenshotUrl }) => {
    const content = `
        <h1 style="${emailStyles.h1}">📦 Votre export de données est prêt</h1>

        <p style="${emailStyles.paragraph}">
            Bonjour <strong>${firstName}</strong>,
        </p>

        <p style="${emailStyles.paragraph}">
            Suite à votre demande, votre export de données personnelles 
            <strong>ESTT Community</strong> est disponible. Cliquez sur le bouton 
            ci-dessous pour générer et télécharger automatiquement votre fichier PDF.
        </p>

        ${screenshotUrl ? `
        <div style="margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #f8fafc; padding: 10px 15px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #475569;">
                📸 Capture d'écran de votre profil public :
            </div>
            <div style="padding: 12px; background-color: #ffffff; text-align: center;">
                <img src="${screenshotUrl}" alt="Capture d'écran de votre profil" style="max-width: 100%; height: auto; border-radius: 4px; border: 1px solid #f1f5f9;" />
            </div>
        </div>
        ` : ''}

        <div style="${emailStyles.highlightBox}">
            <p style="margin: 0 0 10px 0; font-weight: 600; color: #0f172a;">📋 Ce fichier contiendra :</p>
            <ul style="padding-left: 20px; color: #334155; margin: 0;">
                <li style="margin-bottom: 8px;">Informations de profil (nom, email, filière, promotion)</li>
                <li style="margin-bottom: 8px;">Photo de profil</li>
                <li style="margin-bottom: 8px;">Contributions et ressources partagées</li>
                <li style="margin-bottom: 8px;">Ressources enregistrées (favoris)</li>
                <li style="margin-bottom: 8px;">Tickets d'événements</li>
                <li style="margin-bottom: 8px;">Statistiques et succès</li>
            </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${downloadUrl}" style="${emailStyles.button}" target="_blank" rel="noopener noreferrer">
                ⬇️ Télécharger mes données (PDF)
            </a>
        </div>

        <div style="background-color: #fef2f2; border-radius: 6px; padding: 16px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 0; font-size: 13px; color: #7f1d1d; line-height: 1.6;">
                <strong>⚠️ Lien à usage unique :</strong> Ce lien ne peut être utilisé 
                <strong>qu'une seule fois</strong> et expire dans <strong>24 heures</strong>.<br>
                Si vous ne l'avez pas demandé, ignorez cet email ou contactez-nous à 
                <a href="mailto:estt.community@gmail.com" style="color: #2563eb;">estt.community@gmail.com</a>.
            </p>
        </div>

        <p style="${emailStyles.paragraph}; font-size: 13px; color: #64748b;">
            Demande effectuée le : <strong>${exportDate}</strong><br>
            Compte associé : <strong>${email}</strong>
        </p>

        <p style="${emailStyles.paragraph}">
            Cordialement,<br>
            <strong>L'équipe ESTT Community</strong>
        </p>
    `;

    return baseLayout(content);
};
