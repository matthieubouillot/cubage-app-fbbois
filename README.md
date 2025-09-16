# Cubage – Application web de gestion des chantiers

## Structure
- `apps/web` : Frontend React + Vite + Tailwind + Dexie
- `apps/api` : Backend Express + Prisma + PostgreSQL
- `packages/shared` : Types et schémas Zod partagés

## Démarrer le projet
1. Installer les dépendances : `npm install`
2. Configurer la base : `cd apps/api && npx prisma migrate dev`
3. Lancer l’API : `npm run dev` (dans `apps/api`)
4. Lancer le front : `npm run dev` (dans `apps/web`)