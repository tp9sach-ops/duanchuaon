// Logic thuần của âm thanh nền (không đụng DOM/Web Audio nên test được bằng Node).
// ui.js dùng file này để: đọc/lưu lựa chọn, thử autoplay trung thực, tính độ lớn từng lớp âm thanh theo môi trường.

export const V_MAX = 1.5, V_DEF = 0.75, V_STEP = 0.15;
export const KEYS = { on: 'lgt.sound', music: 'lgt.vol', sfx: 'lgt.vfx' };   // lgt.vol là khóa cũ = âm lượng nhạc nền (giữ để không mất lựa chọn đã lưu)
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Đọc lựa chọn đã lưu. on: true/false = người chơi đã chọn; null = chưa chọn (mặc định BẬT).
export function loadSettings(store) {
  const get = (k) => { try { return store.getItem(k); } catch (_) { return null; } };
  const num = (k) => { const n = parseFloat(get(k)); return isFinite(n) ? clamp(n, 0, V_MAX) : V_DEF; };
  const o = get(KEYS.on);
  return { on: o === '1' ? true : o === '0' ? false : null, music: num(KEYS.music), sfx: num(KEYS.sfx) };
}
export function saveSetting(store, key, value) { try { store.setItem(KEYS[key], typeof value === 'boolean' ? (value ? '1' : '0') : String(value)); } catch (_) { /* bỏ qua */ } }
export const wantsSound = (s) => s.on !== false;                     // mặc định bật; chỉ tắt khi người chơi đã tự tắt

