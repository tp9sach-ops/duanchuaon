// Khiêng người 2 giây rồi ném (Phiên 91): chạy NGUYÊN js/ui/throwPlayer.js của HAI máy (người khiêng A, người bị khiêng B) nói chuyện với NGUYÊN gas/Throw.gs trong máy ảo Node.
// Đồng hồ + bộ hẹn giờ được giả để điều khiển từng bước; mạng (fetch) trỏ thẳng vào máy chủ giả.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import '../js/world/outside.js';
import { levelOf } from '../js/world/quests.js';
import { initThrowPlayer } from '../js/ui/throwPlayer.js';

const A = 'player-aaaaaaaa', B = 'player-bbbbbbbb';
const xpFor = (lv) => { for (let xp = 0; xp < 1e6; xp += 5) if (levelOf(xp).lv >= lv) return xp; return 0; };

/** Dựng môi trường giả; trả { A, B, step(ms), restore() }. */
async function world(optA = {}, optB = {}) {
  let clock = 10000, srvClock = 1e12; const store = new Map(), tickers = [];
  const ctx = { CacheService: { getScriptCache: () => ({ get: (k) => store.get(k) ?? null, put: (k, v) => store.set(k, v) }) }, LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) }, Math, JSON, Number, String, Object, Array, isFinite, RegExp, Date: { now: () => srvClock } };
  vm.createContext(ctx);
  vm.runInContext(readFileSync(new URL('../gas/Room.gs', import.meta.url), 'utf8').split('function roomSync_')[0], ctx);
  vm.runInContext(readFileSync(new URL('../gas/Throw.gs', import.meta.url), 'utf8'), ctx);
  const saved = { performance: Object.getOwnPropertyDescriptor(globalThis, 'performance'), setInterval: globalThis.setInterval, fetch: globalThis.fetch, window: globalThis.window };
  Object.defineProperty(globalThis, 'performance', { value: { now: () => clock }, configurable: true, writable: true });
  let owner = null; globalThis.setInterval = (fn) => { tickers.push({ owner, fn }); return tickers.length; };
  globalThis.fetch = async (_u, init) => { const { action, ...rest } = JSON.parse(init.body); const out = action === 'thr' ? JSON.parse(JSON.stringify(ctx.thrSync_(rest))) : { ok: false, error: 'bad_action' }; return { ok: true, json: async () => out }; };
  globalThis.window = {};
  const make = (id, name, o) => {
    const c = { id, name, sen: o.sen ?? 5, toasts: [], tp: [], holds: [], roomHold: [], toss: [], spent: 0, acts: [] };
    const pos = { x: o.x, z: o.z, y: 0 }, others = () => (c.others ? c.others() : []);
    const LGT = c.LGT = { quests: { prog: { xp: xpFor(o.lv) } }, strength: { value: o.str }, getSen: () => c.sen, spendSen: (n) => { c.sen -= n; c.spent += n; return true; }, act: (t) => c.acts.push(t),
      world: { mode: 'free', get pos() { return pos; }, facing: 0, teleport: (x, z) => { c.tp.push([x, z]); pos.x = x; pos.z = z; }, hold: (to) => c.holds.push(to) },
      room: { id, players: () => others(), count: 2, name: () => name, hold: (i) => c.roomHold.push(i), toss: (i, to) => c.toss.push([i, to]) } };
    c.pos = pos; globalThis.window.LGT = LGT; owner = id; initThrowPlayer({ toast: (t) => c.toasts.push(t) }); return c;
  };
  const a = make(A, 'An', { lv: 5, str: 60, x: 0, z: 60, ...optA }), b = make(B, 'Bình', { lv: 2, str: 20, x: 1, z: 60, ...optB });
  a.others = () => [{ id: B, n: 'Bình', x: b.pos.x, z: b.pos.z }]; b.others = () => [{ id: A, n: 'An', x: a.pos.x, z: a.pos.z }];
  const flush = async () => { for (let i = 0; i < 12; i++) await new Promise((r) => setImmediate(r)); };
  const step = async (ms) => { clock += ms; srvClock += ms; for (const t of tickers) { globalThis.window.LGT = t.owner === A ? a.LGT : b.LGT; t.fn(); } await flush(); };
  const run = async (ms) => { for (let t = 0; t < ms; t += 250) await step(250); };
  const restore = () => { if (saved.performance) Object.defineProperty(globalThis, 'performance', saved.performance); globalThis.setInterval = saved.setInterval; globalThis.fetch = saved.fetch; if (saved.window === undefined) delete globalThis.window; else globalThis.window = saved.window; };
  return { A: a, B: b, step, run, restore, flush };
}
const press = async (w, c, fn) => { globalThis.window.LGT = c.LGT; c.LGT.throwP.status(); await c.LGT.throwP[fn](); await w.flush(); };

