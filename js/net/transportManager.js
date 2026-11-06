// Chuỗi dự phòng đường truyền đa người: Firebase #1 → Firebase #2 → … → Apps Script. Logic thuần, kiểm thử bằng Node.
// rooms: [{ type:'firebase'|'gas', name, ... }] theo thứ tự ưu tiên. makeTransport(entry) → { kind, name, connect?(ms), call(req), close?() } hoặc null.
// Chuyển sang nơi kế khi: không kết nối được / phòng đầy (khi vào) · lỗi liên tục quá switchAfterMs (giữa chừng). Đang ở nơi dự phòng thì
// cứ retryMs (tăng gấp đôi mỗi lần thất bại, tối đa retryMaxMs) thử lại nơi ưu tiên cao hơn. Nơi cuối cùng (Apps Script) không bao giờ bị bỏ.
export function createTransportManager({ rooms, makeTransport, onSwitch = () => {}, onError = () => {}, now = () => Date.now(), connectTimeoutMs = 10000, switchAfterMs = 6000, retryMs = 15000, retryMaxMs = 120000 }) {
  const list = (Array.isArray(rooms) ? rooms : []).filter(Boolean);
  let idx = -1, cur = null, failSince = 0, lastUpgrade = now(), upgrading = false, nextRetry = retryMs;   // Phiên 26: ở nơi dự phòng thì thử lại nơi ưu tiên sau 15 giây (thất bại thì thưa dần tới 2 phút) để mọi người sớm gặp nhau trên cùng một đường

  async function open(i) {                                   // mở nơi thứ i → transport đã sẵn sàng hoặc null
    let t = null;
    try { t = makeTransport(list[i]); if (!t) return null; if (t.connect) await t.connect(connectTimeoutMs); return t; }
    catch (e) { try { if (t && t.close) t.close(); } catch (__) { /* bỏ qua */ } try { onError({ index: i, name: (list[i] && list[i].name) || '', error: e }); } catch (__) { /* bỏ qua */ } return null; }
  }
  function adopt(i, t) {
    const prev = cur; cur = t; idx = i; failSince = 0; nextRetry = retryMs; lastUpgrade = now();   // đếm 15 giây từ lúc rơi xuống nơi dự phòng
    if (prev && prev.close) { try { prev.close(); } catch (_) { /* bỏ qua */ } }
    onSwitch({ index: i, name: list[i].name || t.name || '', kind: t.kind || list[i].type, first: !prev });
  }
  async function ensure(from) {                              // chọn nơi khả dụng đầu tiên từ `from` trở đi
    for (let i = from; i < list.length; i++) { const t = await open(i); if (t) { adopt(i, t); return true; } }
    return false;
  }
  async function tryUpgrade() {
    upgrading = true; lastUpgrade = now();
    const before = idx;
    try { for (let i = 0; i < idx; i++) { const t = await open(i); if (t) { adopt(i, t); break; } } } finally { upgrading = false; if (idx >= before) nextRetry = Math.min(retryMaxMs, nextRetry * 2); }
  }

  const API = {
    /** Dùng làm `call` của roomClient. */
    async call(req) {
      if (!cur && !(await ensure(0))) return { ok: false, error: 'no_transport' };
      let res; try { res = await cur.call(req); } catch (_) { res = { ok: false, error: 'throw' }; }
      const t = now();
      if (res && res.ok) failSince = 0;
      else if (!(res && res.error === 'room_full')) {
        if (!failSince) failSince = t;
        else if (t - failSince >= switchAfterMs && idx < list.length - 1) await ensure(idx + 1);
      }
      if (idx > 0 && !upgrading && now() - lastUpgrade >= nextRetry) tryUpgrade();
      return res;
    },
    close() { if (cur && cur.close) { try { cur.close(); } catch (_) { /* bỏ qua */ } } cur = null; idx = -1; },
    get current() { return cur ? { index: idx, name: list[idx].name || cur.name || '', kind: cur.kind } : null; },
  };
  return API;
}
