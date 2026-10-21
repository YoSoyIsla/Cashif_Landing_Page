/**
 * cashif bekleme listesi: landing sayfasındaki formdan gelen e-postaları
 * bu script'in bağlı olduğu Google E-Tablo'ya satır olarak ekler.
 *
 * Kurulum: google-apps-script/README.md
 */

const SHEET_NAME = 'Bekleme listesi';

function doPost(e) {
  const p = (e && e.parameter) || {};

  // Spam tuzağı: gerçek kullanıcı bu alanı göremez, doluysa bot gönderimidir
  if (p._gotcha) return json({ ok: true });

  const email = String(p.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || p.acik_riza !== 'evet') {
    return json({ ok: false, error: 'invalid' });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet();
    // Aynı adres ikinci kez gelirse yeni satır açma
    const existing = sheet.getRange(2, 2, Math.max(sheet.getLastRow() - 1, 1), 1).getValues().flat();
    if (!existing.includes(email)) {
      sheet.appendRow([new Date(), email, 'evet']);
    }
  } finally {
    lock.releaseLock();
  }

  return json({ ok: true });
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Tarih', 'E-posta', 'Açık rıza']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
