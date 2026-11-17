// SÁT THƯƠNG RỒNG HỒNG của Gậy như ý (Phiên 227): LOGIC THUẦN (không DOM / three.js), có test: tests/dragonfx227.test.mjs. Hình khối + vẽ: js/ui/dragonFx.js; nối với quái: js/ui/dragonHit.js.
// Đầu rồng bay tới sát quái (mép thân cách đầu ≤ reach) thì quái dính đòn; mỗi quái dính tối đa `perMonster` lần trong đời một con rồng, hai lần cách nhau ≥ `cooldown` giây.
// Mọi con số là QUY ƯỚC TẠM (tam: true), chờ ptg chơi thử rồi chỉnh.
export const DHIT = Object.freeze({
  tam: true,
  dmgMul: 0.9,        // sát thương mỗi lần dính = dmgMul × sát thương đánh thường gốc (stoneDamage)
  reach: 1.2,         // m: tầm chạm, tính từ mép thân quái tới đầu rồng (mặt phẳng ngang)
  cooldown: 0.6,      // giây giữa hai lần dính cùng một quái
  perMonster: 2,      // số lần dính tối đa một quái trong đời một con rồng
  maxPerFrame: 3,     // số quái tối đa dính trong cùng một khung hình
});

/**
 * Các quái bị đầu rồng chạm lúc giây t. head {x,z}; mons: danh sách quái {uid,x,z,oan}; bodyOf(m) = bán kính thân;
 * rec: Map uid → { n, last } của RIÊNG con rồng này (hàm tự cập nhật). Bóng quái (ghost) và quái đã chết bị bỏ. Trả gần nhất trước.
 */
export function dragonHits(head, mons, bodyOf, rec, t, reach = DHIT.reach) {
  const out = [];
  if (!head || !Number.isFinite(+head.x) || !Number.isFinite(+head.z) || !rec) return out;
  for (const m of mons || []) {
    if (!m || m.ghost || !Number.isFinite(+m.x) || !Number.isFinite(+m.z) || !(m.oan > 0)) continue;
    const d = Math.hypot(m.x - head.x, m.z - head.z) - (bodyOf ? bodyOf(m) : 0);
    if (d > reach) continue;
    const e = rec.get(m.uid) || { n: 0, last: -1e9 };
    if (e.n >= DHIT.perMonster || t - e.last < DHIT.cooldown) continue;
    out.push({ m, d });
  }
  out.sort((a, b) => a.d - b.d);
  const pick = out.slice(0, DHIT.maxPerFrame).map((o) => o.m);
  for (const m of pick) { const e = rec.get(m.uid) || { n: 0, last: -1e9 }; rec.set(m.uid, { n: e.n + 1, last: t }); }
  return pick;
}
