# SPEC.md — Test Technique Ingénieur IA

## Projet

Construire un micro-SaaS **OCR-to-Report** en **Next.js 16** permettant d’uploader des documents PDF, d’en extraire des données structurées avec **Mistral OCR** et **Mistral LLM**, puis de générer un document `.docx` à partir d’un template Word.

Le projet doit être déployé sur **Vercel** et livré avec un repository GitHub propre.

---

## Objectif du test

Ce test technique vise à évaluer la capacité à :

- concevoir une architecture produit claire ;
- implémenter un pipeline complet de traitement documentaire ;
- utiliser un OCR et un LLM de manière robuste ;
- structurer et valider des données métier ;
- générer un livrable client templaté ;
- produire un code maintenable, typé et justifiable à l’oral.

Toutes les ressources sont autorisées : ChatGPT, Claude Code, Cursor, documentation, exemples open source.  
Cependant, chaque ligne livrée doit être comprise et pouvoir être expliquée pendant le debrief technique.

---

## Scope recommandé

Pour limiter la complexité, implémenter **un seul cas d’usage cohérent**.

### Cas d’usage conseillé

**Factures fournisseurs → note de synthèse comptable**

Ce choix est simple, maîtrisable, et permet de démontrer tout le pipeline attendu.

### Alternatives possibles

- Devis fournisseurs → bon de commande client templaté
- Rapports d’inspection technique → rapport de synthèse client

Ne pas implémenter les trois types de documents.  
Un seul type bien fait suffit.

---

## Parcours utilisateur attendu

L’utilisateur doit pouvoir :

1. Uploader un ou plusieurs documents PDF.
2. Lancer l’OCR du document via l’API **Mistral OCR**.
3. Extraire les données métier structurées via **Mistral chat completions** avec structured output.
4. Valider les données extraites avec un schéma **Zod**.
5. Visualiser les données extraites dans une interface lisible.
6. Corriger manuellement les champs si nécessaire.
7. Générer un document `.docx` à partir d’un template Word.
8. Télécharger le document final depuis l’interface.

---

## Stack technique imposée

Le projet doit utiliser :

- **Next.js 16**
- **App Router**
- **TypeScript strict**
- `strict: true` dans `tsconfig.json`
- **Tailwind CSS v4**
- SDK officiel **`@mistralai/mistralai`**
- **Mistral OCR API** avec le modèle `mistral-ocr-latest`
- **Mistral chat completions** avec structured output :
  - JSON mode, ou
  - function calling
- **Zod v4** pour la validation runtime
- Librairie de génération `.docx` :
  - `docxtemplater`, ou
  - `docx-templates`, ou équivalent
- Déploiement sur **Vercel**
- Repository **GitHub**

---

## Contraintes importantes

### API Mistral

- Utiliser le SDK officiel `@mistralai/mistralai`.
- Ne pas faire d’appels `fetch` directs vers l’API Mistral.
- La clé API doit être stockée dans une variable d’environnement.
- Ne jamais commiter la clé API.

### Variables d’environnement

Prévoir un fichier `.env.example` :

```env
MISTRAL_API_KEY=
```

Dans Vercel, ajouter :

```env
MISTRAL_API_KEY=<clé_api_mistral>
```

### Template DOCX

Créer un template Word simple avec des balises.

Exemple :

```txt
Synthèse facture

Fournisseur : {{supplierName}}
Numéro de facture : {{invoiceNumber}}
Date de facture : {{invoiceDate}}
Date d’échéance : {{dueDate}}

Total HT : {{totalHT}} {{currency}}
Total TTC : {{totalTTC}} {{currency}}

Résumé :
{{summary}}

Lignes de facture :
{{#lineItems}}
- {{description}} — quantité : {{quantity}} — prix unitaire : {{unitPrice}} — total : {{total}}
{{/lineItems}}
```

---

## Architecture recommandée

Structure proposée :

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

templates/
  invoice-summary-template.docx

samples/
  sample-invoice.pdf

.env.example
README.md
```

---

## Rôle des fichiers

### `src/app/page.tsx`

Page principale de l’application.

Responsabilités :

- gérer le parcours utilisateur ;
- afficher l’upload ;
- afficher les états de chargement ;
- afficher les données extraites ;
- permettre la correction manuelle ;
- déclencher la génération du `.docx`.

### `src/components/UploadZone.tsx`

Composant d’upload PDF.

Responsabilités :

- sélectionner un fichier PDF ;
- vérifier le type du fichier ;
- afficher le nom du fichier sélectionné.

### `src/components/ExtractionPreview.tsx`

Composant de preview et d’édition.

Responsabilités :

- afficher les champs extraits ;
- permettre leur modification manuelle ;
- gérer les lignes de facture si nécessaire.

### `src/components/StatusStepper.tsx`

Composant d’état du pipeline.

États à gérer :

- `idle`
- `uploading`
- `ocr`
- `extracting`
- `ready`
- `generating`
- `done`
- `error`

### `src/lib/mistral.ts`

Initialisation du client Mistral.

Responsabilités :

- lire `MISTRAL_API_KEY` ;
- instancier le SDK officiel ;
- exposer le client Mistral.

### `src/lib/schemas.ts`

Définition du schéma métier Zod.

Responsabilités :

- définir les champs attendus ;
- exporter les types TypeScript dérivés de Zod ;
- valider les réponses LLM.

### `src/lib/ocr.ts`

Logique OCR.

Responsabilités :

- envoyer le PDF à Mistral OCR ;
- récupérer le texte OCRisé ;
- normaliser la réponse ;
- gérer les erreurs OCR.

### `src/lib/extraction.ts`

Logique d’extraction structurée.

Responsabilités :

- envoyer le texte OCRisé à Mistral chat completions ;
- demander un JSON strict ;
- parser la réponse ;
- valider la sortie avec Zod ;
- retourner des données métier propres.

### `src/lib/docx.ts`

Logique de génération DOCX.

Responsabilités :

- charger le template `.docx` ;
- injecter les données extraites ;
- générer le fichier final ;
- retourner un buffer téléchargeable.

---

## Schéma métier recommandé

Pour le cas d’usage “facture fournisseur”, utiliser un schéma simple.

```ts
import { z } from "zod";

