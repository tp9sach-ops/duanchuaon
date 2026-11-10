// Yêu quái hằng tháng + luật ném người (Phiên 65).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import '../js/world/outside.js';
import { YQ, YQ_ORDER, AOE, DIFF, SLOTS, dayEvents, monthEvents, windupOf, rewardFor as rewardFor2, lootDrops as lootDrops2, monthEvent, eventAt, eventPhase, nextEvent, maxHp, hitDamage, newPlayer, hurt, tickPlayer, INVULN_S, RESPAWN, stoneDamage, spearDamage, throwBossDamage, bossHp, createBoss, aoeShapes, inShape, stepBoss, hitBoss, shareOf, lootDrops, pickLoot, tickLoot, rewardFor, MIN_SHARE, loadYq, emptyYq, rngSeed } from '../js/world/yeuquai.js';
import { throwCheck, markThrown, tickCooldown, inTemple, strengthOf, THROW_COOLDOWN_S, THROW_COST_SEN } from '../js/world/strength.js';
import { blocked, region } from '../js/world/layout.js';
import { emptyLeaf, addLa, loadLeaf, SEN_PER_LA } from '../js/world/merit.js';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('lịch: MỖI NGÀY đúng ba sự kiện 12:00, 16:00, 20:00 giờ VN, mỗi khung 90 phút, không chồng nhau, đủ ba loại quái', () => {
  const hours = SLOTS.map((s) => s.hour); assert.deepEqual(hours, [12, 16, 20]);
  for (let y = 2026; y <= 2028; y++) for (let m = 1; m <= 12; m++) for (const day of [1, 15, 28]) {
    const evs = dayEvents(y, m, day); assert.deepEqual(evs, dayEvents(y, m, day)); assert.equal(evs.length, 3);
    evs.forEach((e, i) => { const d = new Date(e.start + 7 * 3600e3); assert.equal(d.getUTCHours(), hours[i]); assert.equal(d.getUTCMinutes(), 0); assert.equal(d.getUTCMonth() + 1, m); assert.equal(d.getUTCDate(), day); assert.equal(e.end - e.start, 90 * 60000); assert.match(e.key, /^\d{4}-\d{2}-\d{2}-(trua|chieu|toi)$/); if (i) assert.ok(evs[i - 1].end < e.start); });
    assert.equal(new Set(evs.map((e) => e.type)).size, 3, 'mỗi ngày đủ ba loại');
  }
  assert.deepEqual(dayEvents(2026, 11, 10).map((e) => e.diff), ['trung', 'trung', 'cao']);
  assert.equal(dayEvents(2026, 99, 99)[0].month, 12); assert.equal(dayEvents(2026, 2, 31)[0].day, 28); assert.equal(dayEvents(NaN, NaN, NaN)[0].month, 1);
  assert.equal(monthEvents(2026, 11).length, 90); assert.equal(monthEvents(2028, 2).length, 87);
  assert.notEqual(dayEvents(2026, 11, 10)[0].type, dayEvents(2026, 11, 11)[0].type);
});
test('giai đoạn: trước / đang / sau; eventAt dùng ngày theo giờ VN; nextEvent sang ngày mai (qua tháng, qua năm)', () => {
  const [a, b, c] = dayEvents(2026, 11, 10);
  assert.equal(eventPhase(a, a.start - 1000).phase, 'before'); assert.equal(eventPhase(a, a.start).phase, 'live'); assert.equal(eventPhase(a, a.end - 1).phase, 'live'); assert.equal(eventPhase(a, a.end).phase, 'after'); assert.equal(eventPhase(a, a.start + 60000).secs, 89 * 60);
  assert.equal(eventAt(a.start + 1000).key, '2026-11-10-trua'); assert.equal(eventAt(a.end + 1000).key, '2026-11-10-chieu', 'giữa hai khung: chỉ khung sau'); assert.equal(eventAt(b.end + 1000).key, '2026-11-10-toi'); assert.equal(eventAt(c.end + 1000).key, '2026-11-10-toi', 'sau khung cuối ngày: vẫn là khung cuối');
  assert.equal(eventAt(Date.UTC(2026, 10, 30, 16, 59)).key, '2026-11-30-toi', '23:59 ngày 30/11 giờ VN'); assert.equal(eventAt(Date.UTC(2026, 10, 30, 17, 0)).key, '2026-12-01-trua', '00:00 ngày 1/12 giờ VN');
  assert.equal(nextEvent(a.start - 5).key, a.key); assert.equal(nextEvent(c.end + 5).key, '2026-11-11-trua'); assert.equal(nextEvent(Date.UTC(2026, 10, 30, 16, 0)).key, '2026-12-01-trua'); assert.equal(nextEvent(Date.UTC(2026, 11, 31, 16, 0)).key, '2027-01-01-trua');
});
test('máu người chơi theo cấp; cấp càng cao mất càng ít (cả giá trị lẫn tỉ lệ); 3 đòn hạ cấp 1', () => {
  assert.equal(maxHp(1), 100); assert.ok(maxHp(10) > maxHp(5)); assert.equal(maxHp(NaN), 100);
  for (const id of YQ_ORDER) { for (let lv = 1; lv < 20; lv++) { assert.ok(hitDamage(id, lv + 1) <= hitDamage(id, lv)); assert.ok(hitDamage(id, lv + 1) / maxHp(lv + 1) < hitDamage(id, lv) / maxHp(lv)); } assert.ok(Math.ceil(100 / hitDamage(id, 1)) <= 3, id + ' hạ cấp 1 trong ≤3 đòn'); assert.ok(hitDamage(id, 10) >= 1); }
  assert.equal(hitDamage('khongco', 1), 0);
});
test('hồi sinh: hết máu → đầy máu, bất tử 3 giây, đếm số lần ngã; đang bất tử không mất máu', () => {
  let p = newPlayer(1), r = hurt(p, 40); assert.deepEqual([r.p.hp, r.died], [60, false]); r = hurt(r.p, 40); r = hurt(r.p, 40); assert.equal(r.died, true); assert.equal(r.p.hp, 100); assert.equal(r.p.inv, INVULN_S); assert.equal(r.p.deaths, 1);
  assert.equal(hurt(r.p, 999).lost, 0); assert.equal(tickPlayer(tickPlayer(r.p, 1), 1).inv, INVULN_S - 2, 'mỗi nhịp trừ tối đa 1 giây'); assert.equal(tickPlayer(tickPlayer(tickPlayer(tickPlayer(r.p, 1), 1), 1), 1).inv, 0); assert.equal(hurt({ ...r.p, inv: 0 }, 30).p.hp, 70);
  assert.equal(hurt(null, 5).p.hp, 100); assert.equal(hurt(p, -5).lost, 0); assert.equal(hurt(p, NaN).p, p);
  assert.equal(blocked(RESPAWN.x, RESPAWN.z), false); assert.equal(region(RESPAWN.x, RESPAWN.z), 'ground'); assert.equal(inTemple(RESPAWN.x, RESPAWN.z), false, 'hồi sinh ngay trước cổng chùa');
});
test('vùng đánh: mỗi loại một kiểu; vành khuyên an toàn khi đứng sát thân; vòng tròn trúng ai đứng trong', () => {
  const b = createBoss('da', { x: 0, z: 100 }), r = rngSeed(7);
  const slam = aoeShapes(b, [], r); assert.deepEqual(slam, [{ k: 'c', x: 0, z: 100, r: AOE.slam }]); assert.ok(inShape(slam[0], 3, 100) && !inShape(slam[0], 7, 100));
  const ring = aoeShapes(createBoss('nuoc', { x: 0, z: 100 }), [], r)[0]; assert.equal(ring.k, 'ring'); assert.ok(!inShape(ring, 1, 100), 'sát thân an toàn'); assert.ok(inShape(ring, 6, 100)); assert.ok(!inShape(ring, 11, 100));
  const burst = aoeShapes(createBoss('lua', { x: 0, z: 100 }), [{ x: 2, z: 104 }], r); assert.equal(burst.length, AOE.burstN); assert.ok(burst.every((s) => s.r === AOE.burst && Math.hypot(s.x - 2, s.z - 104) <= 4.01));
  assert.ok(Array.from({ length: 20 }, () => aoeShapes(createBoss('lua', {}), [], r)).every((a) => a.length === 3));
});
test('yêu quái: đuổi người gần nhất, gồng (có báo trước) rồi mới đánh; người chạy kịp ra ngoài vùng thì không trúng, đứng yên thì trúng', () => {
  for (const id of YQ_ORDER) {
    const run = (dodge) => {
      const b = createBoss(id, { x: 0, z: 100 }), r = rngSeed(3), p = { id: 'a', x: 0, z: 108 }; let wind = null, strike = null, t = 0;
      while (!strike && t < 30) {
        for (const e of stepBoss(b, 0.05, [p], r)) { if (e.k === 'windup') { wind = { t, dur: e.dur }; } if (e.k === 'strike') strike = { t, hits: e.hits }; }
        if (dodge && b.state === 'windup') { const dx = p.x - b.x, dz = p.z - b.z, d = Math.hypot(dx, dz) || 1; p.x += dx / d * 7 * 0.05; p.z += dz / d * 7 * 0.05; }   // chạy ra xa với tốc độ chạy 7 m/s
        t += 0.05;
      }
      return { wind, strike, p, b };
    };
    const still = run(false), dodged = run(true);
    assert.ok(still.wind && still.strike, id); assert.ok(still.strike.t - still.wind.t >= YQ[id].windup - 0.06, id + ' có báo trước đủ lâu');
    assert.deepEqual(still.strike.hits, ['a'], id + ' đứng yên là trúng');
    if (id === 'da') assert.deepEqual(dodged.strike.hits, [], 'chạy ra khỏi vòng 6,5 m trong 1,9 giây thì né được');
  }
});
test('yêu quái đi qua hàm walk (tránh vật cản) và đứng cách người một khoảng; không có người thì đứng yên', () => {
  const b = createBoss('da', { x: 0, z: 100 }), r = rngSeed(1); let calls = 0;
  for (let i = 0; i < 40; i++) stepBoss(b, 0.1, [{ id: 'a', x: 0, z: 130 }], r, (x, z, dx, dz) => { calls++; return { x: x + dx, z: z + dz }; });
  assert.ok(calls > 0 && b.z > 100 && Math.abs(b.ry) < 1e-9); const z0 = b.z; const c = createBoss('da', {}); stepBoss(c, 0.1, [], r); assert.equal(c.z, 100);
  const far = createBoss('da', { x: 0, z: 100 }); for (let i = 0; i < 200; i++) stepBoss(far, 0.1, [{ id: 'a', x: 0, z: 103 }], r); assert.ok(Math.abs(far.z - 100) < 0.01 || far.state !== 'move', 'đã đứng đủ gần thì không đẩy tới sát mặt');
  assert.ok(z0 > 100);
});
test('đòn của người chơi: sức mạnh càng cao càng đau, thương mạnh hơn ném đá, ném yêu quái đau nhất', () => {
  assert.ok(stoneDamage(100) > stoneDamage(10)); assert.ok(spearDamage(10) > stoneDamage(10)); assert.ok(throwBossDamage(100) > spearDamage(100)); assert.equal(stoneDamage('x'), 8);
  assert.ok(Math.ceil(YQ.da.hp / spearDamage(strengthOf({ level: 1 }))) < 200, 'cấp 1 vẫn hạ được nếu kiên nhẫn');
});
test('trúng yêu quái: ghi công từng người, hết máu thì chết, máu tăng theo số người đánh chung', () => {
  const b = createBoss('lua', {}); assert.equal(hitBoss(b, 0).dealt, 0); assert.equal(hitBoss(b, 100, 'a').dealt, 100); hitBoss(b, 300, 'b'); assert.equal(b.hp, YQ.lua.hp - 400); assert.equal(shareOf(b, 'a'), 100 / b.max); assert.equal(shareOf(b, 'zz'), 0);
  const r = hitBoss(b, 99999, 'a'); assert.ok(r.dead && b.dead && b.hp === 0); assert.equal(r.dealt, YQ.lua.hp - 400); assert.equal(hitBoss(b, 5, 'a').dealt, 0); assert.equal(stepBoss(b, 0.1, [{ id: 'a', x: 0, z: 100 }], rngSeed(1)).length, 0);
  assert.equal(bossHp('da', 1), 2400); assert.equal(bossHp('da', 3), 4800); assert.equal(bossHp('zz', 1), 0); assert.equal(createBoss('zz'), null);
});
test('lá bồ đề rơi: ai chạm trước lấy trước (túi đã nhặt biến mất), nhiều người đánh → nhiều túi, hết hạn thì mất', () => {
  const r = rngSeed(5), d = lootDrops(0, 100, 1, r); assert.equal(d.length, 8); assert.ok(d.every((x) => x.la >= 1 && x.la <= 3 && x.ttl === 150)); assert.equal(lootDrops(0, 100, 4, r).length, 14); assert.equal(new Set(d.map((x) => x.id)).size, 8);
  const first = pickLoot(d, d[2].x, d[2].z); assert.equal(first.got.id, d[2].id); assert.equal(first.drops.length, 7); const second = pickLoot(first.drops, d[2].x, d[2].z); assert.ok(!second.got || second.got.id !== d[2].id, 'người đến sau không nhặt lại được');
  assert.equal(pickLoot(d, 500, 500).got, null); assert.equal(pickLoot(null, 0, 0).got, null);
  assert.equal(tickLoot(d, 100).length, 8); assert.equal(tickLoot(d, 5).length, 8); let l = d; for (let i = 0; i < 40; i++) l = tickLoot(l, 5); assert.equal(l.length, 0);
});
test('thưởng thu phục: đánh ≥ 5% mới có điểm + sức mạnh; sức mạnh cộng thêm tính vào strengthOf; lá thưởng không làm phồng hạt sen từng kiếm', () => {
  assert.deepEqual(rewardFor(MIN_SHARE), { xp: 60, strength: 3 }); assert.deepEqual(rewardFor(0.04), { xp: 0, strength: 0 });
  assert.equal(strengthOf({ level: 1, bonus: 3 }), strengthOf({ level: 1 }) + 3); assert.equal(strengthOf({ level: 1, bonus: 9999 }), strengthOf({ level: 1 }) + 100);
  const g = addLa(emptyLeaf(), 7); assert.ok(g.ok); assert.equal(g.leaf.la, 7); assert.equal(g.leaf.spent, 0); assert.equal(g.leaf.gift, 7);
  const re = loadLeaf(JSON.stringify(g.leaf)); assert.equal(re.la, 7); assert.equal(re.spent, 0, 'nạp lại không tự tăng spent'); assert.equal(loadLeaf(JSON.stringify({ la: 7, spent: 0 })).spent, 7 * SEN_PER_LA, 'lá không có nguồn gốc vẫn bị chỉnh như cũ');
  assert.equal(addLa(emptyLeaf(), 0).ok, false); assert.equal(addLa(emptyLeaf(), NaN).ok, false); assert.equal(addLa(emptyLeaf(), 5000).ok, false);
});
test('lưu lgt.yq: đọc lại an toàn, bỏ khóa lạ', () => {
  for (const bad of [null, undefined, 'rác{', '[]', 5]) assert.deepEqual(loadYq(bad), emptyYq());
  const s = loadYq(JSON.stringify({ done: { '2026-11': true, 'xx': true, '2026-12': 'x' }, kills: 3, bonus: 999, deaths: -4 })); assert.deepEqual(s.done, { '2026-11': true }); assert.equal(s.kills, 3); assert.equal(s.bonus, 100); assert.equal(s.deaths, 0);
});
test('luật ném NGƯỜI (ptg 08/11): trong chùa không ném, đang thiền không ném, hồi chiêu 10 giây mỗi cặp, trừ 1 công đức, cấp VÀ sức mạnh phải lớn hơn', () => {
  const att = { lv: 8, str: 90, x: 0, z: 60 }, tgt = { lv: 2, str: 20, x: 3, z: 60 }, ok = throwCheck({ att, tgt });
  assert.deepEqual(ok, { ok: true, reason: '', cost: THROW_COST_SEN, wait: 0 }); assert.equal(THROW_COST_SEN, 1); assert.equal(THROW_COOLDOWN_S, 10);
  assert.equal(throwCheck({ att, tgt: { ...tgt, z: 10 } }).reason, 'temple', 'người bị ném đang ở trong chùa'); assert.equal(throwCheck({ att: { ...att, z: 0 }, tgt }).reason, 'temple', 'người ném đứng trong chùa'); assert.equal(throwCheck({ att: { ...att, z: 35 }, tgt: { ...tgt, z: 40 } }).reason, 'temple', 'cổng Tam quan cũng là chùa');
  assert.equal(throwCheck({ att, tgt: { ...tgt, meditating: true } }).reason, 'meditating');
  assert.equal(throwCheck({ att, tgt: { ...tgt, lv: 8 } }).reason, 'level'); assert.equal(throwCheck({ att, tgt: { ...tgt, str: 90 } }).reason, 'strength'); assert.equal(throwCheck({ att: { ...att, str: 20 }, tgt: { ...tgt, str: 10 } }).reason, 'weight'); assert.equal(throwCheck({}).ok, false);
  let cd = markThrown({}, 'a', 'b'); const blockedNow = throwCheck({ att, tgt, cd, attId: 'a', tgtId: 'b' }); assert.deepEqual([blockedNow.ok, blockedNow.reason, blockedNow.wait], [false, 'cooldown', 10]);
  assert.equal(throwCheck({ att, tgt, cd, attId: 'a', tgtId: 'c' }).ok, true, 'hồi chiêu tính RIÊNG từng cặp'); assert.equal(throwCheck({ att, tgt, cd, attId: 'b', tgtId: 'a' }).ok, true, 'chiều ngược lại không bị');
  cd = tickCooldown(cd, 4); assert.equal(throwCheck({ att, tgt, cd, attId: 'a', tgtId: 'b' }).wait, 6); cd = tickCooldown(cd, 6); assert.deepEqual(cd, {}); assert.equal(throwCheck({ att, tgt, cd, attId: 'a', tgtId: 'b' }).ok, true);
  assert.equal(inTemple(0, 34), true); assert.equal(inTemple(0, 40), false); assert.equal(inTemple(0, -60), true); assert.equal(inTemple(NaN, 0), false);
});
test('nối dây: initYeuQuai trong hudMenu, cảnh 3D, thanh máu, gửi thưởng qua LGT.merit.addLa', () => {
  const h = read('js/ui/hudMenu.js'), s = read('js/scene/index.js'), u = read('js/ui/yeuquai.js'), m = read('js/ui/merit.js'), c = read('js/ui/carry.js');
  assert.match(h, /initYeuQuai\(hud, \{ toast \}\)/); assert.match(s, /buildYeuQuai\(\)/); assert.match(s, /yeuQuai\.update\(t, LGT\.yqView\)/); assert.match(u, /LGT\.merit\.addLa/); assert.match(u, /teleport\(RESPAWN\.x, RESPAWN\.z\)/); assert.match(u, /get\('yq'\)/); assert.ok(!/innerHTML/.test(u));
  assert.match(m, /addLa: gain/); assert.match(c, /bonus: LGT\.yq \? LGT\.yq\.bonus : 0/);
});

