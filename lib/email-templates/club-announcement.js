import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const clubAnnouncementEmail = (title, content, clubName, ctaLabel, ctaLink, clubLogo, clubThemeColor, coverImageUrl) => {
    // Process content to handle new lines as paragraphs
    const paragraphs = content.split('\n').filter(p => p.trim() !== '');
    const contentHtml = paragraphs.map(p => `<p style="${emailStyles.paragraph}">${p}</p>`).join('');

    // Dynamic styles based on club theme color
    const themeColor = clubThemeColor || '#0056b3';
    const buttonStyle = `${emailStyles.button}; background-color: ${themeColor};`;
    const headerAccentStyle = `border-top: 4px solid ${themeColor};`;

    const mainContent = `
        <div style="${headerAccentStyle}; padding: 20px 0; border-bottom: 1px solid #f0f5fa; margin-bottom: 28px; text-align: center;">
            ${clubLogo ? `<img src="${clubLogo}" alt="${clubName}" style="height: 56px; width: 56px; border-radius: 14px; object-fit: cover; display: inline-block; margin-bottom: 10px;">` : ''}
            <div style="font-size: 18px; font-weight: 700; color: ${themeColor};">${clubName}</div>
        </div>

        ${coverImageUrl ? `
        <div style="margin-bottom: 24px;">
            <img src="${coverImageUrl}" alt="Image de couverture" style="width: 100%; height: auto; border-radius: 12px; display: block; max-height: 320px; object-fit: cover;">
        </div>
        ` : ''}

        <h1 style="${emailStyles.h1}">${title}</h1>
        
        <div style="margin-bottom: 24px; color: #334155;">
            ${contentHtml}
        </div>
        
        ${ctaLabel && ctaLink ? `
        <div style="text-align: center; margin-top: 28px; margin-bottom: 28px;">
            <a href="${ctaLink}" style="${buttonStyle}">${ctaLabel}</a>
        </div>
        ` : ''}
        
        <p style="${emailStyles.paragraph}">
            Cordialement,<br>
            <strong>L'équipe ${clubName}</strong>
        </p>

        <hr style="${emailStyles.divider}" />
        
        <p style="${emailStyles.small}; margin: 0;">
            Vous recevez cet email car vous êtes membre du club ${clubName}. Préférez ne plus recevoir ces annonces ? Modifiez vos notifications depuis votre profil.
        </p>
    `;

    return baseLayout(mainContent);
};