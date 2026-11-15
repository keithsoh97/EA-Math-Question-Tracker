/**
 * E&A Maths Question Tracker — edit API
 *
 * Lets the tracker page (index.html, in Edit mode) write changes straight
 * into this Google Sheet. Paste this whole file into the Sheet's
 * Extensions → Apps Script editor. Setup steps: apps-script/README.md
 *
 * The passcode is NOT stored here (this file is public on GitHub).
 * It lives in Project Settings → Script properties → EDIT_PASSCODE.
 */

const KEY_FIELDS = ['school', 'year', 'paper', 'question'];
const EDITABLE   = ['topic', 'subtopic', 'difficulty', 'page', 'rank', 'pdf_link'];

function doGet() {
  return out({ ok: true, msg: 'Tracker edit API is running.' });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const pass = PropertiesService.getScriptProperties().getProperty('EDIT_PASSCODE');
    if (!pass || String(body.passcode) !== pass) return out({ ok: false, error: 'Wrong passcode' });

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(body.tab);
    if (!sheet) return out({ ok: false, error: 'No tab named ' + body.tab });
    if (body.action === 'ping') return out({ ok: true });

    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      if (body.action === 'update') return out(update(sheet, body));
      if (body.action === 'append') return out(append(sheet, body));
      return out({ ok: false, error: 'Unknown action' });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return out({ ok: false, error: String(err && err.message || err) });
  }
}

// Change one or more fields of one question row.
// body: { row, key: {school, year, paper, question}, changes: {field: value} }
function update(sheet, body) {
  const headers = getHeaders(sheet);
  const width   = headers.length;
  const lastRow = sheet.getLastRow();
  let row = Number(body.row);

  // The page sends the row number it loaded. If rows were inserted/sorted
  // since then, fall back to finding the question by school/year/paper/question.
  const rowOk = row >= 2 && row <= lastRow &&
    rowMatches(sheet.getRange(row, 1, 1, width).getValues()[0], headers, body.key);
  if (!rowOk) {
    const hits = [];
    if (lastRow >= 2) {
      sheet.getRange(2, 1, lastRow - 1, width).getValues().forEach(function (r, i) {
        if (rowMatches(r, headers, body.key)) hits.push(i + 2);
      });
    }
    if (hits.length !== 1) {
      return { ok: false, error: hits.length ? 'Several rows match this question — reload the page' : 'Row not found — reload the page' };
    }
    row = hits[0];
  }

  Object.keys(body.changes || {}).forEach(function (f) {
    if (EDITABLE.indexOf(f) === -1) throw new Error('Field not editable: ' + f);
    sheet.getRange(row, colFor(sheet, headers, f)).setValue(body.changes[f]);
  });
  return { ok: true, row: row };
}

// Add new question rows (for future use, e.g. tagging a new paper).
// body: { rows: [{school, year, paper, question, topic, subtopic, difficulty, pdf_link, page}] }
function append(sheet, body) {
  const headers = getHeaders(sheet);
  const allowed = KEY_FIELDS.concat(EDITABLE);
  const rows = body.rows || [];
  rows.forEach(function (obj) {
    const arr = [];
    Object.keys(obj).forEach(function (k) {
      const f = k.trim().toLowerCase();
      if (allowed.indexOf(f) === -1) return;
      arr[colFor(sheet, headers, f) - 1] = obj[k];
    });
    for (let i = 0; i < headers.length; i++) if (arr[i] === undefined) arr[i] = '';
    sheet.appendRow(arr);
  });
  return { ok: true, added: rows.length };
}

function getHeaders(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0]
    .map(function (h) { return String(h).trim().toLowerCase(); });
}

// Column number for a field; adds the header (e.g. "Rank") if it doesn't exist yet.
function colFor(sheet, headers, field) {
  let i = headers.indexOf(field);
  if (i === -1) {
    i = headers.length;
    sheet.getRange(1, i + 1).setValue(field.charAt(0).toUpperCase() + field.slice(1));
    headers.push(field);
  }
  return i + 1;
}

function norm(v) { return String(v == null ? '' : v).trim().toLowerCase(); }

function rowMatches(values, headers, key) {
  key = key || {};
  return KEY_FIELDS.every(function (f) {
    const i = headers.indexOf(f);
    return i === -1 || norm(values[i]) === norm(key[f]);
  });
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
