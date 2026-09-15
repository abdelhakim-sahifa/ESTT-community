import { baseLayout } from './layout';
import { emailStyles } from './styles';

/**
 * Global Announcement Email Template
 * @param {string} title - The title/heading of the announcement
 * @param {string} content - The main body text
 * @param {string} ctaLabel - Optional button label
 * @param {string} ctaLink - Optional button link
 * @param {string} coverImageUrl - Optional header image
 * @returns {string} - Full HTML email content
 */
export const globalAnnouncementEmail = (title, content, ctaLabel, ctaLink, coverImageUrl) => {
    // Process content to handle new lines as paragraphs
    const paragraphs = content.split('\n').filter(p => p.trim() !== '');
    const contentHtml = paragraphs.map(p => `<p style="${emailStyles.paragraph}">${p}</p>`).join('');

    const mainContent = `
        <div style="text-align: center; margin-bottom: 24px;">
            <span style="display: inline-block; background-color: #eff6ff; border: 1px solid #bfdbfe; color: #0056b3; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 6px 16px; border-radius: 999px;">Annonce officielle</span>
        </div>

        ${coverImageUrl ? `
        <div style="margin-bottom: 24px;">
            <img src="${coverImageUrl}" alt="Image de l'annonce" style="width: 100%; height: auto; border-radius: 12px; display: block; max-height: 320px; object-fit: cover;">
        </div>
        ` : ''}

        <h1 style="${emailStyles.h1}">${title}</h1>
        
        <div style="margin-bottom: 24px; color: #334155;">
            ${contentHtml}
        </div>
        
        ${ctaLabel && ctaLink ? `
        <div style="text-align: center; margin-top: 28px; margin-bottom: 28px;">
            <a href="${ctaLink}" style="${emailStyles.button}">${ctaLabel}</a>
        </div>
        ` : ''}
        
        <p style="${emailStyles.paragraph}">
            Cordialement,<br>
            <strong>L'équipe ESTT-Community</strong>
        </p>

        <hr style="${emailStyles.divider}" />
        
        <p style="${emailStyles.small}; margin: 0;">
            Vous recevez ce message car il s'agit d'une annonce officielle adressée à toute la communauté ESTT Community.
        </p>
    `;

    return baseLayout(mainContent);
};