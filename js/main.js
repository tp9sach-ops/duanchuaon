// Điểm khởi động: preloader → font → cảnh 3D → UI. Có fallback khi không có WebGL.
import { initReveal, initNav, initSound } from './ui.js';
import { cvs } from './util.js';
import { initToday } from './ui/today.js';
import { initProfile } from './ui/profile.js';
import { initCharts } from './ui/charts.js';
import { initForeground } from './fg.js';
import { initFortune } from './ui/fortune.js';
import { initBatu } from './ui/batu.js';
import { initSummary } from './ui/summary.js';
import { initTemple } from './ui/temple.js';
import { initTuvi } from './ui/tuvi.js';
import { initPlanets } from './ui/planets.js';
import { initVision } from './ui/vision.js';
import { initStage } from './ui/stage.js';
import { initHud } from './ui/hud.js';
import { initRoom } from './net/room.js';
import { initZones } from './world/zoneRuntime.js';
import { isNpcSpot } from './world/spots.js';
import { isDonateSpot } from './world/donate.js';
import { initWind } from './scene/wind.js';
import { initViewport } from './ui/viewport.js';
import { initAccount } from './net/account.js';

const pct = document.getElementById('pre-pct'), fill = document.getElementById('pre-fill'), pre = document.getElementById('pre');
const setProgress = (v) => { const p = Math.round(v * 100); pct.textContent = p; fill.style.right = (100 - p) + '%'; };
const hidePre = () => { pre.classList.add('done'); document.body.classList.remove('is-locked'); };
document.body.classList.add('is-locked');
try { initViewport(); } catch (e) { console.warn('[Diệu Giang Tự] Khung nhìn lỗi:', e && e.message); }   // Phiên 31: đo khung nhìn thật cho điện thoại/Z Fold/thanh công cụ dưới
// Âm thanh: thử phát nhạc nền NGAY từ lúc trang khởi động (trước cả khi cảnh 3D nạp xong). Bị chặn thì hiện lời mời bật âm thanh, phát ở lần chạm đầu tiên.
try { initSound(); } catch (e) { console.warn('[Diệu Giang Tự] Âm thanh lỗi:', e && e.message); }

// Tài khoản nhân vật (Phiên 53): máy đã đăng nhập thì kéo bản lưu mới nhất (do máy khác lưu) VỀ TRƯỚC khi các phần của game đọc localStorage.
// Chạy song song với việc nạp font/cảnh; boot() chờ tối đa vài giây. Lỗi/mạng chậm thì chơi tiếp bằng dữ liệu trên máy.
let acct = { ready: Promise.resolve(), attach() {} };
try { acct = initAccount(); } catch (e) { console.warn('[Diệu Giang Tự] Tài khoản lỗi:', e && e.message); }

// Hạt nhiễu cho lớp grain (sinh bằng canvas, không cần ảnh)
(function grain() {
  const c = cvs(120, 120), x = c.getContext('2d'), im = x.createImageData(120, 120);
  for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  x.putImageData(im, 0, 0);
  document.getElementById('grain').style.backgroundImage = `url(${c.toDataURL()})`;
})();

function initAll(rail) {
  initReveal(); initNav(); initSound(); initProfile(); initToday(); initCharts(); initFortune(); initBatu(); initTuvi(); initPlanets(); initVision(); initSummary(); initTemple();
  return initStage(rail, initForeground());
}

function fallback(reason) {
  console.warn('[Diệu Giang Tự] Không dựng được cảnh 3D:', reason);
  document.documentElement.classList.add('no-webgl');
  initAll({}); hidePre();      // không có camera: bảng nội dung vẫn mở được bằng menu
}

