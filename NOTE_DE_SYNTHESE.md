# Note de synthèse

## 1. Choix d'architecture et arbitrages techniques

J'ai choisi une architecture simple, lisible et adaptée à un MVP de test technique :

- `src/app/page.tsx` pilote le parcours utilisateur ;
- `src/app/api/*` contient des routes HTTP fines ;
- `src/lib/*` contient la logique métier et les intégrations externes ;
- `src/components/*` contient les briques UI réutilisables.

L'idée principale a été de **séparer l'orchestration UI, la couche HTTP et la logique métier**.  
Cela permet de :

- garder les routes API faciles à relire ;
- tester la logique sans dépendre du runtime Next.js ;
- limiter le couplage entre interface, OCR, extraction et génération DOCX.

Le schéma `Zod` a été placé au centre du pipeline dans `src/lib/schemas.ts`. C'est le contrat partagé entre :

- l'extraction LLM ;
- l'édition manuelle côté UI ;
- la génération DOCX.

Cet arbitrage était important car l'un des risques principaux du sujet est de **faire confiance trop vite à la sortie du LLM**. J'ai donc préféré :

- OCR -> texte brut ;
- texte brut -> extraction structurée ;
- extraction -> validation `Zod` ;
- validation -> correction manuelle ;
- correction -> revalidation serveur avant DOCX.

J'ai également choisi de **pivoter vers le use case `devis fournisseurs -> bon de commande client`**. Ce choix est conforme au sujet et il était plus cohérent avec le corpus disponible pendant le développement.

Enfin, j'ai gardé un **scope volontairement restreint** :

- un seul document à la fois ;
- un seul type de document ;
- pas d'authentification ;
- pas de base de données ;
- pas d'historique ;
- pas de batch multi-documents.

L'objectif n'était pas d'industrialiser le produit, mais de rendre le pipeline principal propre, démontrable et testable.

## 2. Stratégie de tests et justification

La stratégie de tests est **orientée risque**, et non exhaustive.

J'ai concentré les tests sur les zones les plus fragiles du MVP :

- validation du schéma métier ;
- parsing et validation de la réponse d'extraction ;
- normalisation OCR ;
- génération DOCX ;
- principaux cas d'erreur.

Les tests principaux sont :

- `src/lib/schemas.test.ts`
- `src/lib/extraction.test.ts`
- `src/lib/ocr.test.ts`
- `src/lib/docx.test.ts`
- `src/lib/dev2-quote-fixture.test.ts`

Cette approche est justifiée par la nature du projet : le risque n'est pas dans une logique algorithmique complexe côté UI, mais dans :

- la qualité du document OCR ;
- la robustesse de l'extraction LLM ;
- la cohérence du contrat métier ;
- la capacité à produire un DOCX valide.

Je n'ai pas cherché une couverture exhaustive de l'interface ou des tests E2E, car cela aurait augmenté le temps de développement sans sécuriser autant le cœur du use case.

## 3. Limites assumées de l'implémentation

Les limites principales sont les suivantes :

- support d'un seul PDF à la fois ;
- un seul cas d'usage métier ;
- pas de persistance des documents ni des exports ;
- pas de score de confiance par champ extrait ;
- pas de file d'attente ou de traitement asynchrone ;
- pas de gestion avancée des documents hors périmètre ;
- pas de tests E2E navigateur ;
- dépendance forte à la qualité OCR et à la structuration réelle du devis.

Ces limites sont assumées car le projet est pensé comme un **MVP démonstratif**, pas comme une plateforme prête à être exploitée en production à grande échelle.

## 4. Axes d'amélioration avec plus de temps

Avec plus de temps, je poursuivrais en priorité :

1. une meilleure qualification documentaire avant extraction ;
2. un support batch multi-documents ;
3. un export ZIP pour plusieurs bons de commande ;
4. un affichage des niveaux de confiance ou des champs suspects ;
5. une édition manuelle plus ergonomique sur les lignes ;
6. des templates DOCX multiples selon le client ou le type de devis ;
7. des tests E2E sur le parcours complet ;
8. une persistance minimale pour conserver les traitements.

Je travaillerais aussi la robustesse du prompt d'extraction sur un corpus plus large, afin de mieux séparer les informations commerciales, réglementaires, contractuelles et de garantie.

## 5. Estimation du temps passé

Estimation du temps passé : **environ 5 heures**.

Répartition approximative :

- setup projet et structuration technique : `~1h`
- implémentation OCR + extraction + validation : `~1h30`
- génération DOCX : `~45 min`
- UI MVP et édition manuelle : `~1h`
- tests, ajustements, documentation et nettoyage : `~45 min`

Cette estimation reste volontairement humaine et arrondie. Elle correspond au temps utile de conception, d'implémentation, de tests et de finition du MVP.
