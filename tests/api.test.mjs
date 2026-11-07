// Phiên 54: callApi phải phân loại lỗi đúng (network / blocked / bad_response / timeout / http_NNN) và không báo "mất mạng" oan.
import test from 'node:test';
import assert from 'node:assert/strict';
import { callApi } from '../js/api.js';
import { errMsg, isNetworkError } from '../js/engines/account.js';

const realFetch = globalThis.fetch;
const jsonRes = (o, ok = true, status = 200) => ({ ok, status, json: async () => o });
const withFetch = async (fn, body) => { globalThis.fetch = fn; try { return await body(); } finally { globalThis.fetch = realFetch; } };

test('JSON hợp lệ → trả nguyên', () => withFetch(async () => jsonRes({ ok: true, pong: true }), async () => {
  assert.deepEqual(await callApi('ping'), { ok: true, pong: true });
}));

test('trả HTML (res.json ném lỗi) → bad_response, KHÔNG phải network, không thử lại', () => {
  let n = 0;
  return withFetch(async () => { n++; return { ok: true, status: 200, json: async () => { throw new SyntaxError('Unexpected token <'); } }; }, async () => {
    const r = await callApi('acctCreate', {});
    assert.equal(r.error, 'bad_response'); assert.equal(n, 1);
  });
});

test('fetch ném TypeError nhưng thăm dò no-cors tới được → blocked (không thử lại)', () => {
  let post = 0, probe = 0;
  return withFetch(async (url, init) => { if (init && init.mode === 'no-cors') { probe++; return { type: 'opaque' }; } post++; throw new TypeError('Failed to fetch'); }, async () => {
    const r = await callApi('acctLogin', {});
    assert.equal(r.error, 'blocked'); assert.equal(post, 1); assert.equal(probe, 1);
  });
});

test('fetch ném TypeError và thăm dò cũng hỏng → network (có thử lại 1 lần)', () => {
  let n = 0;
  return withFetch(async () => { n++; throw new TypeError('Failed to fetch'); }, async () => {
    const r = await callApi('ping');
    assert.equal(r.error, 'network'); assert.ok(n >= 2);
  });
});

test('HTTP lỗi → http_NNN', () => withFetch(async () => jsonRes({}, false, 503), async () => {
  assert.equal((await callApi('ping')).error, 'http_503');
}));

test('mã lỗi do máy chủ trả (ok:false) được giữ nguyên', () => withFetch(async () => jsonRes({ ok: false, error: 'exists' }), async () => {
  assert.deepEqual(await callApi('acctCreate', {}), { ok: false, error: 'exists' });
}));

test('blocked / bad_response có thông báo riêng và vẫn cho "Chơi tạm"', () => {
  for (const c of ['blocked', 'bad_response']) { assert.ok(isNetworkError(c)); assert.ok(errMsg(c).length > 20); assert.notEqual(errMsg(c), errMsg('network')); }
});
