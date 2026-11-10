/**
 * Yêu quái đánh CHUNG (Phiên 71). Mỗi lần yêu quái xuất hiện có một "key" (vd 2026-11-10-toi). Mọi người chơi cùng key dùng CHUNG:
 *   - máu: tổng sát thương của tất cả người chơi (mỗi người gửi TỔNG sát thương mình đã gây — gửi lại không bị tính đôi),
 *   - túi lá bồ đề: khi hết máu, máy chủ cho một "hạt giống" + chỗ rơi; ai gửi xin nhặt túi đó TRƯỚC thì được (mỗi túi một người).
 * Trạng thái giữ trong CacheService (không ghi Sheet), tự hết sau vài giờ.
 *
 * Yêu cầu: { action:'yq', id, key, max, d, at:{x,z}, claim:[idTúi,...] }
 * Trả    : { ok, max, total, mine, hp, dead, seed, at, claimed:{idTúi:idNgười}, granted:[idTúi], players }
 * Sau khi sửa: Deploy → Manage deployments → Edit → New version.
 */
var YQ_CFG = { PREFIX: 'dgt_yq_', CACHE_SEC: 21600, MAX_HP: 20000, MAX_PLAYERS: 60, MAX_LOOT: 80, MAX_STEP: 600 };

function yqKey_(s) { s = String(s == null ? '' : s); return /^\d{4}-\d{2}(-\d{2})?-(trung|cao|trua|chieu|toi)$/.test(s) ? s : ''; }
function yqNum_(v, lo, hi, d) { v = Number(v); if (!isFinite(v)) return d; return Math.max(lo, Math.min(hi, v)); }

function yqSync_(req) {
  var id = roomId_(req && req.id), key = yqKey_(req && req.key);
  if (!id) return { ok: false, error: 'bad_id' };
  if (!key) return { ok: false, error: 'bad_key' };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(4000)) return { ok: false, error: 'busy' };
  try {
    var cache = CacheService.getScriptCache(), ck = YQ_CFG.PREFIX + key, st = null, raw = cache.get(ck);
    try { st = raw ? JSON.parse(raw) : null; } catch (e) { st = null; }
    if (!st || typeof st !== 'object') st = {};
    if (!st.dmg || typeof st.dmg !== 'object') st.dmg = {};
    if (!st.claimed || typeof st.claimed !== 'object') st.claimed = {};
    if (!st.max) st.max = Math.floor(yqNum_(req.max, 1, YQ_CFG.MAX_HP, 100));   // người đầu tiên đặt máu tối đa; sau đó không đổi
    if (!st.dmg[id] && Object.keys(st.dmg).length >= YQ_CFG.MAX_PLAYERS) return { ok: false, error: 'full' };

    // sát thương: chỉ tăng, mỗi lượt tối đa MAX_STEP (chống gửi số khổng lồ)
    var prev = Number(st.dmg[id]) || 0, want = Math.floor(yqNum_(req.d, 0, YQ_CFG.MAX_HP, 0));
    st.dmg[id] = Math.min(prev + YQ_CFG.MAX_STEP, Math.max(prev, want));
    var total = 0, ids = Object.keys(st.dmg), i;
    for (i = 0; i < ids.length; i++) total += st.dmg[ids[i]];
    var dead = total >= st.max;
    if (dead && !st.seed) {
      st.seed = 1 + Math.floor(Math.random() * 2000000000);
      st.at = { x: Math.round(yqNum_(req.at && req.at.x, -200, 200, 0) * 10) / 10, z: Math.round(yqNum_(req.at && req.at.z, -200, 200, 100) * 10) / 10 };
    }

    // nhặt lá: túi nào chưa ai nhận thì người xin TRƯỚC (đến máy chủ trước) được
    var granted = [], claim = Array.isArray(req.claim) ? req.claim : [];
    if (dead) for (i = 0; i < claim.length && i < 20; i++) {
      var lid = Math.floor(Number(claim[i]));
      if (lid >= 1 && lid <= YQ_CFG.MAX_LOOT && !st.claimed[lid]) { st.claimed[lid] = id; granted.push(lid); }
    }
    cache.put(ck, JSON.stringify(st), YQ_CFG.CACHE_SEC);
    return { ok: true, max: st.max, total: total, mine: st.dmg[id], hp: Math.max(0, st.max - total), dead: dead, seed: st.seed || 0, at: st.at || null,
      claimed: st.claimed, granted: granted, players: ids.length };
  } finally { lock.releaseLock(); }
}
