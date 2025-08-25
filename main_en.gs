/****************************************************
 * GOOGLE ADS URL GUARD (EN version)
 * Author: Thibault Fayol
 *
 * 🎯 Marketing goal:
 * - Automatically check landing pages (LPs) used by ads/keywords.
 * - Prevent wasting ad budget on broken links (404, 500, redirects, timeouts).
 * - Alert via email/Google Sheet and pause or label impacted items.
 ****************************************************/

const SETTINGS = {
  // Action mode: "PAUSE" (auto pause) or "LABEL" (add a label only)
  ACTION_MODE: "LABEL",
  LABEL_NAME: "⚠️ Broken URL",

  // Reporting
  SPREADSHEET_URL: "", // (optional) paste a Google Sheet URL to log results
  EMAILS: ["contact@example.com"], // report recipients

  // Technical params (leave default unless needed)
  MAX_URLS_PER_RUN: 300,
  FETCH_TIMEOUT_MS: 10000,
  TREAT_REDIRECTS_AS_OK: true,
  EXTRA_BROKEN_MATCHERS: ["Page not found", "maintenance", "error"],
};

function main() {
  const broken = [];
  const checked = [];

  // 1️⃣ Collect active ads URLs
  const ads = AdsApp.ads().withCondition("Status = ENABLED").get();
  while (ads.hasNext()) {
    const ad = ads.next();
    const url = ad.urls().getFinalUrl();
    if (url) {
      const result = checkUrl_(url);
      if (result.isBroken) {
        broken.push({type: "Ad", name: ad.getId(), url, reason: result.reason});
        takeAction_(ad, result.reason);
      }
      checked.push(url);
    }
  }

  // 2️⃣ Collect active keyword URLs
  const kws = AdsApp.keywords().withCondition("Status = ENABLED").get();
  while (kws.hasNext()) {
    const kw = kws.next();
    const url = kw.urls().getFinalUrl();
    if (url) {
      const result = checkUrl_(url);
      if (result.isBroken) {
        broken.push({type: "Keyword", name: kw.getText(), url, reason: result.reason});
        takeAction_(kw, result.reason);
      }
      checked.push(url);
    }
  }

  // 3️⃣ Report (Google Sheet + Email)
  report_(broken, checked);
}

/* Check URL: HTTP code + body scan */
function checkUrl_(url) {
  try {
    const resp = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true,
      timeout: SETTINGS.FETCH_TIMEOUT_MS
    });
    const code = resp.getResponseCode();
    const body = resp.getContentText();

    if (code >= 400) return {isBroken: true, reason: "HTTP error " + code};
    if (!SETTINGS.TREAT_REDIRECTS_AS_OK && code >= 300 && code < 400) return {isBroken: true, reason: "Redirect " + code};
    for (const word of SETTINGS.EXTRA_BROKEN_MATCHERS) {
      if (body.toLowerCase().indexOf(word.toLowerCase()) !== -1) {
        return {isBroken: true, reason: "Error message detected"};
      }
    }
    return {isBroken: false, reason: "OK"};
  } catch (e) {
    return {isBroken: true, reason: "Timeout or network error"};
  }
}

/* Action: pause or label */
function takeAction_(entity, reason) {
  if (SETTINGS.ACTION_MODE === "PAUSE") {
    entity.pause();
  } else {
    ensureLabel_();
    entity.applyLabel(SETTINGS.LABEL_NAME);
  }
}

/* Create label if missing */
function ensureLabel_() {
  if (!AdsApp.labels().withCondition(`Name = "${SETTINGS.LABEL_NAME}"`).get().hasNext()) {
    AdsApp.createLabel(SETTINGS.LABEL_NAME);
  }
}

/* Simple report (email + sheet log) */
function report_(broken, checked) {
  let body = `URLs checked: ${checked.length}\nBroken URLs: ${broken.length}\n\n`;
  broken.slice(0, 20).forEach(b => {
    body += `- ${b.type} (${b.name}) : ${b.url} → ${b.reason}\n`;
  });

  // Email
  for (const to of SETTINGS.EMAILS) {
    MailApp.sendEmail(to, "Google Ads URL Guard Report", body);
  }

  // Google Sheet
  if (SETTINGS.SPREADSHEET_URL) {
    const ss = SpreadsheetApp.openByUrl(SETTINGS.SPREADSHEET_URL);
    const sh = ss.getSheetByName("report") || ss.insertSheet("report");
    sh.appendRow([new Date(), checked.length, broken.length, JSON.stringify(broken)]);
  }
}
