import { emailStyles } from './styles';

export const baseLayout = (content) => {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ESTT Community</title>
</head>
<body style="${emailStyles.body}">
    <!-- Preheader -->
    <div style="display: none; max-height: 0; max-width: 0; overflow: hidden; mso-hide: all;">
        L'actualité de la vie étudiante à l'EST de Tétouan&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
    </div>

    <div style="${emailStyles.container}">
        <!-- Brand accent bar -->
        <div style="${emailStyles.topBar}"></div>

        <!-- Header -->
        <div style="${emailStyles.header}">
            <a href="https://estt.ma/" target="_blank" rel="noopener">
                <img
                    src="https://estt.ma/assets/images/platform_logo_white_bg.svg"
                    alt="ESTT Community"
                    width="183"
                    height="44"
                    style="${emailStyles.logo}"
                />
            </a>
        </div>

        <!-- Content -->
        <div style="${emailStyles.content}">
            ${content}
        </div>

        <!-- Footer -->
        <div style="${emailStyles.footer}">
            <p style="margin: 0 0 12px 0;">
                © ${new Date().getFullYear()} ESTT Community. Tous droits réservés.
            </p>
            <div style="margin-bottom: 14px;">
                <a href="https://estt.ma/" style="color: #64748b; text-decoration: none; font-size: 12px; margin: 0 8px;">Accueil</a>
                <span style="color: #cbd5e1;">•</span>
                <a href="https://estt.ma/clubs" style="color: #64748b; text-decoration: none; font-size: 12px; margin: 0 8px;">Clubs</a>
                <span style="color: #cbd5e1;">•</span>
                <a href="https://estt.ma/events" style="color: #64748b; text-decoration: none; font-size: 12px; margin: 0 8px;">Événements</a>
                <span style="color: #cbd5e1;">•</span>
                <a href="https://estt.ma/contribute" style="color: #64748b; text-decoration: none; font-size: 12px; margin: 0 8px;">Contribuer</a>
            </div>
            <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                EST Tétouan · La plateforme qui connecte les étudiants
            </p>
        </div>
    </div>
</body>
</html>
    `;
};