// Tìm đường cho bấm-để-đi và "đi tới chương" (Phiên 12b). Thuần hàm, có test: A* trên lưới 0,5 m dùng blocked/canStep của layout.js,
// chừa một khoảng sát tường (0,3 m) rồi làm thẳng đường (bỏ điểm thừa nếu đi thẳng được). Trả danh sách điểm {x,z} hoặc null.
import { blocked, canStep, CIRCLES, RECTS } from './layout.js';

const S = 0.5, CLEAR = 0.7, X0 = -130, Z0 = -80, W = 520, H = 480;     // lưới phủ khuôn viên + đường làng, rừng, thác ngoài cổng (−130…130; −80…160)
const SQ2 = Math.SQRT2;

/**
 * Điểm có đi được không, kể cả chừa khoảng CLEAR (0,5 m) sát vật cản VÀ sát "tường vô hình" giữa sàn chính điện và sân (chỉ qua bậc thềm được).
 * CLEAR và M (0,7 m, Phiên 29) phải ≥ bán kính thân người (layout.PLAYER_R 0,35 m) + dung sai đổi mốc của navigator (0,3 m), để đi theo đường không bao giờ kẹt thân vào vật mảnh hay xuyên chỗ cấm.
 */
const NB = [[CLEAR, 0], [-CLEAR, 0], [0, CLEAR], [0, -CLEAR]], M = 0.7;     // M: lề tính từ MẶT vật cản (kể cả cột đèn mảnh r=0,2 mà 4 điểm mẫu có thể lọt qua)
function nearObstacle(x, z) {
  for (const c of CIRCLES) if (Math.hypot(x - c.x, z - c.z) < c.r + M) return true;
  for (const q of RECTS) if (x >= q.x0 - M && x <= q.x1 + M && z >= q.z0 - M && z <= q.z1 + M) return true;
  return false;
}
export const free = (x, z) => !blocked(x, z) && !nearObstacle(x, z) && NB.every(([dx, dz]) => !blocked(x + dx, z + dz) && canStep(x, z, x + dx, z + dz));

// Bộ nhớ đệm theo ô lưới (A* hỏi mỗi ô nhiều lần); tự làm mới nếu có vật cản mới được thêm vào layout.js
let cache = null, cacheKey = '';
function freeCell(i, j) {
  const key = CIRCLES.length + ':' + RECTS.length;
  if (!cache || key !== cacheKey) { cache = new Uint8Array(W * H); cacheKey = key; }
  const k = i + j * W; let v = cache[k];
  if (!v) { v = free(X0 + i * S, Z0 + j * S) ? 1 : 2; cache[k] = v; }
  return v === 1;
}

const cx = (i) => X0 + i * S, cz = (j) => Z0 + j * S;
const ci = (x) => Math.round((x - X0) / S), cj = (z) => Math.round((z - Z0) / S);
const inGrid = (i, j) => i >= 0 && j >= 0 && i < W && j < H;

/** Ô đi được gần (x, z) nhất trong bán kính maxR mét (tìm theo vòng), hoặc null. */
function nearestFree(x, z, maxR) {
  const i0 = ci(x), j0 = cj(z), R = Math.ceil(maxR / S);
  let best = null, bd = Infinity;
  for (let di = -R; di <= R; di++) for (let dj = -R; dj <= R; dj++) {
    const i = i0 + di, j = j0 + dj; if (!inGrid(i, j)) continue;
    const d = Math.hypot(cx(i) - x, cz(j) - z); if (d > maxR || d >= bd) continue;
    if (freeCell(i, j)) { best = { i, j }; bd = d; }
  }
  return best;
}

// Hàng đợi ưu tiên nhị phân tối giản
function heap() {
  const a = [];
  return {
    get size() { return a.length; },
    push(k, v) { a.push([k, v]); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } },
    pop() { const top = a[0], last = a.pop(); if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && a[l][0] < a[m][0]) m = l; if (r < a.length && a[r][0] < a[m][0]) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } } return top[1]; },
  };
}

/** Đoạn thẳng a→b đi được không (mẫu mỗi 0,25 m, từng bước phải canStep và chừa sát tường). */
function clear(a, b) {
  const L = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(1, Math.ceil(L / 0.25));
  let px = a.x, pz = a.z;
  for (let k = 1; k <= n; k++) {
    const x = a.x + (b.x - a.x) * k / n, z = a.z + (b.z - a.z) * k / n;
    if (!free(x, z) || !canStep(px, pz, x, z)) return false;
    px = x; pz = z;
  }
  return true;
}

/**
 * Đường đi từ (x0,z0) tới (x1,z1). Nếu đích bị chặn (bấm vào ao, tường...) thì đi tới ô đi được gần đích nhất (≤ 4 m).
 * Trả mảng điểm {x,z} (không gồm điểm xuất phát; điểm cuối là đích hoặc ô gần đích) hoặc null nếu không có đường.
 */
export function findPath(x0, z0, x1, z1) {
  const s = free(x0, z0) ? { i: ci(x0), j: cj(z0) } : nearestFree(x0, z0, 2);
  const g = free(x1, z1) ? { i: ci(x1), j: cj(z1) } : nearestFree(x1, z1, 4);
  if (!s || !g || !inGrid(s.i, s.j)) return null;
  const goalIdx = g.i + g.j * W, startIdx = s.i + s.j * W;
  const gs = new Float32Array(W * H).fill(Infinity), from = new Int32Array(W * H).fill(-1), done = new Uint8Array(W * H);
  const q = heap(); gs[startIdx] = 0; q.push(0, startIdx);
  const hFn = (i, j) => { const dx = Math.abs(i - g.i), dz = Math.abs(j - g.j); return (dx + dz + (SQ2 - 2) * Math.min(dx, dz)) * S; };
  let found = false;
  while (q.size) {
    const cur = q.pop(); if (done[cur]) continue; done[cur] = 1;
    if (cur === goalIdx) { found = true; break; }
    const i = cur % W, j = (cur / W) | 0;
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
      if (!di && !dj) continue;
      const ni = i + di, nj = j + dj; if (!inGrid(ni, nj)) continue;
      const nIdx = ni + nj * W; if (done[nIdx]) continue;
      const x = cx(i), z = cz(j), nx = cx(ni), nz = cz(nj);
      if (!freeCell(ni, nj) || !canStep(x, z, nx, nz)) continue;
      if (di && dj && (!freeCell(ni, j) || !freeCell(i, nj) || !canStep(x, z, nx, z) || !canStep(x, z, x, nz))) continue;   // không cắt góc
      const ng = gs[cur] + (di && dj ? SQ2 : 1) * S;
      if (ng < gs[nIdx]) { gs[nIdx] = ng; from[nIdx] = cur; q.push(ng + hFn(ni, nj), nIdx); }
    }
  }
  if (!found) return null;
  const cells = []; for (let k = goalIdx; k !== -1; k = from[k]) cells.push({ x: cx(k % W), z: cz((k / W) | 0) });
  cells.reverse();
  // đích thật (nếu đi được) thay cho tâm ô cuối
  if (free(x1, z1) && clear(cells[cells.length - 1], { x: x1, z: z1 })) cells.push({ x: x1, z: z1 });
  // làm thẳng đường: từ mỗi mốc, nhảy tới điểm xa nhất mà đi thẳng được
  const out = []; let a = { x: x0, z: z0 }, idx = 0;
  while (idx < cells.length) {
    let far = idx;
    for (let k = cells.length - 1; k > idx; k--) if (clear(a, cells[k])) { far = k; break; }
    out.push(cells[far]); a = cells[far]; idx = far + 1;
  }
  return out;
}
