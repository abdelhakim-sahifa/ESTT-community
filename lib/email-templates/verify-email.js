import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const verifyEmailTemplate = (firstName, code) => {
    const content = `
        <h1 style="${emailStyles.h1}">Vérifiez votre adresse email</h1>
        
        <p style="${emailStyles.paragraph}">
            Bonjour ${firstName},<br><br>
            Merci de vous être inscrit sur <strong>ESTT Community</strong> ! Il ne reste plus qu'une étape pour activer votre compte : vérifier votre adresse email. Cela nous permet de confirmer que vous êtes bien un étudiant de l'EST de Tétouan.
        </p>
        
        <div style="${emailStyles.highlightBox}; text-align: center; padding: 28px 24px;">
            <p style="margin: 0 0 12px 0; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;">
                Votre code de vérification
            </p>
            <div style="font-family: 'Roboto Mono', 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; color: #0056b3; letter-spacing: 0.22em;">
                ${code}
            </div>
        </div>
        
        <p style="${emailStyles.paragraph}">
            Saisissez ce code dans <strong>l'application</strong> : il est valable pendant <strong>10 minutes</strong>. Une fois vérifié, votre profil gagne le badge <strong>"Vérifié"</strong> et devient pleinement visible par la communauté.
        </p>
        
        <div style="${emailStyles.infoBox}">
            <p style="margin: 0; font-size: 14px; line-height: 1.6;">
                <strong>Vous n'avez pas demandé cette vérification ?</strong><br>
                Rien à faire : ignorez simplement cet email. Vous pourrez toujours renvoyer un nouveau code depuis la page de connexion.
            </p>
        </div>
        
        <p style="${emailStyles.paragraph}">
            À très bientôt sur la plateforme !<br>
            L'équipe ESTT Community
        </p>
    `;

    return baseLayout(content);
};