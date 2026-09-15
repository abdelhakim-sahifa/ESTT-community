import { baseLayout } from './layout';
import { emailStyles } from './styles';

export const rewardClaimedEmail = ({ isGuest, rewardType, email }) => {
    // Format the reward string nicely
    const formatReward = (r) => {
        if (!r) return 'ESTTPlus+';
        if (r.includes('month')) return `ESTTPlus+ (${r.split('_')[1].replace('month', ' Mois')})`;
        if (r.includes('day')) return `ESTTPlus+ (${r.split('_')[1].replace('day', ' Jours')})`;
        return 'ESTTPlus+';
    };

    const formattedReward = formatReward(rewardType);

    const content = `
        <div style="text-align: center; margin-bottom: 26px;">
            <img src="https://fnaiedociknutdxoezhn.supabase.co/storage/v1/object/public/ressources/ESTT-1.jpg" alt="Campus ESTT" style="width: 100%; max-height: 220px; object-fit: cover; border-radius: 12px;" />
        </div>

        <h1 style="${emailStyles.h1}; text-align: center; color: #0f172a;">Félicitations ! 🎉</h1>
        
        <p style="${emailStyles.paragraph}; text-align: center; font-size: 16px;">
            Grâce à votre engagement sur ESTT Community, vous venez de débloquer une récompense exclusive : <br/>
            <strong style="color: #0056b3; font-size: 20px; display: inline-block; margin-top: 8px;">${formattedReward}</strong>
        </p>

        <div style="background: linear-gradient(135deg, #0056b3 0%, #00a8ff 100%); padding: 24px; border-radius: 14px; color: white; margin: 28px 0;">
            <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #ffffff;">Qu'est-ce que l'ESTT Community ? 🚀</h2>
            <p style="margin: 0; line-height: 1.6; font-size: 15px; color: #dbeafe;">
                La plateforme 100% étudiante de l'École Supérieure de Technologie de Tétouan : 
                cours, événements, clubs et actus du campus, réunis au même endroit pour faciliter votre vie étudiante.
            </p>
        </div>

        ${isGuest ? `
        <div style="${emailStyles.warningBox}">
            <h3 style="margin: 0 0 8px 0; color: #b45309; font-size: 16px;">🚨 Dernière étape : activez votre récompense</h3>
            <p style="${emailStyles.paragraph}; color: #92400e; margin-bottom: 16px;">
                Votre récompense a bien été réservée pour l'adresse <strong>${email}</strong>, 
                mais vous n'avez pas encore de profil sur notre plateforme. 
                <br/><br/>
                Créez simplement un compte avec cette même adresse : votre badge VIP sera activé automatiquement !
            </p>
            <div style="text-align: center;">
                <a href="https://estt.ma/signup" style="${emailStyles.button}; background-color: #d97706; display: inline-block;">Créer mon Compte</a>
            </div>
        </div>
        ` : `
        <div style="${emailStyles.successBox}">
            <h3 style="margin: 0 0 8px 0; color: #065f46; font-size: 16px;">✅ Récompense activée !</h3>
            <p style="${emailStyles.paragraph}; color: #065f46; margin-bottom: 16px;">
                Votre badge VIP <strong>ESTTPlus+</strong> est maintenant actif sur votre profil public : 
                il s'affiche pour la communauté et vous donne accès aux contenus et événements exclusifs.
            </p>
            <div style="text-align: center;">
                <a href="https://estt.ma/profile" style="${emailStyles.button}; background-color: #059669; display: inline-block;">Voir mon Profil</a>
            </div>
        </div>
        `}

        <h3 style="${emailStyles.h3}">Découvrez nos clubs étudiants</h3>
        <p style="${emailStyles.paragraph}">
            Tech, sport, art... Il y a forcément un club fait pour vous. Rejoignez-le, participez aux activités et faites vivre la communauté.
        </p>
        
        <div style="text-align: center; margin: 24px 0;">
            <a href="https://estt.ma/clubs" style="${emailStyles.button}; background-color: #0f172a; color: white;">Explorer les Clubs →</a>
        </div>

        <p style="${emailStyles.small}; text-align: center;">
            Une question sur votre récompense ? Répondez simplement à cet email.
        </p>
        
        <p style="${emailStyles.paragraph}; margin-top: 26px; text-align: center; color: #64748b;">
            À très vite sur le campus !<br>
            <strong>L'équipe ESTT Community</strong>
        </p>
    `;

    return baseLayout(content);
};