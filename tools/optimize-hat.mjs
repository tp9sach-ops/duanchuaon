// Tạo js/data/hatGlb.js từ file nón Jingasa gốc (13 MB). Chạy: npm i @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer
//   node tools/optimize-hat.mjs <japanese_hat_jingasa.glb> > js/data/hatGlb.js
// Bỏ 5 mảnh dây cằm (vật liệu jingasa_rope), gộp đỉnh, giảm tam giác, bỏ pháp tuyến/UV, nén toạ độ int16 rồi nhúng base64.
import { NodeIO, Logger } from '@gltf-transform/core';
import { KHRMeshQuantization } from '@gltf-transform/extensions';
import { quantize, prune, dedup, weld, simplify } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
const io = new NodeIO().registerExtensions([KHRMeshQuantization]);
const doc = await io.read(process.argv[2]); doc.setLogger(new Logger(Logger.Verbosity.SILENT)); const root = doc.getRoot();
const rope = root.listMaterials().find((m) => m.getName() === 'jingasa_rope');
for (const mesh of root.listMeshes()) if (mesh.listPrimitives().every((p) => p.getMaterial() === rope)) { for (const n of root.listNodes()) if (n.getMesh() === mesh) n.setMesh(null); mesh.dispose(); }
root.getAsset().extras = { title: 'Japanese hat (Jingasa)', author: 'Red Xamuraigame', source: 'https://sketchfab.com/3d-models/japanese-hat-jingasa-4984465d3b0946d3be1ff14fb2bfd556', license: 'SKETCHFAB Standard' };
for (const m of root.listMeshes()) for (const p of m.listPrimitives()) for (const s of p.listSemantics()) if (/^(TEXCOORD|COLOR)/.test(s) || s === 'TANGENT' || s === 'NORMAL') p.setAttribute(s, null);
await doc.transform(prune(), weld(), simplify({ simplifier: MeshoptSimplifier, ratio: 0.1, error: 0.04 }), quantize({ quantizePosition: 14, quantizeNormal: 8 }), prune(), dedup());
const b64 = Buffer.from(await io.writeBinary(doc)).toString('base64');
process.stdout.write(`// Nón Jingasa (GLB nhúng base64). Sinh bởi tools/optimize-hat.mjs — xem THIRD_PARTY.md về nguồn và giấy phép.\nexport const HAT_GLB_B64 = '${b64}';\n`);
