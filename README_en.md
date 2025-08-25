# Google Ads URL Guard (EN)

Google Ads Script to **automatically monitor landing page health** for ads and keywords.

---

## 🎯 What it does
- Crawls **final URLs** from active ads & keywords.  
- Detects all problematic cases:  
  - **4xx / 5xx HTTP errors** (404, 410, 500, 503, …)  
  - **3xx redirects** (configurable: OK or suspicious)  
  - **Timeouts / network errors**  
  - **200 OK pages with embedded error messages** (customizable matchers)  
- Applies a configurable marketing action:  
  - `PAUSE` = pause impacted entities  
  - `LABEL` = add a label without pausing (watch mode)  
- Reporting:  
  - Detailed log into **Google Sheets** (if URL provided)  
  - **Summary email** sent to configured recipients  

---

## ⚙️ Setup (5 minutes)
1. Create an empty **Google Sheet** (optional but recommended). Copy its URL.  
2. In **Google Ads → Tools & settings → Scripts → New script**:  
   - Paste the content of `main_fr.gs` (logic is language-agnostic).  
   - Click **Authorize**, **Preview**, then **Run** once.  
3. Schedule the script (e.g. **daily at 08:00**, or more frequently if needed).  
4. Adjust key settings:  
   - `ACTION_MODE` = `"PAUSE"` or `"LABEL"`  
   - `LABEL_NAME` = label name if LABEL  
   - `SPREADSHEET_URL` = Google Sheet URL  
   - `EMAILS` = recipients  
   - `TREAT_REDIRECTS_AS_OK` = `true` (default) or `false`  
   - `EXTRA_BROKEN_MATCHERS` = phrases to detect inside HTML (e.g. “Page not found”)  

---

## ✅ Best practices
- Start in **LABEL mode** to avoid false positives.  
- Customize `EXTRA_BROKEN_MATCHERS` to fit your CMS error patterns.  
- Increase `FETCH_TIMEOUT_MS` if your site loads slowly.  

---

## 🔎 Limitations
- Works at **account level**. For MCC, wrap with `AdsManagerApp.accounts()`.  
- Subject to Apps Script quotas (HTTP fetch limits).  
- Some Display/YouTube asset URLs may not be checked.  

---

## 👤 Author
**Thibault Fayol**  
Freelance SEA & Performance Marketing Consultant (Montpellier, FR)  
📌 [Website](https://thibaultfayol.com) – [LinkedIn](https://www.linkedin.com/in/thibault-fayol)  

---

## 📄 License
MIT
