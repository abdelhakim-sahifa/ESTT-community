# ESTT Community

Plateforme web communautaire pour les etudiants de l'EST Tetouan.

Le projet a depasse le stade initial de simple partage de ressources. Aujourd'hui, il combine:

- une bibliotheque de ressources academiques par filiere, semestre et module
- un espace clubs avec pages publiques, administration, adhesion, formulaires et publications
- un calendrier d'evenements avec inscriptions et tickets
- un systeme de notifications
- un chat etudiant par filiere / niveau
- un portail publicitaire etudiant
- une experience PWA, avec aussi une page de telechargement pour l'app mobile ESTT+

## Etat Actuel

Le depot correspond a l'application web principale en production sous Next.js 14.

Situation actuelle du produit:

- le front principal, l'espace admin, les pages clubs, les ressources, les notifications, les evenements et le chat sont implementes dans ce repo
- Firebase Realtime Database reste la source de verite pour les donnees applicatives
- les uploads de ressources sont desormais orientes vers Google Drive via l'API `/api/upload-drive`
- des helpers Supabase existent encore dans le code pour du stockage historique / legacy
- Stripe est branche pour les paiements de billets et des annonces
- Slack et l'envoi d'e-mails sont utilises pour les notifications operationnelles
- l'application est configuree comme PWA avec `next-pwa`

En bref: ce n'est plus seulement un site vitrine, mais une plateforme campus avec plusieurs flux metier relies entre eux.

## Fonctionnalites

### Pour les etudiants

- parcourir les ressources par filiere, semestre et module
- consulter les details d'une ressource, ses metadonnees et ses notes
- contribuer des PDF, images, liens ou videos
- lier une meme ressource a plusieurs modules equivalentes
- rejoindre des clubs et consulter leurs publications
- s'inscrire a des evenements de clubs
- acheter / valider des tickets pour les evenements payants
- recevoir des notifications globales et privees
- utiliser un chat communautaire lie a la filiere et a l'annee d'etude
- gerer son profil, ses favoris et ses contributions
- consulter les offres / annonces etudiantes

### Pour les clubs

- disposer d'une page club dediee
- publier des annonces, activites et posts
- gerer des evenements et inscriptions
- proposer des formulaires
- administrer des membres
- generer des certificats et utiliser un scanner pour certains flux admin

### Pour l'administration

- moderer les ressources en attente
- gerer les utilisateurs
- gerer les annonces admin et les notifications
- traiter les demandes de clubs et les changements lies aux clubs
- suivre les bugs reportes
- administrer les annonces payantes
- gerer des URLs courtes et plusieurs reglages de plateforme

## Apercu Des Routes

Routes principales actuellement presentes dans le projet:

- `/` : page d'accueil marketing avec hero, activite recente, clubs et annonces
- `/browse` : navigation des ressources
- `/contribute` : soumission de ressources
- `/search` : recherche
- `/clubs` : annuaire des clubs
- `/clubs/[clubId]` : page detail d'un club
- `/events` : calendrier global des evenements
- `/chat` : espace discussion
- `/notifications` : centre de notifications
- `/profile` et `/profile/[id]` : profils et activite utilisateur
- `/ads-portal` : portail publicitaire
- `/admin` : back-office
- `/download` : page de telechargement / presentation d'ESTT+
- `/privacy` et `/terms` : pages legales

## Stack Technique

- Next.js 14 avec App Router
- React 18
- Firebase Realtime Database
- Firebase Authentication
- Firebase Storage (support historique / annexe)
- Google Drive API pour les uploads actuels
- Supabase Storage pour certains assets / usage legacy
- Stripe pour les paiements
- Nodemailer pour les e-mails transactionnels
- Slack Webhooks pour les alertes internes
- Tailwind CSS + composants UI Radix / shadcn
- `next-pwa` pour le mode application installable

## Architecture Simplifiee

- `app/` contient les routes App Router, les layouts et les API routes
- `components/` contient les composants UI, marketing, clubs et admin
- `context/` centralise l'authentification cote client
- `lib/` regroupe Firebase, Stripe, Slack, Drive, metadata, notifications et templates email
- `public/` contient les icones PWA, images et assets statiques
- `docs/` contient des notes de migration, de release et d'integration

Organisation fonctionnelle dans `app/`:

- `(marketing)` pour les pages publiques
- `(auth)` pour login / signup / verification
- `(core)` pour les espaces applicatifs connectes
- `(admin)` pour le back-office
- `(legal)` pour les pages juridiques
- `api/` pour les integrations serveur

## Installation

### Prerequis

- Node.js 18 ou 20
- npm
- un projet Firebase configure
- un compte Google avec acces Drive si vous utilisez les uploads actuels
- un compte Stripe si vous activez les paiements
- optionnel: webhooks Slack et une boite Gmail pour les notifications

### Lancement local

```bash
git clone https://github.com/abdelhakim-sahifa/ESTT-community.git
cd ESTT-community
npm install
npm run dev
```

Application disponible sur [http://localhost:3000](http://localhost:3000).

## Configuration

Le projet lit une partie de sa configuration depuis l'environnement, et une autre partie depuis Firebase.

Variables d'environnement detectees dans le code:

```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000

GOOGLE_DRIVE_REFRESH_TOKEN=
GOOGLE_DRIVE_FOLDER_ID=

SLACK_WEBHOOK_ALERTS=
SLACK_WEBHOOK_ADMIN=
SLACK_WEBHOOK_FINANCE=
SLACK_WEBHOOK_COMMUNITY=
```

Notes utiles:

- l'upload Drive peut aussi recuperer un refresh token depuis `adminSettings/driveConfig` dans Firebase
- certaines integrations sont encore en transition entre anciennes valeurs codees en dur et configuration externalisee
- pour un deploiement propre, il est recommande de migrer tous les secrets vers des variables d'environnement securisees

## Paiements, Notifications Et Integrations

- `app/api/checkout` cree une session Stripe pour billets ou annonces
- `app/api/verify-payment` sert de verification applicative cote ticket
- `app/api/webhook/stripe` finalise l'activation des tickets et annonces
- `app/api/send-email` envoie les e-mails transactionnels
- `app/api/slack/notify` pousse les alertes vers Slack
- `app/api/upload-drive` gere l'upload des fichiers vers Google Drive

## Scripts Disponibles

- `npm run dev` : demarrer le serveur de developpement
- `npm run build` : builder l'application
- `npm start` : lancer la build en mode production
- `npm run lint` : lancer ESLint

## Qualite Et Releases

Le depot contient:

- un workflow GitHub Actions de build / validation sur Node 18 et 20
- une configuration `semantic-release`
- un `CHANGELOG.md` versionne
- un guide de contribution dans `CONTRIBUTING.md`

## Points D'Attention

Si vous reprenez ce projet, gardez en tete les points suivants:

- le produit est fonctionnel mais encore en evolution
- certaines integrations historiques coexistent avec les nouveaux flux
- le README deployee ici decrit l'etat actuel du code, pas une architecture totalement finalisee
- un passage de durcissement est recommande avant tout deploiement sensible: secrets, webhooks, variables d'environnement, nettoyage des dependances legacy

## Contribution

Les contributions sont bienvenues.

Flux recommande:

```bash
git checkout -b feature/ma-modification
git commit -m "feat(scope): description"
git push origin feature/ma-modification
```

Consultez aussi [CONTRIBUTING.md](./CONTRIBUTING.md) et [CHANGELOG.md](./CHANGELOG.md).

## Licence

Ce projet est distribue sous licence MIT.
