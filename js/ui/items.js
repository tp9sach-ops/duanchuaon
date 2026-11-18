// Vật phẩm mua bằng lá bồ đề (mục 1): giao diện. Luật/số: js/world/items.js (có test). Nạp từ js/ui/board.js (initBoard). Đặt LGT.items = { openShop(kind), closeShop(), regenMul(), tryRevive(), dmgMul(), state }.
// - Mục 3 (14/11): cửa hàng 'banhsr' (NPC "Nhân viên Bánh Sầu Riêng 9 Sạch", nhà phố 9 Sạch bên phải đường làng): Bánh sầu riêng 3 vị 155 lá (×5 hồi máu, 10 phút), Bánh sầu riêng pho mai than tre 150 lá (hồi sinh tại chỗ, 20 phút). Trước đây là "Ngọc hồi máu / Ngọc dịch chuyển" bán ở Kim Hoàn Ngọc Lan.
//   openShop('kimhoan') (tên cũ) vẫn mở đúng cửa hàng bánh để chỗ nào còn gọi tên cũ không bị hỏng. Cửa hàng 'dienmay' (NPC Điện Máy Lam Sen): Ván trượt 100 lá (js/ui/board.js), Gậy như ý 400 lá, Nón Jingasa 400 lá.
// - Phiên 163: cửa hàng 'tachhoa' (NPC "Nhân viên Tách Hoa", nhà phố Tách Hoa cạnh 9 Sạch): Trà sữa xoài hoàng kim 39 lá = +30 phút Tự động hàng yêu hôm nay (gọi LGT.farm.addAutoMinutes, js/ui/farm.js).
// - 14/11: ảnh món (js/data/itemImages.js, data URI WebP nhỏ) hiện trong khung cửa hàng: hoimau / dichchuyen ở 'banhsr', trasua ở 'tachhoa'. Món khác chưa có ảnh thì không hiện.
// - Hồi máu ×5 / hồi sinh tại chỗ: js/ui/farmCombat.js gọi LGT.items.regenMul() và tryRevive(). Hạn dùng tính theo giờ thật nên đổi tab vẫn chạy.
// - Gậy như ý: MUA là có, nhưng chỉ hiện trên tay / có +1% sát thương / vòng sáng lan khi người chơi ĐANG CẦM Gậy như ý (LGT.loadout.weapon === 'nhuy', chọn ở Túi đồ). Mặc định cầm Thương: trả lại cây côn mặc định. Mua gậy xong tự cầm gậy.
//   Phiên 163: cầm Gậy như ý đánh thường đủ 3 đòn liên tiếp → RỒNG HỒNG bay quanh người (js/ui/dragonFx.js). Chiêu (Chém khí...) gọi swing(số) nên không tính là đánh thường.
// Nhân vật dựng bằng khối (không phải chibi) thì không đổi hình gậy nhưng vẫn có +1% và vòng sáng. CHƯA nhìn bằng mắt trên máy thật.
import * as THREE from 'three';
import { GEMS, STAFF, BAMBOO, BROOM, HAT, TRASUA, afterArmor as aAfter, loadItems, buyGem, buyStaff, buyBamboo, buyBroom, finisherMul as fMul, buyHat, buyTraSua, toggleHat, hatWorn, armorMul as aMul, remainSec, regenMul as rMul, canRevive, dmgMul as dMul, fmtTime } from '../world/items.js';
import { BOARD } from '../world/board.js';
import { askConfirm } from './dialog.js';
import { STAFF_SCALE, STAFF_PINK } from './staffMesh.js';
import { createBroomFx } from './broomFx.js';   // Phiên 230: đập chổi + gió
import { applySlippers } from './slipperMesh.js';   // Phiên 233: dép lào khi dùng chổi
import { broomRange } from '../world/broomMath.js';
import { countBroomHit } from '../world/tornadoMath.js';   // Phiên 234: đếm đòn chổi → 3 lốc nhỏ (đòn 3) / lốc to (đòn 9)
import { applyTornadoHit } from './tornadoHit.js';
import { kitOf } from './weaponKit.js';   // Phiên 224: bảng đồ nghề gậy phát sáng (nhuy / tre)
import { createWolfFx } from './wolfFx.js';   // Phiên 224: sói khí vàng đòn 3 của Gậy dạy chó
import { wolfRange, headingTo } from '../world/wolfMath.js';
import { BASIC } from '../world/basicCombo.js';
import { buildHat, HAT_POS } from './hatMesh.js';
import { createDragonFx, countHit } from './dragonFx.js';
import { ITEM_IMG } from '../data/itemImages.js';   // 14/11: ảnh món trong khung cửa hàng
// Phiên 154: Nón Jingasa (Điện Máy, 400 lá): mua xong tự đội lên đầu nhân vật chibi (js/ui/hatMesh.js), +3% giáp = đòn quái đánh trúng bớt 3% (js/ui/farmCombat.js gọi LGT.items.afterArmor()). Cửa hàng có nút Cất nón / Đội nón. Vị trí nón là số TẠM (HAT_POS).
// Phiên 149: Bánh sầu riêng pho mai than tre (trước là Ngọc dịch chuyển) có thể GHIM một chỗ (nút "Ghim chỗ hồi sinh" dưới chỉ báo hạn dùng, chỉ hiện khi còn hiệu lực): hết máu thì hồi sinh ở chỗ đã ghim, chưa ghim thì hồi sinh tại chỗ đang đứng (js/ui/farmCombat.js đọc LGT.items.pinned). Gậy như ý to gấp STAFF_SCALE lần cây côn mặc định, ánh sáng hồng.

