// GIAO LƯU VÕ THUẬT (Phiên 137, mục 1 lộ trình 6 mục): hai người vào Võ đài, dùng chiêu đánh nhau, hết sinh lực là thua. Thắng/thua KHÔNG ảnh hưởng gì (không cấp, không hạt sen), chỉ để vui.
// LOGIC THUẦN (không DOM, không three.js), có test: tests/duel.test.mjs. Giao diện: js/ui/duel.js; cảnh 3D: js/scene/voDai.js; zone: js/world/zoneVoDai.js.
// Mạng: gói tin đi chung kênh chat (Firebase/Apps Script), chuỗi bắt đầu "#dg" và CHỈ gồm chữ thường a–z (qua được bộ lọc chatOk: không số/link). Mỗi bên tự tính phần MÌNH bị đánh
// (né / đỡ / trúng) rồi báo kết quả cho người đánh → kết quả phụ thuộc di chuyển, canh nhịp Hộ thân, chọn chiêu hợp lý (spam một chiêu thì yếu dần).
// Mọi con số là QUY ƯỚC TẠM, chờ ptg duyệt và playtest. Mọi người chơi có cùng sinh lực (công bằng): sức mạnh/cấp ngoài đời KHÔNG tính ở đây.

export const DUEL = { hp: 1000, timeS: 90, countS: 3, waitS: 30, silenceS: 10, stateGapS: 0.5, maxFat: 3, fatStep: 0.15 };

/** Võ đài ("khu luyện tập sân chùa"): sàn tròn bán kính r, đặt xa hub như Vườn thử. */
export const ARENA = { id: 'vo-dai', ten: 'Võ đài sân chùa', cx: 580, cz: 0, r: 13.2, bounds: { x0: 564, x1: 596, z0: -16, z1: 16 } };
/** Hai bên khởi đầu (toạ độ cục bộ so với tâm), mặt đối mặt. ry = 0 là +z (cùng quy ước layout.js). */
export const SIDES = [{ x: -9, z: 0, ry: Math.PI / 2 }, { x: 9, z: 0, ry: -Math.PI / 2 }];
export const toWorld = (lx, lz) => ({ x: ARENA.cx + lx, z: ARENA.cz + lz });
export const inArena = (x, z) => Math.hypot(x - ARENA.cx, z - ARENA.cz) <= ARENA.r;
// Vị trí người chơi gửi qua mạng bị kẹp trong ±200 (Firebase từ chối ngoài khung) → võ đài "mượn" một góc xa của khung đó.
export const NET = { x: 170, z: -170 };
export const toNet = (x, z) => ({ x: x - ARENA.cx + NET.x, z: z - ARENA.cz + NET.z });
export const fromNet = (nx, nz) => ({ x: nx - NET.x + ARENA.cx, z: nz - NET.z + ARENA.cz });
export const inNetBox = (nx, nz) => Math.abs(nx - NET.x) <= 20 && Math.abs(nz - NET.z) <= 20;

/**
 * CHIÊU — dùng CHUNG một bộ phím với đánh quái ngoài rừng (Phiên 164, mục 1 lộ trình mới): 1 = Đánh thường, 2 (hoặc R) = Thương, 3 = Chém khí, 4 = Thiết đầu công,
 * Q / W / E = chiêu 1 / 2 / 3 của phái, 6 = Hộ thân (chỉ ở Võ đài). Mỗi chiêu có `shape`: 'melee' (cận chiến hình quạt) · 'wave' (khí bay thẳng, né ngang được) · 'dash' (lao, né sang bên).
 * Con số là QUY ƯỚC TẠM; ở Võ đài ai cũng có đủ Q/W/E (không gắn cấp/hệ để công bằng) — hệ chỉ đổi TÊN hiển thị ở máy mình.
 */
