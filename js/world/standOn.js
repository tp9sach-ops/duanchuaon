// ĐỨNG TRÊN VẬT (Phiên 202, mục 1). LOGIC THUẦN (không DOM, không three.js), có test: tests/standon.test.mjs.
// layout.js đã có `top` / DECKS / floorAt / feetH (Phiên 200). File này nối chúng với cú nhảy: mỗi khung js/ui/skill.js hỏi floorRel(...) rồi đưa vào jump.step(dt, floor) (skills.js)
// và ghi LGT.feetH = độ cao chân TUYỆT ĐỐI (m) cho js/world/world.js truyền vào walkStep → bay/đi qua PHÍA TRÊN vật thấp; thấp hơn mặt vật thì vẫn bị chặn (không xuyên).
import { groundY, floorAt, canStep } from './layout.js';

const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/**
 * Mặt đứng TƯƠNG ĐỐI so với mặt đất tại (x, z) cho người có chân cao `y` m trên mặt đất.
 * ahead (m, ≥ 0): nhìn trước quãng đang rơi trong khung hình này để rơi nhanh cũng không xuyên qua mặt vật mỏng.
 * Trả { g: độ cao mặt đất/sàn tại điểm (m, tuyệt đối), fl: mặt đứng so với mặt đất (m, ≥ 0) }.
 */
export function floorRel(x, z, y = 0, ahead = 0) {
  const g = groundY(x, z), feet = g + Math.max(0, num(y)) + Math.max(0, num(ahead));
  return { g, fl: Math.max(0, floorAt(x, z, feet) - g) };
}

/**
 * Điểm rơi khi lao/lướt/bật tới từ (x, z) theo hướng ry (rad; 0 = +z như avatar.setFacing) quãng `range` m: đi từng 0,5 m, dừng trước vật cản/nước/đổi vùng.
 * Giống strength.landing nhưng có feetH (độ cao chân tuyệt đối, m): chân đủ cao thì đi qua phía trên vật thấp. feetH bỏ trống = 0 (hành vi cũ).
 */
export function landingAt(x, z, ry, range, feetH = 0) {
  const fh = Math.max(0, num(feetH));
  const dx = Math.sin(num(ry)), dz = Math.cos(num(ry)), n = Math.floor(clamp(num(range), 0, 60) / 0.5);
  let cx = num(x), cz = num(z), d = 0;
  for (let i = 1; i <= n; i++) { const nx = x + dx * 0.5 * i, nz = z + dz * 0.5 * i; if (!canStep(cx, cz, nx, nz, fh)) break; cx = nx; cz = nz; d = 0.5 * i; }
  return { x: cx, z: cz, dist: d };
}
