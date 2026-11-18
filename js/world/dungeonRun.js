// Phó bản (mục 4d, Phiên 235): LOGIC THUẦN đặt quái thật trong zone phó bản (không DOM, không three.js, không đồng hồ, không Math.random).
// Dùng: js/world/dungeon.js (lượt, hệ số, thưởng) + js/world/zoneDungeon.js (chỗ đặt quái). Nối giao diện: js/ui/dungeonRun.js. Test: tests/dungeonrun235.test.mjs.
// Quái phó bản có hình dạng giống quái bãi rừng ({ id, type, ten, lv, he, elite, boss, x, z, ry, oan, max, dmgBy }) cộng thêm:
//   size (kích thước nhân thêm, to dần theo lượt/số lần chinh phục), pbCong (Công riêng), pbXp (hệ số kinh nghiệm), zone: 'pb', aggro (false = đứng chờ, true = lao vào người chơi).
import { MONSTERS } from '../data/monsters.js';
import { mobSpot } from './zoneDungeon.js';

export const PB_ZONE = 'pb';
const r3 = (x) => Math.round(x * 1000) / 1000;

/** Bộ sinh quái rỗng cho phó bản (cùng dạng spawn.js nhưng KHÔNG hồi sinh tự động: lượt kế do dungeon.onKill quyết định). */
export const newSpawner = () => ({ zone: PB_ZONE, nextId: 1, mons: [], timers: [], night: false });

/** Một con quái từ mobStats (dungeon.js). `i`/`n`: thứ tự và tổng số trong lượt (để chia chỗ đứng). Loại lạ / phó bản lạ → null. */
export function monFrom(dungeonId, stat, i, n, id) {
  const T = stat && MONSTERS[stat.type], spot = mobSpot(dungeonId, i, n); if (!T || !spot) return null;
  const max = Math.max(1, stat.oanKhiMax | 0);
  return { id, type: stat.type, ten: T.ten, lv: stat.lv, he: stat.he, elite: !!stat.elite, boss: !!stat.boss, x: spot.x, z: spot.z, ry: 0,   // ry 0 = nhìn về +z (phía nam, chỗ người chơi vào)
    oan: max, max, dmgBy: {}, zone: PB_ZONE, size: stat.size, pbCong: stat.cong, pbXp: r3(Math.max(1, stat.size)), aggro: false };
}

/** Đặt cả lượt vào `sp` (thay mọi quái cũ). `mobs` = mảng mobStats (waveMobs). Trả mảng quái mới. */
export function fillWave(sp, dungeonId, mobs) {
  sp.mons = []; sp.timers = [];
  const list = Array.isArray(mobs) ? mobs : [];
  list.forEach((st, i) => { const m = monFrom(dungeonId, st, i, list.length, sp.nextId); if (m) { sp.nextId++; sp.mons.push(m); } });
  return sp.mons;
}

/** Cho cả lượt lao vào người chơi (sau thời gian chuẩn bị). */
export const wakeAll = (sp) => { for (const m of (sp ? sp.mons : [])) m.aggro = true; return sp ? sp.mons.length : 0; };

/** Chữ hiển thị tiến độ: 'Lượt 3/9 · còn 4 quái' hoặc 'Boss chính · còn 1'. `run` = state.run. */
export function progressText(run, waves = 9) {
  if (!run) return '';
  return run.boss ? `Boss chính · còn ${run.alive}` : `Lượt ${run.wave}/${waves} · còn ${run.alive} quái`;
}