export const MOVES = {
  a: { id: 'danh', key: '1', ten: 'Đánh thường', shape: 'melee', cd: 0.7, wind: 0.3, range: 2.6, dmg: 40 },
  t: { id: 'thuong', key: '2', alt: 'R', ten: 'Thương', shape: 'melee', cd: 1.8, wind: 0.4, range: 3.6, dmg: 60 },
  b: { id: 'khi', key: '3', ten: 'Chém khí', shape: 'wave', cd: 3, wind: 0.35, range: 16, speed: 18, halfW: 1.0, dmg: 70 },
  c: { id: 'lao', key: '4', ten: 'Thiết đầu công', shape: 'dash', cd: 6, wind: 0.45, dash: 7, dashS: 0.3, halfW: 1.1, dmg: 95 },
  q: { id: 'chieu1', key: 'Q', ten: 'Chiêu 1', shape: 'wave', cd: 5, wind: 0.4, range: 14, speed: 20, halfW: 1.2, dmg: 80 },
  w: { id: 'chieu2', key: 'W', ten: 'Chiêu 2', shape: 'melee', cd: 7, wind: 0.5, range: 4.4, dmg: 100 },
  e: { id: 'chieu3', key: 'E', ten: 'Chiêu 3', shape: 'dash', cd: 11, wind: 0.5, dash: 9, dashS: 0.35, halfW: 1.3, dmg: 130 },
  g: { id: 'giap', key: '6', ten: 'Hộ thân', cd: 5.5, dur: 1.2, perfect: 0.45, block: 0.7, counter: 30 },
};
export const ATTACKS = ['a', 't', 'b', 'c', 'q', 'w', 'e'];
/** Mã phím (KeyboardEvent.code) → chiêu. Cùng phím với js/ui/dock.js (1–4, R) và js/ui/heSkill.js (Q, W, E). */
export const KEY_CODES = { Digit1: 'a', Numpad1: 'a', Digit2: 't', Numpad2: 't', KeyR: 't', Digit3: 'b', Numpad3: 'b', Digit4: 'c', Numpad4: 'c', KeyQ: 'q', KeyW: 'w', KeyE: 'e', Digit6: 'g', Numpad6: 'g' };

