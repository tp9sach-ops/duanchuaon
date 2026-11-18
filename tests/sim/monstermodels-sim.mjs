// Chạy js/scene/monsterModels.js + js/scene/farm.js THẬT với three giả có trạng thái: dựng đủ mọi loại quái, chạy hoạt ảnh ở mọi trạng thái, kiểm tra không lỗi/NaN; cảnh vẽ quái đặt đúng vùng báo đòn. In JSON ở dòng cuối.
import { MONSTERS } from '../../js/data/monsters.js';
import { BUILDERS, buildMonster, TYPES } from '../../js/scene/monsterModels.js';
import { buildFarm } from '../../js/scene/farm.js';
const bad = []; const nan = (o, path = 'g') => { for (const k of ['x', 'y', 'z']) for (const f of ['position', 'rotation', 'scale']) if (o[f] && !Number.isFinite(o[f][k])) bad.push(`${path}.${f}.${k}`); (o.children || []).forEach((c, i) => nan(c, `${path}/${i}`)); };
const out = { missing: Object.keys(MONSTERS).filter((id) => !BUILDERS[id]), extra: TYPES.filter((t) => !MONSTERS[t]), meshes: {}, heights: {}, fallback: buildMonster('khong-co').h > 0 };
for (const id of TYPES) {
  const mdl = buildMonster(id); out.meshes[id] = 0; (function cnt(o) { if (o.geometry) out.meshes[id]++; (o.children || []).forEach(cnt); })(mdl.g); out.heights[id] = mdl.h;
  for (const s of [{ a: 0, p: 0, mv: 0, sleep: true }, { a: 0, p: 0, mv: 1, sleep: false }, { a: 0.6, p: 0, mv: 0, sleep: false }, { a: 1, p: 0, mv: 0, sleep: false }, { a: 1, p: 0.4, mv: 0, sleep: false }, { a: 0, p: 1, mv: 0.5, sleep: false }]) for (const t of [0, 1.3, 7.7]) mdl.anim(t, s);
  nan(mdl.g, id);
}
const f = buildFarm(), mons = Object.keys(MONSTERS).slice(0, 16).map((id, i) => ({ id: i + 1, uid: 'u' + i, type: id, he: MONSTERS[id].he, x: i * 4, z: 0, ry: 0.5, oan: 10, max: 20, eng: true, elite: !!MONSTERS[id].elite, boss: !!MONSTERS[id].boss, wind: i % 2 ? 0.3 : 0, strikeT: i % 3 === 0 ? 0.2 : 0, pat: i % 2 ? 'chem' : 'lao', slam: false }));
f.update(1, { mons, target: '', stones: [] }, null); f.update(1.05, { mons: mons.map((m) => ({ ...m, x: m.x + 0.5, wind: 0.1 })), target: 'u1', stones: [] }, null);
out.farmSlots = f.group.children.length; out.bad = bad;
console.log(JSON.stringify(out));
