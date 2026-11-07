// Giao diện Bác Tư (js/ui/land.js) chỉ được nhập những hàm có thật trong js/world/land.js (Phiên 37, bước 3c).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as m from '../js/world/land.js';

test('js/ui/land.js nhập đúng các export của js/world/land.js và dùng hàm nâng cấp', () => {
  const src = fs.readFileSync(new URL('../js/ui/land.js', import.meta.url), 'utf8');
  const imp = src.match(/import \{([^}]*)\} from '\.\.\/world\/land\.js'/);
  assert.ok(imp, 'không thấy dòng nhập từ world/land.js');
  const names = imp[1].split(',').map((x) => x.trim()).filter(Boolean);
  for (const n of names) assert.ok(n in m, `world/land.js thiếu export ${n}`);
  for (const n of ['upgradeHouse', 'upgradeCost', 'houseLevel', 'HOUSE_LEVELS', 'MAX_LV']) assert.ok(names.includes(n), `ui/land.js phải dùng ${n}`);
});
