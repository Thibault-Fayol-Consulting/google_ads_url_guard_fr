/****************************************************
 * GOOGLE ADS URL GUARD (FR)
 * Auteur : Thibault Fayol
 *
 * 🎯 Objectif marketing :
 * - Vérifier automatiquement les pages de destination (LP)
 *   utilisées par vos annonces et mots‑clés.
 * - Éviter de gaspiller du budget sur des liens cassés
 *   (4xx/5xx, redirections suspectes, erreurs réseau).
 * - Alerter par email/Google Sheet + PAUSE ou LABEL.
 ****************************************************/

const SETTINGS = {
  // Action : "PAUSE" (pause auto) ou "LABEL" (ajoute un label)
  ACTION_MODE: "LABEL",
  LABEL_NAME: "⚠️ URL cassée",

  // Reporting (optionnels)
  SPREADSHEET_URL: "",                 // URL d'une Google Sheet pour journaliser
  EMAILS: ["contact@example.com"],      // Destinataires du rapport

  // Comportement
  TREAT_REDIRECTS_AS_OK: true,          // true = redirections 3xx acceptées
  EXTRA_BROKEN_MATCHERS: [              // Mots indiquant une page en erreur malgré 200 OK
    "page not found","maintenance","erreur","404","problème technique"
  ],

  // Quotas & sécurité
  MAX_URLS_PER_RUN: 300                 // Limite d'URLs analysées par exécution
};

function main() {
  const seen = Object.create(null);   // déduplication (évite de tester 5× la même URL)
  const broken = [];                  // liste des éléments cassés
  const checked = [];                 // toutes les URLs vérifiées
  let processed = 0;

  // 1) Annonces actives
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
      broken.push({type: "Annonce", ref: ad.getId(), url, reason: result.reason});
      takeAction_(ad);
    }
    checked.push(url);
    processed++;
  }

  // 2) Mots‑clés actifs
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
      broken.push({type: "Mot‑clé", ref: kw.getText(), url, reason: result.reason});
      takeAction_(kw);
    }
    checked.push(url);
    processed++;
  }

  // 3) Rapport
  report_(broken, checked);
}

/** Récupère l'URL finale en évitant les erreurs null/undefined. */
function safeFinalUrl_(urls) {
  try {
    return urls && urls.getFinalUrl ? urls.getFinalUrl() : null;
  } catch (_) {
    return null;
  }
}

/** Vérifie une URL : code HTTP + recherche de mots d'erreur dans le HTML. */
function checkUrl_(url) {
  try {
    const resp = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true
      // Pas de timeout paramétrable dans Apps Script
    });
    const code = resp.getResponseCode();
    const body = resp.getContentText() || "";

    if (code >= 400) return { isBroken: true, reason: "Erreur HTTP " + code };
    if (!SETTINGS.TREAT_REDIRECTS_AS_OK && code >= 300 && code < 400) {
      return { isBroken: true, reason: "Redirection " + code };
    }
    const lower = body.toLowerCase();
    for (const token of SETTINGS.EXTRA_BROKEN_MATCHERS) {
      if (token && lower.indexOf(String(token).toLowerCase()) !== -1) {
        return { isBroken: true, reason: "Message d'erreur détecté (200 OK)" };
      }
    }
    return { isBroken: false, reason: "OK" };
  } catch (e) {
    return { isBroken: true, reason: "Erreur réseau / exception" };
  }
}

/** Applique l'action choisie (PAUSE ou LABEL). */
function takeAction_(entity) {
  if (SETTINGS.ACTION_MODE === "PAUSE") {
    try { entity.pause(); } catch (_) {}
  } else {
    ensureLabel_();
    try { entity.applyLabel(SETTINGS.LABEL_NAME); } catch (_) {}
  }
}

/** Crée le label s'il n'existe pas. */
function ensureLabel_() {
  const it = AdsApp.labels().withCondition(`Name = "${SETTINGS.LABEL_NAME}"`).get();
  if (!it.hasNext()) {
    try { AdsApp.createLabel(SETTINGS.LABEL_NAME); } catch (_) {}
  }
}

/** Envoie un email + journalise dans Google Sheet si fourni. */
function report_(broken, checked) {
  let body = "";
  body += "Google Ads URL Guard — Rapport\n";
  body += "-------------------------------\n";
  body += "URLs vérifiées : " + checked.length + "\n";
  body += "URLs cassées  : " + broken.length + "\n\n";
  if (broken.length) body += "Détails (max 20) :\n";
  broken.slice(0, 20).forEach(b =>
    body += `- ${b.type} (${b.ref}) → ${b.url} | ${b.reason}\n`
  );

  // Email
  (SETTINGS.EMAILS || []).forEach(to => {
    if (to) MailApp.sendEmail(String(to), "Rapport Google Ads URL Guard", body);
  });

  // Google Sheet
  if (SETTINGS.SPREADSHEET_URL) {
    try {
      const ss = SpreadsheetApp.openByUrl(SETTINGS.SPREADSHEET_URL);
      const sh = ss.getSheetByName("rapport") || ss.insertSheet("rapport");
      sh.appendRow([new Date(), checked.length, broken.length, JSON.stringify(broken)]);
    } catch (_) {}
  }
}
