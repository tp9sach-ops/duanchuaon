// Phiên 222: máu quái DÙNG CHUNG — chủ quái nhận đòn của người khác (remoteHit), người đòn cuối nhận thưởng (claimKill), đánh bóng quái báo qua combatLink.sendDamage.
// Chạy: node --test tests/farmshared222.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

const fakeEl = () => { const e = { className: '', hidden: false, textContent: '', style: {}, children: [], classList: { toggle() {}, add() {}, remove() {} }, appendChild(c) { e.children.push(c); return c; }, append(...c) { e.children.push(...c); } }; return e; };
let timers = [], clock = 1000;
const store = new Map();
const FIXED = Date.UTC(2026, 10, 11, 5, 0, 0); Date.now = () => FIXED;
globalThis.document = { createElement: fakeEl };
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)) };
globalThis.location = { search: '' };
globalThis.setInterval = (f) => { timers.push(f); return timers.length; };
globalThis.performance = { now: () => clock };
const win = globalThis.window = { LGT: {} };
const LGT = win.LGT;
const toasts = []; let sen = 0;
LGT.addMerit = (n) => { sen += n; };
LGT.world = { pos: { x: -62, z: 80 }, dashing: false, dash(to) { this.pos = { x: to.x, z: to.z }; return true; } };
LGT.strength = { value: 40 };
LGT.night = 1;
const { initFarm } = await import('../js/ui/farm.js');
const api = initFarm(fakeEl(), { toast: (t) => toasts.push(String(t)) });
const step = (secs, n = Math.max(1, Math.ceil(secs * 10))) => { for (let i = 0; i < n; i++) { clock += secs * 1000 / n; for (const f of timers) f(); } };

test('Phiên 222: remoteHit trừ máu thật, quái chết bởi khách thì chủ KHÔNG nhận thưởng; claimKill thưởng cho người đánh đòn cuối', () => {
  LGT.world.pos = { x: -62, z: 80 }; LGT.inHouse = false; LGT.yq = undefined; step(0.5);
  const m = LGT.farmView.mons.find((x) => !x.boss && !x.elite); assert.ok(m, 'có quái thường');
  const before = m.oan, sen0 = sen, toast0 = toasts.length;
  const r1 = api.remoteHit(m.uid, 10, 'abcdef', 0, 0); assert.equal(r1.dead, false); assert.equal(m.oan, before - 10, 'máu thật bị trừ');
  const r2 = api.remoteHit(m.uid, 99999, 'abcdef', 0, 0); assert.equal(r2.dead, true); assert.equal(r2.type, m.type);
  assert.ok(!LGT.farmView.mons.some((x) => x.uid === m.uid), 'quái đã bị hạ');
  assert.equal(sen, sen0, 'chủ không nhận hạt sen'); assert.ok(!toasts.slice(toast0).some((t) => /Thu phục/.test(t)), 'chủ không nhận thưởng');
  assert.equal(api.remoteHit('khongco:1', 5, 'abcdef'), null);
  api.claimKill('dameo'); assert.ok(toasts.slice(toast0).some((t) => /Thu phục Dã Mèo Rừng/.test(t)), 'người đánh đòn cuối nhận thưởng');
});
test('Phiên 222: đánh được BÓNG quái — báo chủ qua LGT.combatLink.sendDamage, không tự thu phục', () => {
  LGT.world.pos = { x: -62, z: 80 }; step(0.2); const sent = [];
  LGT.combatLink = { sendDamage: (g, d) => { sent.push([g.uid, d]); g.oan = Math.max(1, g.oan - d); return true; } };
  LGT.farmView.mons = []; const g = { uid: 'g|own|hoThac:7', ghost: true, type: 'dameo', ten: 'Dã Mèo Rừng', lv: 3, he: 'moc', x: -62, z: 82, ry: 0, oan: 100, max: 100, eng: true };
  LGT.farmView.ghosts = [g]; api.unlock(); api.stone();
  assert.ok(sent.length >= 1, 'đòn trúng bóng quái được báo cho chủ'); assert.ok(g.oan >= 1, 'bóng quái không chết phía khách');
  LGT.farmView.ghosts = []; delete LGT.combatLink;
});
