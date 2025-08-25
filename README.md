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
- Detects errors and issues:  
  - **HTTP 4xx/5xx** (404, 410, 500, 503…)  
  - **3xx redirects** (configurable: OK or suspicious)  
  - **Timeouts / network errors**  
  - **200 OK pages** that contain error messages (customizable matchers)  
- Applies a configurable action:  
  - `PAUSE` = pause impacted entities  
  - `LABEL` = add a label without pausing (watch mode)  
- Reporting:  
  - Logs results to a **Google Sheet** (if a URL is provided)  
  - Sends a **summary email** to the configured recipients  

## ⚙️ Setup (5 minutes)
1. (Optional) Create a **Google Sheet** and copy its URL.  
2. In **Google Ads → Tools & settings → Scripts → New script**:  
   - Paste the content of `main_en.gs` (the script is language‑agnostic).  
   - Click **Authorize**, **Preview**, then **Run** once.  
3. Schedule the script (e.g., daily at 08:00 — account time zone).  
4. Adjust key settings inside the script:  
   - `ACTION_MODE`: `"PAUSE"` or `"LABEL"`  
   - `LABEL_NAME`: label name if using LABEL mode  
   - `SPREADSHEET_URL`: Google Sheet URL  
   - `EMAILS`: report recipients  
   - `TREAT_REDIRECTS_AS_OK`: `true` or `false`  
   - `EXTRA_BROKEN_MATCHERS`: words/phrases to flag inside HTML (e.g., “Page not found”)  

## ✅ Best practices
- Start with **LABEL mode** to avoid false positives.  
- Customize `EXTRA_BROKEN_MATCHERS` to fit your CMS error pages.  
- Increase `FETCH_TIMEOUT_MS` if your site is slow.  

## 🔎 Limitations
- Works at **account level** (wrap with `AdsManagerApp.accounts()` for MCC).  
- Subject to Google Apps Script quotas (**UrlFetchApp**).  
- Some Display/YouTube URLs may not be checked.  

---

# 🇫🇷 Français

## 🎯 Ce que fait le script
- Vérifie les **URL finales** des annonces et mots‑clés actifs  
- Détecte toutes les situations problématiques :  
  - **Erreurs HTTP 4xx/5xx** (404, 410, 500, 503…)  
  - **Redirections 3xx** (configurable : OK ou suspectes)  
  - **Timeouts / erreurs réseau**  
  - **Pages en 200 OK** mais contenant un message d’erreur (motifs personnalisables)  
- Applique une action configurable :  
  - `PAUSE` = met en pause les éléments impactés  
  - `LABEL` = ajoute un label sans couper la diffusion (mode veille)  
- Reporting :  
  - Journalisation détaillée dans un **Google Sheet** (si une URL est fournie)  
  - **Email récapitulatif** envoyé aux destinataires configurés  

## ⚙️ Installation (5 minutes)
1. (Optionnel) Créez un **Google Sheet** et copiez son URL.  
2. Dans **Google Ads → Outils & paramètres → Scripts → Nouveau script** :  
   - Collez le contenu de `main_fr.gs`.  
   - Cliquez sur **Autoriser**, **Aperçu**, puis **Exécuter** une fois.  
3. Planifiez le script (ex. tous les jours à 08:00 — fuseau du compte).  
4. Paramètres clés à adapter :  
   - `ACTION_MODE` : `"PAUSE"` ou `"LABEL"`  
   - `LABEL_NAME` : nom du label si mode LABEL  
   - `SPREADSHEET_URL` : URL de la feuille Google  
   - `EMAILS` : destinataires du rapport  
   - `TREAT_REDIRECTS_AS_OK` : `true` ou `false`  
   - `EXTRA_BROKEN_MATCHERS` : mots/phrases à détecter dans le HTML (ex. « Page not found »)  

## ✅ Bonnes pratiques
- Démarrez en **mode LABEL** pour éviter les faux positifs.  
- Adaptez `EXTRA_BROKEN_MATCHERS` aux pages d’erreur de votre CMS.  
- Augmentez `FETCH_TIMEOUT_MS` si votre site est lent.  

## 🔎 Limites
- Fonctionne au **niveau compte** (extensible en MCC via `AdsManagerApp.accounts()`).  
- Soumis aux quotas Google Apps Script (**UrlFetchApp**).  
- Certaines URL Display/YouTube peuvent ne pas être vérifiées.  

---

## 👤 Author | Auteur
**Thibault Fayol** – Freelance SEA & Acquisition Digitale Rentable (Montpellier, FR)  
🔗 [Website](https://thibaultfayol.com) | [LinkedIn](https://www.linkedin.com/in/thibault-fayol)  

---
## 📄 License | Licence
MIT