test('khiêng → người bị khiêng biết và đứng yên trên vai → hết 2 giây tự ném → rơi xuống điểm rơi, người ném mất 1 hạt sen', async () => {
  const w = await world(); try {
    await w.run(1500);                                         // hai máy báo vị trí cho máy chủ
    assert.equal(w.A.LGT.throwP.status().near, 'Bình'); assert.equal(w.A.LGT.throwP.status().holding, false);
    await press(w, w.A, 'grab');
    assert.deepEqual(w.A.roomHold, [B], 'hình: Bình hiện trên vai An ngay');
    assert.equal(w.A.LGT.throwP.status().holding, true); assert.equal(w.A.LGT.throwP.status().heldName, 'Bình'); assert.equal(w.A.LGT.throwP.status().left, 2);
    await w.run(1000);                                         // máy Bình thăm dò dày (≤ 1 giây) và biết mình bị khiêng
    assert.equal(w.B.LGT.heldBy, A, 'Bình biết ai đang khiêng mình'); assert.ok(w.B.toasts.some((t) => /nhấc bạn lên vai/.test(t)));
    assert.ok(w.B.holds.some((h) => h && h.x === w.A.pos.x && h.z === w.A.pos.z && h.y > 1.5), 'Bình bám theo vai An: ' + JSON.stringify(w.B.holds.at(-1)));
    assert.equal(w.A.sen, 5, 'chưa ném thì chưa mất hạt sen');
    await w.run(2500);                                         // quá 2 giây: tự ném
    assert.equal(w.A.toss.length, 1, 'hình: Bình bay vòng cung'); assert.equal(w.A.toss[0][0], B); assert.ok(w.A.toss[0][1].z > 60.5, 'ném về phía trước (+z)');
    assert.equal(w.A.sen, 4); assert.equal(w.A.spent, 1); assert.ok(w.A.toasts.some((t) => /ném Bình đi xa/.test(t)));
    assert.equal(w.B.tp.length, 1, 'Bình bị dời đúng một lần'); assert.ok(Math.abs(w.B.tp[0][1] - w.A.toss[0][1].z) < 0.11, 'rơi đúng điểm máy chủ nhận');
    assert.equal(w.B.LGT.heldBy, null, 'rơi xuống rồi thì không còn bị khiêng'); assert.equal(w.B.holds.at(-1), null, 'world.hold(null) được gọi');
    assert.ok(w.B.toasts.some((t) => /ném đi! Bạn rơi xuống an toàn/.test(t)));
    assert.equal(w.A.LGT.throwP.status().holding, false); assert.equal(w.A.roomHold.at(-1), null);
  } finally { w.restore(); }
});

test('bấm Ném sớm (trước 2 giây) → ném ngay; không bấm gì thêm thì không ném lần hai', async () => {
  const w = await world(); try {
    await w.run(1500); await press(w, w.A, 'grab'); await w.run(500);
    await press(w, w.A, 'throw'); await w.run(2000);
    assert.equal(w.A.toss.length, 1); assert.equal(w.A.sen, 4); assert.equal(w.B.tp.length, 1);
    await w.run(3000); assert.equal(w.A.toss.length, 1, 'không tự ném thêm'); assert.equal(w.A.sen, 4);
  } finally { w.restore(); }
});

