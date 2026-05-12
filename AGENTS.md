# Repo Instructions

## Contexte

Projet `Next.js 16` qui transforme un devis fournisseur PDF en bon de commande client `.docx`.

Le flow principal est :

1. upload d'un PDF unique ;
2. OCR via Mistral ;
3. extraction structuree via Mistral ;
4. validation runtime avec `Zod` ;
5. correction manuelle dans l'UI ;
6. generation d'un bon de commande `.docx`.

## Scope MVP

- un seul PDF a la fois
- un seul type de document : devis fournisseur
- une seule sortie : bon de commande client DOCX
- pas d'auth
- pas de base de donnees
- pas d'historique
- pas de mode batch
- pas de chatbot

## Regles techniques

- conserver `TypeScript` en mode strict
- ne pas refactoriser l'architecture sans besoin clair
- garder les routes existantes :
  - `/api/ocr`
  - `/api/extract`
  - `/api/generate-docx`
- garder la logique metier dans `src/lib/*`
- garder les routes API fines, sans y deplacer la logique metier
- revalider les donnees avec `Zod` cote serveur avant generation DOCX
- ne pas introduire de nouvelle feature hors scope sans demande explicite

## Fichiers clefs

- `src/app/page.tsx`
- `src/components/UploadZone.tsx`
- `src/components/StatusStepper.tsx`
- `src/components/ExtractionPreview.tsx`
- `src/lib/schemas.ts`
- `src/lib/mistral.ts`
- `src/lib/ocr.ts`
- `src/lib/extraction.ts`
- `src/lib/docx.ts`
- `src/lib/formatCurrency.ts`
- `templates/purchase-order-template.docx`

## Conventions metier

- les noms de champs metier sont majoritairement en francais
- les montants restent en `number` dans les donnees validees
- l'affichage monetaire passe par `formatCurrency`
- les champs textuels vides affiches dans le DOCX doivent rendre `Non spécifié`

## Verification

Lancer si possible avant de terminer une modification :

- `npm run lint`
- `npm run typecheck`
- `npm run test`

Avant un rendu ou un deploiement :

- `npm run build`

## Deploiement

Deploiement cible : `Vercel`

Variable d'environnement requise :

- `MISTRAL_API_KEY`

Le projet doit rester deployable sans dependance locale non documentee.
