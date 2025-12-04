# Cubage – Application de Gestion de Chantiers Forestiers

Application web progressive (PWA) pour la gestion et le suivi des chantiers forestiers, permettant la saisie de données de cubage, le calcul de volumes, et la génération de fiches chantier et d'exports PDF.

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Stack technique](#stack-technique)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Développement](#développement)
- [Déploiement](#déploiement)
- [Structure du projet](#structure-du-projet)
- [Base de données](#base-de-données)
- [API](#api)
- [Fonctionnalités offline](#fonctionnalités-offline)
- [Rôles et permissions](#rôles-et-permissions)

## 🎯 Vue d'ensemble

**Cubage** est une application web moderne conçue pour la gestion complète des chantiers forestiers. Elle permet aux bûcherons, débardeurs et superviseurs de :

- Créer et gérer des chantiers de coupe
- Saisir des données de cubage (longueur, diamètre) avec calcul automatique des volumes
- Suivre les volumes par essence, qualité et scieur
- Gérer les clients et leurs propriétés
- Visualiser les statistiques en temps réel
- Travailler hors ligne avec synchronisation automatique
- Générer des fiches chantier et des exports PDF

L'application est conçue comme une **Progressive Web App (PWA)** avec support complet du mode offline, permettant une utilisation en terrain forestier même sans connexion internet.

## ✨ Fonctionnalités

### Gestion des chantiers
- ✅ Création et modification de chantiers
- ✅ Association de clients et propriétés
- ✅ Gestion des groupes de qualité (essence + qualité + scieur)
- ✅ Attribution de lots et conventions par groupe de qualité
- ✅ Suivi des numéros de coupe uniques
- ✅ Gestion des sections et parcelles

### Saisie de données
- ✅ Saisie de longueur et diamètre avec calcul automatique du volume
- ✅ Calcul des volumes par seuils (V1, V2)
- ✅ Attribution de numéros séquentiels par utilisateur
- ✅ Gestion des annotations
- ✅ Association de débardeurs aux saisies
- ✅ Tri décroissant par numéro de saisie

### Statistiques et rapports
- ✅ Tableaux de volumes par groupe de qualité
- ✅ Statistiques par bûcheron (volumes totaux et journaliers)
- ✅ Calculs de volumes moyens
- ✅ Seuils de qualité configurables
- ✅ Export PDF des données
- ✅ Génération de fiches chantier

### Gestion des utilisateurs
- ✅ Système de rôles (SUPERVISEUR, BUCHERON, DEBARDEUR)
- ✅ Gestion multi-entreprises
- ✅ Attribution de plages de numéros par utilisateur
- ✅ Réinitialisation de mot de passe par email

### Gestion des clients
- ✅ Création et modification de clients
- ✅ Gestion des propriétés (commune, lieu-dit, section, parcelle)
- ✅ Informations de contact (email, téléphone, adresse)
- ✅ Champs optionnels pour saisie progressive

### Points GPS
- ✅ Enregistrement de points GPS par groupe de qualité
- ✅ Visualisation sur carte interactive (Leaflet)
- ✅ Gestion de l'ordre des points
- ✅ Notes associées aux points

### Mode offline
- ✅ Synchronisation automatique des données
- ✅ File d'attente pour les modifications hors ligne
- ✅ Cache IndexedDB pour les données
- ✅ Service Worker pour le cache des assets
- ✅ Synchronisation automatique lors de la reconnexion

## 🏗️ Architecture

L'application suit une architecture **monorepo** avec séparation claire entre frontend et backend :

```
cubage/
├── apps/
│   ├── api/          # Backend Express + Prisma
│   └── web/           # Frontend React + Vite
├── packages/
│   └── shared/       # Types et schémas partagés
```

### Backend (API)
- **Framework** : Express.js avec TypeScript
- **ORM** : Prisma
- **Base de données** : PostgreSQL
- **Authentification** : JWT (JSON Web Tokens)
- **Validation** : Zod
- **Email** : Resend

### Frontend (Web)
- **Framework** : React 19 avec TypeScript
- **Build tool** : Vite
- **Styling** : Tailwind CSS
- **Routing** : React Router v7
- **Offline** : IndexedDB (via idb) + Service Worker
- **Cartes** : Leaflet + React Leaflet
- **PWA** : Vite PWA Plugin

## 🛠️ Stack technique

### Backend
- **Node.js** avec TypeScript
- **Express.js** 5.x
- **Prisma** 6.x (ORM)
- **PostgreSQL** 15
- **bcrypt** (hachage de mots de passe)
- **jsonwebtoken** (authentification)
- **Zod** (validation de schémas)
- **Resend** (envoi d'emails)

### Frontend
- **React** 19.1
- **TypeScript** 5.8
- **Vite** 7.1
- **Tailwind CSS** 4.1
- **React Router** 7.9
- **Leaflet** 1.9 (cartes)
- **idb** 8.0 (IndexedDB)
- **Lucide React** (icônes)

### Outils de développement
- **ESLint** (linting)
- **Prettier** (formatage)
- **ts-node-dev** (développement backend)

## 📦 Prérequis

- **Node.js** >= 18.x
- **npm** >= 9.x
- **PostgreSQL** >= 14
- **Git**

## 🚀 Installation

### 1. Cloner le repository

```bash
git clone https://github.com/matthieubouillot/cubage-app-fbbois.git
cd cubage
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer la base de données

Assurez-vous d'avoir PostgreSQL installé et en cours d'exécution.

### 4. Configurer les variables d'environnement

#### Backend (`apps/api/.env`)

```env
# Base de données
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cubage?schema=public"

# JWT
JWT_SECRET="votre-secret-jwt-tres-securise"

# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxxx"
WEB_BASE_URL="http://localhost:5173"

# CORS (optionnel)
CORS_ORIGIN="http://localhost:5173"
```

#### Frontend (`apps/web/.env`)

```env
VITE_API_URL=http://localhost:3000
```

### 5. Initialiser la base de données

```bash
cd apps/api
npx prisma migrate dev
npx prisma db seed  # Optionnel : charger des données de test
```

### 6. Lancer l'application

#### Terminal 1 : Backend
```bash
cd apps/api
npm run dev
```

Le serveur API sera accessible sur `http://localhost:3000`

#### Terminal 2 : Frontend
```bash
cd apps/web
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## ⚙️ Configuration

### Variables d'environnement

#### Backend (`apps/api/.env`)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | URL de connexion PostgreSQL | `postgresql://user:pass@localhost:5432/cubage` |
| `JWT_SECRET` | Secret pour signer les JWT | `votre-secret-securise` |
| `RESEND_API_KEY` | Clé API Resend pour les emails | `re_xxxxxxxxxxxxx` |
| `WEB_BASE_URL` | URL de base du frontend | `https://app.example.com` |
| `CORS_ORIGIN` | Origine autorisée pour CORS | `https://app.example.com` |

#### Frontend (`apps/web/.env`)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `VITE_API_URL` | URL de l'API backend | `https://api.example.com` |

### Configuration Resend (Email)

Pour activer la réinitialisation de mot de passe :

1. Créer un compte sur [Resend](https://resend.com)
2. Ajouter votre domaine et configurer les enregistrements DNS :
   - **DKIM** : `resend._domainkey` (TXT)
   - **SPF** : `v=spf1 include:amazonses.com include:resend.com ~all` (TXT)
   - **MX** : `send` → `feedback-smtp.eu-west-1.amazonses.com` (priorité 10)
   - **DMARC** (optionnel) : `_dmarc` (TXT)

3. Récupérer votre clé API et l'ajouter dans `apps/api/.env`

## 💻 Développement

### Scripts disponibles

#### Racine du projet
```bash
npm run format    # Formater le code avec Prettier
npm run lint      # Linter le code avec ESLint
```

#### Backend (`apps/api`)
```bash
npm run dev       # Démarrer en mode développement (watch)
npm run build     # Compiler TypeScript
npm run start     # Démarrer la version compilée
npm run db:seed   # Charger des données de test
```

#### Frontend (`apps/web`)
```bash
npm run dev       # Démarrer le serveur de développement
npm run build     # Build de production
npm run preview   # Prévisualiser le build de production
npm run lint      # Linter le code
```

### Structure des migrations Prisma

```bash
cd apps/api
npx prisma migrate dev --name nom_de_la_migration
npx prisma migrate deploy  # En production
```

### Générer le client Prisma

```bash
cd apps/api
npx prisma generate
```

## 🚢 Déploiement

### Backend (API)

1. **Build de production**
   ```bash
   cd apps/api
   npm run build
   ```

2. **Variables d'environnement**
   - Configurer toutes les variables d'environnement sur la plateforme de déploiement
   - S'assurer que `DATABASE_URL` pointe vers la base de production

3. **Migrations**
   ```bash
   npx prisma migrate deploy
   ```

4. **Démarrer le serveur**
   ```bash
   npm start
   ```

### Frontend (Web)

1. **Build de production**
   ```bash
   cd apps/web
   npm run build
   ```

2. **Variables d'environnement**
   - Configurer `VITE_API_URL` pour pointer vers l'API de production

3. **Déployer le dossier `dist/`**
   - Le dossier `dist/` contient tous les fichiers statiques à servir

### Recommandations de déploiement

- **Backend** : Render, Railway, Heroku, ou VPS avec PM2
- **Frontend** : Vercel, Netlify, ou serveur statique (Nginx)
- **Base de données** : PostgreSQL géré (Supabase, Neon, ou PostgreSQL sur VPS)

## 📁 Structure du projet

```
cubage/
├── apps/
│   ├── api/                          # Backend Express
│   │   ├── src/
│   │   │   ├── app.ts                # Configuration Express
│   │   │   ├── index.ts              # Point d'entrée
│   │   │   ├── config/               # Configuration
│   │   │   │   └── env.ts            # Variables d'environnement
│   │   │   ├── lib/                  # Utilitaires
│   │   │   │   └── mailer.ts         # Service d'email
│   │   │   ├── middlewares/          # Middlewares Express
│   │   │   │   ├── auth.ts           # Authentification JWT
│   │   │   │   └── errorHandler.ts   # Gestion des erreurs
│   │   │   └── modules/              # Modules métier
│   │   │       ├── auth/             # Authentification
│   │   │       ├── chantiers/        # Gestion des chantiers
│   │   │       ├── clients/           # Gestion des clients
│   │   │       ├── saisies/           # Gestion des saisies
│   │   │       ├── users/            # Gestion des utilisateurs
│   │   │       └── ...               # Autres modules
│   │   └── prisma/
│   │       ├── schema.prisma         # Schéma Prisma
│   │       ├── migrations/           # Migrations
│   │       └── seed.ts               # Données de test
│   │
│   └── web/                          # Frontend React
│       ├── src/
│       │   ├── App.tsx               # Composant racine + routing
│       │   ├── main.tsx              # Point d'entrée
│       │   ├── components/           # Composants réutilisables
│       │   │   ├── Navbar.tsx
│       │   │   ├── StatsTable.tsx
│       │   │   └── ...
│       │   ├── pages/                # Pages de l'application
│       │   │   ├── auth/             # Pages d'authentification
│       │   │   ├── chantiers/        # Pages des chantiers
│       │   │   ├── clients/          # Pages des clients
│       │   │   └── users/            # Pages des utilisateurs
│       │   ├── features/             # Features organisées par domaine
│       │   │   ├── auth/             # Logique d'authentification
│       │   │   ├── chantiers/        # API et types chantiers
│       │   │   ├── saisies/          # API et logique offline
│       │   │   └── ...
│       │   ├── lib/                  # Utilitaires
│       │   │   ├── api.ts            # Client API
│       │   │   └── offlineDb.ts      # Gestion IndexedDB
│       │   └── hooks/                # Hooks React personnalisés
│       ├── public/
│       │   ├── sw.js                 # Service Worker
│       │   └── manifest.webmanifest  # Manifest PWA
│       └── vite.config.ts           # Configuration Vite
│
├── packages/
│   └── shared/                       # Code partagé (futur)
│
├── package.json                      # Workspace root
└── README.md                         # Ce fichier
```

## 🗄️ Base de données

### Modèles principaux

- **User** : Utilisateurs avec rôles (SUPERVISEUR, BUCHERON, DEBARDEUR)
- **Entreprise** : Entreprises associées aux utilisateurs
- **Client** : Clients propriétaires des chantiers
- **Property** : Propriétés (terrains) des clients
- **Chantier** : Chantiers de coupe
- **QualityGroup** : Groupes de qualité (essence + qualité + scieur)
- **ChantierQualityGroup** : Relation chantier ↔ groupe de qualité (avec lot et convention)
- **Saisie** : Saisies de données (longueur, diamètre, volume)
- **GPSPoint** : Points GPS associés aux chantiers
- **Essence**, **Qualite**, **Scieur** : Référentiels

### Relations clés

- Un **Chantier** appartient à un **Client** (optionnel) et une **Property** (optionnel)
- Un **Chantier** a plusieurs **QualityGroup** via **ChantierQualityGroup**
- Une **Saisie** appartient à un **Chantier**, un **QualityGroup**, un **User** (bûcheron), et optionnellement un **User** (débardeur)
- Un **User** peut avoir plusieurs **Role** (table de jointure implicite)

### Schéma Prisma

Le schéma complet est défini dans `apps/api/prisma/schema.prisma`.

## 🔌 API

### Authentification

Toutes les routes protégées nécessitent un token JWT dans le header :
```
Authorization: Bearer <token>
```

### Endpoints principaux

#### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/forgot-password` - Demande de réinitialisation
- `POST /api/auth/reset-password` - Réinitialisation avec token

#### Chantiers
- `GET /api/chantiers` - Liste des chantiers
- `GET /api/chantiers/:id` - Détails d'un chantier
- `POST /api/chantiers` - Créer un chantier (SUPERVISEUR)
- `PUT /api/chantiers/:id` - Modifier un chantier (SUPERVISEUR)
- `GET /api/chantiers/:id/stats` - Statistiques d'un chantier

#### Saisies
- `GET /api/saisies?chantierId=...&qualityGroupId=...` - Liste des saisies
- `POST /api/saisies` - Créer une saisie
- `PUT /api/saisies/:id` - Modifier une saisie
- `DELETE /api/saisies/:id` - Supprimer une saisie

#### Clients
- `GET /api/clients` - Liste des clients
- `POST /api/clients` - Créer un client (SUPERVISEUR)
- `PUT /api/clients/:id` - Modifier un client (SUPERVISEUR)

#### Utilisateurs
- `GET /api/users` - Liste des utilisateurs (SUPERVISEUR)
- `POST /api/users` - Créer un utilisateur (SUPERVISEUR)
- `PUT /api/users/:id` - Modifier un utilisateur (SUPERVISEUR)

### Format des réponses

Succès :
```json
{
  "data": { ... }
}
```

Erreur :
```json
{
  "error": "Message d'erreur"
}
```

## 📱 Fonctionnalités offline

L'application supporte le mode offline grâce à :

1. **Service Worker** : Cache des assets statiques
2. **IndexedDB** : Stockage local des données
3. **File d'attente** : Mise en file d'attente des modifications hors ligne
4. **Synchronisation automatique** : Synchronisation lors de la reconnexion

### Données mises en cache

- Liste des chantiers
- Détails des chantiers
- Liste des saisies
- Données de référence (essences, qualités, scieurs, etc.)

### Comportement offline

- Les saisies peuvent être créées et modifiées hors ligne
- Les modifications sont mises en file d'attente
- La synchronisation se fait automatiquement lors de la reconnexion
- Les tableaux de statistiques se mettent à jour en temps réel

## 👥 Rôles et permissions

### SUPERVISEUR
- ✅ Accès complet à toutes les fonctionnalités
- ✅ Création et modification de chantiers
- ✅ Gestion des utilisateurs
- ✅ Gestion des clients
- ✅ Visualisation de toutes les statistiques
- ✅ Export PDF et fiche chantier

### BUCHERON
- ✅ Visualisation des chantiers assignés
- ✅ Création et modification de saisies
- ✅ Visualisation des statistiques de ses chantiers
- ❌ Pas d'accès à la gestion des utilisateurs/clients
- ❌ Pas d'accès à la création de chantiers

### DEBARDEUR
- ✅ Visualisation des chantiers assignés
- ✅ Attribution aux saisies
- ❌ Pas de création de saisies
- ❌ Pas d'accès à la gestion

## 📄 Licence

Ce projet est **privé et propriétaire**. Tous droits réservés.

## 📞 Support

Pour toute question ou problème, contactez l'équipe de développement.

---

**Développé avec ❤️ pour la gestion forestière**
