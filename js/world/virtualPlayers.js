// Người chơi ảo — Phiên 235, BƯỚC 1 (logic thuần, không đụng three.js/DOM nên kiểm thử được bằng Node).
// Yêu cầu ptg: người chơi ảo như người thật; số lượng theo lệnh /nguoichoiao (mỗi lần gõ thêm 1 người);
// tên do hệ thống tự đặt ngẫu nhiên, tự nhiên như người thật (không lộ là máy); tin nhắn mở đầu bằng "/" chỉ người gõ thấy.
// Bước 1 làm: lệnh + tên + dáng + đi lại + lời chào. Các bước sau (nhiệm vụ, câu cá, đánh quái, tỷ thí…) nối vào cùng `createVirtual`.
import { AVATAR_COLORS } from './avatarLogic.js';

export const VP_CFG = {
  max: 12,                 // TẠM: tối đa 12 người ảo cùng lúc (giữ máy yếu không giật; phòng mạng tối đa 30 người)
  home: { x: 0, z: 50, r: 11 },   // vùng dạo ở sân trước tam quan, cách tường cổng (z = 34) vài mét (tạm; bước sau cho đi khắp nơi theo việc đang làm)
  speed: [1.5, 2.5],       // m/s khi đi bộ
  idleMs: [2500, 9000],    // đứng nghỉ giữa hai lần đi
  sayGapMs: [45000, 140000],
};

// Họ / đệm / tên phổ biến ở Việt Nam (trộn nam, nữ, trung tính để tên không có "khuôn" dễ nhận ra).
const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Lâm', 'Mai', 'Trương'];
const DEM_NU = ['Thị', 'Ngọc', 'Thùy', 'Kim', 'Bảo', 'Thanh', 'Minh', 'Diệu', 'Hồng', 'Mỹ', 'Phương', 'Quỳnh'];
const DEM_NAM = ['Văn', 'Minh', 'Quốc', 'Hữu', 'Đức', 'Thành', 'Hoàng', 'Gia', 'Anh', 'Tấn', 'Trọng', 'Công'];
const TEN_NU = ['Lan', 'Hương', 'Linh', 'Trang', 'Thảo', 'Ngân', 'Vy', 'Nhi', 'Hạnh', 'Mai', 'Hà', 'Yến', 'Trâm', 'Phượng', 'Ly', 'Thu', 'Châu', 'Oanh', 'Diễm', 'Tiên', 'Loan', 'Nguyệt'];
const TEN_NAM = ['Tuấn', 'Hùng', 'Long', 'Nam', 'Phúc', 'Khoa', 'Thịnh', 'Dũng', 'Hiếu', 'Sơn', 'Tài', 'Bình', 'Khang', 'Quân', 'Huy', 'Đạt', 'Tâm', 'Lộc', 'Nghĩa', 'Kiệt', 'Thiện', 'Trí', 'Giang', 'Vinh'];
const TEN_CHUNG = ['An', 'Bảo', 'Minh', 'Phong', 'Hân', 'Khánh', 'Duy', 'Anh', 'Thiên', 'Nhân'];
// Biệt danh kiểu người dùng mạng xã hội hay đặt (có chữ thường, có số năm sinh…); chỉ chiếm phần nhỏ.
const BIET_DANH = ['Bin', 'Tí', 'Su', 'Mít', 'Cún', 'Bống', 'Na', 'Bơ', 'Sóc', 'Heo', 'Cà Phê', 'Bánh Bao', 'Hạt Dẻ', 'Mây', 'Gió'];
const TIEN_TO = ['Chú', 'Anh', 'Chị', 'Cô', 'Bác', 'Em'];

const pick = (rng, a) => a[Math.min(a.length - 1, Math.floor(rng() * a.length))];
const between = (rng, [lo, hi]) => lo + (hi - lo) * rng();
const stripTone = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

