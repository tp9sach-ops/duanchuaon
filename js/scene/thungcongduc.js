// Thùng công đức (Phiên 80): hòm gỗ sơn son viền vàng có khe bỏ tiền, tấm biển "CÔNG ĐỨC" ở mặt trước, trên nắp có nụ sen vàng, đặt trên bệ đá.
// Vị trí/kích thước lấy từ js/world/donate.js (cùng nguồn với va chạm và điểm bấm). Trả { group, update(t) } — update làm ánh vàng quanh khe thở nhẹ.
import * as THREE from 'three';
import { HALL } from '../world/layout.js';
import { DONATE_BOX } from '../world/donate.js';
import { M } from './temple.js';
import { cvs } from '../util.js';

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o });

/** Tấm biển: nền son đậm, viền vàng, chữ CÔNG ĐỨC vàng, hoa sen nhỏ phía trên. */
function plaqueTexture() {
  const W = 512, H = 512, c = cvs(W, H), x = c.getContext('2d');
  x.fillStyle = '#7d1712'; x.fillRect(0, 0, W, H);
  x.strokeStyle = '#e8c15a'; x.lineWidth = 12; x.strokeRect(14, 14, W - 28, H - 28);
  x.lineWidth = 3; x.strokeRect(34, 34, W - 68, H - 68);
  x.fillStyle = '#f1cf72'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = '700 92px "Cormorant Garamond", Georgia, serif'; x.fillText('CÔNG', W / 2, 262); x.fillText('ĐỨC', W / 2, 364);
  // nụ sen: 5 cánh
  x.save(); x.translate(W / 2, 140);
  for (let i = -2; i <= 2; i++) { x.save(); x.rotate(i * 0.42); x.beginPath(); x.ellipse(0, -34, 17, 40, 0, 0, Math.PI * 2); x.fill(); x.restore(); }
  x.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

export function buildThungCongDuc() {
  const g = new THREE.Group(), { x, z, w, d, h } = DONATE_BOX, y0 = HALL.h;
  g.position.set(x, y0, z); g.name = 'thung-cong-duc';
  const add = (geo, m, px, py, pz) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  const bodyH = h - 0.3;
  add(new THREE.BoxGeometry(w + 0.2, 0.18, d + 0.2), M.stone, 0, 0.09, 0);                                   // bệ đá
  add(new THREE.BoxGeometry(w, bodyH, d), M.lacquer, 0, 0.18 + bodyH / 2, 0);                                // thân hòm sơn son
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(new THREE.BoxGeometry(0.07, bodyH, 0.07), M.gold, sx * (w / 2), 0.18 + bodyH / 2, sz * (d / 2));   // 4 cột viền vàng
  add(new THREE.BoxGeometry(w + 0.1, 0.07, d + 0.1), M.gold, 0, 0.18 + bodyH + 0.035, 0);                    // nắp vàng
  add(new THREE.BoxGeometry(w - 0.1, 0.12, d - 0.1), M.lacquer, 0, 0.18 + bodyH + 0.13, 0);                  // nắp trên sơn son
  const topY = 0.18 + bodyH + 0.2;
  add(new THREE.BoxGeometry(0.46, 0.02, 0.07), mat(0x120805), 0, topY + 0.005, 0);                            // khe bỏ tiền
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.78, w * 0.78), new THREE.MeshStandardMaterial({ map: plaqueTexture(), roughness: 0.5 }));
  plaque.position.set(0, 0.18 + bodyH * 0.5, d / 2 + 0.006); g.add(plaque);                                  // biển ở mặt +z
  // nụ sen vàng trên nắp
  const bud = new THREE.Group(); bud.position.set(0, topY + 0.02, -d * 0.18);
  for (let i = 0; i < 6; i++) {
    const p = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.26, 8), M.gold); const a = (i / 6) * Math.PI * 2;
    p.position.set(Math.cos(a) * 0.07, 0.13, Math.sin(a) * 0.07); p.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35); bud.add(p);
  }
  g.add(bud);
  // quầng sáng vàng nhạt dưới chân để thùng dễ nhận ra giữa sàn gỗ
  const glow = new THREE.Mesh(new THREE.CircleGeometry(1.25, 28), new THREE.MeshBasicMaterial({ color: 0xffc860, transparent: true, opacity: 0.16, depthWrite: false }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = 0.012; g.add(glow);
  return { group: g, update(t) { glow.material.opacity = 0.13 + 0.06 * Math.sin(t * 1.6); } };
}
