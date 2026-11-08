// Yêu quái đánh CHUNG — phần logic thuần (không mạng, không DOM) để kiểm thử bằng Node. Máy chủ: gas/Yq.gs (action 'yq').
// Mỗi máy vẫn tự mô phỏng chuyển động + vùng đỏ của yêu quái; chỉ MÁU và TÚI LÁ là chung.
import { lootDrops, rngSeed } from './yeuquai.js';

export const COOP_POLL_MS = 2500;
/** Key gửi máy chủ hợp lệ (chế độ thử ?yq= dùng key 'thu-…' → không nối mạng). */
export const coopKeyOk = (k) => /^\d{4}-\d{2}-(trung|cao)$/.test(String(k || ''));

/** Gói yêu cầu gửi máy chủ. dealt = TỔNG sát thương mình đã gây; claim = các túi mình vừa chạm. */
export function buildReq({ pageId, key, boss, dealt, claim = [] }) {
  return { id: pageId, key, max: boss ? boss.max : 100, d: Math.max(0, Math.floor(dealt || 0)), at: boss ? { x: boss.x, z: boss.z } : null, claim: claim.slice(0, 20) };
}

/**
 * Áp kết quả máy chủ vào yêu quái cục bộ. Máu chung = max − tổng; trừ thêm phần mình đã đánh mà máy chủ chưa kịp nhận (cho mượt).
 * Trả { killedByOthers: boolean } — true khi MÁY CHỦ báo hết máu mà máy này chưa tự thấy.
 */
export function applyServer(boss, res, dealt = 0) {
  if (!boss || !res || !res.ok) return { killedByOthers: false };
  const pending = Math.max(0, Math.floor(dealt) - (Number(res.mine) || 0));
  boss.max = Number(res.max) || boss.max;
  boss.dmgBy = { ban: Number(res.mine) || 0, khac: Math.max(0, (Number(res.total) || 0) - (Number(res.mine) || 0)) };
  const wasDead = boss.dead;
  boss.hp = res.dead ? 0 : Math.max(1, (Number(res.hp) || 0) - pending);   // chưa hết máu chung thì còn ít nhất 1 (đòn kết liễu tính khi máy chủ xác nhận)
  if (res.dead && !wasDead) { boss.dead = true; boss.state = 'dead'; boss.shapes = []; return { killedByOthers: true }; }
  return { killedByOthers: false };
}

/** Túi lá rơi: cùng hạt giống + chỗ rơi → MỌI máy tạo đúng cùng các túi (id giống nhau); bỏ những túi đã có người nhận. */
export function lootFromServer(res, boss, n = 1) {
  if (!res || !res.ok || !res.dead || !res.seed) return [];
  const at = res.at || { x: boss ? boss.x : 0, z: boss ? boss.z : 100 }, claimed = res.claimed || {};
  return lootDrops(at.x, at.z, n, rngSeed(res.seed >>> 0), boss ? boss.diff : 'trung').filter((d) => !claimed[d.id]);
}

/** Lá đã được CÔNG NHẬN cho mình: id trong granted → tổng số lá của các túi đó (theo bảng túi dựng từ hạt giống). */
export function leavesGranted(res, allDrops) {
  const by = new Map((allDrops || []).map((d) => [d.id, d])); let la = 0;
  for (const id of (res && res.granted) || []) { const d = by.get(id); if (d) la += d.la; }
  return la;
}
