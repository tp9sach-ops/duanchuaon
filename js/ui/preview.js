// Xem trước món nội thất bằng hình 3D (Phiên 42, việc 4): khung lớn xoay chậm + ảnh nhỏ từng món trong cửa hàng.
// Dùng lại đúng hàm vẽ đồ của cảnh trong nhà (LGT.interiorScene.buildItem) nên hình giống hệt lúc đặt vào nhà. Mọi chữ qua textContent.
// Bộ vẽ (WebGLRenderer) tạo lười khi mở cửa hàng; không có WebGL thì createPreview trả về bản rỗng (cửa hàng vẫn dùng được, chỉ không có hình).
import * as THREE from 'three';

const FOV = 32;
/** Một "sân khấu" nhỏ: cảnh + camera + 2 đèn + đĩa nền; setItem(f) dựng món, frame tự canh khung theo kích thước món. */
function makeStage(renderer, host) {
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(FOV, 1, 0.05, 60);
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x6a5a48, 1.05));
  const sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.position.set(2.5, 4, 3); scene.add(sun);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshStandardMaterial({ color: 0x3a3340, roughness: 0.9 })); disc.rotation.x = -Math.PI / 2; disc.position.y = -0.005; scene.add(disc);
  const holder = new THREE.Group(); scene.add(holder);
  let item = null, cur = null;
  function clear() { if (!item) return; holder.remove(item); const S = host(); if (S && S.disposeItem) S.disposeItem(item); item = null; cur = null; }
  function setItem(f) {
    if (cur === f.id && item) return true;
    clear(); const S = host(); if (!S || !S.buildItem) return false;
    const g = S.buildItem(f), box = new THREE.Box3().setFromObject(g), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    g.position.set(-c.x, 0, -c.z); holder.add(g); item = g; cur = f.id;
    const r = Math.max(0.3, size.length() / 2), dist = (r / Math.sin((FOV / 2) * Math.PI / 180)) * 1.02, ty = size.y * 0.45;
    disc.scale.setScalar(Math.max(size.x, size.z) * 0.85 + 0.15);
    cam.position.set(dist * 0.5, ty + dist * 0.42, dist * 0.78); cam.lookAt(0, ty, 0);
    return true;
  }
  const render = (ry) => { holder.rotation.y = ry; renderer.render(scene, cam); };
  function setAspect(a) { cam.aspect = a; cam.updateProjectionMatrix(); }
  return { setItem, render, clear, setAspect, dispose() { clear(); disc.geometry.dispose(); disc.material.dispose(); } };
}

/** getScene: () => LGT.interiorScene. Trả { el (khung xem trước), show(f), start(), stop(), thumb(f) → dataURL|'' (vẽ nếu chưa có), cached(f) (chỉ lấy ảnh đã có), endThumbs(), ok }. */
export function createPreview(getScene) {
  const el = document.createElement('div'); el.className = 'fn-pv';
  const canvas = document.createElement('canvas'); canvas.width = 480; canvas.height = 270; canvas.className = 'fn-pv-c';
  const cap = document.createElement('div'); cap.className = 'fn-pv-cap';
  el.append(canvas, cap);
  let renderer = null, stage = null, failed = false, running = false, raf = 0, last = 0, ry = 0.6, want = null;
  const ensure = () => {
    if (failed) return false; if (renderer) return true;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); renderer.setPixelRatio(1); renderer.setSize(480, 270, false);
      stage = makeStage(renderer, getScene); stage.setAspect(480 / 270); return true;
    } catch (_) { failed = true; renderer = null; el.hidden = true; return false; }
  };
  function loop(t) {
    raf = 0; if (!running) return;
    const dt = last ? Math.min(0.1, (t - last) / 1000) : 0; last = t; ry += dt * 0.7;
    if (want && stage) stage.render(ry);
    raf = requestAnimationFrame(loop);
  }
  function show(f) {
    want = f; if (!f) return;
    cap.textContent = `${f.ten} · ${f.w}×${f.d}×${f.h} m`;
    if (ensure() && !stage.setItem(f)) { want = null; }
    if (want && stage && !running) stage.render(ry);
  }
  function start() { if (!ensure() || running) return; running = true; last = 0; raf = requestAnimationFrame(loop); }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

  // ảnh nhỏ từng món: bộ vẽ riêng 96×96, tạo khi cần, hủy khi xong để không giữ thêm WebGL
  const cache = new Map();
  let tr = null, ts = null;
  function thumb(f) {
    if (cache.has(f.id)) return cache.get(f.id);
    if (failed) return '';
    try {
      if (!tr) { const c = document.createElement('canvas'); tr = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true, preserveDrawingBuffer: true }); tr.setPixelRatio(1); tr.setSize(96, 96, false); ts = makeStage(tr, getScene); ts.setAspect(1); }
      if (!ts.setItem(f)) return '';
      ts.render(0.7); const url = tr.domElement.toDataURL('image/png'); cache.set(f.id, url); return url;
    } catch (_) { return ''; }
  }
  function endThumbs() { if (!tr) return; try { ts.dispose(); tr.dispose(); tr.forceContextLoss(); } catch (_) { /* bỏ qua */ } tr = ts = null; }
  return { el, show, start, stop, thumb, endThumbs, cached: (f) => cache.get(f.id) || '', get ok() { return !failed; } };
}