let stage = null;
async function boot() {
  setProgress(0.05);
  // Đợi font chữ Việt (serif) để canvas hoành phi vẽ đúng (tối đa 2.5s)
  try {
    await Promise.race([
      Promise.all([document.fonts.load('600 100px "Cormorant Garamond"', 'DIỆU GIANG TỰ'), document.fonts.ready]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch (_) { /* tiếp tục với font dự phòng */ }
  setProgress(0.1);
  await Promise.race([acct.ready, new Promise((r) => setTimeout(r, 4500))]);   // bản lưu từ tài khoản phải xuống trước khi dựng cảnh/HUD đọc dữ liệu

  try { const { loadChibi } = await import('./scene/chibiBody.js'); await Promise.race([loadChibi(), new Promise((r) => setTimeout(r, 4000))]); } catch (e) { console.warn('[Diệu Giang Tự] Mô hình nhân vật lỗi, dùng nhân vật dựng bằng khối:', e && e.message); }   // Phiên 99: thân nhân vật từ GLB (nạp trước khi dựng cảnh để mọi nhân vật/NPC dùng chung); chậm/lỗi thì giữ thân dựng bằng khối
  let created;
  try {
    const { createScene } = await import('./scene/index.js');
    created = createScene(document.getElementById('gl'), {
      onProgress: (v) => { setProgress(0.1 + v * 0.9); if (v >= 1) setTimeout(hidePre, 350); },
      onPick: (id) => stage && stage.go(id),          // bấm điểm sáng/vật 3D: đi tới rồi mới mở
      onArrive: (id) => (isDonateSpot(id) ? window.LGT.onDonate && window.LGT.onDonate() : isNpcSpot(id) ? window.LGT.onNpc && window.LGT.onNpc(id) : stage && stage.open(id)),      // nhân vật tới nơi: mở bảng của chương, hoặc NPC nói chuyện
    });
  } catch (e) { return fallback(e && e.message); }

  window.LGT = window.LGT || {};
  try { acct.attach(window.LGT); } catch (e) { console.warn('[Diệu Giang Tự] Gắn tài khoản lỗi:', e && e.message); }   // LGT.account (chỉ gắn SAU khi cảnh dựng xong: scene/index.js tự tạo LGT mặc định)
  window.LGT.scene = created.scene;   // Phiên 87: zone dựng/dỡ cảnh riêng
  window.LGT.getPos = () => (created.world ? created.world.pos : null);   // vị trí người chơi {x, z}: ui.js dùng để chỉnh to/nhỏ tiếng thác và chuông

  stage = initAll(created.rail);
  try { initWind(created.scene); } catch (e) { console.warn('[Diệu Giang Tự] Gió lỗi:', e && e.message); }   // cây lung lay; lỗi thì cây đứng yên
  try { initHud(); } catch (e) { console.warn('[Diệu Giang Tự] HUD lỗi:', e && e.message); }   // màn vào cửa + HUD; lỗi thì giữ giao diện cũ
  try { initZones(localStorage, () => (window.LGT && window.LGT.world ? window.LGT.world.pos : null)); } catch (e) { console.warn('[Diệu Giang Tự] Khu vực lỗi:', e && e.message); }
  try { import('./ui/zoneGate.js').then((m) => m.initZoneGate({ toast: (t, ms) => window.LGT.toast && window.LGT.toast(t, ms) })).catch((e) => console.warn('[Diệu Giang Tự] Cổng zone lỗi:', e && e.message)); } catch (_) { /* bỏ qua */ }
  try { initRoom(); } catch (e) { console.warn('[Diệu Giang Tự] Đa người lỗi:', e && e.message); }   // thấy người khác trong chùa; lỗi thì vẫn chơi một mình
  // Phòng khi onProgress(1) không tới (tab nền): vẫn mở trang sau 6s
  setTimeout(hidePre, 6000);

  // Mất context WebGL (hay gặp trên điện thoại): chuyển sang fallback thay vì màn hình đen
  document.getElementById('gl').addEventListener('webglcontextlost', (ev) => {
    ev.preventDefault(); document.documentElement.classList.add('no-webgl'); // UI đã khởi tạo rồi, chỉ đổi nền
  });
}
boot();

// PWA: đăng ký service worker (bỏ qua khi chạy file:// hoặc trình duyệt không hỗ trợ)
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
