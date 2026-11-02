// Kiểm tra nhanh: cú pháp mọi file JS, file bắt buộc, quy ước đặt tên, khớp số mốc camera.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let fail = 0;
const ok = (m) => console.log('  ok  ' + m);
const bad = (m) => { fail++; console.error('  LỖI ' + m); };

const walk = (d) => readdirSync(d).flatMap((n) => {
  if (['node_modules', '.git', 'tests', '_site'].includes(n)) return [];
  const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p];
});
const files = walk(root);

// 1 · cú pháp
for (const f of files.filter((p) => p.endsWith('.js'))) {
  try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); ok('cú pháp ' + f.slice(root.length + 1)); }
  catch (e) { bad('cú pháp ' + f.slice(root.length + 1) + '\n' + e.stderr); }
}
// 2 · file bắt buộc
for (const f of ['index.html', 'manifest.webmanifest', 'sw.js', 'assets/icon.svg', 'assets/icon-192.png', 'assets/og.png', 'sitemap.xml', 'assets/icon-512.png', 'css/style.css', 'js/main.js', 'js/scene/index.js', 'gas/Code.gs', 'gas/Storage.gs', 'js/ui/profile.js', 'js/engines/personal.js', 'js/data/personal.json', 'js/engines/numerology.js', 'js/engines/astro.js', 'js/engines/zodiac.js', 'js/ui/charts.js', 'js/data/numerology.json', 'js/data/zodiac.json', 'js/engines/batu.js', 'js/ui/fortune.js', 'js/ui/temple.js', 'js/ui/tuvi.js', 'js/ui/planets.js', 'js/ui/vision.js', 'js/engines/vision.js', 'gas/Vision.gs', 'gas/Prayers.gs', 'js/engines/planets.js', 'js/engines/eclipse.js', 'js/engines/tuvi.js', 'js/engines/temple.js', 'js/ui/batu.js', 'js/fg.js', 'css/fg.css', 'HANDOFF.md', 'PROMPT.md', 'js/world/layout.js', 'js/world/avatar.js', 'js/world/avatarLogic.js', 'js/world/placements.js', 'js/world/world.js', 'js/world/worldLogic.js', 'js/world/spots.js', 'js/world/path.js', 'js/scene/garden.js', 'js/scene/nhato.js', '.github/workflows/pages.yml']) {
  existsSync(join(root, f)) ? ok('có ' + f) : bad('thiếu ' + f);
}
// 3 · tên chùa là Diệu Giang Tự; không còn "Linh Giang", "Linh Quang", "Kage" hay chữ Hán trong mã nguồn
const text = files.filter((p) => /\.(html|js|css|gs|md|yml|json)$/.test(p) && !p.endsWith('HANDOFF.md') && !p.endsWith('PROMPT.md') && !p.endsWith('README.md') && !p.includes('/docs/'));
for (const f of text) {
  const s = readFileSync(f, 'utf8');
  if (/linh\s*(quang|giang)/i.test(s) || /\bkage\b/i.test(s) || /[\u4e00-\u9fff]/.test(s)) bad('còn tên cũ trong ' + f.slice(root.length + 1));
}
ok('đã quét tên cũ');
// 4 · số mốc camera == số section data-cam (trừ footer)
const html = readFileSync(join(root, 'index.html'), 'utf8');
const nSec = [...html.matchAll(/<section[^>]*data-cam="(\d+)"/g)].length;
const nCam = [...readFileSync(join(root, 'js/scene/rail.js'), 'utf8').matchAll(/name:\s*'/g)].length;
nSec === nCam ? ok(`camera ${nCam} mốc = ${nSec} section`) : bad(`camera ${nCam} mốc ≠ ${nSec} section`);

if (fail) { console.error(`\n${fail} lỗi`); process.exit(1); }
console.log('\nTất cả kiểm tra đạt.');
