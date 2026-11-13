// Cưỡi / cầm đồ (mục 1): giao diện. Luật: js/world/loadout.js (có test) + js/world/board.js (ván: mua 100 lá bồ đề). Đặt LGT.board = { own, on, speedMul, toggle(), buy(), shop(), status() } và LGT.loadout = { hold, weapon, owned(), list(), choose(id) }.
// - Mặc định ai cũng cầm và CƯỠI THƯƠNG. Mua Gậy như ý (Điện Máy, 400 lá) thì đánh và cưỡi bằng gậy (hai đầu chớp sáng, vệt sáng khi bay). Mua Ván trượt (100 lá) thì cưỡi/lướt ván; ván KHÔNG phải vũ khí. Người chơi chọn đồ cầm ở Túi đồ (js/ui/bag.js); nút cưỡi ở dock cưỡi đúng đồ đang cầm (nhãn rideLabel).
// - Tốc độ theo MOUNT_MUL trong js/world/loadout.js (thương/gậy ×1,25 là số TẠM chờ ptg chốt; ván ×1,5). world.js nhân LGT.board.speedMul.
// - Vào trận (LGT.combatPose.stance) thì KHÔNG cưỡi được: đang cưỡi → đồ rời chân, xoay một vòng quanh người rồi bay về tay (returnPose) và biến mất. Ván trượt 3D nạp từ assets/models/skateboard.glb (thiếu file thì dùng ván khối).
// Dữ liệu: 'lgt.van' (đã mua ván chưa; khóa mới, KHÔNG dùng 'lgt.board' cũ vì đó là thương bay mua bằng hạt sen, nay ai cũng có thương) + 'lgt.loadout'. CHƯA nhìn bằng mắt trên máy thật.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { BOARD, loadBoard, buyBoard, canRide, returnPose } from '../world/board.js';
import { HOLDS, holdById, loadLoadout, chooseHold, weaponFor, ownedMap, mountMul, rideLabel } from '../world/loadout.js';
import { askConfirm } from './dialog.js';
import { buildStaff, loadStaffGlb, pulseGlows, glowTexture } from './staffMesh.js';

const VKEY = 'lgt.van', LKEY = 'lgt.loadout', GLB = new URL('../../assets/models/skateboard.glb', import.meta.url).href;
const FLY_LIFT = 0.45, FLY_BOB = 0.035, K = 3, SLEN = 2.6, VLEN = 1.1, VBOB = 0.006;   // K: cán thương dày gấp 3 (chỉ bề ngang); SLEN: dài cây thương/gậy khi cưỡi; VLEN: dài ván

