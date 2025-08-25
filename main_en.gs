/****************************************************
 * GOOGLE ADS URL GUARD (EN)
 * Author: Thibault Fayol
 *
 * 🎯 Marketing goal:
 * - Automatically check landing pages (LPs) used by
 *   your ads and keywords.
 * - Prevent budget waste from broken links
 *   (4xx/5xx, suspicious redirects, network errors).
 * - Notify via email/Google Sheet + PAUSE or LABEL.
 ****************************************************/

const SETTINGS = {
  // Action mode: "PAUSE" (auto pause) or "LABEL" (tag only)
  ACTION_MODE: "LABEL",
  LABEL_NAME: "⚠️ Broken URL",

  // Reporting (optional)
  SPREADSHEET_URL: "",                 // Google Sheet URL to log results
  EMAILS: ["contact@example.com"],      // Report recipients

  // Behavior
  TREAT_REDIRECTS_AS_OK: true,          // true = accept 3xx redirects
  EXTRA_BROKEN_MATCHERS: [              // Words that indicate an error despite 200 OK
    "page not found","maintenance","error","404","technical issue"
  ],

  // Quotas & safety
  MAX_URLS_PER_RUN: 300                 // Hard cap per execution
};

function main() {
  const seen = Object.create(null);   // dedupe URLs
  const broken = [];
  const checked = [];
  let processed = 0;

  // 1) Active ads
  const ads = AdsApp.ads().withCondition("Status = ENABLED").get();
  while (ads.hasNext()) {
    if (processed >= SETTINGS.MAX_URLS_PER_RUN) break;
    const ad = ads.next();
    const url = safeFinalUrl_(ad.urls());
    if (!url) continue;
    if (seen[url]) { checked.push(url); processed++; continue; }
    seen[url] = true;

    const result = checkUrl_(url);
    if (result.isBroken) {
      broken.push({type: "Ad", ref: ad.getId(), url, reason: result.reason});
      takeAction_(ad);
    }
    checked.push(url);
    processed++;
  }

  // 2) Active keywords
  const kws = AdsApp.keywords().withCondition("Status = ENABLED").get();
  while (kws.hasNext()) {
    if (processed >= SETTINGS.MAX_URLS_PER_RUN) break;
    const kw = kws.next();
    const url = safeFinalUrl_(kw.urls());
    if (!url) continue;
    if (seen[url]) { checked.push(url); processed++; continue; }
    seen[url] = true;

    const result = checkUrl_(url);
    if (result.isBroken) {
      broken.push({type: "Keyword", ref: kw.getText(), url, reason: result.reason});
      takeAction_(kw);
    }
    checked.push(url);
    processed++;
  }

  // 3) Report
  report_(broken, checked);
}

/** Safely gets the final URL, avoiding null/undefined errors. */
function safeFinalUrl_(urls) {
  try {
    return urls && urls.getFinalUrl ? urls.getFinalUrl() : null;
  } catch (_) {
    return null;
  }
}

/** Checks an URL: HTTP status + simple error pattern scan. */
function checkUrl_(url) {
  try {
    const resp = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true
      // No per‑request timeout in Apps Script
    });
    const code = resp.getResponseCode();
    const body = resp.getContentText() || "";

    if (code >= 400) return { isBroken: true, reason: "HTTP " + code };
    if (!SETTINGS.TREAT_REDIRECTS_AS_OK && code >= 300 && code < 400) {
      return { isBroken: true, reason: "Redirect " + code };
    }
    const lower = body.toLowerCase();
    for (const token of SETTINGS.EXTRA_BROKEN_MATCHERS) {
      if (token && lower.indexOf(String(token).toLowerCase()) !== -1) {
        return { isBroken: true, reason: "Error text detected (200 OK)" };
      }
    }
    return { isBroken: false, reason: "OK" };
  } catch (e) {
    return { isBroken: true, reason: "Network error / exception" };
  }
}

/** Applies the chosen action (PAUSE or LABEL). */
function takeAction_(entity) {
  if (SETTINGS.ACTION_MODE === "PAUSE") {
    try { entity.pause(); } catch (_) {}
  } else {
    ensureLabel_();
    try { entity.applyLabel(SETTINGS.LABEL_NAME); } catch (_) {}
  }
}

/** Creates the label if missing. */
function ensureLabel_() {
  const it = AdsApp.labels().withCondition(`Name = "${SETTINGS.LABEL_NAME}"`).get();
  if (!it.hasNext()) {
    try { AdsApp.createLabel(SETTINGS.LABEL_NAME); } catch (_) {}
  }
}

/** Sends an email and logs to Google Sheet if provided. */
function report_(broken, checked) {
  let body = "";
  body += "Google Ads URL Guard — Report\n";
  body += "------------------------------\n";
  body += "URLs checked : " + checked.length + "\n";
  body += "Broken URLs  : " + broken.length + "\n\n";
  if (broken.length) body += "Details (max 20):\n";
  broken.slice(0, 20).forEach(b =>
    body += `- ${b.type} (${b.ref}) → ${b.url} | ${b.reason}\n`
  );

  // Email
  (SETTINGS.EMAILS || []).forEach(to => {
    if (to) MailApp.sendEmail(String(to), "Google Ads URL Guard Report", body);
  });

  // Google Sheet
  if (SETTINGS.SPREADSHEET_URL) {
    try {
      const ss = SpreadsheetApp.openByUrl(SETTINGS.SPREADSHEET_URL);
      const sh = ss.getSheetByName("report") || ss.insertSheet("report");
      sh.appendRow([new Date(), checked.length, broken.length, JSON.stringify(broken)]);
    } catch (_) {}
  }
}
