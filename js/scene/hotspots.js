// Điểm sáng bấm được trong cảnh 3D: nút HTML đặt theo toạ độ chiếu của một điểm 3D (dễ dùng bằng bàn phím, đọc được bằng trình đọc màn hình).
import * as THREE from 'three';

import { SPOTS } from '../world/spots.js';

// Vị trí nhãn và tên lấy từ js/world/spots.js (nơi duy nhất định nghĩa điểm đến + điểm đứng). Bấm nhãn → nhân vật đi tới rồi mới mở bảng.
export const HOTSPOTS = SPOTS.map((s) => ({ id: s.id, num: s.num, label: s.label, at: s.look }));

export function createHotspots(camera, onPick) {
  const layer = document.getElementById('hotspots');
  if (!layer) return { update() {}, setVisible() {} };
  const p = new THREE.Vector3(), q = new THREE.Vector3();
  const items = HOTSPOTS.map((d) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'hs'; b.dataset.open = d.id;
    b.setAttribute('aria-label', 'Mở: ' + d.label);
    b.innerHTML = '<i class="hs-dot"></i><span class="hs-tx"><b>' + d.num + '</b>' + d.label + '</span>';
    b.addEventListener('click', () => onPick(d.id));
    layer.appendChild(b);
    return { b, v: new THREE.Vector3(...d.at) };
  });
  let visible = true;
  return {
    setVisible(v) { visible = v; layer.classList.toggle('off', !v); },
    update(w, h) {
      if (!visible) return;
      for (const it of items) {
        q.copy(it.v).applyMatrix4(camera.matrixWorldInverse);          // toạ độ trong hệ camera: z<0 là phía trước
        p.copy(it.v).project(camera);
        const ok = q.z < -1 && Math.abs(p.x) < 1.05 && Math.abs(p.y) < 1.05;
        it.b.style.visibility = ok ? 'visible' : 'hidden';
        if (ok) it.b.style.transform = 'translate3d(' + ((p.x * 0.5 + 0.5) * w).toFixed(1) + 'px,' + ((-p.y * 0.5 + 0.5) * h).toFixed(1) + 'px,0)';
      }
    },
  };
}