/** Cây thương cưỡi (như Phiên 130–131): nằm ngang, hướng +z, cán gỗ đỏ sẫm dày, hai đầu bọ tròn chụp vàng. Gốc = chỗ nhân vật đứng. */
function buildSpearMount() {
  const g = new THREE.Group(); g.name = 'cuoi-thuong'; g.visible = false;
  const wood = new THREE.MeshStandardMaterial({ color: 0x7a2a1c, roughness: 0.5 }), gold = new THREE.MeshStandardMaterial({ color: 0xe0a93a, roughness: 0.3, metalness: 0.4 }), red = new THREE.MeshStandardMaterial({ color: 0xc8261c, roughness: 0.55 });
  const R = 0.055 * K, Y = -R;
  const along = (geo, mat, z) => { const m = new THREE.Mesh(geo, mat); m.rotation.x = Math.PI / 2; m.position.set(0, Y, z); g.add(m); return m; };
  along(new THREE.CylinderGeometry(R, R, SLEN, 16), wood, 0);
  for (const z of [-0.55, 0.55]) along(new THREE.CylinderGeometry(0.07 * K, 0.07 * K, 0.1, 16), gold, z);
  along(new THREE.CylinderGeometry(0.085 * K, 0.085 * K, 0.16, 16), red, SLEN / 2 - 0.2);
  for (const s of [-1, 1]) { along(new THREE.CylinderGeometry(0.075 * K, 0.075 * K, 0.14, 16), gold, s * (SLEN / 2)); const cap = new THREE.Mesh(new THREE.SphereGeometry(0.075 * K, 16, 12), gold); cap.scale.set(1, 1, 0.45); cap.position.set(0, Y, s * (SLEN / 2 + 0.05)); g.add(cap); }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

/** Gậy như ý cưỡi bay: cây gậy 3D nằm ngang (to gấp ~1,7), hai đầu chớp sáng, có vệt sáng phía sau khi bay. */
function buildStaffMount() {
  const g = new THREE.Group(); g.name = 'cuoi-gay'; g.visible = false;
  const s = buildStaff(); s.rotation.x = Math.PI / 2; s.scale.setScalar(SLEN / 1.5); s.position.y = -0.07; g.add(s); loadStaffGlb(s);
  const trail = [];
  for (let i = 0; i < 9; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    sp.position.set(0, -0.07, -(SLEN / 2 + 0.2 + i * 0.32)); const k = 0.9 - i * 0.07; sp.scale.set(k, k, 1); g.add(sp); trail.push(sp);
  }
  g.userData.staff = s; g.userData.trail = trail;
  return g;
}

/** Ván trượt dựng bằng khối (dùng khi chưa có GLB). Gốc = chỗ người đứng, mặt ván ở y = 0, đáy bánh xe ở y = -0,14. */
function buildProcBoard() {
  const g = new THREE.Group(); g.name = 'vantruot-khoi';
  const deck = new THREE.MeshStandardMaterial({ color: 0xf2a31b, roughness: 0.5 }), dark = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.7 }), wheel = new THREE.MeshStandardMaterial({ color: 0xf4f1e6, roughness: 0.4 }), metal = new THREE.MeshStandardMaterial({ color: 0xaab2bd, roughness: 0.35, metalness: 0.7 });
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
  add(new THREE.BoxGeometry(0.24, 0.03, VLEN * 0.72), deck, 0, -0.015, 0);
  for (const s of [-1, 1]) { const k = add(new THREE.BoxGeometry(0.24, 0.03, VLEN * 0.15), deck, 0, 0.0, s * VLEN * 0.4); k.rotation.x = -s * 0.28; }
  add(new THREE.BoxGeometry(0.235, 0.004, VLEN * 0.72), dark, 0, 0.001, 0);
  for (const z of [-0.3, 0.3]) { add(new THREE.BoxGeometry(0.2, 0.02, 0.035), metal, 0, -0.05, z); for (const x of [-0.1, 0.1]) { const w = add(new THREE.CylinderGeometry(0.04, 0.04, 0.035, 14), wheel, x, -0.1, z); w.rotation.z = Math.PI / 2; } }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

/** Chuẩn hóa GLB ván: trục dài nhất → +z, dài VLEN m, giữa theo x/z, mặt trên ván ở y = 0. Trả { root, height }. */
function normalizeGlb(model) {
  const holder = new THREE.Group(); holder.add(model); model.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
  if (size.x > size.z && size.x >= size.y) holder.rotation.y = Math.PI / 2;
  model.scale.setScalar(VLEN / Math.max(size.x, size.y, size.z, 1e-6));
  const root = new THREE.Group(); root.add(holder); root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root), c = box.getCenter(new THREE.Vector3());
  holder.position.set(-c.x, -box.max.y, -c.z);
  root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { root, height: Math.max(0.05, box.max.y - box.min.y) };
}

