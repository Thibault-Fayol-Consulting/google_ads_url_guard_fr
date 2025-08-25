# Google Ads URL Guard

Google Ads Script to automatically monitor the health of landing pages (LPs) used in your ads and keywords.  
Script Google Ads pour contrôler automatiquement la santé des pages de destination (LP) utilisées par vos annonces et mots‑clés.

---

## 🌍 Languages | Langues
- 🇬🇧 English version → below  
- 🇫🇷 Version française → plus bas  

---

# 🇬🇧 English

## 🎯 What it does
- Crawls the **final URLs** from active ads and keywords  
- Detects issues:  
  - **HTTP 4xx/5xx** (404, 410, 500, 503…)  
  - **3xx redirects** (configurable: OK or suspicious)  
  - **Network errors / request failures**  
  - **200 OK pages** that still display error messages (customizable matchers)  
- Applies a configurable action:  
  - `PAUSE` = pause impacted entities  
  - `LABEL` = add a label without pausing (watch mode)  
- Reporting:  
  - Logs to a **Google Sheet** (if a URL is provided)  
  - Sends a **summary email** to configured recipients  

## ⚙️ Setup (5 minutes)
1. (Optional) Create a **Google Sheet** and copy its URL.  
2. In **Google Ads → Tools & settings → Scripts → New script**:  
   - Paste the content of `main_en.gs` or `main_fr.gs` (logic is identical).  
   - Click **Authorize**, **Preview**, then **Run** once.  
3. Schedule the script (e.g., daily at 08:00 — account time zone).  
4. Adjust key settings inside the script:  
   - `ACTION_MODE`: `"PAUSE"` or `"LABEL"`  
   - `LABEL_NAME`: label name if using LABEL mode  
   - `SPREADSHEET_URL`: Google Sheet URL (optional)  
   - `EMAILS`: report recipients  
   - `TREAT_REDIRECTS_AS_OK`: `true` or `false`  
   - `EXTRA_BROKEN_MATCHERS`: phrases to flag in HTML (e.g., “Page not found”)  
   - `MAX_URLS_PER_RUN`: hard cap to respect Apps Script quotas

> **Note on timeouts:** `UrlFetchApp.fetch` does **not** expose a per‑request timeout. The script treats thrown exceptions as network errors and stops after `MAX_URLS_PER_RUN` to stay within quotas.

## ✅ Best practices
- Start with **LABEL mode** to avoid false positives.  
- Customize `EXTRA_BROKEN_MATCHERS` to fit your CMS error pages.  
- Keep `MAX_URLS_PER_RUN` reasonable on large accounts.

## 🔎 Limitations
- Works at **account level** (wrap with `AdsManagerApp.accounts()` for MCC).  
- Subject to Google Apps Script quotas (**UrlFetchApp**).  
- Some Display/YouTube URLs may not be checkable.

---

# 🇫🇷 Français

## 🎯 Ce que fait le script
- Vérifie les **URL finales** des annonces et mots‑clés actifs  
- Détecte les problèmes :  
  - **Erreurs HTTP 4xx/5xx** (404, 410, 500, 503…)  
  - **Redirections 3xx** (configurable : OK ou suspectes)  
  - **Erreurs réseau / requêtes échouées**  
  - **Pages en 200 OK** affichant quand même un message d’erreur (motifs personnalisables)  
- Applique une action configurable :  
  - `PAUSE` = met en pause les éléments impactés  
  - `LABEL` = ajoute un label sans pause (mode veille)  
- Reporting :  
  - Journalise dans un **Google Sheet** (si une URL est fournie)  
  - Envoie un **email récapitulatif** aux destinataires configurés  

## ⚙️ Installation (5 minutes)
1. (Optionnel) Créez un **Google Sheet** et copiez son URL.  
2. Dans **Google Ads → Outils & paramètres → Scripts → Nouveau script** :  
   - Collez le contenu de `main_fr.gs` ou `main_en.gs` (même logique).  
   - Cliquez **Autoriser**, **Aperçu**, puis **Exécuter** une fois.  
3. Planifiez le script (ex. tous les jours à 08:00 — fuseau du compte).  
4. Paramètres clés :  
   - `ACTION_MODE` : `"PAUSE"` ou `"LABEL"`  
   - `LABEL_NAME` : nom du label si mode LABEL  
   - `SPREADSHEET_URL` : URL de la feuille Google (optionnel)  
   - `EMAILS` : destinataires du rapport  
   - `TREAT_REDIRECTS_AS_OK` : `true` ou `false`  
   - `EXTRA_BROKEN_MATCHERS` : termes à détecter dans le HTML (ex. « Page not found »)  
   - `MAX_URLS_PER_RUN` : limite dure pour respecter les quotas

> **À propos des timeouts :** `UrlFetchApp.fetch` ne permet **pas** de définir un timeout par requête. Le script considère les exceptions comme des erreurs réseau et s’arrête après `MAX_URLS_PER_RUN` pour rester dans les quotas.

## ✅ Bonnes pratiques
- Démarrez en **mode LABEL** pour éviter les faux positifs.  
- Adaptez `EXTRA_BROKEN_MATCHERS` aux pages d’erreur de votre CMS.  
- Gardez un `MAX_URLS_PER_RUN` prudent sur les gros comptes.

## 🔎 Limites
- Fonctionne au **niveau compte** (extensible en MCC via `AdsManagerApp.accounts()`).  
- Soumis aux quotas Google Apps Script (**UrlFetchApp**).  
- Certaines URL Display/YouTube peuvent ne pas être vérifiables.

---

## 👤 Author | Auteur
**Thibault Fayol** – Freelance SEA & Acquisition Digitale Rentable (Montpellier, FR)  
🔗 Website: https://thibaultfayol.com | LinkedIn: https://www.linkedin.com/in/thibault-fayol

---
## 📄 License | Licence
MIT
