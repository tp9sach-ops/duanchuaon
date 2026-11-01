// Camera rail: 7 trạm. Không còn cuộn trang: người dùng bấm điểm sáng / menu → goTo(i), camera bay mượt dọc đường cong.
import * as THREE from 'three';
import { clamp, damp } from '../util.js';

// QUAN TRỌNG: thứ tự và số trạm phải khớp với data-cam trong index.html.
export const CAM = [
  { name: 'hero',    pos: [0, 9, 70],     look: [0, 12, -30]  }, // toàn cảnh quần thể chùa trên núi
  { name: 'today',   pos: [5, 5.5, 62],   look: [0, 8, 34]    }, // tiến tới Tam quan
  { name: 'fortune', pos: [-14, 3.4, 28], look: [0, 1.5, 14]  }, // ao sen
  { name: 'charts',  pos: [10, 6, 6],     look: [0, 12, -70]  }, // ngước nhìn quần thể chùa phía sau
  { name: 'reading', pos: [22, 3.2, 14],  look: [28, 7, -2]   }, // gác chuông
  { name: 'temple',  pos: [0, 4.2, 4],    look: [0, 3.4, -26] }, // chánh điện: tượng Phật, bàn thờ
  { name: 'summary', pos: [0, 40, 38],    look: [0, 24, -60]  }, // bay lên, trăng và sao
];

export function createRail(camera) {
  const posCurve = new THREE.CatmullRomCurve3(CAM.map((c) => new THREE.Vector3(...c.pos)), false, 'centripetal');
  const lookCurve = new THREE.CatmullRomCurve3(CAM.map((c) => new THREE.Vector3(...c.look)), false, 'centripetal');
  const sections = [...document.querySelectorAll('[data-cam]')].filter((el) => el.tagName !== 'FOOTER');
  let f = 0, target = 0;
  const p = new THREE.Vector3(), l = new THREE.Vector3();

  return {
    sections,
    get index() { return f; },
    get target() { return target; },
    goTo(i) { target = clamp(Math.round(i), 0, CAM.length - 1); },
    update(dt, reduce) {
      f = reduce ? target : damp(f, target, 2.6, dt);
      const t = f / (CAM.length - 1);
      posCurve.getPoint(t, p); lookCurve.getPoint(t, l);
      // Màn hình dọc: hạ cảnh xuống một chút ở trạm đầu để chữ giới thiệu không đè lên chùa
      if (camera.aspect < 0.85) l.y += 8 * clamp(1 - f, 0, 1);
      camera.position.copy(p); camera.lookAt(l);
      return f;
    },
    snap() { f = target; },
  };
}
