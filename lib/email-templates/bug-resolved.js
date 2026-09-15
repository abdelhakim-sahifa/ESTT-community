import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const bugResolvedEmail = (userName, bugTitle, referenceId) => {
    const content = `
        <h1 style="${emailStyles.h1}">Bug résolu ! 🚀</h1>
        
        <p style="${emailStyles.paragraph}">
            Bonjour <strong>${userName || 'Cher utilisateur'}</strong>,
        </p>
        
        <p style="${emailStyles.paragraph}">
            Excellente nouvelle : le bug que vous avez signalé a été corrigé par notre équipe technique.
        </p>
        
        <div style="${emailStyles.successBox}">
            <p style="margin: 0 0 6px 0; font-weight: bold;">Détails du rapport :</p>
            <p style="margin: 0; font-size: 14px;">
                <strong>Sujet :</strong> ${bugTitle}<br>
                <strong>Référence :</strong> ${referenceId}
            </p>
        </div>
        
        <p style="${emailStyles.paragraph}">
            N'hésitez pas à vérifier que tout fonctionne désormais comme prévu. Si le problème persiste — ou si vous rencontrez autre chose — signalez-le nous : chaque retour nous aide à améliorer la plateforme.
        </p>
        
        <div style="text-align: center; margin: 28px 0;">
            <a href="https://estt.ma/" style="${emailStyles.button}">
                Visiter la plateforme
            </a>
        </div>
        
        <p style="${emailStyles.paragraph}">
            Merci encore pour votre précieux retour !
        </p>
    `;

    return baseLayout(content);
};