export const InvoiceLineSchema = z.object({
  description: z.string(),
  quantity: z.number().nullable().optional(),
  unitPrice: z.number().nullable().optional(),
  total: z.number().nullable().optional(),
});

export const InvoiceSchema = z.object({
  supplierName: z.string(),
  invoiceNumber: z.string().nullable().optional(),
  invoiceDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  totalHT: z.number().nullable().optional(),
  totalTTC: z.number().nullable().optional(),
  currency: z.string().default("EUR"),
  lineItems: z.array(InvoiceLineSchema).default([]),
  summary: z.string().nullable().optional(),
});

export type InvoiceData = z.infer<typeof InvoiceSchema>;
```

---

## API routes recommandées

### `POST /api/ocr`

Input :

- fichier PDF en `FormData`

Output :

```json
{
  "text": "OCR text here"
}
```

Erreurs à gérer :

- fichier absent ;
- fichier non PDF ;
- erreur Mistral OCR ;
- réponse OCR vide.

---

### `POST /api/extract`

Input :

```json
{
  "ocrText": "..."
}
```

Output :

```json
{
  "invoice": {
    "supplierName": "...",
    "invoiceNumber": "...",
    "totalHT": 100,
    "totalTTC": 120,
    "currency": "EUR",
    "lineItems": []
  }
}
```

Erreurs à gérer :

- texte OCR absent ;
- erreur Mistral LLM ;
- JSON invalide ;
- validation Zod échouée.

---

### `POST /api/generate-docx`

Input :

```json
{
  "invoice": {}
}
```

Output :

- fichier `.docx` téléchargeable

Erreurs à gérer :

- données invalides ;
- template introuvable ;
- erreur de génération DOCX.

---

## Prompt d’extraction recommandé

```txt
You are an information extraction assistant specialized in supplier invoices.

Extract structured invoice data from the OCR text below.

Return only valid JSON.
Do not include explanations.
Do not include Markdown.
If a field is missing, return null.
For numeric amounts, return numbers only, without currency symbols.

Expected schema:
{
  "supplierName": string,
  "invoiceNumber": string | null,
  "invoiceDate": string | null,
  "dueDate": string | null,
  "totalHT": number | null,
  "totalTTC": number | null,
  "currency": string,
  "lineItems": [
    {
      "description": string,
      "quantity": number | null,
      "unitPrice": number | null,
      "total": number | null
    }
  ],
  "summary": string | null
}

OCR text:
{{ocrText}}
```

---

## UI / UX attendue

L’interface doit être simple mais claire.

Elle doit inclure :

- zone d’upload PDF ;
- affichage du fichier sélectionné ;
- bouton de lancement de l’analyse ;
- état OCR en cours ;
- état extraction en cours ;
- affichage des erreurs ;
- preview lisible des données extraites ;
- champs éditables ;
- bouton de génération DOCX ;
- téléchargement du fichier final.

Critères UI importants :

- hiérarchie visuelle claire ;
- responsive desktop ;
- loaders ou états de progression ;
- messages d’erreur actionnables ;
- labels accessibles ;
- navigation clavier minimale.

---

## Gestion d’erreurs attendue

Prévoir des messages clairs pour :

- fichier absent ;
- mauvais format ;
- erreur réseau ;
- erreur API Mistral ;
- quota ou rate limit ;
- réponse OCR vide ;
- réponse JSON invalide ;
- validation Zod échouée ;
- échec de génération DOCX.

Exemple de principe :

```txt
Une erreur technique ne doit pas casser toute l’interface.
L’utilisateur doit comprendre ce qui s’est passé et pouvoir réessayer.
```

---

## Tests recommandés

Ne pas viser une couverture exhaustive.  
Tester surtout les zones à risque métier.

### Tests prioritaires

1. Validation du schéma Zod :
   - données valides acceptées ;
   - données invalides rejetées.

2. Génération DOCX :
   - un fichier est généré à partir de données mockées.

3. Parsing de réponse LLM :
   - une réponse JSON valide est parsée ;
   - une réponse invalide déclenche une erreur propre.

### Tests optionnels

- E2E Playwright couvrant le happy path :
  - upload ;
  - OCR mocké ;
  - extraction mockée ;
  - génération DOCX.

---

## Critères d’évaluation

L’évaluation est faite sur quatre axes de poids équivalent.

### 1. Qualité du code

Attendu :

- architecture claire ;
- séparation UI / logique métier / appels LLM / génération document ;
- TypeScript strict ;
- pas de `any` non justifié ;
- types métier explicites ;
- gestion d’erreurs propre ;
- conventions de nommage cohérentes ;
- fichiers de taille raisonnable ;
- pas de duplication évidente ;
- ESLint et Prettier configurés.

### 2. UI / UX

Attendu :

- interface lisible ;
- hiérarchie visuelle nette ;
- responsive desktop ;
- états du parcours bien gérés ;
- feedback utilisateur clair ;
- accessibilité minimale.

### 3. Stratégie de tests

Attendu :

- stratégie justifiée ;
- tests concentrés sur les risques métier ;
- explication de ce qui est testé ;
- explication de ce qui n’est pas testé et pourquoi.

### 4. Documentation & Developer Experience

Attendu :

- `README.md` complet ;
- setup local en moins de 5 minutes ;
- variables d’environnement documentées ;
- scripts disponibles ;
- URL Vercel indiquée ;
- commentaires pertinents sur la logique non triviale ;
- historique Git propre ;
- aucun fichier `.env` commité.

---

## README attendu

Le `README.md` doit contenir :

```md
# OCR-to-Report

