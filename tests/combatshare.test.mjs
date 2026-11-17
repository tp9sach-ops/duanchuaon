// Phiên 220: đồng bộ chiến đấu giữa người chơi (js/world/combatShare.js + js/net/combatLink.js + nhánh /combat của js/net/firebaseTransport.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COMBAT, COMBAT_CHARSET, packAction, unpackAction, unpackActions, packMons, unpackMons, createOutbox, createInbox, createGhosts } from '../js/world/combatShare.js';
import { createCombatLink } from '../js/net/combatLink.js';
import { createFirebaseTransport } from '../js/net/firebaseTransport.js';

const mon = (o = {}) => ({ uid: 'hoThac:12', type: 'thuyquy', x: 10.26, z: -5.04, ry: 1.5, oan: 60, max: 120, eng: true, wind: 0, slam: false, ...o });

test('mã hóa hành động: chiêu / đòn / trúng khứ hồi đúng, chỉ ký tự hợp lệ', () => {
  const c = packAction({ k: 'c', seq: 1, id: 'hoa_1', x: 1.234, z: -5, ry: 3.1, tx: 2, tz: 3 });
  assert.match(c, COMBAT_CHARSET); assert.deepEqual(unpackAction(c), { k: 'c', seq: 1, id: 'hoa_1', x: 1.2, z: -5, ry: 3.1, tx: 2, tz: 3 });
  assert.equal(unpackAction(packAction({ k: 'c', seq: 2, id: 'kim_2', x: 0, z: 0, ry: 0 })).tx, null, 'không có mục tiêu → null');
  const s = unpackAction(packAction({ k: 's', seq: 3, kind: 'xoay', x: 4, z: 5, ry: -1 })); assert.equal(s.kind, 'xoay'); assert.equal(s.ry, -1);
  const h = unpackAction(packAction({ k: 'h', seq: 4, key: 'hoThac:12', dmg: 55, id: 'thuy_1', i: 1, dead: true, ax: 1, az: 2 }));
  assert.deepEqual([h.key, h.dmg, h.id, h.i, h.dead, h.nho, h.ax, h.az], ['hoThac:12', 55, 'thuy_1', 1, true, false, 1, 2]);
});
test('mã hóa hành động: dữ liệu hỏng / độc bị từ chối, không ném lỗi', () => {
  for (const bad of [null, {}, { k: 'c', id: 'a b' }, { k: 'c', id: '<x>' }, { k: 's', kind: 'la' }, { k: 'h', key: 'abc' }, { k: 'h', key: 'a:1', id: '../x' }]) assert.equal(packAction(bad), '');
  for (const bad of ['', 'x', '1,c', '1,c,hoa 1,0,0,0,,', '1,s,la,0,0,0', '1,h,k,1,2,3,4,5,6,7', '1,c,hoa_1,0,0,0,,;<script>', null, 5]) assert.equal(unpackAction(bad), null);
  assert.deepEqual(unpackActions('1,s,ngang,0,0,0;rac;2,s,nguoc,0,0,0').map((a) => a.kind), ['ngang', 'nguoc']);
});
test('mã hóa quái: khứ hồi, máu theo %, pha gồng đòn, bỏ loại lạ, tối đa 12 con', () => {
  const s = packMons([mon(), mon({ uid: 'hoThac:13', oan: 120 }), mon({ uid: 'hoThac:14', type: 'khonghay' }), mon({ uid: 'hoThac:15', oan: 0 }), mon({ uid: 'x', oan: 5 })]);
  assert.match(s, COMBAT_CHARSET); const l = unpackMons(s); assert.equal(l.length, 2);
  assert.deepEqual([l[0].key, l[0].x, l[0].z, l[0].pct, l[0].ph, l[0].type], ['hoThac:12', 10.3, -5, 50, 0, 'thuyquy']); assert.equal(l[1].pct, 100);
  const w = unpackMons(packMons([mon({ wind: 0.1 })]))[0]; assert.ok(w.ph >= 1 && w.ph <= 9, 'đang gồng → pha 1..9');
  assert.equal(unpackMons(packMons(Array.from({ length: 30 }, (_, i) => mon({ uid: 'a:' + i })))).length, COMBAT.maxMons);
  assert.deepEqual(unpackMons('rac;1,2'), []);
});
test('hộp gửi: điều tiết nhịp, giữ hành động ngắn hạn, quái hết đánh gửi một gói trống rồi im', () => {
  const o = createOutbox(); assert.equal(o.packet(0), null, 'chưa có gì: im');
  o.setRoom('main'); o.push({ k: 's', kind: 'ngang', x: 0, z: 0, ry: 0 }, 1000);
  const p = o.packet(1000); assert.equal(p.r, 'main'); assert.equal(unpackActions(p.a).length, 1); assert.equal(p.m, undefined);
  o.push({ k: 's', kind: 'nguoc', x: 0, z: 0, ry: 0 }, 1050); assert.equal(o.packet(1050), null, 'gửi dồn trong 120 ms bị hoãn');
  const p2 = o.packet(1130); assert.deepEqual(unpackActions(p2.a).map((a) => a.seq), [1, 2], 'gói mang cả đòn trước (người nhận bỏ trùng)');
  assert.equal(o.packet(1200), null);
  o.setMons([mon()]); const p3 = o.packet(1300); assert.ok(p3.m); assert.equal(o.packet(1300 + 2000), null, 'đang đánh, không đổi: chưa tới 3 giây'); assert.ok(o.packet(1300 + 3000), 'báo còn đây');
  o.setMons([]); const p4 = o.packet(5000); assert.ok(p4 && !p4.m && !p4.a, 'một gói trống để máy khác bỏ bóng quái'); assert.equal(o.packet(9000), null);
  const r = createOutbox(); r.setRoom('bậy bạ'); r.push({ k: 's', kind: 'xoay', x: 0, z: 0, ry: 0 }); assert.equal(r.packet(0).r, '', 'tên phòng lạ bị bỏ');
  const big = createOutbox(); for (let i = 0; i < 20; i++) big.push({ k: 'h', key: 'hoThac:12', dmg: 99999, id: 'thuy_huyenbang_4', i: 9, dead: true, ax: 100.5, az: -100.5 }, 0); assert.ok(big.packet(0).a.length <= COMBAT.maxA);
});
test('hộp nhận: lần đầu chỉ ghi mốc, sau đó chỉ trả hành động mới, đúng thứ tự', () => {
  const i = createInbox(), pk = (n, k = 'ngang') => packAction({ k: 's', seq: n, kind: k, x: 0, z: 0, ry: 0 });
  assert.deepEqual(i.take('A', pk(5)), [], 'đòn cũ của người vừa thấy không phát lại');
  assert.deepEqual(i.take('A', pk(5)), []); assert.deepEqual(i.take('A', [pk(5), pk(7, 'xoay'), pk(6, 'nguoc')].join(';')).map((a) => a.seq), [6, 7]);
  assert.deepEqual(i.take('A', [pk(6), pk(7)].join(';')), []); assert.deepEqual(i.take('B', pk(1)), []); i.forget('A'); assert.deepEqual(i.take('A', pk(9)), []);
});
test('bóng quái: dựng, nội suy, trúng/kết liễu, mộ không dựng lại, hết hạn, người rời', () => {
  const g = createGhosts(); g.ingest('A', unpackMons(packMons([mon()])), 0);
  const q = g.list()[0]; assert.equal(q.ghost, true); assert.equal(q.ten, 'Thủy Quỷ Hồ Thác'); assert.equal(q.he, 'thuy'); assert.equal(q.oan, 50); assert.equal(q.max, 100); assert.ok(q.uid.startsWith('g|'));
  g.ingest('A', unpackMons(packMons([mon({ x: 14, oan: 30 })])), 500); g.step(0.1, 500); assert.ok(q.x > 10.3 && q.x < 14, 'trượt dần tới chỗ mới'); assert.equal(q.oan, 25);
  assert.equal(g.hit('A', 'hoThac:12'), q); assert.equal(g.hit('B', 'hoThac:12'), null);
  g.kill('A', 'hoThac:12', 600); g.ingest('A', unpackMons(packMons([mon()])), 700); assert.equal(g.size, 0, 'vừa hạ thì chưa dựng lại');
  g.step(0.1, 600 + COMBAT.tombMs + 1); g.ingest('A', unpackMons(packMons([mon()])), 4000); assert.equal(g.size, 1, 'hết hạn mộ → dựng lại');
  g.step(0.1, 4000 + COMBAT.ghostTtlMs + 1); assert.equal(g.size, 0, 'không nhận gói mới thì biến mất');
  g.ingest('A', unpackMons(packMons([mon(), mon({ uid: 'hoThac:13' })])), 0); g.ingest('B', unpackMons(packMons([mon()])), 0); g.ingest('A', [], 1); assert.equal(g.size, 1, 'A hết đánh: bỏ bóng của A, giữ của B'); g.drop('B'); assert.equal(g.size, 0);
});

