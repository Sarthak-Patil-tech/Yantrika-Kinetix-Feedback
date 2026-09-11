/*************************************************
 *  YANTRIKA — WALL·E Edition · tiny backend (v3)
 *
 *  Where this file lives:
 *    Your Google Sheet → Extensions → Apps Script
 *    (replace the default code with this file)
 *
 *  What it does:
 *    POST type=general   → saves one row into  Sheet "General feedback"  (Sheet 2)
 *    POST type=botbatch  → saves N rows into   Sheet "bot feedback"      (Sheet 1)
 *    GET  ?sheet=general → returns general reviews as JSON
 *    GET  ?sheet=bot     → returns per-bot reviews as JSON
 *
 *  The two tabs are created automatically the first time they are
 *  written to (or run `setup` once to create them up front).
 *
 *  Deploy it as: Deploy → New deployment → Web app
 *  (Execute as: Me · Who has access: Anyone)
 *
 *  IMPORTANT after editing: Deploy → Manage deployments →
 *  pencil icon → Version: New version → Deploy. (URL stays the same.)
 *************************************************/

const SHEET_BOT     = "bot feedback";       // Sheet 1 — one row per bot station
const SHEET_GENERAL = "General feedback";   // Sheet 2 — final overall feedback

const BOT_HEADERS = ["ID", "Name", "Branch", "Bot", "Rating", "Feedback", "Date"];
const GEN_HEADERS = ["ID", "Name", "Branch", "Rating", "Feedback", "Date"];

/* OPTIONAL: leave "" if you created this script FROM the sheet
   (Extensions → Apps Script — the recommended way).
   If you instead created a STANDALONE script at script.google.com,
   getActiveSpreadsheet() returns null; paste your sheet's ID here
   (the long string in the sheet URL between /d/ and /edit).       */
const SPREADSHEET_ID = "";

function ss_() {
  return SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
}


// ---------- helper: get (or create) a sheet with its header row ----------
function sheet_(name, headers) {
  const ss = ss_();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sh;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


// ---------- GET: return reviews as JSON (?sheet=bot | general) ----------
function doGet(e) {
  const which = (e && e.parameter && e.parameter.sheet === "bot") ? "bot" : "general";

  if (which === "bot") {
    const sh = sheet_(SHEET_BOT, BOT_HEADERS);
    const rows = sh.getDataRange().getValues();
    const out = [];
    for (let i = 1; i < rows.length; i++) {
      out.push({
        id:       rows[i][0],
        name:     rows[i][1],
        branch:   rows[i][2],
        bot:      rows[i][3],
        rating:   rows[i][4],
        feedback: rows[i][5],
        date:     rows[i][6]
      });
    }
    return json_(out);
  }

  const sh = sheet_(SHEET_GENERAL, GEN_HEADERS);
  const rows = sh.getDataRange().getValues();
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    out.push({
      id:       rows[i][0],
      name:     rows[i][1],
      branch:   rows[i][2],
      rating:   rows[i][3],
      feedback: rows[i][4],
      date:     rows[i][5]
    });
  }
  return json_(out);
}


// ---------- POST: save feedback ----------
function doPost(e) {
  const p = (e && e.parameter) || {};
  const type = String(p.type || "general").toLowerCase();

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);                    // serialize writes (batch safety)
  try {

    /* ----- Sheet 1: per-bot feedback, sent as one batch -----
       payload = JSON array: [{bot, rating, feedback}, …]        */
    if (type === "botbatch") {
      let rows = [];
      try { rows = JSON.parse(p.payload || "[]"); } catch (err) { rows = []; }
      if (!Array.isArray(rows) || rows.length === 0) {
        return json_({ result: "error", message: "No bot rows received." });
      }

      const sh = sheet_(SHEET_BOT, BOT_HEADERS);
      let id = sh.getLastRow();            // header is row 1 → first data id = 1
      const vals = rows.map(function (r) {
        return [
          id++,
          p.name        || "",
          p.branch      || "",
          r.bot         || "",
          r.rating      || "",
          r.feedback    || "",
          new Date()
        ];
      });
      sh.getRange(sh.getLastRow() + 1, 1, vals.length, BOT_HEADERS.length).setValues(vals);
      return json_({ result: "success", saved: vals.length, sheet: SHEET_BOT });
    }

    /* ----- Sheet 2: final overall feedback (one row) ----- */
    const sh = sheet_(SHEET_GENERAL, GEN_HEADERS);
    const id = sh.getLastRow();
    sh.appendRow([
      id,
      p.name     || "",
      p.branch   || "",
      p.rating   || "",
      p.feedback || "",
      new Date()
    ]);
    return json_({ result: "success", saved: 1, sheet: SHEET_GENERAL });

  } catch (err) {
    return json_({ result: "error", message: String(err) });
  } finally {
    lock.releaseLock();
  }
}


// ---------- OPTIONAL helper: creates both tabs + header rows ----------
// Select "setup" → click Run once, if you prefer the tabs ready up front.
function setup() {
  sheet_(SHEET_BOT, BOT_HEADERS);
  sheet_(SHEET_GENERAL, GEN_HEADERS);
}