const num = (x, d = 0) => (Number.isFinite(+x) ? +x : d);
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const TAU = Math.PI * 2;
const angDiff = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
function distToSeg(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz; if (L2 < 1e-9) return Math.hypot(px - ax, pz - az);
  const t = clamp(((px - ax) * dx + (pz - az) * dz) / L2, 0, 1); return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

// ---------------------------------------------------------------- mã hoá gói tin (chỉ a–z)
const AL = 'abcdefghijklmnopqrstuvwxyz';
const enc = (n, len) => { n = clamp(Math.round(num(n)), 0, Math.pow(26, len) - 1); let s = ''; for (let i = 0; i < len; i++) { s = AL[n % 26] + s; n = Math.floor(n / 26); } return s; };
const dec = (s) => { let n = 0; for (const ch of s) { const i = AL.indexOf(ch); if (i < 0) return NaN; n = n * 26 + i; } return n; };
/** Mã 6 chữ của một id người chơi (để gói tin nói "gửi cho ai" mà không phải mang cả id dài). */
export function tagOf(id) { let h = 2166136261; for (const ch of String(id == null ? '' : id)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return enc(h % Math.pow(26, 6), 6); }
/** Chuỗi có phải gói tin giao lưu không (để lọc khỏi khung chat). */
export const isSignal = (t) => typeof t === 'string' && /^#dg[a-z]{7,}$/.test(t);

const PH = ['wait', 'count', 'fight', 'over'];
export const pack = {
  invite: (to) => '#dgi' + to, accept: (to) => '#dgy' + to, decline: (to) => '#dgn' + to, bye: (to) => '#dgb' + to,
  state: (to, o) => '#dgs' + to + enc(o.seq % 26, 1) + enc(o.phase, 1) + enc(o.hp, 3),
  atk: (to, o) => '#dgk' + to + enc(o.id % 26, 1) + (ATTACKS.includes(o.kind) ? o.kind : 'a') + enc(o.fat, 1)
    + enc((o.x - ARENA.cx + 15) * 10, 2) + enc((o.z - ARENA.cz + 15) * 10, 2) + enc((((o.ry % TAU) + TAU) % TAU) * 64 / TAU, 2),
  res: (to, o) => '#dgr' + to + enc(o.id % 26, 1) + (['h', 'g', 'p', 'd'].includes(o.res) ? o.res : 'd') + enc(o.dmg, 2),
};
/** Đóng gói đối tượng sự kiện của engine ({type:'state'|'atk'|'res'}) gửi cho `to` (mã 6 chữ). */
export const packObj = (to, o) => (o && pack[o.type] ? pack[o.type](to, o) : '');

/** Giải mã. Trả { type, to, ... } hoặc null nếu hỏng/thiếu/thừi/ký tự lạ. */
export function decode(text) {
  if (!isSignal(text)) return null;
  const c = text[3], to = text.slice(4, 10), b = text.slice(10);
  if (to.length !== 6) return null;
  const simple = { i: 'invite', y: 'accept', n: 'decline', b: 'bye' };
  if (simple[c]) return b === '' ? { type: simple[c], to } : null;
  if (c === 's' && b.length === 5) { const seq = dec(b[0]), phase = dec(b[1]), hp = dec(b.slice(2)); return phase > 3 ? null : { type: 'state', to, seq, phase, hp }; }
  if (c === 'k' && b.length === 9) {
    const kind = b[1]; if (!ATTACKS.includes(kind)) return null;
    return { type: 'atk', to, id: dec(b[0]), kind, fat: clamp(dec(b[2]), 0, DUEL.maxFat), x: ARENA.cx + dec(b.slice(3, 5)) / 10 - 15, z: ARENA.cz + dec(b.slice(5, 7)) / 10 - 15, ry: dec(b.slice(7, 9)) * TAU / 64 };
  }
  if (c === 'r' && b.length === 4) { const res = b[1]; return ['h', 'g', 'p', 'd'].includes(res) ? { type: 'res', to, id: dec(b[0]), res, dmg: dec(b.slice(2)) } : null; }
  return null;
}

// ---------------------------------------------------------------- kết quả
/** Hết giờ: nhiều sinh lực hơn thắng, bằng nhau hòa. 'left' = đối thủ rời → mình thắng. 'noshow' = không ai tới → hòa. */
export function verdict({ myHp, oppHp, why = 'time' }) {
  if (why === 'left') return { winner: 'me', why };
  if (why === 'noshow') return { winner: 'draw', why };
  if (myHp <= 0 && oppHp <= 0) return { winner: 'draw', why: 'hp' };
  if (myHp <= 0) return { winner: 'opp', why: 'hp' };
  if (oppHp <= 0) return { winner: 'me', why: 'hp' };
  return { winner: myHp > oppHp ? 'me' : myHp < oppHp ? 'opp' : 'draw', why: 'time' };
}

// ---------------------------------------------------------------- bộ máy trận đấu (mỗi máy chạy MỘT bản cho riêng mình)
/**
 * send(obj): gửi cho đối thủ, obj = {type:'state'|'atk'|'res', ...}. receive(obj) nhận obj tương ứng (đã decode).
 * tick(dt, me={x,z,ry}) trả mảng sự kiện: count | fight | incoming{kind,from} | hit | guard | perfect | dodge | ack-hit | ack-guard | ack-miss | countered | over.
 */
export function createDuel({ send = () => {}, hpMax = DUEL.hp } = {}) {
  let t = 0, phase = 'wait', waited = 0, countLeft = DUEL.countS, fightT = 0, lastHeard = 0, heard = false, seq = 0, sendIn = 0, lastSentHp = -1, lastSentPh = -1, lastOppSeq = -1;
  let myHp = hpMax, oppHp = hpMax, windUntil = 0, guardT0 = -9, guardUntil = -9, lastKind = '', streak = 0, idN = 0, result = null;
  const cdAt = {}, incoming = [], seen = [], events = [];
  const st = { hits: 0, whiffs: 0, dodges: 0, guards: 0, perfects: 0, punished: 0, taken: 0, dealt: 0 };

  function over(why) {
    if (phase === 'over') return;
    phase = 'over'; result = { ...verdict({ myHp, oppHp, why }), myHp, oppHp, stats: { ...st } };
    events.push({ type: 'over', ...result });
  }
  function settle(inc, hit) {
    inc.done = true;
    if (!hit) { st.dodges++; send({ type: 'res', id: inc.id, res: 'd', dmg: 0 }); events.push({ type: 'dodge', kind: inc.kind }); return; }
    const m = MOVES[inc.kind], dmg = Math.max(1, Math.round(m.dmg * (1 - DUEL.fatStep * inc.fat)));
    const guarding = t >= guardT0 && t <= guardUntil;
    if (guarding && t - guardT0 <= MOVES.g.perfect) { st.perfects++; send({ type: 'res', id: inc.id, res: 'p', dmg: 0 }); events.push({ type: 'perfect', kind: inc.kind }); return; }
    const d = guarding ? Math.max(1, Math.round(dmg * (1 - MOVES.g.block))) : dmg;
    myHp = Math.max(0, myHp - d); st.taken += d; if (guarding) st.guards++;
    send({ type: 'res', id: inc.id, res: guarding ? 'g' : 'h', dmg: d });
    events.push({ type: guarding ? 'guard' : 'hit', kind: inc.kind, dmg: d });
  }
  function resolveIncoming(me) {
    for (const inc of incoming) {
      if (inc.done) continue;
      const m = MOVES[inc.kind], age = t - inc.t0, dx = Math.sin(inc.ry), dz = Math.cos(inc.ry), rx = me.x - inc.ox, rz = me.z - inc.oz;
      if (m.shape === 'melee') {
        if (age < m.wind) continue;
        const d = Math.hypot(rx, rz), ang = d < 1e-6 ? 0 : Math.abs(angDiff(Math.atan2(rx, rz), inc.ry));
        settle(inc, d <= m.range + 0.4 && ang <= 1.15);
      } else if (m.shape === 'wave') {
        if (age < m.wind) continue;
        const along = m.speed * (age - m.wind), p = rx * dx + rz * dz, lat = rx * dz - rz * dx;
        if (p >= inc.prev - 0.4 && p <= Math.min(along, m.range) + 0.4 && p >= 0 && Math.abs(lat) <= m.halfW + 0.3) settle(inc, true);
        else if (along > m.range + 1) settle(inc, false);
        inc.prev = along;
      } else {
        if (age < m.wind + m.dashS * 0.5) continue;
        settle(inc, distToSeg(me.x, me.z, inc.ox, inc.oz, inc.ox + dx * m.dash, inc.oz + dz * m.dash) <= m.halfW + 0.3);
      }
    }
    for (let i = incoming.length - 1; i >= 0; i--) if (incoming[i].done) incoming.splice(i, 1);
  }

  const api = {
    get phase() { return phase; }, get hp() { return myHp; }, get oppHp() { return oppHp; }, get hpMax() { return hpMax; }, get result() { return result; }, get stats() { return { ...st }; },
    get countLeft() { return Math.max(0, countLeft); }, get timeLeft() { return Math.max(0, DUEL.timeS - fightT); }, get heard() { return heard; },
    get guarding() { return t >= guardT0 && t <= guardUntil; }, get incomingCount() { return incoming.length; },
    cdLeft: (k) => Math.max(0, num(cdAt[k]) - t),
    tick(dt, me = { x: 0, z: 0, ry: 0 }) {
      dt = clamp(num(dt), 0, 0.25); t += dt;
      if (phase === 'wait') { waited += dt; if (heard) { phase = 'count'; countLeft = DUEL.countS; events.push({ type: 'count' }); } else if (waited > DUEL.waitS) over('noshow'); }
      else if (phase === 'count') { countLeft -= dt; if (countLeft <= 0) { phase = 'fight'; fightT = 0; lastHeard = t; events.push({ type: 'fight' }); } }
      else if (phase === 'fight') {
        fightT += dt; resolveIncoming(me);
        if (myHp <= 0 || oppHp <= 0) over('hp'); else if (fightT >= DUEL.timeS) over('time'); else if (t - lastHeard > DUEL.silenceS) over('left');
      }
      sendIn -= dt; const ph = PH.indexOf(phase);
      if (sendIn <= 0 || myHp !== lastSentHp || ph !== lastSentPh) { send({ type: 'state', seq: seq++ % 26, phase: ph, hp: myHp }); sendIn = DUEL.stateGapS; lastSentHp = myHp; lastSentPh = ph; }
      return events.splice(0);
    },
    /** Nhận gói của đối thủ. Sự kiện sinh ra được trả ở tick() kế tiếp. */
    receive(p) {
      if (!p) return;
      if (p.type === 'state') {
        if (lastOppSeq >= 0 && ((p.seq - lastOppSeq + 26) % 26) > 13) return;   // gói cũ đến muộn
        lastOppSeq = p.seq; heard = true; lastHeard = t; oppHp = clamp(num(p.hp), 0, 4095 * 4);
        if (p.phase === 3 && phase === 'fight' && oppHp > 0 && myHp > 0) over(fightT >= DUEL.timeS - 3 ? 'time' : 'left');
      } else if (p.type === 'atk') {
        heard = true; lastHeard = t;
        if (phase !== 'fight' || seen.includes(p.id + p.kind)) return;
        seen.push(p.id + p.kind); if (seen.length > 8) seen.shift();
        incoming.push({ id: p.id, kind: p.kind, fat: p.fat, ox: p.x, oz: p.z, ry: p.ry, t0: t, prev: 0, done: false });
        events.push({ type: 'incoming', kind: p.kind, from: { x: p.x, z: p.z, ry: p.ry } });
      } else if (p.type === 'res') {
        heard = true; lastHeard = t;
        if (p.res === 'h') { st.hits++; st.dealt += p.dmg; events.push({ type: 'ack-hit', dmg: p.dmg }); }
        else if (p.res === 'g') { st.hits++; st.dealt += p.dmg; events.push({ type: 'ack-guard', dmg: p.dmg }); }
        else if (p.res === 'p') { st.punished++; myHp = Math.max(0, myHp - MOVES.g.counter); st.taken += MOVES.g.counter; events.push({ type: 'countered', dmg: MOVES.g.counter }); }
        else { st.whiffs++; events.push({ type: 'ack-miss' }); }
      }
    },
    /** Dùng chiêu `kind` ('a'|'t'|'b'|'c'|'q'|'w'|'e'|'g'). me = {x,z,ry}. Trả { ok, reason?, move, fat? }. */
    cast(kind, me) {
      const m = MOVES[kind];
      if (!m) return { ok: false, reason: 'khong-co' };
      if (phase !== 'fight') return { ok: false, reason: 'chua-danh' };
      if (t < windUntil) return { ok: false, reason: 'dang-ra-don' };
      if (num(cdAt[kind]) > t) return { ok: false, reason: 'hoi-chieu', left: cdAt[kind] - t };
      cdAt[kind] = t + m.cd;
      if (kind === 'g') { guardT0 = t; guardUntil = t + m.dur; return { ok: true, move: m }; }
      streak = kind === lastKind ? streak + 1 : 0; lastKind = kind;
      const fat = Math.min(DUEL.maxFat, streak);
      windUntil = t + m.wind + (m.dashS || 0);
      send({ type: 'atk', id: idN++ % 26, kind, fat, x: me.x, z: me.z, ry: me.ry });
      return { ok: true, move: m, fat };
    },
    /** Đối thủ đã rời hẳn (zone đổi, tín hiệu bye). */
    oppLeft() { if (phase === 'fight' || phase === 'count') over('left'); },
    /** Mình chủ động rời giữa trận: coi như bỏ cuộc (đối thủ nhận bye → thắng). */
    forfeit() { if (phase === 'fight' || phase === 'count') { myHp = 0; over('hp'); } },
  };
  return api;
}