const withTimeout = (p, ms) => Promise.race([Promise.resolve(p), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

// Thử phát nhạc thật. Chỉ trả playing:true khi AudioContext ĐANG CHẠY và phần tử nhạc ĐANG PHÁT (nhạc đi qua AudioContext nên một trong hai bị chặn là im lặng).
// Trình duyệt chặn autoplay: ctx.resume() treo mãi (nên có timeout) và el.play() bị từ chối -> trả playing:false, reason:'blocked' để giao diện hiện lời mời.
export async function tryAutoplay(ctx, el, timeoutMs = 1200) {
  try { if (ctx.state !== 'running') await withTimeout(ctx.resume(), timeoutMs); } catch (_) { /* bị chặn hoặc quá lâu */ }
  let media = false, err = '';
  try { await withTimeout(el.play(), timeoutMs); media = !el.paused; } catch (e) { err = (e && e.name) || String(e); }
  const running = ctx.state === 'running';
  const playing = running && media;
  return { playing, running, media, reason: playing ? 'ok' : (err === 'NotAllowedError' || !running ? 'blocked' : 'error') };
}

// Vị trí cố định (mét) dùng để tính độ lớn theo khoảng cách.
export const SPOTS = { water: { x: 112, z: 104 }, bell: { x: 28, z: -4 }, hall: { x: 0, z: -30 }, forest: { x: -104, z: 90 } };   // forest = bãi rừng thông (js/world/outside.js: bai-rung)
// Hệ số theo mùa (Phiên 31): côn trùng đêm, ếch, gió. Mùa lạ/không biết = 1 (như cũ). Mùa hạ có ve (lớp cicada riêng).
export const SEASON_MIX = { xuan: { insects: 0.8, frogs: 1.3, wind: 1, cicada: 0 }, ha: { insects: 1.2, frogs: 1.1, wind: 0.9, cicada: 1 }, thu: { insects: 1, frogs: 0.5, wind: 1.15, cicada: 0 }, dong: { insects: 0.12, frogs: 0, wind: 1.35, cicada: 0 } };
const dist = (p, a) => Math.hypot(p.x - a.x, p.z - a.z);

// Độ lớn (0..1) từng lớp âm thanh theo môi trường. env: { p: {x,z}|null (vị trí người chơi), night: bool }.
// Thời tiết (Phiên 25): env.rain = cường độ mưa 0..1 (effects().rain), env.wind = gió 0..1, env.sheltered = đang trong chánh điện (có mái, tiếng mưa nhỏ lại).
// Mưa: lớp `rain` (tiếng mưa rơi); gió mạnh lên; côn trùng thưa đi, ếch vẫn kêu; chuông/mõ nhỏ bớt vì tiếng mưa lấn.
export function ambientMix(env) {
  const p = env && env.p && isFinite(env.p.x) && isFinite(env.p.z) ? env.p : null, night = !!(env && env.night);
  const rain = clamp(env && isFinite(env.rain) ? env.rain : 0, 0, 1), wx = clamp(env && isFinite(env.wind) ? env.wind : 0, 0, 1), roof = env && env.sheltered ? 0.4 : 1;
  const rainG = rain > 0.01 ? clamp(0.12 + 0.88 * rain, 0, 1) * roof : 0;      // mưa nhỏ vẫn nghe được; mưa lớn ầm ào
  const sm = SEASON_MIX[env && env.season] || { insects: 1, frogs: 1, wind: 1, cicada: 0 };
  const duck = 1 - 0.35 * rain;                                                // mưa lấn: chuông, mõ nhỏ bớt
  if (!p) return { water: 0.3, bell: 0.7 * duck, wind: clamp((0.3 + 0.6 * wx) * sm.wind, 0, 1), insects: night ? clamp(0.3 * sm.insects, 0, 1) * (1 - 0.8 * rain) : 0, frogs: night ? clamp(0.25 * sm.frogs, 0, 1) : 0, mo: 0.2 * duck, rain: rainG, cicada: night ? 0 : 0.4 * sm.cicada * (1 - rain) };   // không biết vị trí (không có cảnh 3D)
  const outside = clamp((p.z - 40) / 40, 0, 1);                       // càng ra xa cổng chùa (làng, rừng, thác) càng "hoang dã"
  const forest = clamp(1 - (dist(p, SPOTS.forest) - 12) / 50, 0, 1);   // trong/gần rừng thông: lá xào xạc, nhiều ve
  const nearWater = clamp(1 - (dist(p, SPOTS.water) - 6) / 60, 0, 1); // gần thác/hồ
  return {
    water: Math.pow(clamp(1 - (dist(p, SPOTS.water) - 6) / 84, 0, 1), 2),
    bell: Math.max(0.08, Math.pow(clamp(1 - (dist(p, SPOTS.bell) - 10) / 140, 0, 1), 1.5)) * duck,
    wind: clamp(((0.25 + 0.5 * outside) * (1 + 0.8 * wx) + 0.2 * wx + 0.15 * forest) * sm.wind, 0, 1) * (env && env.sheltered ? 0.6 : 1),
    insects: night ? clamp((0.3 + 0.7 * outside) * sm.insects, 0, 1) * (1 - 0.8 * rain) : 0,
    frogs: night ? clamp((0.15 + 0.85 * nearWater) * sm.frogs, 0, 1) : 0,
    cicada: night ? 0 : clamp((0.2 + 0.8 * Math.max(0.6 * outside, forest)) * sm.cicada, 0, 1) * (1 - rain) * (env && env.sheltered ? 0.5 : 1),
    mo: Math.pow(clamp(1 - (dist(p, SPOTS.hall) - 8) / 40, 0, 1), 1.5) * duck,   // tiếng mõ chỉ nghe rõ gần chánh điện
    rain: rainG,
  };
}

// Tiếng sấm (Phiên 25): vol 0..1 từ weather (xa/gần). Trả thông số để ui.js dựng: độ lớn, độ dài tiếng ầm, tần số cắt của bộ lọc (sấm xa trầm hơn, ngắn đục hơn).
export function thunderParams(vol) {
  const v = clamp(isFinite(vol) ? vol : 0.5, 0, 1);
  return { gain: 0.25 + 0.75 * v, dur: 2.2 + 3.2 * v, cutoff: 260 + 900 * v, crack: v > 0.7 };   // sấm gần (v cao): có tiếng nổ "rắc" đầu và ầm dài
}

// Khoảng chờ (giây) tới lần kêu kế tiếp của một lớp âm thanh ngẫu nhiên; rng() trong [0,1). Càng "đông" (gain lớn) càng kêu dày.
export function nextDelay(kind, gain, rng = Math.random) {
  const base = { frogs: [1.5, 5], mo: [60, 120], bell: [40, 80] }[kind] || [5, 10];
  const crowd = 1 / (0.5 + clamp(gain, 0, 1));                          // gain 1 -> x0,67; gain 0 -> x2
  return (base[0] + rng() * (base[1] - base[0])) * crowd;
}
