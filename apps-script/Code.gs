/**
 * Leap+ mock backend (concept prototype). Fake card numbers only. No real money.
 * Setup: paste into Extensions → Apps Script, run setup() once, then
 * Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone.
 * @OnlyCurrentDoc
 */
var CARDS = "Cards";
var TX = "Transactions";
var MIN_TOPUP = 500;
var MAX_BALANCE = 15000;
var METHODS = { GOOGLE_PAY: "Google Pay", APPLE_PAY_SIM: "Apple Pay (simulated)", SAVED_CARD: "Saved card •••• 4242" };
var CARD_RE = /^\d{12,19}$/;
var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function setup() {
  var ss = SpreadsheetApp.getActive();
  var cards = ss.getSheetByName(CARDS) || ss.insertSheet(CARDS);
  var tx = ss.getSheetByName(TX) || ss.insertSheet(TX);
  var now = new Date();
  cards.clear();
  tx.clear();
  cards.getRange("A:A").setNumberFormat("@");
  tx.getRange("A:B").setNumberFormat("@");
  tx.getRange("G:G").setNumberFormat("@");
  cards.getRange(1, 1, 4, 4).setValues([
    ["cardNumber", "holderType", "balanceCents", "updatedAt"],
    ["300000000001", "Adult", 320, now.toISOString()],
    ["300000000002", "Student", 1250, now.toISOString()],
    ["300000000003", "Adult", 0, now.toISOString()],
  ]);
  var seed = [["txId", "cardNumber", "type", "amountCents", "method", "description", "idempotencyKey", "createdAt", "balanceAfterCents"]];
  var history = {
    "300000000001": [[-200, "Dublin Bus E1"], [-200, "Dublin Bus 39A"], [1000, "Top-up · Saved card •••• 4242"], [-200, "Luas Green Line"], [-200, "Dublin Bus 16"]],
    "300000000002": [[-200, "DART"], [2000, "Top-up · Saved card •••• 4242"], [-200, "Dublin Bus 39A"], [-150, "Luas Red Line"], [-200, "Dublin Bus E1"]],
    "300000000003": [[-200, "Dublin Bus 16"], [-200, "Dublin Bus E1"], [500, "Top-up · Saved card •••• 4242"], [-200, "Dublin Bus 39A"], [-100, "Dublin Bus 16"]],
  };
  Object.keys(history).forEach(function (card) {
    history[card].forEach(function (h, i) {
      var t = new Date(now.getTime() - (5 - i) * 86400000);
      seed.push([Utilities.getUuid(), card, h[0] > 0 ? "TOPUP" : "FARE", h[0], h[0] > 0 ? "SAVED_CARD" : "—", h[1], "", t.toISOString(), ""]);
    });
  });
  tx.getRange(1, 1, seed.length, seed[0].length).setValues(seed);
  cards.setFrozenRows(1);
  tx.setFrozenRows(1);
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty("SHARED_SECRET")) {
    props.setProperty("SHARED_SECRET", (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, ""));
  }
  Logger.log("Setup done. Copy SHARED_SECRET from Project Settings → Script Properties into Vercel.");
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return out_({ error: "BAD_REQUEST" });
  }
  if (!safeEqual_(String(body.secret || ""), PropertiesService.getScriptProperties().getProperty("SHARED_SECRET") || "")) {
    return out_({ error: "UNAUTHORIZED" });
  }
  if (!CARD_RE.test(String(body.cardNumber || ""))) return out_({ error: "BAD_REQUEST" });
  if (body.action === "get") return out_(getCard_(body.cardNumber));
  if (body.action === "topup") return out_(topUp_(body));
  return out_({ error: "BAD_REQUEST" });
}

function getCard_(cardNumber) {
  var row = findCard_(cardNumber);
  if (!row) return { error: "CARD_NOT_FOUND" };
  var rows = sheet_(TX).getDataRange().getValues().slice(1);
  var txs = rows
    .filter(function (r) { return String(r[1]) === cardNumber; })
    .map(function (r) {
      return { txId: String(r[0]), type: r[2], amountCents: Number(r[3]), description: String(r[5]), createdAt: iso_(r[7]) };
    })
    .sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; })
    .slice(0, 5);
  return { cardNumber: cardNumber, holderType: row.values[1], balanceCents: Number(row.values[2]), updatedAt: iso_(row.values[3]), transactions: txs };
}

function topUp_(b) {
  var amount = b.amountCents;
  if (typeof amount !== "number" || amount % 1 !== 0 || amount < MIN_TOPUP) return { error: "INVALID_AMOUNT" };
  if (!Object.prototype.hasOwnProperty.call(METHODS, b.method)) return { error: "BAD_REQUEST" };
  if (!UUID_RE.test(String(b.idempotencyKey || ""))) return { error: "BAD_REQUEST" };
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
  } catch (err) {
    return { error: "BUSY" };
  }
  try {
    var tx = sheet_(TX);
    var rows = tx.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][6]) === b.idempotencyKey) {
        if (String(rows[i][1]) !== b.cardNumber || Number(rows[i][3]) !== amount) return { error: "IDEMPOTENCY_MISMATCH" };
        return { balanceCents: Number(rows[i][8]), txId: String(rows[i][0]), createdAt: iso_(rows[i][7]) };
      }
    }
    var card = findCard_(b.cardNumber);
    if (!card) return { error: "CARD_NOT_FOUND" };
    var balance = Number(card.values[2]) + amount;
    if (balance > MAX_BALANCE) return { error: "BALANCE_CAP" };
    var now = new Date().toISOString();
    var txId = Utilities.getUuid();
    sheet_(CARDS).getRange(card.index, 3, 1, 2).setValues([[balance, now]]);
    tx.appendRow([txId, b.cardNumber, "TOPUP", amount, b.method, "Top-up · " + METHODS[b.method], b.idempotencyKey, now, balance]);
    SpreadsheetApp.flush();
    return { balanceCents: balance, txId: txId, createdAt: now };
  } finally {
    lock.releaseLock();
  }
}

function findCard_(cardNumber) {
  var rows = sheet_(CARDS).getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === cardNumber) return { index: i + 1, values: rows[i] };
  }
  return null;
}

function sheet_(name) {
  return SpreadsheetApp.getActive().getSheetByName(name);
}

function iso_(v) {
  return v instanceof Date ? v.toISOString() : String(v);
}

function safeEqual_(a, b) {
  if (!b || a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}