/** Sinh MỘT cái tên (≤ 20 ký tự, hợp avatarLogic.cleanName). `used` (Set tên đã có, không phân biệt hoa thường) để không trùng. rng() ∈ [0,1). */
export function makeName(rng = Math.random, used = new Set()) {
  for (let tries = 0; tries < 40; tries++) {
    const nu = rng() < 0.5, k = rng();
    let n;
    if (k < 0.5) n = `${pick(rng, HO)} ${pick(rng, nu ? DEM_NU : DEM_NAM)} ${pick(rng, nu ? TEN_NU : TEN_NAM)}`;          // họ + đệm + tên
    else if (k < 0.68) n = `${pick(rng, HO)} ${pick(rng, nu ? TEN_NU : TEN_NAM)}`;                                          // họ + tên
    else if (k < 0.8) n = `${pick(rng, nu ? DEM_NU : DEM_NAM)} ${pick(rng, nu ? TEN_NU : TEN_NAM)}`;                       // đệm + tên (không họ), ví dụ "Minh Anh"
    else if (k < 0.88) n = pick(rng, nu ? TEN_NU : TEN_NAM);                                                                // chỉ tên
    else if (k < 0.93) n = `${pick(rng, TIEN_TO)} ${pick(rng, nu ? TEN_NU : TEN_NAM)}`;                                      // "Chị Lan", "Chú Tuấn"
    else if (k < 0.97) n = `${pick(rng, BIET_DANH)}${rng() < 0.5 ? ' ' + (1985 + Math.floor(rng() * 20)) : ''}`;            // biệt danh (có thể kèm năm sinh)
    else { const t = stripTone(`${pick(rng, nu ? TEN_NU : TEN_NAM)}${pick(rng, TEN_CHUNG)}`).toLowerCase(); n = t + (rng() < 0.6 ? String(10 + Math.floor(rng() * 89)) : ''); }   // kiểu tên đăng nhập không dấu
    n = Array.from(n).slice(0, 20).join('').trim();
    if (n && !used.has(n.toLowerCase())) return n;
  }
  return `Khách ${100 + Math.floor(rng() * 900)}`;     // hết cách (cực hiếm): vẫn không trùng vì kèm số
}

/** Chọn áo + kiểu đầu ngẫu nhiên (chỉ áo trong bảng chọn của người chơi). Tóc búi thường hơn với tên nữ-ish không cần biết: chia đều 50/50. */
export function pickLook(rng = Math.random) {
  const col = pick(rng, AVATAR_COLORS);
  return { color: col.id, hair: rng() < 0.5 ? 'troc' : 'bui' };
}

/** Lời chào/lời nói ngắn tự nhiên (chỉ gồm chữ, ≤ 80 ký tự, không link/số điện thoại). */
export const CHAT_LINES = [
  'Nam mô A Di Đà Phật', 'A Di Đà Phật 🙏', 'Chào mọi người nha', 'Hôm nay chùa vắng ghê', 'Ai đi câu cá không?', 'Mình mới vào, chỉ mình với',
  'Đi bộ cho khỏe 😄', 'Trời đẹp quá', 'Có ai rủ đánh quái không', 'Chúc mọi người bình an', 'Mình đi thắp nhang đây', 'Tới giờ thiền rồi nè', 'Hello cả nhà',
  'Ủa mọi người ở đâu hết rồi', 'Cây bồ đề to ghê', 'Ai biết chỗ mua đất không ạ',
];
export const pickLine = (rng = Math.random) => pick(rng, CHAT_LINES);

/**
 * Tách lệnh gạch chéo. Trả null nếu tin KHÔNG bắt đầu bằng "/" (tin thường, gửi lên phòng như cũ).
 * Ngược lại trả { cmd, args } với cmd viết thường, bỏ dấu cách thừa — tin dạng này LUÔN chỉ người gõ thấy, không gửi lên mạng.
 */
export function parseSlash(text) {
  const s = String(text == null ? '' : text).trim();
  if (!s.startsWith('/')) return null;
  const parts = s.slice(1).trim().split(/\s+/).filter(Boolean);
  return { cmd: (parts[0] || '').toLowerCase(), args: parts.slice(1) };
}

/** Tin có phải lệnh "/..." không (dùng để chặn gửi lên mạng ở mọi đường gửi chữ). */
export const isSlash = (text) => String(text == null ? '' : text).trimStart().startsWith('/');

/**
 * Bộ não đi lại của một người ảo (thuần). Đứng nghỉ ngẫu nhiên → chọn điểm đến trong vùng `home` → đi tới → nghỉ…
 * blocked(x, z) → true nếu điểm bị vật cản (cây/đá/nhà…): gặp thì đổi hướng. Mỗi lần step trả {x, z, ry, state:'idle'|'walk', speed, say?}.
 */