const KEY = 'lgt.items', PIN_KEY = 'lgt.itempin';
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const CSS = '.it-box{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:9500;width:min(92vw,430px);max-height:84vh;overflow:auto;background:rgba(26,17,10,.97);color:#f4e4c1;border:1px solid #c9a24a;border-radius:14px;padding:14px;font:14px/1.45 "Be Vietnam Pro","Noto Sans",system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.55)}'
  + '.it-box header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}.it-box h3{margin:0;font-size:17px;color:#f2c14e}'
  + '.it-x{background:none;border:0;color:#f4e4c1;font-size:24px;line-height:1;cursor:pointer;padding:2px 8px}.it-la{margin:0 0 10px;color:#cdb98a}'
  + '.it-row{border:1px solid rgba(201,162,74,.35);border-radius:10px;padding:10px;margin-bottom:8px;background:rgba(255,255,255,.03)}.it-row b{color:#ffe08a}.it-row p{margin:4px 0}'
  + '.it-img{display:block;max-width:100%;max-height:114px;width:auto;height:auto;border-radius:8px;margin:0 0 6px}'
  + '.it-meta{color:#cdb98a;font-size:13px}.it-buy{margin-top:6px;background:#c9a24a;color:#2a1a08;border:0;border-radius:8px;padding:8px 16px;font:600 14px inherit;cursor:pointer;min-height:40px}.it-buy:disabled{opacity:.45;cursor:default}'
  + '.it-chips{position:fixed;left:8px;top:calc(env(safe-area-inset-top,0px) + 56px);z-index:40;display:flex;flex-direction:column;gap:4px;pointer-events:none}'
  + '.it-chiplist{display:flex;flex-direction:column;gap:4px}.it-pin{pointer-events:auto;align-self:flex-start;background:rgba(26,17,10,.82);color:#9fe0ff;border:1px solid #6fb8dd;border-radius:999px;padding:5px 12px;font:600 12px "Be Vietnam Pro",system-ui,sans-serif;cursor:pointer;min-height:32px}.it-pin[hidden]{display:none}.it-pin.on{color:#ffe08a;border-color:#c9a24a}'
  + '.it-chip{background:rgba(26,17,10,.82);color:#ffe08a;border:1px solid #c9a24a;border-radius:999px;padding:3px 10px;font:600 12px "Be Vietnam Pro",system-ui,sans-serif}';

let RING_GEO = null;

