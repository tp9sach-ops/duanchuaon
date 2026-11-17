// Phiên 213 (mục 1 đợt 2): QUÁI BỊ TRÚNG CHIÊU — nơi DUY NHẤT xử lý "mục tiêu trúng đòn": tư thế (m.rx cho js/scene/farm.js vẽ), tiếng trúng theo chất liệu, tia lóe/sóng chấn/số sát thương.
// Logic thuần: js/world/hitReact.js (có test). Hình dựng: js/scene/chieuTrungFx.js (hitAt). Lỗi bất kỳ bị nuốt: hỏng thì game vẫn đánh được như cũ.
// Gọi: LGT.hitReact.onHit(m, { dmg, id, ax, az, dead, nho, i }) — m = đối tượng quái trong LGT.farmView.mons; i = thứ tự quái trong cùng một lần chiêu (0 = đầu tiên).
import { rxStart, amTrung, ngansachHieuUng, AM_TOI_DA } from '../world/hitReact.js';
import { tierOf } from '../world/chieuFxPlan.js';

export function initHitReact() {
  const LGT = window.LGT || (window.LGT = {});
  if (LGT.hitReact) return LGT.hitReact;
  let ctfx = null, tried = false, amAt = -1e9, amN = 0;
  const nowS = () => performance.now() / 1000;

  function fxReady() {   // nạp lười một lần khi cảnh sẵn sàng
    if (ctfx || tried || !LGT.scene) return;
    tried = true;
    import('../scene/chieuTrungFx.js').then((m) => {
      ctfx = m.createChieuTrungFx(LGT.scene, { getTier: () => tierOf(LGT.perfLevel), onShake: (c) => { try { LGT.camFeel && LGT.camFeel.rung(c); } catch (_) { /* bỏ qua */ } }, onHitStop: (g) => { try { LGT.camFeel && LGT.camFeel.khung(g); } catch (_) { /* bỏ qua */ } } });
    }).catch((e) => { ctfx = null; console.warn('[Diệu Giang Tự] Hiệu ứng trúng đòn lỗi:', e && e.message); });
  }

  function sound(m, muc, i) {
    try {
      const s = LGT.sfx; if (!s || !s.playFile) return;
      const t = performance.now(); if (t - amAt > 160) { amAt = t; amN = 0; }   // một lần chiêu = một cụm tiếng; quá AM_TOI_DA thì bỏ bớt
      if (amN >= AM_TOI_DA) return; amN++;
      const a = amTrung(m.type, muc);
      if (!s.playFile(a.file, { gain: a.gain, delay: Math.min(0.12, i * 0.03) })) s.play && s.play('da-trung');   // kho âm chưa có → cue cũ
      if (a.them && i === 0 && s.play) s.play(a.them);
    } catch (_) { /* âm thanh không được làm sập game */ }
  }

  function onHit(m, o = {}) {
    try {
      if (!m) return null;
      fxReady();
      const i = Math.max(0, Math.floor(+o.i || 0)), bs = ngansachHieuUng(i), p = LGT.world && LGT.world.pos;
      const rx = rxStart(m, { ax: o.ax != null ? o.ax : p && p.x, az: o.az != null ? o.az : p && p.z, id: o.id, now: nowS(), chiMang: o.chiMang, ketLieu: !!o.dead, nho: o.nho, luc: Math.random() });
      if (!rx) return null;
      if (!o.dead) m.rx = rx;   // quái chết thì biến mất ngay: không cần tư thế, chỉ cần tia + số
      if (bs.coAm && !o.nho) sound(m, rx.muc, i);   // đánh thường đã có tiếng riêng (cue 'thuong'/'nem-da'): không chồng thêm
      if (ctfx) ctfx.hitAt({ x: +m.x, y: 0, z: +m.z }, { ry: m.ry, co: m.boss ? 'boss' : m.elite ? 'elite' : 'thuong', dai: m.boss ? 3.2 : m.elite ? 2.4 : 1.8 }, { ax: o.ax != null ? o.ax : p && p.x, az: o.az != null ? o.az : p && p.z, id: o.id, damage: o.dmg, muc: rx.muc, ketLieu: !!o.dead, gon: !bs.dayDu, nho: o.nho });
      return rx;
    } catch (_) { return null; }
  }

  LGT.hitReact = { onHit };
  return LGT.hitReact;
}