export function initBoard({ toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let van; try { van = loadBoard(localStorage.getItem(VKEY)); } catch (_) { van = loadBoard(null); }
  let rawLo = null; try { rawLo = JSON.parse(localStorage.getItem(LKEY)); } catch (_) { rawLo = null; }
  const saveVan = () => { try { localStorage.setItem(VKEY, JSON.stringify({ own: van.own, on: false })); } catch (_) { /* riêng tư */ } };
  const saveLo = () => { try { localStorage.setItem(LKEY, JSON.stringify(rawLo)); } catch (_) { /* riêng tư */ } };
  // Trạng thái chọn đồ thô (rawLo) không bị ép về Thương khi LGT.items chưa nạp xong: mỗi lần đọc đều lọc lại theo đồ đã có.
  const owned = () => ownedMap({ nhuy: !!(LGT.items && LGT.items.state && LGT.items.state.staff), van: van.own });
  const cur = () => loadLoadout(rawLo, owned());
  const mountId = () => cur().hold;
  const nameOf = (id) => (holdById(id) || { ten: 'đồ' }).ten;

  let on = false, shown = 'thuong', lift = 0, clock = 0, ret = null, vBase = 0.14, glb = null, loading = false, meshes = null;   // ret = { t, id }
  const fighting = () => !!(LGT.combatPose && LGT.combatPose.stance);
  const la = () => (LGT.merit && LGT.merit.leaf ? LGT.merit.leaf.la : 0);
  const mulText = (id) => String(mountMul(id)).replace('.', ',');
  const placeRiding = (m) => { m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); };
  function placeReturn(av, dt, m) {
    ret.t += dt; const p = returnPose(ret.t);
    if (p.done) { ret = null; m.visible = false; placeRiding(m); m.scale.setScalar(1); return; }
    let hx = 0.3, hy = 1.0, hz = 0.2;
    if (av.handPos && av.group) { av.group.updateWorldMatrix(true, false); const h = av.handPos(), v = av.group.worldToLocal(new THREE.Vector3(h.x, h.y, h.z)); hx = v.x; hy = v.y; hz = v.z; }
    const ox = Math.sin(p.ang) * p.rad, oz = Math.cos(p.ang) * p.rad, oy = 1.1;
    m.position.set(ox + (hx - ox) * p.blend, oy + (hy - oy) * p.blend, oz + (hz - oz) * p.blend);
    m.rotation.set(0, p.ang + Math.PI / 2, 0);
    const k = 1 - 0.55 * p.blend; if (ret.id === 'thuong') m.scale.set(k / K, k / K, k); else m.scale.setScalar(k);
    m.visible = true;
  }

  function ensureVan() {   // nạp GLB ván một lần (chỉ khi đã mua ván); lỗi / thiếu file thì giữ ván khối
    if (loading || glb || !meshes || !van.own) return; loading = true;
    try {
      new GLTFLoader().load(GLB, (gltf) => {
        try { const r = normalizeGlb(gltf.scene); glb = r.root; vBase = r.height + 0.01; meshes.van.add(glb); meshes.van.userData.proc.visible = false; }
        catch (err) { console.warn('[Diệu Giang Tự] Không xử lý được ván trượt 3D, dùng ván khối:', err); }
      }, undefined, (err) => { console.warn('[Diệu Giang Tự] Chưa nạp được assets/models/skateboard.glb, dùng ván khối:', err && err.message ? err.message : err); });
    } catch (err) { console.warn('[Diệu Giang Tự] Không nạp được ván trượt 3D:', err); }
  }

  function wrap() {
    const av = LGT.world && LGT.world.avatar; if (!av || av.__board || !av.group) return;
    const proc = buildProcBoard(), vg = new THREE.Group(); vg.name = 'cuoi-van'; vg.add(proc); vg.userData.proc = proc;
    meshes = { thuong: buildSpearMount(), nhuy: buildStaffMount(), van: vg };
    for (const k of Object.keys(meshes)) { meshes[k].visible = false; av.group.add(meshes[k]); }
    const orig = av.update.bind(av); av.__board = true;
    av.update = (dt) => {
      orig(dt); clock += dt;
      const id = on ? mountId() : (ret ? ret.id : shown), isVan = id === 'van';
      const want = on ? (isVan ? vBase : FLY_LIFT) + Math.sin(clock * (isVan ? 9 : 3)) * (isVan ? VBOB : FLY_BOB) : 0;
      lift += (want - lift) * Math.min(1, 14 * dt);
      for (const k of Object.keys(meshes)) meshes[k].visible = false;
      const m = meshes[id];
      if (m) {
        if (ret) placeReturn(av, dt, m);
        else if (on || lift > 0.01) { m.visible = true; placeRiding(m); m.scale.setScalar(1); if (on) shown = id; }
        if (id === 'nhuy' && m.visible) {   // gậy cưỡi: hai đầu chớp nhanh + vệt sáng phía sau (chỉ khi đang bay)
          pulseGlows(m.userData.staff, clock, true);
          m.userData.trail.forEach((sp, i) => { sp.material.opacity = on ? Math.max(0, 0.55 - i * 0.055) * (0.7 + 0.3 * Math.sin(clock * 10 + i)) : 0; });
        }
      }
      if (av.group) av.group.position.y += lift;
    };
  }
  function ctx() {
    const W = LGT.world;
    return { free: !!W && W.mode === 'free' && !LGT.panelOpen && !LGT.heldBy, inHouse: !!LGT.inHouse, swim: !!(LGT.swim && LGT.swim.active), fight: fighting() };
  }
  function tick() {
    wrap(); ensureVan();
    if (!on) return;
    const c = ctx();
    if (!canRide(c)) {
      const id = mountId(); on = false;
      if (c.fight && c.free) { ret = { t: 0, id }; toast(`Vào trận rồi — ${nameOf(id).toLowerCase()} bay về tay bạn. Đang đánh nhau không cưỡi được.`, 3200); }   // vào nhà / bơi / bị khiêng: chỉ xuống, không diễn bay
    }
  }
  setInterval(tick, 100);

  /** Chọn đồ cầm (Túi đồ). silent = không toast (khi mua xong tự cầm). */
  function choose(id, silent) {
    const r = chooseHold(rawLo, id, owned());
    if (!r.ok) { if (!silent) toast(r.reason === 'notowned' ? `Bạn chưa có ${nameOf(id)}. Mua ở Điện Máy Lam Sen.` : 'Không có món này.', 3200); return false; }
    if (on && id !== mountId()) { on = false; ret = null; }   // đang cưỡi món khác → bước xuống
    rawLo = r.state; saveLo();
    if (!silent) toast(id === 'van' ? 'Bạn cầm Ván trượt (không phải vũ khí — đánh nhau sẽ dùng vũ khí cầm trước đó).' : `Bạn cầm ${nameOf(id)} — đánh và cưỡi bằng ${nameOf(id).toLowerCase()}.`, 3200);
    return true;
  }

  /** Mua ván bằng 100 lá bồ đề. Trả Promise<boolean>. */
  async function buy() {
    if (van.own) { toast('Bạn đã có Ván trượt. Chọn “Ván trượt” ở Túi đồ rồi bấm nút cưỡi.', 4200); return false; }
    const ok = await askConfirm(`Ván trượt — ${BOARD.gia} lá bồ đề.\nLướt ván đi nhanh gấp ${mulText('van')} lần bình thường. Ván không phải vũ khí (không đánh được); đánh nhau thì tự xuống.\nBạn đang có ${la()} lá bồ đề. Mua không?`, { ok: 'Mua', cancel: 'Để sau' });
    if (!ok) return false;
    const r = buyBoard(van, la());
    if (!r.ok) { toast(r.reason === 'owned' ? 'Bạn đã có ván trượt rồi.' : `Chưa đủ lá bồ đề (cần ${r.cost}, bạn có ${la()}). Đổi thêm lá ở Thầy Tri khách.`, 3600); return false; }
    if (!(LGT.merit && LGT.merit.spendLa && LGT.merit.spendLa(r.cost))) { toast('Chưa đủ lá bồ đề.', 2500); return false; }
    van = { own: true, on: false }; saveVan(); choose('van', true); ensureVan();
    toast(`Đã mua Ván trượt (−${r.cost} lá bồ đề). Bạn đang cầm ván — bấm “Lướt ván”; đổi về Thương/Gậy ở Túi đồ.`, 4600);
    return true;
  }

  const api = {
    get own() { return true; }, get on() { return on; }, get speedMul() { return on ? mountMul(mountId()) : 1; },
    toggle() {
      const id = mountId(), nm = nameOf(id).toLowerCase();
      if (!on && fighting()) { toast(`Đang giao chiến, không cưỡi ${nm} được. Hết đánh nhau rồi hãy cưỡi.`, 2800); return; }
      if (!on && !canRide(ctx())) { toast(`Chỗ này không cưỡi ${nm} được (trong nhà, dưới nước hoặc đang bận).`, 2800); return; }
      on = !on; if (on) { ret = null; ensureVan(); }
      toast(on ? (id === 'van' ? `Bạn lướt ván trượt — đi nhanh gấp ${mulText(id)}!` : `Bạn cưỡi ${nm} bay — đi nhanh gấp ${mulText(id)}!`) : `Bạn bước xuống ${nm}.`, 2200);
    },
    buy, shop: buy,
    status() { const id = mountId(); return { own: true, on, hold: id, label: rideLabel(id, on), van: van.own }; },
  };
  LGT.board = api;
  LGT.loadout = {
    get hold() { return mountId(); }, get weapon() { return weaponFor(rawLo, owned()); }, owned,
    list() { const c = mountId(), o = owned(); return HOLDS.map((h) => ({ id: h.id, ten: h.ten, mo: h.mo, weapon: h.weapon, own: !!o[h.id], current: c === h.id })); },
    choose,
  };
  import('./items.js').then((m) => m.initItems({ toast })).catch((e) => console.warn('[Diệu Giang Tự] Vật phẩm lá bồ đề lỗi:', e && e.message));   // Ngọc hồi máu / dịch chuyển / Gậy như ý (mục 1)
  return api;
}
