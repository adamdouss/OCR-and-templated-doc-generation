# OCR-to-Report

## Description

Micro-SaaS `Next.js 16` qui transforme un devis fournisseur PDF en bon de commande client `.docx`.

Le projet suit le cas d'usage autorise par le sujet :

- `devis fournisseurs -> bon de commande client tempalate`
- `devis fournisseurs -> bon de commande client template`

Le parcours utilisateur actuel est :

1. upload d'un PDF unique ;
2. OCR avec `mistral-ocr-latest` ;
3. extraction structuree via Mistral chat completions ;
4. validation runtime avec `Zod` ;
5. previsualisation et correction manuelle des donnees ;
6. generation et telechargement du `.docx`.

## Fonctionnalites

- Upload d'un devis fournisseur en PDF
- OCR serveur via le SDK officiel `@mistralai/mistralai`
- Extraction structuree d'un devis fournisseur
- Validation stricte du schema metier avec `Zod v4`
- Edition manuelle des champs extraits dans l'interface
- Gestion des lignes de devis
- Generation d'un bon de commande `.docx`
- Formatage monetaire `fr-FR` dans le document genere
- Champs structures additionnels :
  - TVA
  - conditions de paiement
  - contraintes reglementaires
  - garantie

## Stack technique

- `Next.js 16`
- `App Router`
- `TypeScript` avec `strict: true`
- `Tailwind CSS v4`
- `@mistralai/mistralai`
- `Zod v4`
- `docx-templates`
- `Vitest`
- `ESLint`
- `Prettier`

## Architecture

```txt
src/
  app/
    page.tsx
    api/
      ocr/
        route.ts
      extract/
        route.ts
      generate-docx/
        route.ts

  components/
    UploadZone.tsx
    ExtractionPreview.tsx
    StatusStepper.tsx

  lib/
    mistral.ts
    schemas.ts
    ocr.ts
    extraction.ts
    docx.ts
    formatCurrency.ts

templates/
  purchase-order-template.docx

samples/
  dev1.pdf
  dev2.pdf
  ...
```

Separation des responsabilites :

- `src/app/page.tsx` : orchestration UI du parcours
- `src/app/api/*` : couches HTTP fines
- `src/lib/*` : logique metier, appels Mistral, validation, DOCX
- `src/components/*` : interface utilisateur

## Installation locale

Prerequis :

- `Node.js` recent
- `npm`
- une cle API Mistral valide

Installation :

```bash
npm install
```

## Variables d'environnement

Le projet attend :

```env
MISTRAL_API_KEY=
```

Fichiers utiles :

- `.env.example` : modele a committer
- `.env.local` : secret local non versionne

Exemple local :

```env
MISTRAL_API_KEY=your_real_key_here
```

## Lancer le projet

```bash
npm run dev
```

Ouvrir ensuite :

```txt
http://localhost:3000
```

Scripts utiles :

```bash
npm run dev
npm run lint
npm run test
npm run build
npm run typecheck
npm run generate:template
```

## Lancer les tests

Tests unitaires :

```bash
npm run test
```

Verification statique :

```bash
npm run lint
npm run typecheck
```

Build de verification :

```bash
npm run build
```

## Deploiement

Deploiement cible : `Vercel`

Etapes prevues :

1. connecter le repository GitHub
2. ajouter `MISTRAL_API_KEY` dans les variables d'environnement Vercel
3. lancer le build
4. verifier le flux complet en production

## URL Vercel

Non renseignee pour l'instant.

## Limites connues

- support limite a un seul type de document
- support limite a un seul PDF a la fois
- pas d'authentification
- pas de base de donnees
- pas d'historique des traitements
- pas de score de confiance par champ
- pas de tests E2E Playwright
- la qualite de l'extraction depend de la qualite OCR et du document source
- le mode batch multi-documents n'est pas implemente

## Ameliorations possibles

- support batch multi-documents
- export ZIP pour plusieurs bons de commande
- meilleure edition manuelle des lignes
- comparaison visuelle OCR brut / structure
- score de confiance par champ
- templates DOCX multiples
- tests E2E Playwright
- historique des exports
