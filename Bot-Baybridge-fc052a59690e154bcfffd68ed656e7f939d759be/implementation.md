# BayBridge Visit Planning Service — Guide d'implémentation

## Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Variables d'environnement](#variables-denvironnement)
4. [Déploiement local](#déploiement-local)
5. [Déploiement sur Vercel](#déploiement-sur-vercel)
6. [Architecture technique](#architecture-technique)
7. [Comportement du bot](#comportement-du-bot)
8. [Personnalisation](#personnalisation)
9. [Dépannage](#dépannage)

---

## Vue d'ensemble

BayBridge Visit Planning Service est une application **Next.js** qui simule un agent Agentforce pour délégués médicaux. Elle s'appuie sur l'API **Google Gemini 2.5 Flash** côté serveur et expose une interface de chat flottante sur une landing page orientée visite médicale/pharmacie.

**Stack technique :**
- **Frontend :** Next.js (Pages Router) + Tailwind CSS v4
- **Backend :** Route API Next.js (`/api/chat`) — jamais exposée au navigateur
- **LLM :** Google Gemini `gemini-2.5-flash` via l'API officielle REST
- **Session :** Mémoire RAM navigateur (sessionStorage implicite via état React)
- **Déploiement :** Vercel (recommandé) ou `npm run dev` en local

---

## Prérequis

| Outil | Version minimale |
|-------|-----------------|
| Node.js | 18.x ou supérieur |
| npm | 9.x ou supérieur |
| Compte Google AI Studio | Gratuit — [aistudio.google.com](https://aistudio.google.com) |

---

## Variables d'environnement

### Variable obligatoire

| Variable | Description | Où l'obtenir |
|----------|-------------|--------------|
| `GEMINI_API_KEY` | Clé API Google Gemini | [Google AI Studio](https://aistudio.google.com/app/apikey) |

### Comment obtenir votre clé Gemini

1. Accédez à [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Connectez-vous avec votre compte Google
3. Cliquez sur **"Create API key"**
4. Sélectionnez un projet Google Cloud (ou créez-en un)
5. Copiez la clé générée

> ⚠️ **Sécurité :** La clé ne doit **jamais** être committée dans Git ni exposée côté frontend. Elle n'est utilisée que dans la route API serveur (`/pages/api/chat.js`).

### Configuration locale

```bash
# Copier le fichier exemple
cp .env.local.example .env.local

# Éditer .env.local et remplacer la valeur
GEMINI_API_KEY=AIzaSy...votre_clé_ici
```

### Configuration Vercel (production)

Les variables d'environnement sont gérées depuis le dashboard Vercel — **voir section déploiement ci-dessous**.

---

## Déploiement local

### Installation et démarrage

```bash
# 1. Cloner le dépôt
git clone https://github.com/kolothmane/Bot-Baybridge.git
cd Bot-Baybridge

# 2. Installer les dépendances
npm install

# 3. Créer le fichier d'environnement
cp .env.local.example .env.local
# → Éditez .env.local et ajoutez votre GEMINI_API_KEY

# 4. Lancer en mode développement
npm run dev
```

L'application est disponible sur **[http://localhost:3000](http://localhost:3000)**

### Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement avec hot-reload |
| `npm run build` | Build de production optimisé |
| `npm run start` | Démarrer le serveur de production (après build) |
| `npm run lint` | Vérification ESLint |

---

## Déploiement sur Vercel

### Méthode 1 — Via l'interface Vercel (recommandée)

1. **Connectez-vous** sur [vercel.com](https://vercel.com) avec votre compte GitHub

2. **Importez le projet :**
   - Cliquez sur **"Add New Project"**
   - Sélectionnez le dépôt `kolothmane/Bot-Baybridge`
   - Vercel détecte automatiquement Next.js

3. **Configurez la variable d'environnement :**
   - Dans la section **"Environment Variables"** avant le déploiement
   - Ajoutez :
     ```
     Name : GEMINI_API_KEY
     Value: AIzaSy...votre_clé_ici
     ```
   - Sélectionnez les environnements : ✅ Production, ✅ Preview, ✅ Development

4. **Déployez :**
   - Cliquez sur **"Deploy"**
   - Vercel build et déploie automatiquement (~1-2 minutes)
   - Votre URL sera du type : `https://bot-baybridge-xxxx.vercel.app`

### Méthode 2 — Via Vercel CLI

```bash
# Installer la CLI Vercel
npm install -g vercel

# Depuis le dossier du projet
vercel

# Suivre les instructions interactives :
# → Set up and deploy? Yes
# → Which scope? (votre compte)
# → Link to existing project? No
# → Project name: bot-baybridge
# → Directory: ./
# → Override settings? No

# Configurer la variable d'environnement
vercel env add GEMINI_API_KEY
# → Entrer la valeur quand demandé
# → Sélectionner : Production, Preview, Development

# Re-déployer pour prendre en compte la variable
vercel --prod
```

### Déploiements automatiques

Une fois connecté à GitHub, Vercel redéploie automatiquement à chaque `git push` sur la branche principale.

```bash
git add .
git commit -m "update"
git push origin main
# → Vercel déclenche un nouveau déploiement automatiquement
```

### Modifier une variable d'environnement existante sur Vercel

1. Dashboard Vercel → votre projet → **Settings** → **Environment Variables**
2. Cliquez sur les **"..."** à côté de `GEMINI_API_KEY` → **Edit**
3. Modifiez la valeur → **Save**
4. **Important :** Redéployez pour appliquer le changement :
   - Dashboard → **Deployments** → **Redeploy** sur le dernier déploiement

---

## Architecture technique

```
Bot-Baybridge/
├── pages/
│   ├── index.js              # Landing page complète
│   ├── _app.js               # App wrapper + styles globaux
│   └── api/
│       └── chat.js           # ⚠️ Route API serveur (Gemini)
├── components/
│   └── ChatWidget.js         # Widget chat flottant (React)
├── lib/
│   └── pharmacies.js         # Dataset fictif + scoring
├── styles/
│   └── globals.css           # Tailwind + styles globaux
├── public/                   # Assets statiques
├── .env.local.example        # Template variables d'env
├── .env.local                # ← À créer, JAMAIS committer
├── next.config.mjs
├── package.json
└── implementation.md         # Ce fichier
```

### Flux d'une requête chat

```
Navigateur
    │
    │  POST /api/chat { message, history }
    ▼
pages/api/chat.js (serveur Next.js)
    │
    ├─ Validation input (longueur, type)
    ├─ detectIntent(message)  ←── Routeur d'intentions (regex)
    │     └─ transcription_audio | annulation_rdv |
    │        recommandation_alternative | preparation_visite |
    │        suivi_transcription | crm_logging | hors_sujet
    │
    ├─ buildSystemPrompt(intent, context)
    │     └─ Instructions spécifiques au topic + règles globales
    │
    └─ callGemini(systemPrompt, history)
          │
          │  HTTPS → api.generativelanguage.googleapis.com
          ▼
    Google Gemini 2.5 Flash
          │
          ▼
    { reply, intent }  →  Navigateur → ChatWidget
```

---

## Comportement du bot

### Intents reconnus

| Intent | Déclencheurs (mots-clés) | Comportement |
|--------|--------------------------|--------------|
| `transcription_audio` | audio, transcrire, enregistrement, dicter, mp3, vocal | Guide pour coller du texte ou dicter le contenu |
| `annulation_rdv` | annuler, annulation, rdv, rendez-vous, reporter, reprogrammer | Extrait pharmacie / date / motif, propose alternatives |
| `recommandation_alternative` | alternative, pharmacie proche, recommander, remplacer, proximité | Top 3 pharmacies scorées avec méthodologie |
| `preparation_visite` | préparer, brief, visite, objectif, contexte | Génère un brief structuré avec objectifs SMART |
| `suivi_transcription` | résumer, synthèse, transcription, compte rendu, actions | Résumé + décisions + engagements + prochaines actions |
| `crm_logging` | crm, log, enregistrer, historique, interaction | Crée un log CRM structuré |
| `hors_sujet` | *(tout le reste)* | Redirige vers les services disponibles |

### Règles de réponse (toujours appliquées)

- ✅ Répondre **uniquement en français**
- ✅ Réponse **structurée avec sections claires**
- ✅ Signaler les données manquantes avec le texte : **`Donnée manquante.`**
- ✅ Ton **professionnel, court, orienté action**
- ✅ Toujours terminer par **`Prochaines étapes :`**
- ✅ Ne jamais inventer des faits — si incertain, le dire
- ✅ Aucune stack trace ou erreur technique exposée à l'utilisateur

### Dataset pharmacies fictif

Le fichier `lib/pharmacies.js` contient 8 pharmacies fictives à Lyon avec un scoring pondéré :

| Critère | Poids |
|---------|-------|
| Distance / temps de trajet | 40% |
| Demande locale | 20% |
| Historique d'interactions | 20% |
| Disponibilité du commercial | 20% |

Pour adapter au client réel, remplacez les données dans `lib/pharmacies.js`.

---

## Personnalisation

### Changer le nom de l'agent

Dans `pages/api/chat.js`, modifiez la ligne dans `buildSystemPrompt` :
```js
Tu es "Visit Planning Service", un assistant IA professionnel...
```

### Changer la couleur principale

Dans `components/ChatWidget.js` et `pages/index.js`, remplacez les classes `teal-600` / `teal-700` par la couleur souhaitée (ex: `blue-600`, `indigo-600`).

### Changer le modèle Gemini

Dans `pages/api/chat.js`, modifiez :
```js
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
```

Modèles disponibles recommandés :
- `gemini-2.5-flash` ← actuellement utilisé (rapide, économique)
- `gemini-2.5-pro` (plus puissant, plus lent)
- `gemini-2.0-flash` (très rapide, moins capable)

### Ajouter des pharmacies

Éditez `lib/pharmacies.js` en ajoutant des entrées dans le tableau `pharmacies` avec la même structure.

---

## Dépannage

### ❌ `Error: GEMINI_API_KEY is not configured`

**Cause :** La variable d'environnement n'est pas définie.

**Solution locale :**
```bash
# Vérifier que .env.local existe et contient la clé
cat .env.local
# Redémarrer le serveur après modification
npm run dev
```

**Solution Vercel :** Vérifiez dans Dashboard → Settings → Environment Variables que `GEMINI_API_KEY` est présente et redéployez.

---

### ❌ `Gemini API responded with status 400`

**Cause :** Requête mal formée ou modèle introuvable.

**Solution :** Vérifiez que le nom du modèle dans `GEMINI_API_URL` est exact (voir la liste des modèles disponibles dans votre compte AI Studio).

---

### ❌ `Gemini API responded with status 403`

**Cause :** Clé API invalide ou API Gemini non activée pour ce projet.

**Solution :**
1. Vérifiez que la clé est correctement copiée (sans espace)
2. Dans [Google Cloud Console](https://console.cloud.google.com), activez l'API "Generative Language API" pour votre projet

---

### ❌ `Gemini API responded with status 429`

**Cause :** Quota dépassé (trop de requêtes).

**Solution :** Attendez quelques secondes ou passez sur un plan payant Google AI.

---

### ❌ Le widget chat ne s'ouvre pas au clic sur le bouton CTA

**Cause :** Problème de chargement côté client (SSR).

**Solution :** Le `ChatWidget` est chargé avec `dynamic(..., { ssr: false })`, il est normal qu'il s'initialise après le premier rendu. Vérifiez la console navigateur pour des erreurs JavaScript.

---

*Documentation générée pour BayBridge Visit Planning Service — Version 1.0*
