// Phiên 55: đường dự phòng gửi bằng form ẩn + iframe ẩn + postMessage (khi fetch bị 'blocked').
// Phía trình duyệt: js/api.js (DOM giả). Phía máy chủ: chạy Code.gs thật trong vm (doPost nhánh form → frame_).
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { callApi, callViaFrame } from '../js/api.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------- DOM giả
function fakeEnv({ reply, origin = 'https://abc123-script.googleusercontent.com', never = false } = {}) {
  const handlers = new Set(), appended = [];
  const mk = (tag) => ({ tag, style: {}, children: [], attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, appendChild(c) { this.children.push(c); }, remove() { this.removed = true; } });
  const win = {
    location: { origin: 'https://tp9sach-ops.github.io' },
    addEventListener: (t, f) => { if (t === 'message') handlers.add(f); },
    removeEventListener: (t, f) => { if (t === 'message') handlers.delete(f); },
  };
  const doc = { body: { appendChild: (c) => appended.push(c) }, createElement: mk };
  const sent = [];
  const submit = function () {
    const f = Object.fromEntries(this.children.map((i) => [i.name, i.value]));
    sent.push({ url: this.action, target: this.target, method: this.method, fields: f });
    if (never) return;
    const res = reply ? reply(JSON.parse(f.d)) : { ok: true };
    setTimeout(() => handlers.forEach((h) => h({ origin, data: { lgt: f.rid, res } })), 0);
  };
  const origMk = doc.createElement;
  doc.createElement = (tag) => { const e = origMk(tag); if (tag === 'form') e.submit = submit; return e; };
  return { doc, win, sent, appended, handlers, url: 'https://script.google.com/macros/s/TEST/exec' };
}

test('callViaFrame: gửi form POST tới apiUrl, nhận kết quả từ thư của Google, dọn khung', async () => {
  const env = fakeEnv({ reply: (req) => ({ ok: true, echo: req.action }) });
  const r = await callViaFrame(JSON.stringify({ action: 'ping' }), env);
  assert.deepEqual(r, { ok: true, echo: 'ping' });
  assert.equal(env.sent.length, 1);
  assert.equal(env.sent[0].method, 'POST'); assert.equal(env.sent[0].url, env.url);
  assert.equal(env.sent[0].fields.o, 'https://tp9sach-ops.github.io');
  assert.match(env.sent[0].fields.rid, /^[A-Za-z0-9-]+$/);
  assert.equal(env.handlers.size, 0);                       // đã gỡ bộ nghe
  assert.ok(env.appended.every((e) => e.removed));          // form + iframe đã bị gỡ
});

test('callViaFrame: bỏ qua thư từ origin lạ → hết giờ trả null', async () => {
  const env = fakeEnv({ origin: 'https://evil.example.com' });
  assert.equal(await callViaFrame('{}', { ...env, timeoutMs: 60 }), null);
});

test('callViaFrame: không có phản hồi → null sau timeout; không có DOM → null ngay', async () => {
  assert.equal(await callViaFrame('{}', { ...fakeEnv({ never: true }), timeoutMs: 40 }), null);
  assert.equal(await callViaFrame('{}', { doc: null, win: {}, url: 'x' }), null);
});

// ---------------------------------------------------------------- callApi dùng đường khung khi fetch 'blocked'
const realFetch = globalThis.fetch;
const blockedFetch = (counter) => async (url, init) => { if (init && init.mode === 'no-cors') return { type: 'opaque' }; counter.n++; throw new TypeError('Failed to fetch'); };

test('fetch blocked → thử đường khung và trả kết quả của máy chủ (cùng gói lệnh); lần sau đi thẳng đường khung', async () => {
  const c = { n: 0 }; globalThis.fetch = blockedFetch(c);
  try {
    const env = fakeEnv({ reply: (req) => ({ ok: true, aid: req.aid, action: req.action }) });
    const r1 = await callApi('acctCreate', { aid: 'AID-1' }, { frameEnv: env });
    assert.deepEqual(r1, { ok: true, aid: 'AID-1', action: 'acctCreate' });
    assert.equal(c.n, 1);
    const r2 = await callApi('acctLogin', { name: 'x' }, { frameEnv: env });
    assert.equal(r2.action, 'acctLogin'); assert.equal(c.n, 1);          // không gọi fetch lại
    assert.equal(env.sent.length, 2);
  } finally { globalThis.fetch = realFetch; }
});

