// In bảng màu + phác thảo 30 chiêu. Chạy:
//   node tools/chieuMau.mjs md  > docs/CHIEU_BANG_MAU.md
//   node tools/chieuMau.mjs svg > docs/chieu-bang-mau.svg
import { BANG_MAU, HE_LIST, mauChieu, phacThao, doSang, tuongPhan, hexXam } from '../js/data/chieuMau.js';
import { COMBAT_SKILLS } from '../js/data/combatSkills.js';
import { chieuOf } from '../js/world/chieuNguHanh.js';
import { skillById } from '../js/world/skillCatalog.js';

const SLOT = { 1: 'Chiêu 1', 2: 'Chiêu 2', 3: 'Chiêu 3', 4: 'Chiêu 4', tuyet: 'Tuyệt học' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const mode = process.argv[2] || 'md';

function md() {
  const o = ['# Bảng màu + phác thảo hình 30 chiêu (prompt chiêu thức 3D, mục 4 và mục 14 điểm 2)', '',
    'Tạo tự động bằng `node tools/chieuMau.mjs md` từ `js/data/chieuMau.js`. Bản vẽ vùng cảnh báo tô đúng màu: `docs/chieu-bang-mau.svg` (tạo bằng `node tools/chieuMau.mjs svg > docs/chieu-bang-mau.svg`). Màu là TẠM, chờ ptg nhìn bằng mắt rồi chỉnh một chỗ ở `chieuMau.js`.', '',
    'Quy tắc: lõi sáng nhất, nền đậm nhất; tối đa 4 màu chủ + 1 màu bổ sung nhỏ (≤ 10% diện tích); ảnh đen trắng vẫn tách khối (độ sáng tăng dần nền < chủ < sáng < lõi).', '',
    '## Bảng 4 màu mỗi Hệ + màu bổ sung', '', '| Hệ | Nền tối | Màu chủ | Màu sáng | Lõi trắng ngà | Bổ sung | Độ sáng (nền / chủ / sáng / lõi) | Tương phản chủ÷nền |', '| --- | --- | --- | --- | --- | --- | --- | ---: |'];
  for (const he of HE_LIST) { const b = BANG_MAU[he], y = [b.nen, b.chu, b.sang, b.loi].map((x) => doSang(x).toFixed(2)).join(' / '); o.push(`| ${b.ten} | \`${b.nen}\` | \`${b.chu}\` | \`${b.sang}\` | \`${b.loi}\` | \`${b.buSung}\` (${b.tenBuSung}) | ${y} | ${tuongPhan(b.chu, b.nen).toFixed(1)} |`); }
  o.push('', '## Phác thảo từng chiêu (3 hình dáng, chọn 1 — dấu ✔)', '');
  for (const he of HE_LIST) {
    o.push(`### ${BANG_MAU[he].ten}`, '');
    for (const s of COMBAT_SKILLS.filter((x) => x.he === he)) {
      const p = phacThao(s.id), sk = skillById(s.id), k = chieuOf(s.id).canhBao.hinh;
      const vung = k.kieu === 'tron' ? `tròn r ${k.r} m` : k.kieu === 'duong' ? `đường ${k.dai}×${k.rong} m` : `nón ${k.dai} m, ${k.goc}°`;
      o.push(`**${SLOT[s.slot]} · ${sk?.ten || s.ten}** (\`${s.id}\`, vùng ${vung}) — ${p.y}  `, `Từ khóa: ${p.tk.join(' · ')}`, ...p.phac.map((t, i) => `${i === p.chon ? '- ✔' : '- ○'} ${t}`), '');
    }
  }
  return o.join('\n');
}

function svg() {
  const CW = 210, CH = 190, PAD = 12, HEAD = 46, W = PAD * 2 + CW * 6, H = PAD + 5 * (HEAD + CH) + PAD;
  const o = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="'Be Vietnam Pro','Noto Sans',sans-serif">`, `<rect width="${W}" height="${H}" fill="#101214"/>`];
  HE_LIST.forEach((he, r) => {
    const b = BANG_MAU[he], y0 = PAD + r * (HEAD + CH);
    o.push(`<text x="${PAD}" y="${y0 + 26}" font-size="22" font-weight="700" fill="${b.sang}">${b.ten}</text>`);
    [b.nen, b.chu, b.sang, b.loi, b.buSung].forEach((c, i) => o.push(`<rect x="${PAD + 90 + i * 44}" y="${y0 + 6}" width="38" height="28" rx="5" fill="${c}" stroke="#666" stroke-width="1"/><text x="${PAD + 109 + i * 44}" y="${y0 + 44}" font-size="9" text-anchor="middle" fill="#aaa">${['nền', 'chủ', 'sáng', 'lõi', 'bổ sung'][i]}</text>`));
    o.push(`<text x="${PAD + 330}" y="${y0 + 26}" font-size="11" fill="#9aa">bổ sung: ${esc(b.tenBuSung)} · đen trắng: ${[b.nen, b.chu, b.sang, b.loi].map(hexXam).join(' ')}</text>`);
    COMBAT_SKILLS.filter((s) => s.he === he).forEach((s, c) => {
      const m = mauChieu(s.id), p = phacThao(s.id), k = chieuOf(s.id).canhBao.hinh, sk = skillById(s.id), x0 = PAD + c * CW, y1 = y0 + HEAD;
      const cx = x0 + CW / 2, cy = y1 + 100, ext = k.kieu === 'tron' ? k.r : k.dai, sc = Math.min(8, 70 / ext), loi = !!chieuOf(s.id).canhBao.loi;
      o.push(`<rect x="${x0 + 3}" y="${y1}" width="${CW - 6}" height="${CH - 4}" rx="8" fill="${m.nen}" stroke="${loi ? m.sang : m.chu}" stroke-width="1.5"/>`);
      const fill = `fill="${m.chu}" fill-opacity="0.55" stroke="${m.sang}" stroke-width="1.5"`;
      if (k.kieu === 'tron') o.push(`<circle cx="${cx}" cy="${cy}" r="${k.r * sc}" ${fill}/><circle cx="${cx}" cy="${cy}" r="${k.r * sc * 0.45}" fill="${m.sang}" fill-opacity="0.35"/>`);
      else if (k.kieu === 'duong') o.push(`<rect x="${cx - k.rong * sc / 2}" y="${cy - k.dai * sc}" width="${k.rong * sc}" height="${k.dai * sc}" ${fill}/><rect x="${cx - k.rong * sc / 6}" y="${cy - k.dai * sc}" width="${k.rong * sc / 3}" height="${k.dai * sc}" fill="${m.loi}" fill-opacity="0.7"/>`);
      else { const a = (k.goc / 2) * Math.PI / 180, R = k.dai * sc, ax = cx - Math.sin(a) * R, bx = cx + Math.sin(a) * R, ay = cy - Math.cos(a) * R; o.push(`<path d="M${cx},${cy} L${ax.toFixed(1)},${ay.toFixed(1)} A${R},${R} 0 0 1 ${bx.toFixed(1)},${ay.toFixed(1)} Z" ${fill}/>`); }
      o.push(`<circle cx="${cx}" cy="${cy}" r="4" fill="${m.loi}"/><circle cx="${x0 + CW - 20}" cy="${y1 + 18}" r="${Math.max(3, m.tiLeBuSung * 40)}" fill="${m.buSung}"/>`);
      o.push(`<text x="${x0 + 12}" y="${y1 + 20}" font-size="12" font-weight="700" fill="${m.loi}">${esc(sk?.ten || s.ten)}</text>`, `<text x="${x0 + 12}" y="${y1 + 35}" font-size="9.5" fill="${m.sang}">${esc(SLOT[s.slot])} · ${p.tk.map(esc).join(' · ')}</text>`);
      const t = esc(p.hinhChon); o.push(`<text x="${x0 + 12}" y="${y1 + CH - 12}" font-size="9.5" fill="${m.loi}">✔ ${t.length > 36 ? t.slice(0, 35) + '…' : t}</text>`);
    });
  });
  o.push('</svg>');
  return o.join('\n');
}
console.log(mode === 'svg' ? svg() : md());
