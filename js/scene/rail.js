// Camera rail: 7 mốc, mỗi mốc ứng với một section có data-cam.
// Cuộn trang → tiến độ f (0..6) → vị trí/hướng nhìn trên đường cong CatmullRom.
import * as THREE from 'three';
import { clamp, damp } from '../util.js';

// QUAN TRỌNG: thứ tự và số mốc phải khớp với data-cam trong index.html.
export const CAM = [
  { name: 'hero',    pos: [0, 9, 70],    look: [0, 11, 0]    }, // toàn cảnh chùa trên núi
  { name: 'today',   pos: [5, 5.5, 62],  look: [0, 7, 34]    }, // tiến tới Tam quan
  { name: 'fortune', pos: [-14, 3.4, 28], look: [0, 1.5, 14]  }, // ao sen
  { name: 'charts',  pos: [6, 3.8, 0],   look: [0, 14, -34]   }, // ngước lên chính điện, bầu trời
  { name: 'reading', pos: [22, 3.2, 14], look: [28, 7, -2]    }, // gác chuông
  { name: 'temple',  pos: [0, 3.4, 2],   look: [0, 2.6, -8]   }, // lư hương trước điện
  { name: 'summary', pos: [0, 40, 38],   look: [0, 24, -60]   }, // bay lên, trăng và sao
];

export function createRail(camera) {
  const posCurve = new THREE.CatmullRomCurve3(CAM.map((c) => new THREE.Vector3(...c.pos)), false, 'centripetal');
  const lookCurve = new THREE.CatmullRomCurve3(CAM.map((c) => new THREE.Vector3(...c.look)), false, 'centripetal');
  const sections = [...document.querySelectorAll('[data-cam]')].filter((el) => el.tagName !== 'FOOTER');
  let anchors = [], f = 0, target = 0;
  const p = new THREE.Vector3(), l = new THREE.Vector3();

  // Neo = vị trí cuộn mà tại đó camera đứng đúng mốc của section
  const measure = () => {
    const vh = innerHeight;
    anchors = sections.map((el, i) => (i === 0 ? 0 : el.getBoundingClientRect().top + scrollY - vh * 0.35));
  };
  const progress = (y) => {
    if (!anchors.length) return 0;
    if (y <= anchors[0]) return 0;
    for (let i = 0; i < anchors.length - 1; i++) {
      if (y < anchors[i + 1]) return i + (y - anchors[i]) / Math.max(1, anchors[i + 1] - anchors[i]);
    }
    return anchors.length - 1;
  };
  measure();
  addEventListener('resize', measure);
  addEventListener('load', measure);
  new ResizeObserver(measure).observe(document.body);

  return {
    sections,
    get index() { return f; },
    update(dt, reduce) {
      target = clamp(progress(scrollY), 0, CAM.length - 1);
      f = reduce ? target : damp(f, target, 3.2, dt);
      const t = f / (CAM.length - 1);
      posCurve.getPoint(t, p); lookCurve.getPoint(t, l);
      camera.position.copy(p); camera.lookAt(l);
      return f;
    },
    snap() { target = clamp(progress(scrollY), 0, CAM.length - 1); f = target; },
  };
}
