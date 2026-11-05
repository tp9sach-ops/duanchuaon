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
for (const f of ['index.html', 'manifest.webmanifest', 'sw.js', 'assets/icon.svg', 'assets/icon-192.png', 'assets/og.png', 'sitemap.xml', 'assets/icon-512.png', 'css/style.css', 'css/hud.css', 'css/iching.css', 'js/engines/iching.js', 'js/engines/xam36.js', 'THIRD_PARTY.md', 'js/ui/hud.js', 'js/ui/hudLogic.js', 'js/ui/hudMenu.js', 'js/ui/menuLogic.js', 'js/ui/den.js', 'js/engines/den.js', 'js/world/loc.js', 'js/scene/hoasen.js', 'css/den.css', 'js/world/seats.js', 'js/engines/kinh.js', 'js/data/kinh.js', 'js/ui/practice.js', 'js/ui/sound.js', 'css/practice.css', 'js/scene/boduon.js', 'js/scene/chanhdien.js', 'js/scene/buddha.js', 'assets/buddha.webp', 'js/world/npc.js', 'js/world/outside.js', 'js/world/quests.js', 'js/scene/outside.js', 'js/scene/perfLogic.js', 'js/ui/quest.js', 'css/quest.css', 'js/scene/npc.js', 'js/ui/npc.js', 'js/ui/chat.js', 'css/chat.css', 'css/hudmenu.css', 'js/main.js', 'js/scene/index.js', 'gas/Code.gs', 'gas/Storage.gs', 'js/ui/profile.js', 'js/engines/personal.js', 'js/data/personal.json', 'js/engines/numerology.js', 'js/engines/astro.js', 'js/engines/zodiac.js', 'js/ui/charts.js', 'js/data/numerology.json', 'js/data/zodiac.json', 'js/engines/batu.js', 'js/ui/fortune.js', 'js/ui/temple.js', 'js/ui/tuvi.js', 'js/ui/planets.js', 'js/ui/vision.js', 'js/engines/vision.js', 'gas/Vision.gs', 'gas/Prayers.gs', 'gas/Room.gs', 'js/engines/room.js', 'js/net/room.js', 'js/net/roomClient.js', 'js/engines/planets.js', 'js/engines/eclipse.js', 'js/engines/tuvi.js', 'js/engines/temple.js', 'js/ui/batu.js', 'js/fg.js', 'css/fg.css', 'HANDOFF.md', 'PROMPT.md', 'js/world/layout.js', 'js/world/avatar.js', 'js/world/avatarLogic.js', 'js/world/placements.js', 'js/world/world.js', 'js/world/worldLogic.js', 'js/world/spots.js', 'js/world/path.js', 'js/scene/garden.js', 'js/scene/nhato.js', '.github/workflows/pages.yml']) {
  existsSync(join(root, f)) ? ok('có ' + f) : bad('thiếu ' + f);
}
// 3 · tên chùa là Diệu Giang Tự; không còn "Linh Giang", "Linh Quang", "Kage" hay chữ Hán trong mã nguồn
const text = files.filter((p) => /\.(html|js|css|gs|md|yml|json)$/.test(p) && !p.endsWith('HANDOFF.md') && !p.endsWith('PROMPT.md') && !p.endsWith('README.md') && !p.includes('/docs/'));
for (const f of text) {
  const s = readFileSync(f, 'utf8');
  if (/linh\s*(quang|giang)/i.test(s) || /\bkage\b/i.test(s) || /[\u4e00-\u9fff]/.test(s)) bad('còn tên cũ trong ' + f.slice(root.length + 1));
}
ok('đã quét tên cũ');
// 4 · mỗi chương trong index.html có điểm đến trong thế giới đi bộ (js/world/spots.js), vì không còn camera trượt theo mốc
const html = readFileSync(join(root, 'index.html'), 'utf8');
const spotIds = [...readFileSync(join(root, 'js/world/spots.js'), 'utf8').matchAll(/id:\s*'([a-z]+)'/g)].map((m) => m[1]);
const secIds = [...html.matchAll(/<section[^>]*class="[^"]*\bsec\b[^"]*"[^>]*id="([a-z]+)"/g)].map((m) => m[1]);
const missing = secIds.filter((id) => id !== 'hero' && !spotIds.includes(id));
missing.length === 0 ? ok(`${secIds.length - 1} chương đều có điểm đến`) : bad('chương chưa có điểm đến: ' + missing.join(', '));

if (fail) { console.error(`\n${fail} lỗi`); process.exit(1); }
console.log('\nTất cả kiểm tra đạt.');
