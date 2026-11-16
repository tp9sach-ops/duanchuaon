// CẢNH vùng tung chiêu xem trước (Phiên 207): khi lướt tay dùng chiêu định hướng, hiện hình chiêu (đường / nón) TÔ MÀU HỆ trên mặt đất, gốc ở chân người chơi, xoay theo hướng kéo; nhả tay thì ẩn và chiêu tung đúng vùng đó.
// Hình học: js/world/aimPreview.js (có test). Một nhóm duy nhất, dựng lại hình chỉ khi đổi chiêu; không đèn động, không bóng (rẻ cho điện thoại). CHƯA nhìn bằng mắt (môi trường AI không có WebGL). Mọi lỗi bị nuốt: hỏng thì game vẫn chạy.
import * as THREE from 'three';
import { previewPoly } from '../world/aimPreview.js';

export function createAimPreview(scene) {
  const g = new THREE.Group(); g.visible = false; scene.add(g);
  let key = '', fill = null, edge = null;
  const drop = () => { for (const o of [fill, edge]) if (o) { g.remove(o); o.geometry.dispose(); o.material.dispose(); } fill = edge = null; };
  function build(poly, color) {
    drop();
    const a = []; for (let i = 1; i < poly.length - 1; i++) a.push(poly[0][0], 0, poly[0][1], poly[i][0], 0, poly[i][1], poly[i + 1][0], 0, poly[i + 1][1]);   // quạt tam giác từ đỉnh đầu
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(a, 3));
    fill = new THREE.Mesh(fg, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }));
    const e = []; for (const q of poly) e.push(q[0], 0, q[1]);
    const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.Float32BufferAttribute(e, 3));
    edge = new THREE.LineLoop(eg, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95, depthWrite: false }));
    fill.frustumCulled = false; edge.frustumCulled = false; g.add(fill, edge);
  }
  return {
    /** x, z = chân người chơi; ry = hướng chiêu (rad, như facingOf); hinh = canhBao.hinh của chiêu; mau = '#rrggbb' màu Hệ. Trả true nếu đang hiện. */
    show({ x = 0, z = 0, ry = 0, hinh = null, mau = '' } = {}) {
      try {
        const poly = previewPoly(hinh); if (!poly) { g.visible = false; return false; }
        const k = JSON.stringify(poly) + '|' + mau; if (k !== key) { key = k; build(poly, mau || 0xffe08a); }
        g.position.set(x, 0.14, z); g.rotation.y = ry; g.visible = true; return true;
      } catch (_) { g.visible = false; return false; }
    },
    hide() { g.visible = false; },
    dispose() { drop(); scene.remove(g); },
  };
}