test('fetch blocked mà đường khung cũng không phản hồi → vẫn báo blocked (kèm ghi chú trong detail)', async () => {
  const c = { n: 0 }; globalThis.fetch = blockedFetch(c);
  try {
    // useFrame đang bật từ test trước → khung hỏng thì tắt, rồi đi đường thường, rồi thử khung lần nữa
    const r = await callApi('acctCreate', { aid: 'AID-2' }, { frameEnv: { ...fakeEnv({ never: true }), timeoutMs: 40 } });
    assert.equal(r.error, 'blocked'); assert.match(r.detail, /khung/);
  } finally { globalThis.fetch = realFetch; }
});

test('keepalive (lúc đóng trang) không dùng đường khung', async () => {
  const c = { n: 0 }; globalThis.fetch = blockedFetch(c);
  try {
    const env = fakeEnv();
    const r = await callApi('acctSave', {}, { keepalive: true, frameEnv: env });
    assert.equal(r.error, 'blocked'); assert.equal(env.sent.length, 0);
  } finally { globalThis.fetch = realFetch; }
});

// ---------------------------------------------------------------- Code.gs thật (doPost nhánh form)
function loadCode() {
  const ctx = {
    console,
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (s) => ({ kind: 'text', s, setMimeType() { return this; }, getContent() { return this.s; } }) },
    HtmlService: { XFrameOptionsMode: { ALLOWALL: 'ALLOWALL' }, createHtmlOutput: (h) => ({ kind: 'html', h, mode: null, setXFrameOptionsMode(m) { this.mode = m; return this; }, getContent() { return this.h; } }) },
  };
  vm.createContext(ctx);
  vm.runInContext(readFileSync(path.join(root, 'gas', 'Code.gs'), 'utf8'), ctx, { filename: 'Code.gs' });
  return (e) => vm.runInContext('doPost', ctx)(e);
}

test('Code.gs: text/plain như cũ → JSON (không đổi hành vi)', () => {
  const doPost = loadCode();
  const o = doPost({ postData: { contents: JSON.stringify({ action: 'ping' }) }, parameter: {} });
  assert.equal(o.kind, 'text'); assert.deepEqual(JSON.parse(o.getContent()), { ok: true, pong: true });
  assert.deepEqual(JSON.parse(doPost({ postData: { contents: '{"action":"zzz"}' } }).getContent()), { ok: false, error: 'unknown_action' });
  assert.equal(JSON.parse(doPost({ postData: { contents: 'khong phai json' } }).getContent()).error, 'server_error');
});

test('Code.gs: nhánh form → trang HTML cho phép nhúng, gọi postMessage đúng rid/origin, kết quả thật của lệnh', () => {
  const doPost = loadCode();
  const o = doPost({ parameter: { d: JSON.stringify({ action: 'ping' }), rid: 'abc-123', o: 'https://tp9sach-ops.github.io' }, postData: { contents: 'd=...' } });
  assert.equal(o.kind, 'html'); assert.equal(o.mode, 'ALLOWALL');
  const html = o.getContent();
  assert.match(html, /<script>/); assert.match(html, /postMessage\(m,o\)/);
  const m = html.match(/var m=(\{.*?\}),o=("[^"]*");/);
  assert.ok(m); assert.deepEqual(JSON.parse(m[1]), { lgt: 'abc-123', res: { ok: true, pong: true } }); assert.equal(JSON.parse(m[2]), 'https://tp9sach-ops.github.io');
});

test('Code.gs: nhánh form chống chèn mã (rid/origin/kết quả có ký tự đặc biệt) và lỗi vẫn trả về qua khung', () => {
  const doPost = loadCode();
  const bad = doPost({ parameter: { d: '{"action":"ping"}', rid: 'x"</script><script>alert(1)', o: '"</script><script>alert(2)//' } }).getContent();
  assert.equal((bad.match(/<script>/g) || []).length, 1);                    // không có thẻ script thứ hai
  assert.equal((bad.match(/<\/script>/g) || []).length, 1);
  assert.match(bad, /,o="\*";/);                                             // origin sai định dạng → '*'
  const err = doPost({ parameter: { d: 'hong', rid: 'r1' } }).getContent();
  assert.match(err, /server_error/);
  const sep = doPost({ parameter: { d: '{"action":"nope\\u2028"}', rid: 'r2' } }).getContent();
  assert.ok(!sep.includes(' '));
});
