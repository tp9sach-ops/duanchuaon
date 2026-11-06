// Âm thanh thiên nhiên THEO VỊ TRÍ (Phiên 32): ếch nhái, chim, dế phát ra từ những NƠI CỤ THỂ trong thế giới, không còn đều khắp mọi chỗ.
// File này THUẦN (không đụng DOM/Web Audio) nên test được bằng Node. ui.js đọc kết quả rồi chỉnh độ lớn / trái-phải / độ "đục" của từng nguồn.
//
// Cách tính cho MỖI nguồn phát:
//   độ lớn  = rolloff(khoảng cách)  ×  cổng thời điểm (ngày/đêm, mùa, mưa, trong chánh điện)
//   gần (≤ ref): to nhất · xa dần: giảm theo ~1/khoảng cách (mỗi lần xa gấp đôi nhỏ đi ~6 dB), tắt hẳn ở ≥ max
//   trái/phải = theo hướng NHÌN của camera (nguồn bên phải thì tiếng nghiêng phải); sát nguồn thì về giữa
//   xa thì tiếng "đục" hơn (bộ lọc cắt cao hạ dần) giống tiếng thật ở xa
// Tọa độ khớp js/world/layout.js, landscape.js, outside.js, placements.js (đơn vị mét, +z là hướng ra cổng). Muốn dời chỗ chim/ếch/dế: sửa bảng EMITTERS bên dưới.

import { SEASON_MIX } from './soundLogic.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/** File âm thanh (đã xử lý bằng tools/make-nature-audio.py). */
export const NATURE_FILES = { frog: 'assets/audio/ech-nhai.mp3', bird: 'assets/audio/chim-ngay.mp3', cricket: 'assets/audio/de-dem.mp3' };

/** Mức gốc từng loại (trước khi nhân âm lượng "Hiệu ứng" của người chơi). Cố ý NHỎ hơn nhạc nền: nhạc 0,55 và các file đã chỉnh cùng mức RMS −23 dBFS. */
export const NATURE_VOL = { frog: 0.25, bird: 0.22, cricket: 0.2 };   // đo trong Chromium: ếch ngay bờ ao ≈ −37 dB, nhạc nền ≈ −27 dB (nhỏ hơn nhạc ~10 dB); ptg nghe rồi chỉnh tại đây
/** Mỗi loại chỉ cho tối đa bấy nhiêu nguồn kêu cùng lúc (nguồn to nhất thắng): giữ tổng tiếng không dày lên khi đứng giữa nhiều chỗ, và đỡ tốn máy điện thoại. */
export const MAX_ACTIVE = { frog: 3, bird: 4, cricket: 4 };

/**
 * Các nguồn phát. {id, kind, x, z, ref, max}: ref = trong bán kính này tiếng to nhất (khu vực nguồn), max = ngoài khoảng này im hẳn.
 * frog: ven ao/hồ · bird: dưới tán cây, bụi tre, rừng thông, gốc đa · cricket: bãi cỏ, vườn, vỉa hè làng.
 */