/** hud/opts: { toast(text, ms) }. */
export function initItems({ toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  if (LGT.items) return LGT.items;
  let st = loadItems(null); try { st = loadItems(localStorage.getItem(KEY)); } catch (_) { /* riêng tư */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (_) { /* bỏ qua */ } };
  let pin = null; try { const q = JSON.parse(localStorage.getItem(PIN_KEY) || 'null'); if (q && Number.isFinite(+q.x) && Number.isFinite(+q.z)) pin = { x: +q.x, z: +q.z }; } catch (_) { /* riêng tư / hỏng → chưa ghim */ }
  const savePin = () => { try { if (pin) localStorage.setItem(PIN_KEY, JSON.stringify(pin)); else localStorage.removeItem(PIN_KEY); } catch (_) { /* bỏ qua */ } };
  document.head.appendChild(el('style', null, CSS));
  const laNow = () => (LGT.merit && LGT.merit.leaf ? LGT.merit.leaf.la : 0);
  const spend = (n) => !!(LGT.merit && LGT.merit.spendLa && LGT.merit.spendLa(n));
  const hatOn = () => hatWorn(st);
  // Phiên 224: đang cầm gậy phát sáng nào? 'nhuy' = Gậy như ý (chưa có hệ chọn đồ thì coi như cầm nếu đã mua) · 'tre' = Gậy dạy chó (phải chọn ở Túi đồ) · null = Thương mặc định.
  const heldKind = () => { const w = LGT.loadout ? LGT.loadout.weapon : null; if (st.staff && (!w || w === 'nhuy')) return 'nhuy'; if (st.tre && w === 'tre') return 'tre'; if (st.choi && w === 'choi') return 'choi'; return null; };   // Phiên 230: 'choi' = Chổi
  const staffOn = () => heldKind() === 'nhuy';
  const bambooOn = () => heldKind() === 'tre';
  const broomOn = () => heldKind() === 'choi';
  const holdDmg = () => { const k = heldKind(); return k === 'nhuy' ? dMul(st) : k === 'tre' ? BAMBOO.dmg : 1; };   // +1% sát thương cho cả hai gậy

  // ---------- Cửa hàng ----------
  const box = el('section', 'it-box'); box.hidden = true; box.setAttribute('role', 'dialog');
  const head = el('header'), title = el('h3'), x = el('button', 'it-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Đóng'); head.append(title, x);
  const laLine = el('p', 'it-la'), list = el('div', 'it-list'); box.append(head, laLine, list); document.body.appendChild(box);
  let shopKind = '';
  const confirm = (text) => askConfirm(text, { ok: 'Mua', cancel: 'Để sau' });

  async function buyGemUi(g) {
    const ok = await confirm(`${g.ten} — ${g.gia} lá bồ đề.\n${g.mo}\nBạn đang có ${laNow()} lá bồ đề. Mua không?`); if (!ok) return;
    const r = buyGem(st, g.id, laNow()); if (!r.ok) { toast(`Chưa đủ lá bồ đề (cần ${g.gia}, bạn có ${laNow()}). Đổi thêm lá ở Thầy Tri khách.`, 3600); return; }
    if (!spend(r.cost)) { toast('Chưa đủ lá bồ đề.', 2500); return; }
    st = r.state; save(); chipsDraw(); draw();
    toast(`Đã mua ${g.ten} (−${r.cost} lá bồ đề) — còn ${fmtTime(remainSec(st, g.id))}.`, 3200);
  }
  async function buyStaffUi() {
    const ok = await confirm(`${STAFF.ten} — ${STAFF.gia} lá bồ đề.\n${STAFF.mo}\nBạn đang có ${laNow()} lá bồ đề. Mua không?`); if (!ok) return;
    const r = buyStaff(st, laNow()); if (!r.ok) { toast(r.reason === 'owned' ? 'Bạn đã có Gậy như ý rồi.' : `Chưa đủ lá bồ đề (cần ${r.cost}, bạn có ${laNow()}).`, 3600); return; }
    if (!spend(r.cost)) { toast('Chưa đủ lá bồ đề.', 2500); return; }
    st = r.state; save();
    if (LGT.loadout) LGT.loadout.choose('nhuy', true);   // mua xong tự cầm gậy (đổi lại Thương ở Túi đồ)
    draw(); toast(`Đã mua ${STAFF.ten} (−${r.cost} lá bồ đề). Bạn đang cầm gậy — đổi vũ khí ở Túi đồ.`, 4200);
  }
  async function buyBambooUi() {   // Phiên 224: Gậy dạy chó 150 lá
    const ok = await confirm(`${BAMBOO.ten} — ${BAMBOO.gia} lá bồ đề.\n${BAMBOO.mo}\nBạn đang có ${laNow()} lá bồ đề. Mua không?`); if (!ok) return;
    const r = buyBamboo(st, laNow()); if (!r.ok) { toast(r.reason === 'owned' ? 'Bạn đã có Gậy dạy chó rồi.' : `Chưa đủ lá bồ đề (cần ${r.cost}, bạn có ${laNow()}).`, 3600); return; }
    if (!spend(r.cost)) { toast('Chưa đủ lá bồ đề.', 2500); return; }
    st = r.state; save();
    if (LGT.loadout) LGT.loadout.choose('tre', true);   // mua xong tự cầm gậy
    draw(); toast(`Đã mua ${BAMBOO.ten} (−${r.cost} lá bồ đề). Bạn đang cầm gậy — đổi vũ khí ở Túi đồ.`, 4200);
  }
  async function buyBroomUi() {   // Phiên 230: Chổi 50 lá
    const ok = await confirm(`${BROOM.ten} — ${BROOM.gia} lá bồ đề.\n${BROOM.mo}\nBạn đang có ${laNow()} lá bồ đề. Mua không?`); if (!ok) return;
    const r = buyBroom(st, laNow()); if (!r.ok) { toast(r.reason === 'owned' ? 'Bạn đã có Chổi rồi.' : `Chưa đủ lá bồ đề (cần ${r.cost}, bạn có ${laNow()}).`, 3600); return; }
    if (!spend(r.cost)) { toast('Chưa đủ lá bồ đề.', 2500); return; }
    st = r.state; save();
    if (LGT.loadout) LGT.loadout.choose('choi', true);   // mua xong tự cầm chổi
    draw(); toast(`Đã mua ${BROOM.ten} (−${r.cost} lá bồ đề). Bạn đang cầm chổi — đổi vũ khí ở Túi đồ.`, 4200);
  }
  async function buyHatUi() {
    const ok = await confirm(`${HAT.ten} — ${HAT.gia} lá bồ đề.\n${HAT.mo}\nBạn đang có ${laNow()} lá bồ đề. Mua không?`); if (!ok) return;
    const r = buyHat(st, laNow()); if (!r.ok) { toast(r.reason === 'owned' ? 'Bạn đã có Nón Jingasa rồi.' : `Chưa đủ lá bồ đề (cần ${r.cost}, bạn có ${laNow()}).`, 3600); return; }
    if (!spend(r.cost)) { toast('Chưa đủ lá bồ đề.', 2500); return; }
    st = r.state; save(); draw(); toast(`Đã mua ${HAT.ten} (−${r.cost} lá bồ đề). Bạn đã đội nón: +3% giáp.`, 4200);
  }
  function toggleHatUi() { st = toggleHat(st); save(); draw(); toast(hatOn() ? 'Bạn đã đội nón (+3% giáp).' : 'Bạn đã cất nón (hết +3% giáp).', 2600); }
  // Phiên 163: Trà sữa xoài hoàng kim — trừ lá rồi cộng 30 phút Tự động hàng yêu cho hôm nay (LGT.farm.addAutoMinutes). Không có farm thì không trừ lá.
  async function buyTraSuaUi() {
    if (!LGT.farm || !LGT.farm.addAutoMinutes) { toast('Tự động hàng yêu chưa sẵn sàng, thử lại sau nhé.', 2600); return; }
    const ok = await confirm(`${TRASUA.ten} — ${TRASUA.gia} lá bồ đề.\n${TRASUA.mo}\nBạn đang có ${laNow()} lá bồ đề. Mua không?`); if (!ok) return;
    const r = buyTraSua(laNow()); if (!r.ok) { toast(`Chưa đủ lá bồ đề (cần ${r.cost}, bạn có ${laNow()}). Đổi thêm lá ở Thầy Tri khách.`, 3600); return; }
    if (!spend(r.cost)) { toast('Chưa đủ lá bồ đề.', 2500); return; }
    LGT.farm.addAutoMinutes(r.sec / 60); draw();
    toast(`Đã uống ${TRASUA.ten} (−${r.cost} lá bồ đề): +${TRASUA.phut} phút Tự động hàng yêu hôm nay — còn ${autoLeftMin()} phút.`, 4200);
  }
  const autoLeftMin = () => { try { return LGT.farm && LGT.farm.status ? LGT.farm.status().autoLeft : 0; } catch (_) { return 0; } };
  function row(ten, mo, meta, label, enabled, act, img) {
    const r = el('div', 'it-row');
    if (img) { const im = el('img', 'it-img'); im.src = img; im.alt = ten; r.appendChild(im); }   // 14/11: ảnh món bên trên tên
    r.append(el('b', null, ten), el('p', null, mo), el('p', 'it-meta', meta));
    const b = el('button', 'it-buy', label); b.type = 'button'; b.disabled = !enabled; b.addEventListener('click', act); r.appendChild(b); return r;
  }
  function draw() {
    const la = laNow(); list.textContent = '';
    title.textContent = shopKind === 'banhsr' ? 'Bánh Sầu Riêng 9 Sạch' : shopKind === 'tachhoa' ? 'Tách Hoa' : 'Điện Máy Lam Sen';
    laLine.textContent = `Bạn có ${la} lá bồ đề.`;
    if (shopKind === 'banhsr') {
      for (const g of GEMS) {
        const left = remainSec(st, g.id), meta = `Giá ${g.gia} lá · tác dụng ${g.giay / 60} phút${left > 0 ? ` · đang có tác dụng, còn ${fmtTime(left)} (mua thêm sẽ cộng dồn)` : ''}`;
        list.appendChild(row(g.ten, g.mo, meta, left > 0 ? 'Mua thêm' : 'Mua', la >= g.gia, () => buyGemUi(g), ITEM_IMG[g.id]));
      }
    } else if (shopKind === 'tachhoa') {
      list.appendChild(row(TRASUA.ten, TRASUA.mo, `Giá ${TRASUA.gia} lá · +${TRASUA.phut} phút tự động hàng yêu hôm nay · hôm nay còn ${autoLeftMin()} phút`, 'Mua', la >= TRASUA.gia, buyTraSuaUi, ITEM_IMG.trasua));
    } else {
      const bd = LGT.board ? LGT.board.status() : { van: false };
      list.appendChild(row(BOARD.ten, `Ván trượt 3D: lướt đi nhanh gấp ${String(BOARD.mul).replace('.', ',')} lần. Ván KHÔNG phải vũ khí (không đánh được); đánh nhau thì tự xuống.`, `Giá ${BOARD.gia} lá${bd.van ? ' · Bạn đã có' : ''}`, bd.van ? 'Đã có' : 'Mua', !bd.van && la >= BOARD.gia, async () => { if (LGT.board) await LGT.board.buy(); draw(); }));
      list.appendChild(row(STAFF.ten, STAFF.mo, `Giá ${STAFF.gia} lá${st.staff ? ' · Bạn đã có' : ''}`, st.staff ? 'Đã có' : 'Mua', !st.staff && la >= STAFF.gia, buyStaffUi));
      list.appendChild(row(BAMBOO.ten, BAMBOO.mo, `Giá ${BAMBOO.gia} lá${st.tre ? ' · Bạn đã có' : ''}`, st.tre ? 'Đã có' : 'Mua', !st.tre && la >= BAMBOO.gia, buyBambooUi));
      list.appendChild(row(BROOM.ten, BROOM.mo, `Giá ${BROOM.gia} lá${st.choi ? ' · Bạn đã có' : ''}`, st.choi ? 'Đã có' : 'Mua', !st.choi && la >= BROOM.gia, buyBroomUi));
      list.appendChild(row(HAT.ten, HAT.mo, `Giá ${HAT.gia} lá · +3% giáp${st.hat ? (hatOn() ? ' · Bạn đang đội' : ' · Bạn đã có, đang cất') : ''}`, st.hat ? (hatOn() ? 'Cất nón' : 'Đội nón') : 'Mua', st.hat || la >= HAT.gia, st.hat ? toggleHatUi : buyHatUi));
    }
  }
  const closeShop = () => { box.hidden = true; };
  const openShop = (kind) => { shopKind = kind === 'banhsr' || kind === 'kimhoan' ? 'banhsr' : kind === 'tachhoa' ? 'tachhoa' : 'dienmay'; draw(); box.hidden = false; x.focus({ preventScroll: true }); };   // 'kimhoan' = tên cũ của cửa hàng này
  x.addEventListener('click', closeShop);
  box.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); closeShop(); } });

  // ---------- Chỉ báo hạn dùng (góc trái) ----------
  const chips = el('div', 'it-chips'), chipList = el('div', 'it-chiplist'), pinBtn = el('button', 'it-pin'); pinBtn.type = 'button'; pinBtn.hidden = true;
  chips.append(chipList, pinBtn); document.body.appendChild(chips);
  const was = { hoimau: false, dichchuyen: false };
  function chipsDraw() {
    chipList.textContent = '';
    for (const g of GEMS) {
      const left = remainSec(st, g.id), on = left > 0;
      if (on) chipList.appendChild(el('span', 'it-chip', `${g.ten}${g.id === 'hoimau' ? ' ×5' : ''} · ${fmtTime(left)}`));
      else if (was[g.id]) toast(`${g.ten} đã hết tác dụng.`, 3200);
      was[g.id] = on;
    }
    pinBtn.hidden = !canRevive(st);   // nút ghim chỉ hiện khi Bánh sầu riêng pho mai than tre còn tác dụng
    pinBtn.textContent = pin ? '📍 Bỏ ghim chỗ hồi sinh' : '📍 Ghim chỗ hồi sinh'; pinBtn.classList.toggle('on', !!pin);
  }
  pinBtn.addEventListener('click', () => {
    if (pin) { pin = null; savePin(); chipsDraw(); toast('Đã bỏ ghim: hết máu sẽ hồi sinh tại chỗ đang đứng.', 3200); return; }
    const p = LGT.world && LGT.world.pos;
    if (!p || LGT.inHouse) { toast('Không ghim được ở đây. Hãy ra ngoài rồi ghim lại.', 3000); return; }
    pin = { x: p.x, z: p.z }; savePin(); chipsDraw(); toast('Đã ghim chỗ này: hết máu (còn tác dụng của bánh pho mai than tre) bạn sẽ hồi sinh ở đây.', 4200);
  });
  setInterval(chipsDraw, 500); chipsDraw();

  // ---------- Vòng sáng lan ----------
  const ripples = []; let clock = 0, skin = null, skinB = null, skinH = null;   // skinB: cây gậy thu gọn đeo sau lưng (Phiên 152)
  function spawnRipple(color, ahead, n) {
    const av = LGT.world && LGT.world.avatar, scene = av && av.group && av.group.parent; if (!scene) return;
    if (!RING_GEO) { RING_GEO = new THREE.RingGeometry(0.86, 1, 56); }
    const ry = av.group.rotation.y, p = av.group.position;
    for (let i = 0; i < n; i++) {
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      const m = new THREE.Mesh(RING_GEO, mat); m.rotation.x = -Math.PI / 2; m.renderOrder = 5; m.visible = false;
      m.position.set(p.x + Math.sin(ry) * ahead, p.y + 0.07, p.z + Math.cos(ry) * ahead); scene.add(m);
      ripples.push({ m, scene, t: -i * 0.12, life: 0.75, r: 3.2 });
    }
  }
  function stepRipples(dt) {
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i]; r.t += dt; if (r.t < 0) continue;
      const k = r.t / r.life; if (k >= 1) { r.scene.remove(r.m); r.m.material.dispose(); ripples.splice(i, 1); continue; }
      r.m.visible = true; const e = 1 - (1 - k) * (1 - k); r.m.scale.setScalar(0.3 + (r.r - 0.3) * e); r.m.material.opacity = 0.85 * (1 - k);
    }
  }

  // ---------- Rồng hồng (Phiên 163): cầm Gậy như ý, đánh thường đủ 3 đòn liên tiếp → rồng bay quanh người ----------
  let dragon = null, hitSt = null, wolf = null;
  function onNormalHit(av) {
    hitSt = countHit(hitSt, performance.now() / 1000); if (!hitSt.fire) return;
    const scene = av.group && av.group.parent; if (!scene) return;
    if (!dragon || dragon.scene !== scene) { if (dragon) dragon.clear(); dragon = createDragonFx(scene); }   // đổi cảnh (vào / ra nhà...) thì dựng bộ rồng mới
    if (dragon.spawn(av.group.position, av.group.rotation.y)) spawnRipple(STAFF_PINK, 0, 3);
  }

  // ---------- Gậy như ý trên tay (bọc update + swing của avatar, giống js/ui/board.js) ----------
  function wrapAvatar() {
    const av = LGT.world && LGT.world.avatar; if (!av || av.__items || !av.group || typeof av.update !== 'function') return;
    av.__items = true;
    let host = null; av.group.traverse((o) => { if (!host && o.isBone && o.name === 'handR') host = o.children.find((c) => c.isGroup && c.rotation.order === 'YXZ') || null; });   // nhóm cây côn nằm TRONG bàn tay phải (Phiên 204: group nhân vật cũng 'YXZ' nên không được dò theo order một mình)
    if (!host) av.group.traverse((o) => { if (!host && o !== av.group && o.isGroup && o.rotation.order === 'YXZ' && o.children.length >= 4) host = o; });   // dự phòng cho thân không có bone handR
    if (host) skin = { host, orig: host.children.slice(), mesh: null, kind: '' };
    const bh = av.backHost; if (bh) skinB = { host: bh, orig: bh.children.slice(), mesh: null, kind: '' };   // Phiên 152: Gậy như ý cũng thu gọn sau lưng khi không đánh
    if (av.headHost) skinH = { host: av.headHost, mesh: null, av };   // Phiên 154: nón Jingasa trên đầu (chỉ chibi có headHost)
    const upd = av.update.bind(av);
    av.update = (dt) => {
      upd(dt); clock += dt; stepRipples(dt);
      if (dragon) dragon.update(dt, av.group.position);   // Phiên 163: rồng hồng bay theo người chơi
      if (wolf) wolf.update(dt);
      applySlippers(av, av.__slip || (av.__slip = {}), broomOn());   // Phiên 233: dùng chổi thì mang đôi dép lào
      if (broomFx) broomFx.update(dt);   // Phiên 230                           // Phiên 224: sói khí vàng
      if (skin) {   // Phiên 224: cây trên tay theo bảng KIT (nhuy / tre); đổi gậy → dựng lại
        const kit = kitOf(heldKind());
        if (skin.mesh && (!kit || skin.kind !== kit.id)) { skin.host.remove(skin.mesh); skin.mesh = null; skin.kind = ''; if (!kit) for (const c of skin.orig) c.visible = true; }   // đổi về Thương: trả cây côn mặc định
        if (kit && !skin.mesh) { for (const c of skin.orig) c.visible = false; skin.mesh = kit.build(); skin.kind = kit.id; skin.mesh.scale.setScalar(kit.scale); skin.host.add(skin.mesh); kit.load(skin.mesh); }   // Phiên 149: gậy to hơn cây côn mặc định
        if (skin.mesh) kitOf(skin.kind).pulse(skin.mesh, clock, !!av.swinging);
      }
      if (skinH) {   // Phiên 154: đội / cất nón theo trạng thái đã mua
        const wantH = hatOn();
        if (wantH && !skinH.mesh) { skinH.mesh = buildHat(); skinH.mesh.position.set(HAT_POS.x, HAT_POS.y, HAT_POS.z); skinH.host.add(skinH.mesh); if (skinH.av.setHat) skinH.av.setHat(true); }
        else if (!wantH && skinH.mesh) { skinH.host.remove(skinH.mesh); skinH.mesh = null; if (skinH.av.setHat) skinH.av.setHat(false); }
      }
      if (skinB) {   // Phiên 152: trên lưng — chỉ thay hình, hiện/ẩn do avatar tự lo (backHost.visible)
        const kitB = kitOf(heldKind());
        if (skinB.mesh && (!kitB || skinB.kind !== kitB.id)) { skinB.host.remove(skinB.mesh); skinB.mesh = null; skinB.kind = ''; if (!kitB) for (const c of skinB.orig) c.visible = true; }
        if (kitB && !skinB.mesh) { for (const c of skinB.orig) c.visible = false; skinB.mesh = kitB.build(); skinB.kind = kitB.id; skinB.mesh.scale.setScalar(kitB.scale * 0.7); skinB.host.add(skinB.mesh); kitB.load(skinB.mesh); }
        if (skinB.mesh) kitOf(skinB.kind).pulse(skinB.mesh, clock, false);
      }
    };
    const sw = av.swing;
    if (typeof sw === 'function') av.swing = (...a) => {
      const r = sw.apply(av, a);
      const hk = kitOf(heldKind());
      if (hk) {
        spawnRipple(hk.color, 1.5 * hk.scale, 2);   // Phiên 149: vòng sáng hồng (Gậy như ý) · Phiên 224: vàng (Gậy dạy chó)
        if (hk.id === 'nhuy' && typeof a[0] !== 'number') { try { onNormalHit(av); } catch (e) { /* hiệu ứng rồng lỗi không làm hỏng đòn đánh */ } }   // swing(số) = chiêu Chém khí, không tính là đánh thường
      }
      return r;
    };
  }

  // ---------- +1% sát thương khi đang cầm Gậy như ý ----------
  function dmgTick() {
    const mons = LGT.farmView && LGT.farmView.mons; if (!mons || !mons.length) return; const k = holdDmg() - 1;   // Phiên 224: cả Gậy như ý và Gậy dạy chó +1%
    for (const m of mons) {
      const prev = m.__oi;
      if (k > 0 && prev !== undefined && m.oan < prev) { const extra = (prev - m.oan) * k; if (m.oan - extra > 0.5) m.oan -= extra; }
      m.__oi = m.oan;
    }
  }
  setInterval(() => { try { wrapAvatar(); dmgTick(); } catch (e) { /* không để hỏng game */ } }, 100);

  // ---------- Gậy dạy chó (Phiên 224): mỗi đòn đánh thường nghe tiếng GỖ; đòn THỨ 3 thả SÓI KHÍ VÀNG vồ về phía quái ----------
  // farm.js / yeuquai.js gọi LGT.items.onHit(step, target) mỗi đòn đánh thường (step 1..3; target = quái bị đánh hoặc null khi vung không khí) và nhân sát thương bằng LGT.items.finisherMul() ở đòn 3.
  let broomFx = null, broomCount = null;
  function onBroomHit(step, target) {   // Phiên 230: mỗi đòn: tiếng quét lá + gió nhẹ từ phía sau; đòn 3: ĐẬP CHỔI (lá, cát, đá bay)
    try { if (LGT.sfx && LGT.sfx.broom) LGT.sfx.broom(step); } catch (_) { /* tiếng lỗi không làm hỏng đòn đánh */ }
    const av = LGT.world && LGT.world.avatar, scene = av && av.group && av.group.parent; if (!scene) return;
    if (!broomFx || broomFx.scene !== scene) { if (broomFx) broomFx.clear(); broomFx = createBroomFx(scene, { onTornadoHit: (tn, pt, t, rec) => { const q = av.group.position; return applyTornadoHit(tn, pt, t, rec, { x: q.x, z: q.z }); } }); }   // Phiên 234: lốc của MÌNH làm quái mất máu
    const p = av.group.position, ry = av.group.rotation.y;
    const cnt = countBroomHit(broomCount, step, performance.now() / 1000); broomCount = cnt.state;   // Phiên 234: đòn 3 → w=1 (3 lốc nhỏ), đòn 9 → w=2 (thêm lốc to)
    broomFx.wind({ x: p.x, y: p.y, z: p.z }, ry);
    if (step < BASIC.steps) return;
    const gap = target && Number.isFinite(+target.x) && Number.isFinite(+target.z) ? Math.hypot(target.x - p.x, target.z - p.z) : 0;
    broomFx.spawn({ x: p.x, y: p.y, z: p.z }, target ? headingTo(p, target, ry) : ry, broomRange(gap), false, 0, cnt.w);
  }
  function onHit(step, target) {
    if (broomOn()) { onBroomHit(step, target); return; }
    if (!bambooOn()) return;
    try { if (LGT.sfx && LGT.sfx.wood) LGT.sfx.wood(step); } catch (_) { /* tiếng lỗi không làm hỏng đòn đánh */ }
    if (step < BASIC.steps) return;
    const av = LGT.world && LGT.world.avatar, scene = av && av.group && av.group.parent; if (!scene) return;
    if (!wolf || wolf.scene !== scene) { if (wolf) wolf.clear(); wolf = createWolfFx(scene, { onBite: () => { try { if (LGT.sfx && LGT.sfx.wood) LGT.sfx.wood(2); } catch (_) { /* bỏ qua */ } } }); }   // đổi cảnh (vào / ra nhà...) thì dựng bộ sói mới
    const p = av.group.position, ry = av.group.rotation.y;
    const gap = target && Number.isFinite(+target.x) && Number.isFinite(+target.z) ? Math.hypot(target.x - p.x, target.z - p.z) : 0;
    if (wolf.spawn({ x: p.x, y: p.y, z: p.z }, target ? headingTo(p, target, ry) : ry, wolfRange(gap))) spawnRipple(kitOf('tre').color, 0, 3);
  }

  function tryRevive() {
    if (!canRevive(st)) return false;
    spawnRipple(0x7fd0ff, 0, 3);
    toast(`Bánh sầu riêng pho mai than tre tiếp sức — bạn hồi sinh ${pin ? 'ở chỗ đã ghim' : 'ngay tại chỗ'}! (còn ${fmtTime(remainSec(st, 'dichchuyen'))})`, 4200);
    return true;
  }

  LGT.items = { openShop, closeShop, regenMul: () => rMul(st), tryRevive, get pinned() { return pin; }, dmgMul: holdDmg, finisherMul: () => (bambooOn() ? fMul(st) : 1), onHit, get bambooOn() { return bambooOn(); }, get bamboo() { return st.tre; }, get broomOn() { return broomOn(); }, get weaponSfx() { return bambooOn() || broomOn(); },   /* Phiên 230: gậy/chổi có tiếng riêng → bỏ tiếng ném đá */  get broom() { return st.choi; }, armorMul: () => aMul(st), afterArmor: (d) => aAfter(d, st), get state() { return st; }, get staff() { return st.staff; } };
  return LGT.items;
}
