# Checklist Exigences

## Scope choisi

- Cas d'usage retenu : `devis fournisseurs -> bon de commande client`
- Conforme au sujet : `oui`

## Exigences techniques

- `Next.js 16` : fait
- `App Router` : fait
- `TypeScript strict` : fait
- `Tailwind CSS v4` : fait
- SDK officiel `@mistralai/mistralai` : fait
- `mistral-ocr-latest` : fait
- chat completions Mistral avec structured output : fait
- `Zod v4` : fait
- generation `.docx` : fait
- `.env.example` : fait
- `ESLint` et `Prettier` : fait

## Pipeline document

- upload PDF : fait
- OCR Mistral : fait
- extraction structuree : fait
- validation Zod : fait
- preview lisible : fait
- correction manuelle : fait
- generation DOCX : fait
- telechargement du fichier : fait

## Tests cibles

- validation du schema Zod : fait
- parsing de reponse LLM : fait
- OCR / normalisation : fait
- generation DOCX : fait

## Etat des livrables

- code MVP : fait
- README descriptif : fait
- repository GitHub : a finaliser cote livraison
- URL Vercel : non faite
- note de synthese : non faite

## Limites assumees

- un seul type de document
- un seul fichier a la fois
- pas d'auth
- pas de base de donnees
- pas de batch
- pas de tests E2E

## Reste a faire

1. verification manuelle finale dans le navigateur
2. nettoyage du repo avant push
3. push GitHub
4. deploiement Vercel
5. note de synthese