export const EMITTERS = [
  // --- ếch nhái (đêm; ven nước)
  { id: 'ech-ao-tay', kind: 'frog', x: -8, z: 14, ref: 5, max: 55 }, { id: 'ech-ao-dong', kind: 'frog', x: 8, z: 14, ref: 5, max: 55 },   // ao sen trước chánh điện (POND x0 z14 r10,6)
  { id: 'ech-hoca', kind: 'frog', x: 60, z: 10, ref: 6, max: 55 },                                                                      // hồ cá (KOI)
  { id: 'ech-thac', kind: 'frog', x: 99, z: 112, ref: 5, max: 45 },                                                                    // bờ hồ chân thác
  // --- chim (ngày; tán cây)
  { id: 'chim-bode-tay', kind: 'bird', x: -24, z: 6, ref: 6, max: 70 }, { id: 'chim-bode-dong', kind: 'bird', x: 24, z: 26, ref: 6, max: 70 }, { id: 'chim-bode-sau', kind: 'bird', x: -34, z: -16, ref: 6, max: 70 },   // ba cây bồ đề
  { id: 'chim-tre-tay', kind: 'bird', x: -40, z: 12, ref: 6, max: 65 }, { id: 'chim-tre-dong', kind: 'bird', x: 42, z: 8, ref: 6, max: 65 },    // hai bụi tre
  { id: 'chim-hang-tay', kind: 'bird', x: -40.5, z: 5, ref: 8, max: 70 }, { id: 'chim-hang-dong', kind: 'bird', x: 40.5, z: 8, ref: 8, max: 70 },   // hàng cây hai bên khuôn viên
  { id: 'chim-vuon-thien', kind: 'bird', x: -62, z: -20, ref: 7, max: 60 }, { id: 'chim-vuon-thap', kind: 'bird', x: 0, z: -66, ref: 8, max: 60 },
  { id: 'chim-rung-1', kind: 'bird', x: -100, z: 82, ref: 9, max: 75 }, { id: 'chim-rung-2', kind: 'bird', x: -108, z: 98, ref: 9, max: 75 },     // rừng thông
  { id: 'chim-da-lang', kind: 'bird', x: 0, z: 131, ref: 8, max: 60 },                                                                       // gốc đa làng
  { id: 'chim-bai-thac', kind: 'bird', x: 90, z: 92, ref: 7, max: 55 },                                                                     // bãi thác
  // --- dế (đêm; bãi cỏ, vườn)
  { id: 'de-san-tay', kind: 'cricket', x: -36, z: 42, ref: 7, max: 60 }, { id: 'de-san-dong', kind: 'cricket', x: 36, z: 42, ref: 7, max: 60 },   // bãi cỏ trước Tam quan
  { id: 'de-tra-that', kind: 'cricket', x: -64, z: 20, ref: 7, max: 60 }, { id: 'de-hoca', kind: 'cricket', x: 52, z: 22, ref: 7, max: 60 },
  { id: 'de-vuon-thien', kind: 'cricket', x: -62, z: -22, ref: 7, max: 60 }, { id: 'de-vuon-thap', kind: 'cricket', x: 30, z: -62, ref: 8, max: 60 },
  { id: 'de-duong-lang-tay', kind: 'cricket', x: -13, z: 84, ref: 7, max: 60 }, { id: 'de-duong-lang-dong', kind: 'cricket', x: 13, z: 110, ref: 7, max: 60 },   // vỉa hè đường làng
  { id: 'de-rung', kind: 'cricket', x: -96, z: 88, ref: 8, max: 65 }, { id: 'de-duong-thac', kind: 'cricket', x: 54, z: 104, ref: 7, max: 60 },
];

/** Độ lớn 0..1 theo khoảng cách d: ≤ ref là 1; xa hơn giảm theo ref/d (−6 dB mỗi lần xa gấp đôi), thêm cửa sổ tắt dần để về đúng 0 tại max. */
export function rolloff(d, ref, max) {
  if (!isFinite(d)) return 0;
  if (d <= ref) return 1;
  if (d >= max) return 0;
  const t = (d - ref) / (max - ref);
  return (ref / d) * (1 - t * t);
}

/** Trái/phải −1..1 của nguồn (ex, ez) so với người nghe (p) đang nhìn theo yaw của camera (camPose: camera ở +sin(yaw), +cos(yaw) sau lưng người chơi → hướng nhìn = −(sin, cos); phải = (cos, −sin)). Sát nguồn thì về giữa. */
export function panOf(p, yaw, e) {
  const dx = e.x - p.x, dz = e.z - p.z, d = Math.hypot(dx, dz);
  if (d < 1e-6) return 0;
  const y = isFinite(yaw) ? yaw : 0;
  const side = (dx * Math.cos(y) - dz * Math.sin(y)) / d;
  return clamp(side * Math.min(1, d / Math.max(1, e.ref)), -1, 1) * 0.9;   // không bao giờ dồn hẳn một tai
}

