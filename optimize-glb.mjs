// Xử lý GLB cây (Phiên 14f). Dùng: node optimize-glb.mjs vao.glb ra.glb <tối đa tam giác> <cỡ ảnh px> [sai số simplify]; cần: npm i @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer sharp
// Xử lý GLB cây: giải nén meshopt, đổi spec-gloss -> metal-rough (three 0.160 không còn đọc spec-gloss), gộp mesh, giảm tam giác, ảnh webp ≤ cỡ chỉ định, nén lại meshopt.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { dequantize, flatten, join, weld, simplify, prune, dedup, quantize, metalRough, textureCompress, resample, unpartition, getBounds } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'node:fs';


function dropFlat(doc) {
  const scene = doc.getRoot().listScenes()[0], nodes = []; const walk = (n) => { nodes.push(n); n.listChildren().forEach(walk); }; scene.listChildren().forEach(walk);
  const items = []; let gy0 = 1e30, gy1 = -1e30, gx0 = 1e30, gx1 = -1e30;
  for (const n of nodes) { const m = n.getMesh(); if (!m) continue; const w = n.getWorldMatrix();
    for (const p of m.listPrimitives()) { const P = p.getAttribute('POSITION'), v = [0,0,0]; let a = [1e30,1e30,1e30], b = [-1e30,-1e30,-1e30];
      for (let i = 0; i < P.getCount(); i++) { P.getElement(i, v); const x = w[0]*v[0]+w[4]*v[1]+w[8]*v[2]+w[12], y = w[1]*v[0]+w[5]*v[1]+w[9]*v[2]+w[13], z = w[2]*v[0]+w[6]*v[1]+w[10]*v[2]+w[14]; a = [Math.min(a[0],x),Math.min(a[1],y),Math.min(a[2],z)]; b = [Math.max(b[0],x),Math.max(b[1],y),Math.max(b[2],z)]; }
      items.push({ m, p, a, b }); gy0 = Math.min(gy0, a[1]); gy1 = Math.max(gy1, b[1]); gx0 = Math.min(gx0, a[0]); gx1 = Math.max(gx1, b[0]); } }
  const H = gy1 - gy0, W = gx1 - gx0; let dropped = 0;
  for (const it of items) if ((it.b[1] - it.a[1]) < 0.02 * H && (it.b[0] - it.a[0]) > 0.25 * W) { it.m.removePrimitive(it.p); it.p.dispose(); dropped++; }
  return dropped;
}
// Bake: đưa mọi đỉnh về toạ độ thế giới, chuẩn hoá cây cao đúng 1 đơn vị, gốc ở (0,0,0) (đáy ở y=0, tâm x/z ở giữa tán thân)
function bake(doc) {
  const scene = doc.getRoot().listScenes()[0], nodes = [];
  const walk = (n) => { nodes.push(n); n.listChildren().forEach(walk); }; scene.listChildren().forEach(walk);
  const seen = new Set(); let mn = [1e30, 1e30, 1e30], mx = [-1e30, -1e30, -1e30];
  const mats = new Map();
  for (const n of nodes) {
    const m = n.getMesh(); if (!m) continue;
    if (seen.has(m)) throw new Error('mesh dùng chung nhiều node'); seen.add(m);
    const w = n.getWorldMatrix(); mats.set(n, w);
    for (const p of m.listPrimitives()) {
      const P = p.getAttribute('POSITION'), N = p.getAttribute('NORMAL'), v = [0, 0, 0];
      for (let i = 0; i < P.getCount(); i++) { P.getElement(i, v); const x = w[0]*v[0]+w[4]*v[1]+w[8]*v[2]+w[12], y = w[1]*v[0]+w[5]*v[1]+w[9]*v[2]+w[13], z = w[2]*v[0]+w[6]*v[1]+w[10]*v[2]+w[14]; P.setElement(i, [x, y, z]); mn = [Math.min(mn[0], x), Math.min(mn[1], y), Math.min(mn[2], z)]; mx = [Math.max(mx[0], x), Math.max(mx[1], y), Math.max(mx[2], z)]; }
      if (N) { const sx = Math.hypot(w[0], w[1], w[2]), sy = Math.hypot(w[4], w[5], w[6]), sz = Math.hypot(w[8], w[9], w[10]); for (let i = 0; i < N.getCount(); i++) { N.getElement(i, v); let x = (w[0]*v[0]/sx/sx+w[4]*v[1]/sy/sy+w[8]*v[2]/sz/sz), y = (w[1]*v[0]/sx/sx+w[5]*v[1]/sy/sy+w[9]*v[2]/sz/sz), z = (w[2]*v[0]/sx/sx+w[6]*v[1]/sy/sy+w[10]*v[2]/sz/sz); const l = Math.hypot(x, y, z) || 1; N.setElement(i, [x/l, y/l, z/l]); } }
    }
  }
  const H = mx[1] - mn[1], cx = (mn[0] + mx[0]) / 2, cz = (mn[2] + mx[2]) / 2;
  for (const n of nodes) { const m = n.getMesh(); if (!m) continue; for (const p of m.listPrimitives()) { const P = p.getAttribute('POSITION'), v = [0, 0, 0]; for (let i = 0; i < P.getCount(); i++) { P.getElement(i, v); P.setElement(i, [(v[0]-cx)/H, (v[1]-mn[1])/H, (v[2]-cz)/H]); } } }
  // gỡ node: mỗi mesh thành con trực tiếp của scene, ma trận đơn vị
  for (const n of nodes) { n.setTranslation([0,0,0]).setRotation([0,0,0,1]).setScale([1,1,1]); }
  for (const n of nodes) { if (n.getMesh()) { n.getParentNode()?.removeChild(n); scene.addChild(n); } }
  for (const n of nodes) if (!n.getMesh() && !n.listChildren().length) { n.getParentNode()?.removeChild(n); scene.removeChild(n); }
  return { H: +H.toFixed(2), w: +((mx[0]-mn[0])/H).toFixed(2), d: +((mx[2]-mn[2])/H).toFixed(2) };
}
await MeshoptDecoder.ready; await MeshoptEncoder.ready; await MeshoptSimplifier.ready;
const [,, src, dst, tris, tex, errArg] = process.argv;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(src);
const count = (d) => { let n = 0; for (const m of d.getRoot().listMeshes()) for (const p of m.listPrimitives()) n += (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3; return n | 0; };
const before = count(doc);
await doc.transform(
  dequantize(),
  metalRough({}),
  flatten(),
  join({ keepMeshes: false, keepNamed: false }),
  weld(),
);
const dropped = dropFlat(doc);
const info = bake(doc); info.dropped = dropped;
await doc.transform(join({ keepMeshes: false, keepNamed: false }));
const mid = count(doc);
const target = +tris;
if (mid > target) await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio: target / mid, error: +(errArg || 0.02), lockBorder: false }));
await doc.transform(
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [+tex, +tex], quality: 80 }),
  prune(), dedup(), quantize({ quantizePosition: 14, quantizeTexcoord: 12, quantizeNormal: 10 }),
);
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
await io.write(dst, doc);
const r = doc.getRoot(), bb = getBounds(r.getDefaultScene() || r.listScenes()[0]);
console.log(JSON.stringify({ info, src: src.split('/').pop().slice(0, 24), before, mid, after: count(doc), meshes: r.listMeshes().length, prims: r.listMeshes().reduce((a, m) => a + m.listPrimitives().length, 0), mats: r.listMaterials().length, tex: r.listTextures().length, kb: (fs.statSync(dst).size / 1024) | 0, min: bb.min.map((x) => +x.toFixed(2)), max: bb.max.map((x) => +x.toFixed(2)) }));