// ---- liên kết vào game (đồ giả)
function makeWorld() {
  const calls = { cast: [], swing: [], hit: [], sent: [], slash: [], fx: [], sfx: [], remote: [], ghostFrames: 0 };
  const av = { group: { position: { x: 0, z: 0 }, rotation: { y: 0 } }, cast: (id) => { calls.cast.push(id); return 1.2; }, swing: (a) => { calls.swing.push(a); return a || 'ngang'; } };
  const remoteAv = { group: { position: { x: 3, z: 4 } }, setFacing() {}, cast: (id) => calls.remote.push(['cast', id]), swing: (k) => calls.remote.push(['swing', k]), setStance: (on) => calls.remote.push(['stance', on]) };
  const LGT = { farmView: { mons: [], target: '' }, hitReact: { onHit: (m, o) => { calls.hit.push([m.uid, o.dmg]); return 'rx'; } }, sfx: { play: (c) => calls.sfx.push(c) }, zones: null };
  const incoming = []; let t = 1_000_000;
  const tr = { sendCombat: (p) => calls.sent.push(p), combat: () => incoming.map((x) => ({ ...x })) };
  const link = createCombatLink({
    LGT, W: { pos: { x: 0, z: 0 }, avatar: av, facing: 0.5 }, getTransport: () => tr, avatarOf: (id) => (id === 'peer1' ? remoteAv : null), roomOf: () => 'main', now: () => t, perf: () => t,
    makeSlash: () => ({ slash: (k) => { calls.slash.push(k); return true; }, update() {}, dispose() {} }), castFx: (id, o) => calls.fx.push([id, o]), ghostView: { update() { calls.ghostFrames++; } },
  });
  return { calls, LGT, av, remoteAv, incoming, link, tr, advance: (ms) => { t += ms; }, get t() { return t; } };
}
test('liên kết: đòn/chiêu/trúng của MÌNH được phát đi, hàm gốc vẫn chạy đúng', () => {
  const w = makeWorld(); w.link.hookAvatar(); w.link.hookHit(); w.link.hookAvatar();
  assert.equal(w.av.cast('hoa_1'), 1.2); assert.equal(w.av.swing(), 'ngang'); assert.equal(w.LGT.hitReact.onHit({ uid: 'hoThac:3' }, { dmg: 20, id: 'hoa_1' }), 'rx');
  assert.deepEqual([w.calls.cast, w.calls.swing.length, w.calls.hit.length], [['hoa_1'], 1, 1], 'bọc hai lần vẫn chỉ gọi hàm gốc một lần');
  w.link.tick(); const p = w.calls.sent[0], a = unpackActions(p.a); assert.deepEqual(a.map((x) => x.k), ['c', 's', 'h']); assert.equal(a[0].id, 'hoa_1'); assert.equal(a[2].key, 'hoThac:3');
  w.LGT.farmView.mons = [mon({ x: 5, z: 5 }), mon({ uid: 'hoThac:99', x: 90, z: 90 }), mon({ uid: 'hoThac:98', eng: false })];
  w.advance(500); w.link.tick(); assert.equal(unpackMons(w.calls.sent[1].m).length, 1, 'chỉ quái mình đang đánh và ở gần');
});
test('liên kết: trúng bóng quái KHÔNG phát lại; Võ đài (skipOut) không phát', () => {
  const w = makeWorld(); w.link.hookHit(); w.LGT.hitReact.onHit({ uid: 'g|A|x:1', ghost: true }, { dmg: 5 }); w.link.tick(); assert.equal(w.calls.sent.length, 0);
  const w2 = makeWorld(); let arena = true; const l2 = createCombatLink({ LGT: w2.LGT, W: { pos: { x: 0, z: 0 }, avatar: w2.av }, getTransport: () => w2.tr, skipOut: () => arena, now: () => 0 });
  l2.hookAvatar(); w2.av.swing(); l2.tick(); assert.equal(w2.calls.sent.length, 0); arena = false; w2.av.swing(); assert.equal(l2.outbox.seq, 1);
});
test('liên kết: nhận đòn, chiêu, quái và trúng của người khác → chiếu lại', () => {
  const w = makeWorld(), pk = (a) => packAction(a);
  w.incoming.push({ id: 'peer1', r: 'main', a: pk({ k: 's', seq: 1, kind: 'ngang', x: 3, z: 4, ry: 0 }), m: '', t: 1 });
  w.link.tick(); assert.deepEqual(w.calls.remote, [], 'gói đầu tiên: chỉ ghi mốc');
  w.incoming[0] = { id: 'peer1', r: 'main', t: 2, m: packMons([mon({ x: 5, z: 5, oan: 100, max: 100 })]),
    a: [pk({ k: 's', seq: 1, kind: 'ngang', x: 3, z: 4, ry: 0 }), pk({ k: 's', seq: 2, kind: 'xoay', x: 3, z: 4, ry: 1 }), pk({ k: 'c', seq: 3, id: 'thuy_1', x: 3, z: 4, ry: 1, tx: 5, tz: 5 }), pk({ k: 'h', seq: 4, key: 'hoThac:12', dmg: 40, id: 'thuy_1', i: 0 })].join(';') };
  w.link.tick();
  assert.deepEqual(w.calls.remote.filter((x) => x[0] !== 'stance'), [['swing', 'xoay'], ['cast', 'thuy_1']]); assert.ok(w.calls.remote.some((x) => x[0] === 'stance' && x[1] === true));
  assert.deepEqual(w.calls.slash, ['xoay']); assert.equal(w.calls.fx[0][0], 'thuy_1'); assert.equal(w.calls.fx[0][1].tx, 5); assert.ok(w.calls.sfx.length >= 1);
  assert.equal(w.link.ghosts.size, 1); assert.deepEqual(w.calls.hit, [['g|peer1|hoThac:12', 40]], 'trúng bóng quái → hiệu ứng trúng đòn cục bộ');
  w.link.frame(0.016); assert.equal(w.LGT.farmView.ghosts.length, 1); assert.equal(w.calls.ghostFrames, 1);
  w.advance(COMBAT.stanceMs + 10); w.link.frame(0.016); assert.deepEqual(w.calls.remote.at(-1), ['stance', false], 'hết đánh thì thôi thế chiến đấu');
  w.incoming[0] = { ...w.incoming[0], r: 'main:vo-dai', t: 3 }; w.link.tick(); assert.equal(w.link.ghosts.size, 0, 'người ở zone khác: không thấy bóng quái');
  w.incoming.length = 0; w.link.tick(); assert.equal(w.link.ghosts.size, 0);
});
test('liên kết: đòn kết liễu đi cùng gói đầu tiên của quái vẫn có hiệu ứng, rồi bóng biến mất', () => {
  const w = makeWorld(); w.incoming.push({ id: 'peer1', r: 'main', t: 1, a: '', m: '' }); w.link.tick();
  w.incoming[0] = { id: 'peer1', r: 'main', t: 2, m: packMons([mon({ oan: 3, max: 100 })]), a: packAction({ k: 'h', seq: 1, key: 'hoThac:12', dmg: 9, dead: true }) };
  w.link.tick(); assert.equal(w.calls.hit.length, 1); assert.equal(w.link.ghosts.size, 0);
});
test('liên kết: đường truyền không có sendCombat (Apps Script) vẫn chạy bình thường', () => {
  const w = makeWorld(); const l = createCombatLink({ LGT: w.LGT, W: { pos: { x: 0, z: 0 }, avatar: w.av }, getTransport: () => ({ call() {} }), now: () => 0 }); l.hookAvatar(); w.av.swing(); assert.doesNotThrow(() => l.tick());
});

