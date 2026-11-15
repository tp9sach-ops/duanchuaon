// Quà quản trị (Phiên 170): máy chủ gắn `grants` vào phản hồi acctLoad/acctSave → client cộng đúng 1 lần, sau khi đã nhận bản lưu.
import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { createAccountClient } from '../js/net/accountClient.js';
import { applyGrants } from '../js/net/account.js';

class Store {
  constructor() { this.m = new Map(); }
  get length() { return this.m.size; }
  key(i) { return [...this.m.keys()][i] ?? null; }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
}
const AID = 'a'.repeat(20);
function logged(call, grant) {
  const storage = new Store();
  storage.setItem('lgt.acct', JSON.stringify({ aid: AID, token: 't'.repeat(32), name: 'An', rev: 1, h: 'x' }));
  storage.setItem('lgt.wallet', '{"sen":10}');
  return { storage, client: createAccountClient({ call, storage, subtle: webcrypto.subtle, grant }) };
}

test('applyGrants: cộng đúng 1 lần theo id, bỏ id trùng/giá trị sai; chưa có LGT.addMerit thì ghi thẳng ví', () => {
  const st = new Store(); st.setItem('lgt.wallet', '{"sen":10,"x":1}');
  const list = [{ id: 'g1', sen: 5000 }, { id: 'g1', sen: 5000 }, { id: 'g2', sen: -3 }, { id: 3, sen: 9 }, null];
  assert.equal(applyGrants(list, { storage: st, LGT: null }), 5000);
  assert.deepEqual(JSON.parse(st.getItem('lgt.wallet')), { sen: 5010, x: 1 });
  assert.equal(applyGrants(list, { storage: st, LGT: null }), 0, 'nhận rồi thì không cộng lại');
  assert.deepEqual(JSON.parse(st.getItem('lgt.wallet')), { sen: 5010, x: 1 });
  assert.deepEqual(JSON.parse(st.getItem('lgt.grantDone')), ['g1', 'g2']);
});
test('applyGrants: game đang chạy thì cộng qua LGT.addMerit', () => {
  const st = new Store(); let added = 0;
  assert.equal(applyGrants([{ id: 'g9', sen: 70 }], { storage: st, LGT: { addMerit: (n) => { added += n; } } }), 70);
  assert.equal(added, 70); assert.equal(st.getItem('lgt.wallet'), null, 'không đụng ví khi đã cộng qua addMerit');
});
test('client.pull: quà đi kèm phản hồi (cả khi không có bản mới) được giao đúng 1 lần mỗi phản hồi, không đổi kết quả trả về', async () => {
  const got = [];
  const { client } = logged(async () => ({ ok: true, changed: false, rev: 1, grants: [{ id: 'g1', sen: 5 }] }), (g) => got.push(g));
  assert.deepEqual(await client.pull(), { ok: true, changed: false });
  assert.deepEqual(got, [[{ id: 'g1', sen: 5 }]]);
});
test('client.pull: có bản mới thì quà được cộng SAU khi bản lưu của máy chủ đã ghi vào máy', async () => {
  let walletAtGrant = null;
  const { client, storage } = logged(async () => ({ ok: true, changed: true, rev: 2, name: 'An', save: { v: 1, d: { 'lgt.wallet': '{"sen":100}' } }, grants: [{ id: 'g1', sen: 5 }] }),
    () => { walletAtGrant = storage.getItem('lgt.wallet'); });
  assert.equal(storage.getItem('lgt.wallet'), '{"sen":10}');
  // máy không có thay đổi chưa lưu: đặt dấu vân đúng bản hiện tại
  const a = JSON.parse(storage.getItem('lgt.acct')); a.h = undefined; storage.setItem('lgt.acct', JSON.stringify(a));
  const r = await client.pull();
  if (r.conflict) { assert.equal(walletAtGrant, '{"sen":10}', 'xung đột: bản máy này được giữ, quà cộng lên đó'); return; }
  assert.equal(r.changed, true); assert.equal(walletAtGrant, '{"sen":100}');
});
test('client.push: quà đi kèm cả khi lưu thành công lẫn khi bị stale (xung đột) — quà độc lập với rev', async () => {
  for (const reply of [{ ok: true, rev: 2, grants: [{ id: 'g1', sen: 5 }] }, { ok: false, error: 'stale', rev: 3, grants: [{ id: 'g1', sen: 5 }] }]) {
    const got = [];
    const { client } = logged(async () => reply, (g) => got.push(g));
    await client.push({ force: true });
    assert.equal(got.length, 1, reply.error || 'ok');
  }
});
test('client: không có `grant` hoặc `grants` rỗng thì chạy như cũ', async () => {
  const { client } = logged(async () => ({ ok: true, changed: false, rev: 1, grants: [] }));
  assert.deepEqual(await client.pull(), { ok: true, changed: false });
  const g = [];
  const c2 = logged(async () => ({ ok: true, changed: false, rev: 1, grants: [] }), (x) => g.push(x));
  await c2.client.pull(); assert.equal(g.length, 0);
});
