/***** PARAMÈTRES MARKETING À ADAPTER *****/
const SETTINGS = {
  // 1) Action quand une URL casse :
  ACTION_MODE: "PAUSE",           // "PAUSE" ou "LABEL" (ne rien arrêter si "LABEL")
  LABEL_NAME: "⚠️ URL cassée",     // Nom du label si ACTION_MODE="LABEL"

  // 2) Reporting :
  SPREADSHEET_URL: "",            // Colle l'URL d’une Google Sheet vide (ou laisse vide pour désactiver)
  EMAILS: ["contact@tondomaine.com"], // Destinataires du rapport (peut être vide)

  // 3) Limites & timeouts :
  MAX_URLS_PER_RUN: 500,          // Sécurité pour ne pas dépasser le quota d’exécution
  FETCH_TIMEOUT_MS: 20000,        // Timeout par requête (ms)
  PARALLEL_BATCH: 20,             // Traiter les URLs par lots (évite les timeouts globaux)
  
  // 4) Règles de statut HTTP considérées “cassé” :
  TREAT_REDIRECTS_AS_OK: true,    // True = 3xx OK ; False = on les considère suspects
  EXTRA_BROKEN_MATCHERS: ["Page not found", "404", "error 500", "maintenance"], // Mots-clés dans la page
};
/*******************************************/

function main() {
  const start = new Date();
  const broken = [];       // [{url, status, reason, entities:[{type,id,name}] }]
  const urlToEntities = {}; // url -> Set of entity refs
  const uniqueUrls = new Set();

  // 1) Récupérer toutes les URLs finales actives (Annonces + Mots-clés)
  collectAdUrls(uniqueUrls, urlToEntities);
  collectKeywordUrls(uniqueUrls, urlToEntities);

  // 2) Tronquer si trop d’URLs (sécurité quotas)
  const urlsToCheck = Array.from(uniqueUrls).slice(0, SETTINGS.MAX_URLS_PER_RUN);

  // 3) Vérifier les URLs par petits lots
  const results = checkUrlsInBatches(urlsToCheck);
  for (const r of results) {
    if (!r) continue;
    if (isBroken(r)) {
      broken.push({
        url: r.url,
        status: r.status,
        reason: r.reason,
        entities: Array.from(urlToEntities[r.url] || []),
      });
    }
  }

  // 4) Appliquer l’action (Pause ou Label)
  const actions = applyActions(broken);

  // 5) Reporter (Sheet + Email)
  writeToSheet(broken, actions);
  sendEmailSummary(broken, actions, start);

  // Log fin
  Logger.log("Vérification terminée. URLs vérifiées: " + urlsToCheck.length + 
             " | URLs cassées: " + broken.length);
}

/* ===== Collecte des URLs sur les ENTITÉS ===== */

function collectAdUrls(uniqueUrls, urlToEntities) {
  const it = AdsApp.ads()
    .withCondition("Status = ENABLED")
    .get();
  while (it.hasNext()) {
    const ad = it.next();
    const name = getAdName(ad);
    const id = ad.getId();
    const urls = getAllFinalUrls(ad);
    for (const u of urls) {
      if (!u) continue;
      track(u, "AD", id, name, uniqueUrls, urlToEntities);
    }
  }
}

function collectKeywordUrls(uniqueUrls, urlToEntities) {
  const it = AdsApp.keywords()
    .withCondition("Status = ENABLED")
    .get();
  while (it.hasNext()) {
    const kw = it.next();
    const id = kw.getId();
    const name = kw.getText();
    const url = safe(() => kw.urls().getFinalUrl());
    if (url) track(url, "KEYWORD", id, name, uniqueUrls, urlToEntities);
  }
}

function getAllFinalUrls(ad) {
  const urls = [];
  const u = safe(() => ad.urls().getFinalUrl());
  const mobile = safe(() => ad.urls().getMobileFinalUrl());
  if (u) urls.push(u);
  if (mobile && mobile !== u) urls.push(mobile);
  return urls;
}

function getAdName(ad) {
  try {
    if (ad.isType().responsiveSearchAd()) return "RSA";
    if (ad.isType().expandedTextAd()) return ad.asType().expandedTextAd().getHeadlinePart1();
    if (ad.isType().imageAd()) return "Image Ad";
  } catch(e){}
  return "Ad #" + ad.getId();
}

function track(url, type, id, name, uniqueUrls, urlToEntities) {
  const clean = normalizeUrl(url);
  uniqueUrls.add(clean);
  if (!urlToEntities[clean]) urlToEntities[clean] = new Set();
  urlToEntities[clean].add({ type: type, id: id, name: name });
}

/* ===== Vérification HTTP ===== */

function checkUrlsInBatches(urls) {
  const out = [];
  for (let i = 0; i < urls.length; i += SETTINGS.PARALLEL_BATCH) {
    const slice = urls.slice(i, i + SETTINGS.PARALLEL_BATCH);
    const batch = slice.map(u => checkUrl(u));
    out.push.apply(out, batch);
  }
  return out;
}

function checkUrl(url) {
  try {
    const resp = UrlFetchApp.fetch(url, {
      followRedirects: true,
      muteHttpExceptions: true,
      validateHttpsCertificates: true,
      method: "get",
      contentType: "application/x-www-form-urlencoded",
      escaping: false,
      timeout: SETTINGS.FETCH_TIMEOUT_MS
    });
    const code = resp.getResponseCode();
    const body = safe(() => resp.getContentText()) || "";

    if (code >= 400) {
      return { url: url, status: code, reason: "HTTP_" + code, body: body };
    }
    if (!SETTINGS.TREAT_REDIRECTS_AS_OK && code >= 300 && code < 400) {
      return { url: url, status: code, reason: "REDIRECT_" + code, body: body };
    }
    const hit = SETTINGS.EXTRA_BROKEN_MATCHERS.find(m => body.toLowerCase().indexOf(m.toLowerCase()) !== -1);
    if (hit) {
      return { url: url, status: code, reason: "CONTENT_FLAG_" + hit, body: "" };
    }
    return { url: url, status: code, reason: "OK" };
  } catch (e) {
    return { url: url, status: 0, reason: "FETCH_ERROR: " + String(e) };
  }
}

