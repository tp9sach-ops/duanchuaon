// Chạy PHÓ BẢN (mục 4d, Phiên 235): đặt quái thật trong zone phó bản theo lượt, quái hồi sinh mạnh/to hơn mỗi lượt, 9 lượt rồi boss chính, thưởng khi chinh phục, lưu qua LGT.dungeonState.
// Logic: js/world/dungeon.js (lượt/thưởng) + js/world/dungeonRun.js (đặt quái). Quái đi vào LGT.farm.setDungeon → dùng chung đánh/chiêu/thu phục/đánh trả của bãi rừng (js/ui/farm.js, farmCombat.js).
// Đặt LGT.dungeonRun = { begin(id, mobs), onKill(mon), onDefeat(), get active }. CHƯA nhìn bằng mắt. Mọi chữ qua textContent.
import { onKill as dOnKill, leave as dLeave, describe } from '../world/dungeon.js';
import { DUNGEON_CFG, vatPhamTen } from '../data/dungeons.js';
import { newSpawner, fillWave, wakeAll, progressText } from '../world/dungeonRun.js';
import { bgTick } from '../bgTick.js';

const WAIT_FIRST = 3.0, WAIT_NEXT = 2.5, WAKE_AFTER = 2.0;   // giây: chuẩn bị trước lượt 1 / nghỉ giữa các lượt / từ lúc quái hiện tới lúc lao vào

export function initDungeonRun({ toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let sp = null, id = '', pending = null, wakeIn = 0, lastT = performance.now();
  const hud = document.createElement('div'); hud.hidden = true; hud.setAttribute('aria-live', 'polite');
  hud.style.cssText = 'position:fixed;top:max(10px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:31;pointer-events:none;padding:6px 14px;border-radius:999px;border:1px solid rgba(217,178,95,.8);background:rgba(10,12,22,.82);color:#f1dba0;font:600 14px/1.2 system-ui,sans-serif;text-align:center;white-space:nowrap;max-width:calc(100vw - 20px);overflow:hidden;text-overflow:ellipsis';
  document.body.appendChild(hud);
  const S = () => (LGT.dungeonState ? LGT.dungeonState.get() : null);
  const save = (s) => { if (LGT.dungeonState) LGT.dungeonState.set(s); };
  const paint = () => { const s = S(); if (!sp || !s || !s.run) { hud.hidden = true; return; } const d = describe(s, id); hud.textContent = `${d ? d.ten : ''} · ${pending ? 'Chuẩn bị…' : progressText(s.run, DUNGEON_CFG.waves)}`; hud.hidden = false; };

  function end() { sp = null; pending = null; wakeIn = 0; id = ''; if (LGT.farm && LGT.farm.setDungeon) LGT.farm.setDungeon(null); hud.hidden = true; }
  /** Bắt đầu phó bản `dId` với lượt 1 (`mobs` = mảng mobStats từ enter()). Gọi SAU khi đã vào zone phó bản. */
  function begin(dId, mobs) {
    if (!LGT.farm || !LGT.farm.setDungeon) return false;
    id = dId; sp = newSpawner(); fillWave(sp, id, mobs); LGT.farm.setDungeon(sp); pending = null; wakeIn = WAIT_FIRST + WAKE_AFTER; paint(); return true;
  }
  function abort(msg) { const s = S(); if (s) save(dLeave(s)); end(); if (msg) toast(msg, 4200); }

  /** Farm báo một quái phó bản đã thu phục. */
  function onKill() {
    const s = S(); if (!sp || !s || !s.run) return;
    const R = dOnKill(s, Math.random); save(R.state);
    if (R.cleared) { end(); celebrate(R); return; }
    if (R.nextWave.length) {
      const w = R.state.run.wave;
      pending = { mobs: R.nextWave, at: WAIT_NEXT };
      toast(w > DUNGEON_CFG.waves ? 'Hết 9 lượt! Boss chính sắp xuất hiện — to và mạnh hơn hẳn!' : `Lượt ${w}/${DUNGEON_CFG.waves} sắp tới: quái hồi sinh MẠNH hơn và TO hơn!`, 3200);
    }
    paint();
  }
  function celebrate(R) {
    const rw = R.reward || { hatSen: 0, manh: null, items: [] };
    if (rw.hatSen > 0 && LGT.addMerit) { try { LGT.addMerit(rw.hatSen); } catch (_) { /* bỏ qua */ } }
    const cnt = {}; for (const it of rw.items) cnt[it] = (cnt[it] || 0) + 1;
    const items = Object.keys(cnt).map((k) => `${vatPhamTen(k)} ×${cnt[k]}`).join(', ');
    toast(`CHINH PHỤC PHÓ BẢN! +${rw.hatSen} hạt sen${rw.manh ? ', 1 mảnh yêu quái' : ''}${items ? `, nhận: ${items}` : ''}. Lần sau quay lại quái sẽ mạnh hơn. Ra cổng phía nam để về.`, 9000);
  }
  /** Gục trong phó bản (hết Sinh Lực): hủy lượt, đưa về chỗ NPC. Trả true nếu đã xử lý (farmCombat không teleport về cổng chùa nữa). */
  function onDefeat() {
    if (!(LGT.dungeonZones && LGT.dungeonZones.inside)) return false;
    abort('Bạn kiệt sức, phải rời phó bản. Lượt đang chạy bị hủy (không mất đồ, không mất cấp). Nghỉ một chút rồi thử lại nhé!');
    try { LGT.dungeonZones.leave(); } catch (_) { /* bỏ qua */ }
    return true;
  }

  function tick() { const now = performance.now(), dt = Math.min(0.5, (now - lastT) / 1000); lastT = now; step(dt); }
  function step(dt) {   // tách riêng để test mô phỏng (tests/dungeonrun235.test.mjs)
    if (!sp) return;
    if (!(LGT.dungeonZones && LGT.dungeonZones.inside)) { abort('Bạn rời phó bản giữa chừng: lượt đang chạy bị hủy, không tính chinh phục.'); return; }   // ra cổng / bị đưa đi nơi khác
    if (pending) { pending.at -= dt; if (pending.at <= 0) { fillWave(sp, id, pending.mobs); pending = null; wakeIn = WAKE_AFTER; paint(); const s = S(); if (s && s.run) toast(s.run.boss ? 'BOSS CHÍNH xuất hiện!' : `Lượt ${s.run.wave}/${DUNGEON_CFG.waves} bắt đầu!`, 2200); } return; }
    if (wakeIn > 0) { wakeIn -= dt; if (wakeIn <= 0) { wakeIn = 0; wakeAll(sp); } }
  }
  bgTick.on(tick);

  LGT.dungeonRun = { begin, onKill, onDefeat, abort, step, get active() { return !!sp; } };
  return LGT.dungeonRun;
}
