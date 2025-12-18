# ESTT Community - Next.js

Plateforme communautaire pour partager, découvrir et contribuer des ressources, événements et projets liés à la communauté EST Tétouan.

## 🚀 Migration vers Next.js

Ce projet a été migré d'une application HTML/CSS/JS statique vers une application Next.js moderne avec les fonctionnalités suivantes :

- ⚡ **Next.js 14** avec App Router
- 🔥 **Firebase Realtime Database** pour le stockage des données
- 📦 **Supabase Storage** pour les fichiers uploadés
- 🎨 **CSS personnalisé** avec design responsive
- 📱 **Mobile-first** design

## 📋 Prérequis

- Node.js 18+ et npm
- Compte Firebase (pour la base de données)
- Compte Supabase (pour le stockage de fichiers)

## 🛠️ Installation

1. **Cloner le repository**
   ```bash
   git clone https://github.com/abdelhakim-sahifa/ESTT-community.git
   cd "est nextjs"
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration des variables d'environnement**
   
   Copiez `.env.local.example` vers `.env.local` et configurez vos clés :
   ```bash
   copy .env.local.example .env.local
   ```

4. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

5. **Ouvrir dans le navigateur**
   
   Visitez [http://localhost:3000](http://localhost:3000)

## 📁 Structure du projet

```
├── app/                    # Pages Next.js (App Router)
│   ├── layout.js          # Layout racine
│   ├── page.js            # Page d'accueil
│   ├── blog/              # Pages du blog
│   ├── browse/            # Navigation des ressources
│   ├── contribute/        # Formulaire de contribution
│   ├── login/             # Page de connexion
│   ├── signup/            # Page d'inscription
│   ├── profile/           # Profil utilisateur
│   ├── admin/             # Administration
│   └── thanks/            # Page de remerciement
├── components/            # Composants React réutilisables
│   ├── Header.js          # En-tête avec navigation
│   └── Footer.js          # Pied de page
├── lib/                   # Bibliothèques et utilitaires
│   ├── firebase.js        # Configuration Firebase
│   ├── supabase.js        # Configuration Supabase
│   └── data.js            # Données statiques (filières, modules)
├── public/                # Fichiers statiques
│   ├── assets/            # Images et ressources
│   └── fonts/             # Polices personnalisées
└── next.config.js         # Configuration Next.js
```

## 🎯 Fonctionnalités

### Pour les étudiants
- 📚 **Explorer les ressources** par filière, semestre et module
- ✍️ **Contribuer** des cours, TDs, exercices ou vidéos
- 📝 **Écrire des articles** de blog pour partager des expériences
- 🔍 **Rechercher** des ressources spécifiques

### Pour les administrateurs
- ✅ **Modérer** les contributions
- 📊 **Gérer** les ressources et utilisateurs
- 📈 **Suivre** les statistiques de la plateforme

## 🔐 Authentification

L'application utilise Firebase Authentication avec validation d'email académique (@etu.uae.ac.ma).

## 📦 Technologies utilisées

- **Framework**: Next.js 14
- **Base de données**: Firebase Realtime Database
- **Stockage**: Supabase Storage
- **Styling**: CSS personnalisé
- **Icônes**: Font Awesome 6
- **Polices**: Outfit (Google Fonts) + Canela (custom)

## 🚢 Déploiement

### Vercel (recommandé)
```bash
npm run build
vercel deploy
```

### Autre plateforme
```bash
npm run build
npm start
```

## 📝 Scripts disponibles

- `npm run dev` - Lancer le serveur de développement
- `npm run build` - Construire l'application pour la production
- `npm start` - Lancer l'application en mode production
- `npm run lint` - Vérifier le code avec ESLint

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 License

Ce projet est sous licence MIT.

## 👥 Auteurs

**Promo 2 - EST Tétouan**

Fait avec ❤️ pour les futurs étudiants de l'EST Tétouan.

## 🆘 Support

Pour toute question ou problème, ouvrez une issue sur GitHub.