// ---- Firebase: nhánh /combat
function fakeDb() {
  const B = { tree: { players: {}, chat: {}, combat: {} }, ls: [], deny: false, disc: [], n: 0 };
  const snap = (key, val) => ({ key, val: () => val, forEach: () => {} });
  const emit = (coll, ev, key) => { for (const l of B.ls) if (l.coll === coll && l.ev === ev) l.cb(snap(key, B.tree[coll][key])); };
  const sdk = {
    initializeApp: () => ({}), initializeAuth: () => ({}), inMemoryPersistence: {}, getAuth: () => ({}), signInAnonymously: async () => ({ user: { uid: 'uid' + String(++B.n).padStart(10, '0') + 'abcdefghij' } }),
    getDatabase: () => ({}), ref: (db, p) => ({ p }), query: (r) => ({ ref: r }), limitToLast: () => ({}),
    onValue: (ref, cb) => { cb({ val: () => true }); return () => {}; }, onDisconnect: (ref) => ({ remove: async () => { B.disc.push(ref.p); } }),
    get: async (rq) => { const r = rq.ref || rq, d = B.tree[r.p] || {}; return { val: () => d, forEach: () => {} }; },
    onChildAdded: (rq, cb) => { const r = rq.ref || rq; const l = { coll: r.p, ev: 'added', cb }; B.ls.push(l); return () => {}; },
    onChildChanged: (r, cb) => { B.ls.push({ coll: r.p, ev: 'changed', cb }); return () => {}; }, onChildRemoved: (r, cb) => { B.ls.push({ coll: r.p, ev: 'removed', cb }); return () => {}; },
    set: async (ref, val) => { if (B.deny && ref.p.startsWith('combat')) throw new Error('PERMISSION_DENIED'); const [c, k] = ref.p.split('/'), had = k in B.tree[c]; B.tree[c][k] = val; emit(c, had ? 'changed' : 'added', k); },
    push: async () => {}, remove: async (ref) => { const [c, k] = ref.p.split('/'); delete B.tree[c][k]; for (const l of B.ls) if (l.coll === c && l.ev === 'removed') l.cb(snap(k, null)); }, goOffline() {}, deleteApp: async () => {},
  };
  return { B, loadSdk: async () => sdk };
}
test('Firebase /combat: gửi + nhận gói của nhau, tự xóa khi đóng, bị luật từ chối thì chỉ thôi gửi (người chơi không biến mất)', async () => {
  const F = fakeDb(), T = { t: 5_000_000 }, mk = () => createFirebaseTransport({ config: {}, name: 'x', loadSdk: F.loadSdk, now: () => T.t });
  const a = mk(), b = mk(); await a.connect(); await b.connect();
  assert.equal(a.sendCombat({ r: 'main', a: '1,s,ngang,0,0,0', m: 'hoThac:1,1,2,3,50,0,0,thuyquy' }), true); await Promise.resolve();
  const got = b.combat(); assert.equal(got.length, 1); assert.deepEqual([got[0].id, got[0].r, got[0].a], [a.uid, 'main', '1,s,ngang,0,0,0']); assert.deepEqual(a.combat(), [], 'không nhận lại gói của chính mình');
  assert.ok(F.B.disc.includes('combat/' + a.uid), 'đăng ký tự xóa khi rớt mạng');
  assert.deepEqual(Object.keys(F.B.tree.combat[a.uid]).sort(), ['a', 'm', 'r', 't']);
  a.sendCombat({ r: 'main', a: 'có dấu <script>', m: 'x'.repeat(COMBAT.maxM + 1) }); await Promise.resolve(); assert.deepEqual(Object.keys(F.B.tree.combat[a.uid]).sort(), ['r', 't'], 'chuỗi lạ / quá dài bị bỏ trước khi gửi');
  a.close(); assert.equal(a.sendCombat({ r: 'main' }), false); assert.equal(F.B.tree.combat[a.uid], undefined, 'đóng → xóa gói chiến đấu'); assert.deepEqual(b.combat(), []);
  const c = mk(); await c.connect(); F.B.deny = true; c.sendCombat({ r: 'main', a: '1,s,ngang,0,0,0' }); await new Promise((r) => setTimeout(r, 5)); assert.equal(c.sendCombat({ r: 'main' }), false, 'bị từ chối: thôi gửi');
  const res = await c.call({ action: 'sync', n: 'An', c: 'nau', h: 'troc', x: 1, y: 0, z: 1, r: 0, s: 'idle', since: 0 }); assert.equal(res.ok, true, 'đi lại vẫn bình thường');
});
test('luật Firebase có nhánh /combat khớp giới hạn của mã hóa', () => {
  const rules = JSON.parse(readFileSync(new URL('../firebase/database.rules.json', import.meta.url), 'utf8')).rules.combat.$uid;
  assert.equal(rules['$other']['.validate'], false); assert.match(rules.a['.validate'], /<= 600/); assert.match(rules.m['.validate'], /<= 800/); assert.ok(COMBAT.maxA <= 600 && COMBAT.maxM <= 800);
  for (const f of ['a', 'm', 'r']) assert.ok(rules[f]['.validate'].includes('A-Za-z0-9_.'));
});
