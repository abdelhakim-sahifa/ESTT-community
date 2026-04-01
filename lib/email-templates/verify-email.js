
import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const verifyEmailTemplate = (firstName, code) => {
    const content = `
        <h1 style="${emailStyles.h1}">Vérifiez votre adresse email</h1>
        
        <p style="${emailStyles.paragraph}">
            Bonjour ${firstName},<br><br>
            Merci de vouloir vérifier votre profil sur <strong>ESTT Community</strong>. Cette étape nous permet de garantir que vous êtes bien un étudiant de l'EST de Tétouan.
        </p>
        
        <div style="background-color: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b; font-weight: bold; text-transform: uppercase; tracking-wider: 0.05em;">
                Votre code de vérification
            </p>
            <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; color: #3b82f6; letter-spacing: 0.2em;">
                ${code}
            </div>
        </div>
        
        <p style="${emailStyles.paragraph}">
            Ce code est valable pendant <strong>10 minutes</strong>. Si vous n'avez pas demandé cette vérification, vous pouvez ignorer cet email en toute sécurité.
        </p>
        
        <div style="${emailStyles.highlightBox}">
            <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">
                <strong>Pourquoi vérifier mon email ?</strong><br>
                Un profil vérifié gagne en crédibilité auprès de la communauté et débloque le badge "Vérifié" sur votre page de profil.
            </p>
        </div>
        
        <p style="${emailStyles.paragraph}">
            À bientôt sur la plateforme !<br>
            L'équipe ESTT Community
        </p>
    `;

    return baseLayout(content);
};
