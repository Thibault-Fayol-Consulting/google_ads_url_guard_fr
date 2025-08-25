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
   - Paste the content of `main_fr.gs` (the script is language‑agnostic).  
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
- Customize `EXTRA_BROKEN_MATCHERS` to fit your CMS error pa
