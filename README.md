# OCR-to-Report

Micro-SaaS `Next.js 16` pour uploader une facture fournisseur PDF, extraire des donnees structurees avec Mistral OCR + LLM, puis generer une synthese comptable en `.docx`.

## Statut

Le projet est initialise. Les prochaines etapes sont :

- definir le schema facture avec Zod
- brancher le client Mistral cote serveur
- implementer les routes API OCR, extraction et generation DOCX
- construire l interface de previsualisation et de correction

## Stack de base

- Next.js 16
- App Router
- TypeScript strict
- Tailwind CSS v4
- Zod v4
- SDK officiel `@mistralai/mistralai`
- `docx-templates`
- Vitest