## Description

## Fonctionnalités

## Stack technique

## Architecture

## Installation locale

## Variables d’environnement

## Lancer le projet

## Lancer les tests

## Déploiement

## URL Vercel

## Limites connues

## Améliorations possibles
```

Commandes à documenter :

```bash
npm install
npm run dev
npm run lint
npm run test
npm run build
```

---

## Livrables à fournir

Trois livrables sont attendus :

1. Lien vers le repository GitHub.
2. URL Vercel de l’application déployée et fonctionnelle.
3. Note de synthèse de 1 à 2 pages, au format Markdown ou PDF.

---

## Note de synthèse attendue

La note doit couvrir :

1. Choix d’architecture.
2. Arbitrages techniques principaux.
3. Stratégie de tests et justification.
4. Limites assumées de l’implémentation.
5. Axes d’amélioration avec plus de temps.
6. Estimation du temps passé.

Structure recommandée :

```md
# Note de synthèse

## 1. Choix d’architecture

## 2. Arbitrages techniques

## 3. Stratégie de tests

## 4. Limites assumées

## 5. Améliorations possibles

## 6. Temps passé
```

---

## Limites assumées possibles

Exemples à mentionner si pertinent :

- support limité à un seul type de document ;
- pas d’authentification ;
- pas de base de données ;
- pas d’historique des documents ;
- pas de scoring de confiance par champ ;
- extraction dépendante de la qualité de l’OCR ;
- pas de support complet du batch multi-documents ;
- tests E2E non implémentés si manque de temps.

---

## Améliorations possibles

Exemples :

- support multi-documents ;
- support multi-templates ;
- choix du type de document à l’upload ;
- scoring de confiance par champ ;
- interface de correction plus avancée ;
- historique des exports ;
- comparaison OCR brut / extraction structurée ;
- tests E2E Playwright ;
- chatbot de Q&A sur les documents ;
- dossier `.claude/` avec conventions et commandes agentiques.

---

## Bonus optionnels

À ne faire que si le périmètre principal est solide :

- chatbot d’interaction avec le corpus ;
- dossier `.claude/` soigné ;
- support batch multi-documents ;
- édition manuelle avancée des champs ;
- tests E2E Playwright.

Ne pas commencer par les bonus.

---

## Ordre de développement conseillé

1. Initialiser le projet Next.js.
2. Installer les dépendances.
3. Configurer TypeScript strict.
4. Créer le schéma Zod.
5. Configurer le client Mistral.
6. Implémenter la route OCR.
7. Implémenter la route extraction structurée.
8. Tester le pipeline OCR → JSON validé.
9. Créer le template Word.
10. Implémenter la génération DOCX.
11. Construire l’interface utilisateur.
12. Ajouter preview et correction manuelle.
13. Ajouter gestion d’erreurs.
14. Ajouter tests unitaires ciblés.
15. Rédiger le README.
16. Déployer sur Vercel.
17. Rédiger la note de synthèse.

---

## Priorités

### Must-have

- Upload PDF
- OCR Mistral
- Extraction structurée Mistral
- Validation Zod
- Preview des données
- Correction manuelle simple
- Génération DOCX
- Téléchargement du fichier
- README
- Déploiement Vercel

### Nice-to-have

- Multi-documents
- UI avancée
- Tests E2E
- Chatbot
- Dossier `.claude/`
- Historique des exports

---

## Principe directeur

Livrer un MVP petit, propre, robuste et entièrement explicable.

Mieux vaut un pipeline simple mais maîtrisé qu’une application ambitieuse difficile à justifier pendant le debrief.
