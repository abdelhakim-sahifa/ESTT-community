
import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const clubAnnouncementEmail = (title, content, clubName, ctaLabel, ctaLink, clubLogo, clubThemeColor, coverImageUrl) => {
    // Process content to handle new lines as paragraphs
    const paragraphs = content.split('\n').filter(p => p.trim() !== '');
    const contentHtml = paragraphs.map(p => `<p style="${emailStyles.paragraph}">${p}</p>`).join('');

    // Dynamic styles based on club theme color
    const themeColor = clubThemeColor || '#2563eb';
    const buttonStyle = `${emailStyles.button}; background-color: ${themeColor};`;
    const headerAccentStyle = `border-top: 4px solid ${themeColor};`;

    const mainContent = `
        <div style="${headerAccentStyle} padding: 20px 0; border-bottom: 1px solid #f0f0f0; margin-bottom: 30px;">
            <table width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                    <td align="left" style="vertical-align: middle;">
                        ${clubLogo ? `<img src="${clubLogo}" alt="${clubName}" style="height: 50px; width: auto; display: block; border-radius: 4px;">` : `<span style="font-weight: bold; font-size: 18px; color: ${themeColor}">${clubName}</span>`}
                    </td>
                    <td align="center" style="vertical-align: middle; padding: 0 10px; color: #94a3b8; font-size: 20px;">
                        &times;
                    </td>
                    <td align="right" style="vertical-align: middle;">
                        <span style="${emailStyles.logo}">
                            ESTT<span style="${emailStyles.logoHighlight}">.Community</span>
                        </span>
                    </td>
                </tr>
            </table>
        </div>

        ${coverImageUrl ? `
        <div style="margin-bottom: 30px;">
            <img src="${coverImageUrl}" alt="Cover Image" style="width: 100%; height: auto; border-radius: 8px; display: block; max-height: 400px; object-fit: cover;">
        </div>
        ` : ''}

        <h1 style="${emailStyles.h1}">${title}</h1>
        
        <div style="margin-bottom: 30px; color: #334155;">
            ${contentHtml}
        </div>
        
        ${ctaLabel && ctaLink ? `
        <div style="text-align: center; margin-top: 30px; margin-bottom: 30px;">
            <a href="${ctaLink}" style="${buttonStyle}">${ctaLabel}</a>
        </div>
        ` : ''}
        
        <p style="${emailStyles.paragraph}">
            Cordialement,<br>
            <strong>L'équipe ${clubName}</strong>
        </p>
    `;

    return baseLayout(mainContent);
};