test('Thả xuống: không ném, không mất hạt sen, người bị khiêng đứng dậy được', async () => {
  const w = await world(); try {
    await w.run(1500); await press(w, w.A, 'grab'); await w.run(1000);
    assert.equal(w.B.LGT.heldBy, A);
    await press(w, w.A, 'drop'); await w.run(2000);
    assert.equal(w.A.toss.length, 0); assert.equal(w.A.sen, 5); assert.equal(w.B.tp.length, 0, 'Bình không bị dời đi');
    assert.equal(w.B.LGT.heldBy, null, 'máy chủ không còn coi Bình bị khiêng → máy Bình tự đứng dậy'); assert.equal(w.B.holds.at(-1), null);
    assert.equal(w.A.roomHold.at(-1), null); assert.equal(w.A.LGT.throwP.status().holding, false);
    await w.run(4000); assert.equal(w.A.toss.length, 0, 'thả rồi không tự ném');
  } finally { w.restore(); }
});

test('bị từ chối: người kia không nhỏ hơn mình / hết hạt sen / ở xa → hủy hình khiêng và báo lý do', async () => {
  let w = await world({}, { lv: 5, str: 20 }); try {   // cấp bằng nhau
    await w.run(1500); await press(w, w.A, 'grab'); await w.run(500);
    assert.equal(w.A.LGT.throwP.status().holding, false, 'hủy khiêng'); assert.equal(w.A.roomHold.at(-1), null);
    assert.ok(w.A.toasts.some((t) => /không nhỏ hơn bạn/.test(t)), JSON.stringify(w.A.toasts)); assert.equal(w.A.sen, 5); assert.equal(w.B.LGT.heldBy ?? null, null);
  } finally { w.restore(); }
  w = await world({ sen: 0 }); try {
    await w.run(1500); await press(w, w.A, 'grab');
    assert.equal(w.A.LGT.throwP.status().holding, false); assert.ok(w.A.toasts.some((t) => /1 hạt sen/.test(t))); assert.deepEqual(w.A.roomHold, []);
  } finally { w.restore(); }
  w = await world({}, { x: 40 }); try {   // đứng xa: không có "người ở gần"
    await w.run(1500); await press(w, w.A, 'grab'); assert.ok(w.A.toasts.some((t) => /Không có ai ở gần/.test(t)));
  } finally { w.restore(); }
});

test('trong chùa không khiêng được; hồi chiêu 10 giây cho cặp đó sau khi ném', async () => {
  let w = await world({ z: 10 }, { z: 10 }); try {
    await w.run(1500); await press(w, w.A, 'grab'); assert.ok(w.A.toasts.some((t) => /khuôn viên chùa/.test(t)), JSON.stringify(w.A.toasts)); assert.equal(w.A.LGT.throwP.status().holding, false);
  } finally { w.restore(); }
  w = await world(); try {
    await w.run(1500); await press(w, w.A, 'grab'); await w.run(3500); assert.equal(w.A.toss.length, 1);
    w.B.others = () => [{ id: A, n: 'An', x: w.A.pos.x, z: w.A.pos.z }]; w.A.others = () => [{ id: B, n: 'Bình', x: w.A.pos.x + 1, z: w.A.pos.z }];   // Bình lại gần (đứng cạnh An)
    w.B.LGT.world.teleport(w.A.pos.x + 1, w.A.pos.z); await w.run(1000);
    await press(w, w.A, 'grab'); assert.ok(w.A.toasts.some((t) => /chờ \d+ giây/.test(t)), JSON.stringify(w.A.toasts.slice(-2))); assert.equal(w.A.LGT.throwP.status().holding, false);
  } finally { w.restore(); }
});