/** Tần số cắt cao (Hz) của bộ lọc theo khoảng cách: gần = trong, xa = đục (không thấp dưới ~3,5 kHz để tiếng chim ếch vẫn nhận ra). */
export function lowpassHz(d, max) {
  const k = 1 - clamp(d / Math.max(1, max), 0, 1);
  return 3500 + 12500 * k * k;
}

// Hệ số chim theo mùa (chưa có trong SEASON_MIX): đông ít chim. Mùa lạ/không biết = 1.
const BIRD_SEASON = { xuan: 1, ha: 0.9, thu: 0.8, dong: 0.5 };

/**
 * Cổng THỜI ĐIỂM từng loại, 0..1 (chưa tính khoảng cách).
 * env: { dark: 0..1 (độ tối; LGT.night) hoặc night: bool, season, rain: 0..1, sheltered: bool }
 * chim = ban ngày (mờ dần lúc hoàng hôn, sáng lại lúc rạng đông); dế và ếch = ban đêm; mưa làm chim im, dế thưa, ếch vẫn kêu; trong chánh điện (có mái) nhỏ đi.
 */
export function kindGates(env) {
  const e = env || {};
  const dark = clamp(isFinite(e.dark) ? e.dark : e.night ? 1 : 0, 0, 1), rain = clamp(isFinite(e.rain) ? e.rain : 0, 0, 1), roof = e.sheltered ? 0.5 : 1;
  const sm = SEASON_MIX[e.season] || { insects: 1, frogs: 1 };
  const nightG = smooth(0.3, 0.7, dark), dayG = 1 - smooth(0.2, 0.55, dark);
  return {
    bird: clamp(dayG * (BIRD_SEASON[e.season] || 1) * (1 - 0.9 * rain) * roof, 0, 1),
    cricket: clamp(nightG * clamp(sm.insects, 0, 1) * (1 - 0.8 * rain) * roof, 0, 1),
    frog: clamp(nightG * clamp(sm.frogs / 1.3, 0, 1) * (1 + 0.3 * rain) * roof, 0, 1),
  };
}

// Không có vị trí (không có cảnh 3D, ?rail=1): coi như người nghe đứng ở sân chùa.
const FALLBACK_POS = { x: 0, z: 20 };

/**
 * Trạng thái mọi nguồn phát tại thời điểm này: mảng {id, kind, gain 0..1 (đã gồm cổng thời điểm), pan, cutoff, dist} cho các nguồn ĐƯỢC PHÉP kêu
 * (mỗi loại chỉ giữ MAX_ACTIVE nguồn to nhất, và chỉ khi gain > minGain). Nguồn không có trong mảng thì ui.js tắt hẳn.
 * env: { p: {x,z}|null, yaw, dark|night, season, rain, sheltered }.
 */
export function emitterStates(env, { minGain = 0.012, emitters = EMITTERS } = {}) {
  const e = env || {}, p = e.p && isFinite(e.p.x) && isFinite(e.p.z) ? e.p : FALLBACK_POS, gates = kindGates(e), byKind = {};
  for (const m of emitters) {
    const gate = gates[m.kind];
    if (!(gate > 0)) continue;
    const d = Math.hypot(m.x - p.x, m.z - p.z), gain = clamp(rolloff(d, m.ref, m.max) * gate, 0, 1);
    if (gain < minGain) continue;
    (byKind[m.kind] = byKind[m.kind] || []).push({ id: m.id, kind: m.kind, gain, pan: panOf(p, e.yaw, m), cutoff: lowpassHz(d, m.max), dist: d });
  }
  return Object.keys(byKind).flatMap((k) => byKind[k].sort((a, b) => b.gain - a.gain).slice(0, MAX_ACTIVE[k] || 3));
}
