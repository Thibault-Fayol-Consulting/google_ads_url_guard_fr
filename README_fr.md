# Google Ads URL Guard (FR)

Script Google Ads pour **contrôler automatiquement la santé des pages de destination** utilisées par vos annonces/mots‑clés.

## Ce que fait le script
- Vérifie les **final URLs** des **annonces** et **mots‑clés** actifs.
- Détecte **toutes** les situations problématiques :
  - **Codes 4xx/5xx** (404, 410, 500, 503, …)
  - **Redirections** (3xx) optionnellement marquées comme OK ou suspectes
  - **Timeouts / erreurs réseau**
  - **Pages 200 OK** mais contenant un **message d’erreur** (mots‑clés personnalisables)
- Applique une **action marketing** :
  - `PAUSE` : met en pause les éléments impactés
  - `LABEL` : ajoute un label sans couper la diffusion (mode “veille”)
- **Reporting** :
  - Log détaillé dans **Google Sheets** (si URL fournie)
  - **Email récapitulatif** (destinataires configurables)

> Remarque : le nom “404 checker” est volontairement court pour LinkedIn/GitHub, mais le script couvre bien **4xx/5xx + redirections + timeouts + erreurs de contenu**.

## Installation (5 minutes)
1. **Google Sheet (optionnel mais recommandé)**  
   - Créez une feuille vide → copiez l’URL → gardez-la.
2. **Google Ads → Outils & paramètres → Scripts → Nouveau script**  
   - Collez le contenu de `main_fr.gs`  
   - Cliquez **Autoriser**, **Aperçu**, puis **Exécuter**
3. **Planification**  
   - Dans la liste des scripts → **Planification** → **Toutes les heures** (ou 2–4×/jour selon le trafic)
4. **Paramètres clés dans le script**
   - `ACTION_MODE: "PAUSE"` ou `"LABEL"`
   - `LABEL_NAME`: nom du label si mode LABEL
   - `SPREADSHEET_URL`: URL de la Google Sheet (facultatif)
   - `EMAILS`: liste des destinataires
   - `TREAT_REDIRECTS_AS_OK`: `true` (par défaut) ou `false` pour marquer les 3xx comme suspects
   - `EXTRA_BROKEN_MATCHERS`: mots/phrases à chercher dans le HTML (ex. “Page not found”, “maintenance”)

## Bonnes pratiques
- **Démarrer en `LABEL`** 24–48h pour valider qu’il n’y a pas de faux positifs (WAF, 200 OK avec bannière d’erreur, etc.).
- Adapter `EXTRA_BROKEN_MATCHERS` à votre CMS (messages 200 OK mais page HS).
- En cas de sites très lents, ajuster `FETCH_TIMEOUT_MS`.

## Portée & limites
- Fonctionne au **niveau compte**. Pour MCC, encapsulez dans un itérateur `AdsManagerApp.accounts()`.
- Urls fetchées via `UrlFetchApp` (quotas Google Apps Script s’appliquent).
- Les assets Display/YouTube renvoyant des URLs non standard peuvent être ignorés.

## Auteur
**Thibault Fayol** — Consultant SEA & Acquisition Digitale Rentable (Montpellier)  
Site: https://thibaultfayol.com – LinkedIn: https://www.linkedin.com/in/thibault-fayol

## Licence
MIT
