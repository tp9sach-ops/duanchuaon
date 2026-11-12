// GÓC CAMERA khi câu cá theo clip mẫu (Phiên 120): logic THUẦN (không three.js), có test: tests/fishpose.test.mjs.
//  • 'cast'  — lúc thả cầu / chờ cá: camera nâng cao, lùi ra, lệch sang bên để nhân vật nằm bên TRÁI màn hình, quay mặt về phía nước ở phía TRÊN-PHẢI,
//              thấy cả quả cầu, vòng sóng và bóng cá.
//  • 'show'  — lúc cầm cá vừa câu: kéo sát, ngang tầm ngực, nhìn thẳng vào mặt nhân vật và con cá giơ trước người.
// world.js trộn (yaw, pitch, dist) của người chơi với góc này theo mức `k` (0 = tự do, 1 = hết góc quay), ra/vào mượt.
const TAU = Math.PI * 2;
const wrap = (a) => { let x = (a + Math.PI) % TAU; if (x < 0) x += TAU; return x - Math.PI; };

/** dyaw: lệch ngang so với "sau lưng" (cast) / "trước mặt" (show); pitch: góc nhìn xuống (rad); dist: khoảng cách (m). */
export const SHOTS = {
  cast: { behind: true, dyaw: 0.85, pitch: 0.95, dist: 7.2 },
  show: { behind: false, dyaw: -0.2, pitch: 0.14, dist: 3.2 },
};

/** Góc camera cho cảnh `name` khi nhân vật quay mặt `facing` (nhìn +z khi 0). Trả { yaw, pitch, dist } | null (tên lạ / không có mặt). camPose đặt camera tại look + (sin yaw, cos yaw)·dist. */
export function shotPose(name, facing) {
  const s = SHOTS[name]; if (!s || !Number.isFinite(facing)) return null;
  return { yaw: wrap(facing + (s.behind ? Math.PI : 0) + s.dyaw), pitch: s.pitch, dist: s.dist };
}

/** Nội suy góc (đi đường ngắn nhất qua ±π). */
export function lerpAngle(a, b, k) { return a + wrap(b - a) * k; }

/** Trộn góc người chơi `cur` = { yaw, pitch, dist } với góc quay `shot` theo k (0..1). shot null → trả cur. */
export function blendShot(cur, shot, k) {
  if (!shot || !(k > 0)) return cur;
  const t = Math.min(1, k);
  return { yaw: lerpAngle(cur.yaw, shot.yaw, t), pitch: cur.pitch + (shot.pitch - cur.pitch) * t, dist: cur.dist + (shot.dist - cur.dist) * t };
}

/** Nhân vật nằm ở phía nào màn hình khi nhìn từ camera (yaw)? Trả hướng nhìn của nhân vật chiếu lên trục ngang màn hình (−1 trái … +1 phải; > 0 = mặt hướng sang phải). */
export function facingOnScreen(facing, yaw) { return Math.sin(facing - yaw); }
