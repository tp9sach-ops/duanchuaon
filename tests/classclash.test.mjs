// Phiên 140: chống TRÙNG TÊN CLASS giữa các giao diện. Lỗi gốc: khung công đức dùng `.cd { position:absolute; top:64px … }` (css/donate.css) trùng với class `cd`
// mà Võ đài và cụm nút chính gắn lên nút khi hồi chiêu → nút bị hất ra ngoài màn hình (Võ đài: cả 4 nút đánh biến mất).
// Test này quét mọi lần js/ui/*.js bật/tắt một class bằng chuỗi cố định và báo lỗi nếu class đó ĐỒNG THỜI là một quy tắc `.tên{…}` đặt vị trí (absolute/fixed) trong css.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const uiFiles = fs.readdirSync(path.join(root, 'js/ui')).filter((f) => f.endsWith('.js')).map((f) => 'js/ui/' + f);
const cssFiles = fs.readdirSync(path.join(root, 'css')).filter((f) => f.endsWith('.css')).map((f) => 'css/' + f);

/** Các quy tắc css có bộ chọn là ĐÚNG MỘT class (`.tên`) và khai báo vị trí absolute/fixed. Trả Map tên → tệp. */
function positionedSingleClassRules() {
  const out = new Map();
  for (const f of cssFiles) {
    const css = read(f).replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of css.matchAll(/(?:^|[}\s,])\.([A-Za-z_][\w-]*)\s*(?:,\s*\.[\w-]+\s*)*\{([^{}]*)\}/g)) {
      if (/position\s*:\s*(absolute|fixed)/.test(m[2])) out.set(m[1], f);
    }
  }
  return out;
}

test('tên class bật/tắt trên nút KHÔNG trùng quy tắc định vị tuyệt đối trong css', () => {
  const pos = positionedSingleClassRules(), bad = [];
  for (const f of uiFiles) {
    const js = read(f);
    for (const m of js.matchAll(/classList\.(?:toggle|add)\(\s*'([A-Za-z_][\w-]*)'/g)) {
      if (pos.has(m[1])) bad.push(`${f}: classList '${m[1]}' trùng quy tắc .${m[1]}{position:…} ở ${pos.get(m[1])}`);
    }
  }
  assert.deepEqual(bad, [], bad.join('\n'));
});

test('hồi chiêu: Võ đài dùng dl-cd, cụm nút chính dùng on-cd (không dùng "cd" của khung công đức)', () => {
  const duel = read('js/ui/duel.js'), dock = read('js/ui/dock.js'), dockCss = read('css/dock.css'), donateCss = read('css/donate.css');
  assert.ok(/classList\.toggle\('dl-cd'/.test(duel) && /\.dl-btn\.dl-cd\{/.test(duel), 'Võ đài phải dùng class dl-cd');
  assert.ok(!/classList\.toggle\('cd'/.test(duel), 'Võ đài không được bật class cd');
  assert.ok(/classList\.toggle\('on-cd'/.test(dock) && /\.dk-b\.on-cd::after/.test(dockCss), 'Cụm nút chính phải dùng class on-cd');
  assert.ok(!/classList\.toggle\('cd'/.test(dock) && !/\.dk-b\.cd\b/.test(dockCss), 'Cụm nút chính không được dùng class cd');
  assert.ok(/^\.cd\{position:absolute/m.test(donateCss), 'khung công đức vẫn dùng .cd (nếu đổi tên thì cập nhật test này)');
});

test('yêu quái hằng tháng chỉ ở zone hub (không hiện nút đánh trong Võ đài)', () => {
  const yq = read('js/ui/yeuquai.js');
  assert.ok(/const here = \(\) => [^\n]*mapAvailable\(LGT\.zones\)/.test(yq), 'here() của yêu quái phải kiểm zone');
  assert.ok(/import \{ mapAvailable \} from '\.\.\/world\/minimap\.js'/.test(yq));
});