test('ba khung giờ mỗi ngày: 12:00 và 16:00 trung bình, 20:00 cao; mỗi khung 90 phút', () => {
  const [a, b, c] = dayEvents(2026, 11, 10);
  assert.deepEqual([a.diff, b.diff, c.diff], ['trung', 'trung', 'cao']); assert.ok(a.day === b.day && b.day === c.day);
  assert.deepEqual([a, b, c].map((e) => new Date(e.start + 7 * 3600e3).getUTCHours()), [12, 16, 20]);
  assert.equal(a.end - a.start, 90 * 60000); assert.ok(a.end < b.start && b.end < c.start);
  assert.equal(eventAt(a.start + 1000).key, a.key); assert.equal(eventAt(b.start + 1000).key, b.key); assert.equal(eventAt(c.start + 1000).key, c.key);
  assert.equal(eventAt(a.end + 1000).key, b.key, 'giữa hai khung: chỉ khung sau'); assert.equal(eventAt(b.end + 1000).key, c.key);
});
test('độ khó cao: máu nhiều, đánh đau hơn, gồng ngắn hơn, rơi nhiều lá, thưởng lớn hơn', () => {
  const t = createBoss('da', { diff: 'trung' }), c = createBoss('da', { diff: 'cao' });
  assert.ok(c.max > t.max); assert.ok(hitDamage('da', 1, 'cao') > hitDamage('da', 1, 'trung'));
  assert.ok(windupOf(c) < windupOf(t));
  assert.ok(lootDrops2(0, 0, 1, () => 0.5, 'cao').length > lootDrops2(0, 0, 1, () => 0.5, 'trung').length);
  assert.ok(rewardFor2(1, 'cao').xp > rewardFor2(1, 'trung').xp); assert.equal(rewardFor2(0, 'cao').xp, 0);
  assert.equal(createBoss('da', {}).diff, 'trung'); assert.equal(createBoss('da', { diff: 'xx' }).diff, 'trung');
  assert.deepEqual(SLOTS.map((s) => s.diff), ['trung', 'trung', 'cao']);
});