function isBroken(result) {
  if (!result) return false;
  if (result.reason === "OK") return false;
  if (result.status >= 400) return true;
  if (!SETTINGS.TREAT_REDIRECTS_AS_OK && result.status >= 300) return true;
  if (result.reason && result.reason.indexOf("CONTENT_FLAG_") === 0) return true;
  if (result.status === 0) return true; // timeouts, DNS, etc.
  return false;
}

/* ===== Actions : Pause / Label ===== */

function applyActions(broken) {
  const summary = { pausedAds: 0, pausedKeywords: 0, labeledAds: 0, labeledKeywords: 0 };
  if (SETTINGS.ACTION_MODE === "LABEL") ensureLabel(SETTINGS.LABEL_NAME);

  for (const row of broken) {
    for (const ent of row.entities) {
      if (ent.type === "AD") {
        const ad = findAdById(ent.id);
        if (!ad) continue;
        if (SETTINGS.ACTION_MODE === "PAUSE") {
          if (ad.isEnabled()) { ad.pause(); summary.pausedAds++; }
        } else {
          ad.applyLabel(SETTINGS.LABEL_NAME);
          summary.labeledAds++;
        }
      } else if (ent.type === "KEYWORD") {
        const kw = findKeywordById(ent.id);
        if (!kw) continue;
        if (SETTINGS.ACTION_MODE === "PAUSE") {
          if (kw.isEnabled()) { kw.pause(); summary.pausedKeywords++; }
        } else {
          kw.applyLabel(SETTINGS.LABEL_NAME);
          summary.labeledKeywords++;
        }
      }
    }
  }
  return summary;
}

function ensureLabel(name) {
  if (!AdsApp.labels().withCondition(`Name = "${name}"`).get().hasNext()) {
    AdsApp.createLabel(name);
  }
}

function findAdById(id) {
  const it = AdsApp.ads().withCondition("AdId = " + id).get();
  return it.hasNext() ? it.next() : null;
}
function findKeywordById(id) {
  const it = AdsApp.keywords().withCondition("Id = " + id).get();
  return it.hasNext() ? it.next() : null;
}

/* ===== Reporting : Google Sheet + Email ===== */

function writeToSheet(broken, actions) {
  if (!SETTINGS.SPREADSHEET_URL) return;
  const ss = SpreadsheetApp.openByUrl(SETTINGS.SPREADSHEET_URL);
  const sh = ss.getSheetByName("broken_urls") || ss.insertSheet("broken_urls");
  if (sh.getLastRow() === 0) {
    sh.appendRow(["Timestamp", "URL", "HTTP/Reason", "Nb entités impactées", "Action", "Détail entités"]);
  }
  const ts = new Date();
  broken.forEach(b => {
    const entitiesTxt = b.entities.map(e => `${e.type}:${e.id}(${truncate(e.name,60)})`).join(" | ");
    sh.appendRow([
      ts,
      b.url,
      (b.status + " / " + b.reason),
      b.entities.length,
      SETTINGS.ACTION_MODE,
      entitiesTxt
    ]);
  });
  // Résumé en pied
  sh.appendRow([ts, "SUMMARY", JSON.stringify(actions), "", "", ""]);
}

function sendEmailSummary(broken, actions, startTime) {
  if (!SETTINGS.EMAILS || SETTINGS.EMAILS.length === 0) return;
  const duration = Math.round((new Date() - startTime) / 1000);
  const totalEntities = broken.reduce((acc, b) => acc + b.entities.length, 0);

  let body = [];
  body.push("Rapport URL Guard (Google Ads)");
  body.push("");
  body.push("URLs cassées détectées : " + broken.length);
  body.push("Éléments impactés (annonces + mots-clés) : " + totalEntities);
  body.push("Action appliquée : " + SETTINGS.ACTION_MODE + (SETTINGS.ACTION_MODE === "LABEL" ? ` (${SETTINGS.LABEL_NAME})` : ""));
  body.push("");
  body.push("Détails (max 20) :");
  broken.slice(0,20).forEach(b=>{
    body.push(`- ${b.url} → ${b.status} / ${b.reason} | ${b.entities.length} entité(s)`);
  });
  body.push("");
  body.push("Résumé actions : " + JSON.stringify(actions));
  body.push("Durée d’exécution : " + duration + "s");
  if (SETTINGS.SPREADSHEET_URL) {
    body.push("");
    body.push("Sheet : " + SETTINGS.SPREADSHEET_URL);
  }

  for (const to of SETTINGS.EMAILS) {
    MailApp.sendEmail({
      to: to,
      subject: "Google Ads – URLs cassées détectées",
      htmlBody: "<pre style='font-family:monospace'>" + body.join("\n") + "</pre>"
    });
  }
}

/* ===== Utilitaires ===== */

function normalizeUrl(url) {
  try {
    // Évite de checker deux fois la même URL à trailing slash près
    return url.replace(/#.*$/, "").replace(/\/+$/, "");
  } catch(e) { return url; }
}
function truncate(str, n){ return (str && str.length>n) ? str.slice(0,n-1)+"…" : str; }
function safe(fn){ try{ return fn(); } catch(e){ return null; } }