export function createWanderer({ rng = Math.random, x, z, home = VP_CFG.home, blocked = () => false, speed = VP_CFG.speed } = {}) {
  const S = { x, z, ry: rng() * Math.PI * 2, tx: x, tz: z, walking: false, wait: between(rng, [200, 3000]) / 1000, v: between(rng, speed), sayIn: between(rng, VP_CFG.sayGapMs) / 1000, stuck: 0 };
  const inHome = (px, pz) => Math.hypot(px - home.x, pz - home.z) <= home.r;
  const choose = () => {
    for (let i = 0; i < 12; i++) {
      const a = rng() * Math.PI * 2, d = 3 + rng() * 11, px = S.x + Math.cos(a) * d, pz = S.z + Math.sin(a) * d;
      if (inHome(px, pz) && !blocked(px, pz)) { S.tx = px; S.tz = pz; S.walking = true; S.v = between(rng, speed); S.stuck = 0; return; }
    }
    S.wait = 1.5;   // không tìm được chỗ: đứng thêm rồi thử lại
  };
  return {
    get state() { return S; },
    step(dt) {
      dt = Math.max(0, Math.min(0.1, dt)); let say = '';
      S.sayIn -= dt; if (S.sayIn <= 0) { say = pickLine(rng); S.sayIn = between(rng, VP_CFG.sayGapMs) / 1000; }
      if (!S.walking) {
        S.wait -= dt; if (S.wait <= 0) choose();
        return { x: S.x, z: S.z, ry: S.ry, state: 'idle', speed: 0, say };
      }
      const dx = S.tx - S.x, dz = S.tz - S.z, d = Math.hypot(dx, dz);
      if (d < 0.25) { S.walking = false; S.wait = between(rng, VP_CFG.idleMs) / 1000; return { x: S.x, z: S.z, ry: S.ry, state: 'idle', speed: 0, say }; }
      const step = Math.min(d, S.v * dt), nx = S.x + dx / d * step, nz = S.z + dz / d * step;
      if (blocked(nx, nz)) { S.stuck += dt; if (S.stuck > 0.4) { S.walking = false; S.wait = 0.3; } return { x: S.x, z: S.z, ry: S.ry, state: 'idle', speed: 0, say }; }
      S.x = nx; S.z = nz; S.ry = Math.atan2(dx, dz);   // ry = 0 nhìn về +z (cùng quy ước layout.SPAWN)
      return { x: S.x, z: S.z, ry: S.ry, state: 'walk', speed: step / (dt || 1), say };
    },
  };
}

/**
 * Bộ quản lý danh sách người ảo (thuần, không có three.js): add() thêm đúng 1 người (tối đa VP_CFG.max).
 * Mỗi người có id riêng (bắt đầu "ao-" để bước sau phân biệt khi đồng bộ), tên không trùng, dáng, bộ đi lại.
 */
export function createVirtual({ rng = Math.random, blocked = () => false, cfg = VP_CFG } = {}) {
  const list = [], used = new Set();
  let seq = 0;
  return {
    get list() { return list; },
    get count() { return list.length; },
    add(extraUsed) {
      if (list.length >= cfg.max) return null;
      if (extraUsed) for (const n of extraUsed) used.add(String(n).toLowerCase());
      const name = makeName(rng, used); used.add(name.toLowerCase());
      const look = pickLook(rng), a = rng() * Math.PI * 2, r = Math.sqrt(rng()) * cfg.home.r * 0.6;
      let x = cfg.home.x + Math.cos(a) * r, z = cfg.home.z + Math.sin(a) * r;
      for (let i = 0; i < 10 && blocked(x, z); i++) { x = cfg.home.x + (rng() - 0.5) * cfg.home.r; z = cfg.home.z + (rng() - 0.5) * cfg.home.r; }
      const p = { id: 'ao-' + (++seq).toString(36) + Math.floor(rng() * 1e6).toString(36).padStart(4, '0'), name, ...look, brain: createWanderer({ rng, x, z, home: cfg.home, blocked }) };
      list.push(p); return p;
    },
    remove(id) { const i = list.findIndex((p) => p.id === id); if (i < 0) return false; used.delete(list[i].name.toLowerCase()); list.splice(i, 1); return true; },
    clear() { list.length = 0; used.clear(); },
  };
}
