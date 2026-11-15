// Kho âm thanh chiêu thức (prompt chiêu thức 3D mục 5 + mục 14 điểm 5): đủ 18 tiếng, nhẹ, có nguồn/giấy phép, ba lớp + dư âm, Tuyệt học to hơn 6 dB, nối vào cảnh + bộ phát.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { KHO_AM } from '../js/data/chieuAmKho.js';
import { lapAm, lapCanhBao, xa, vaiAm, DO_LON, CHAT_LIEU, TRE_DU_AM, NGUONG_XA } from '../js/world/chieuAm.js';
import { COMBAT_SKILLS } from '../js/data/combatSkills.js';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const IDS = COMBAT_SKILLS.map((s) => s.id), HES = ['kim', 'moc', 'thuy', 'tho', 'hoa'];

test('kho đủ 18 tiếng: mỗi Hệ có gồng + phát + dư âm, cộng 3 tiếng trúng theo chất liệu', () => {
  assert.equal(Object.keys(KHO_AM).length, 18);
  for (const he of HES) for (const l of ['gong', 'phat', 'duam']) { const k = KHO_AM[`${he}-${l}`]; assert.ok(k, `${he}-${l}`); assert.equal(k.he, he); assert.equal(k.loai, l); }
  for (const c of CHAT_LIEU) assert.equal(KHO_AM[`trung-${c}`].loai, 'trung');
  assert.ok(Object.isFrozen(KHO_AM) && Object.isFrozen(KHO_AM['kim-gong']));
});
test('mỗi tiếng: file m4a thật, ≤ 100 KB, độ dài đúng loại (phát/dư âm theo prompt), có nguồn + giấy phép', () => {
  let tong = 0;
  for (const [id, k] of Object.entries(KHO_AM)) {
    assert.equal(k.file, `assets/sfx/chieu/${id}.m4a`); const n = statSync(new URL(k.file, root)).size; tong += n;
    assert.ok(n > 1000 && n <= 100 * 1024, `${id} ${n} byte`); assert.equal(readFileSync(new URL(k.file, root)).subarray(4, 8).toString('latin1'), 'ftyp', id + ' phải là m4a');
    if (k.loai === 'duam') assert.ok(k.giay >= 0.5 && k.giay <= 1.5, `${id} dư âm ${k.giay}`);
    if (k.loai === 'phat') assert.ok(k.giay >= 0.4 && k.giay <= 1.0, `${id} phát ${k.giay}`);
    if (k.loai === 'gong') assert.ok(k.giay >= 0.5 && k.giay <= 1.2, `${id} gồng ${k.giay}`);
    if (k.loai === 'trung') assert.ok(k.giay <= 0.6, `${id} trúng ${k.giay}`);
    assert.ok(k.nguon.length > 10 && k.giayPhep.length > 10, id + ' thiếu nguồn/giấy phép');
  }
  assert.ok(tong < 200 * 1024, 'kho nhẹ để tải trước: ' + tong);
});
test('độ dài ghi trong kho khớp file thật (đo bằng ffprobe nếu máy có)', (t) => {
  const pr = spawnSync('ffprobe', ['-version']); if (pr.error || pr.status !== 0) return t.skip('không có ffprobe');
  for (const [id, k] of Object.entries(KHO_AM)) { const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', new URL(k.file, root).pathname], { encoding: 'utf8' }); assert.ok(Math.abs(parseFloat(r.stdout) - k.giay) < 0.06, `${id} ${r.stdout} vs ${k.giay}`); }
});
test('lapAm: 30 chiêu đủ gồng/phát/trúng/dư âm trỏ vào file có thật, đúng Hệ; dư âm đến sau phát; chiêu lạ → null', () => {
  assert.equal(lapAm('xxx'), null);
  for (const id of IDS) {
    const a = lapAm(id), he = id.split('_')[0];
    assert.equal(a.gong.file, `${he}-gong`, id); assert.equal(a.phat.file, `${he}-phat`, id); assert.equal(a.duAm.file, `${he}-duam`, id); assert.equal(a.trung.file, 'trung-dathit', id);
    for (const k of ['gong', 'phat', 'trung', 'duAm']) { assert.ok(KHO_AM[a[k].file], `${id} ${k}`); assert.ok(a[k].gain > 0 && a[k].gain <= 1, `${id} ${k} gain`); }
    assert.ok(a.duAm.tre >= TRE_DU_AM && a.trung.tre > 0 && a.duAm.gain < a.phat.gain, id);
    assert.equal(lapAm(id, { coTrung: false }).trung, null);
  }
  assert.equal(lapAm('kim_1', { chatLieu: 'kimloai' }).trung.file, 'trung-kimloai'); assert.equal(lapAm('kim_1', { chatLieu: 'da' }).trung.file, 'trung-da'); assert.equal(lapAm('kim_1', { chatLieu: 'lạ' }).trung.file, 'trung-dathit');
});
test('độ lớn theo vai chiêu: Tuyệt học to gấp đôi chiêu thường (~6 dB), Chiêu 4 ở giữa', () => {
  assert.ok(Math.abs(20 * Math.log10(DO_LON.tuyet / DO_LON.thuong) - 6.02) < 0.05); assert.ok(DO_LON.thuong < DO_LON.chieu4 && DO_LON.chieu4 < DO_LON.tuyet);
  assert.equal(vaiAm('hoa_tuyet'), 'tuyet'); assert.equal(vaiAm('hoa_hoalong_4'), 'chieu4'); assert.equal(vaiAm('hoa_1'), 'thuong');
  assert.equal(lapAm('hoa_tuyet').phat.gain / lapAm('hoa_1').phat.gain, 2);
});
test('âm người xa nhỏ dần theo khoảng cách; âm cảnh báo cho người bị nhắm vẫn nghe được ở xa (≤ 40 m)', () => {
  assert.equal(xa(0), 1); assert.equal(xa(NGUONG_XA.gan), 1); assert.equal(xa(NGUONG_XA.xa), 0); assert.equal(xa('abc'), 1);
  let prev = 1; for (let d = 4; d <= 40; d += 2) { const v = xa(d); assert.ok(v <= prev + 1e-9, 'giảm đều ' + d); prev = v; }
  assert.ok(lapAm('moc_1', { khoangCach: 30 }).gong.gain < lapAm('moc_1').gong.gain);
  assert.ok(lapCanhBao('moc_1', 30).gain >= 0.35); assert.equal(lapCanhBao('moc_1', 41).gain, 0); assert.equal(lapCanhBao('xxx'), null);
});
test('nối dây: cảnh chiêu dùng lapAm + playFile, bộ phát có playFile/preloadFiles, loader biết đường dẫn kho', () => {
  const sc = read('js/scene/chieuFx.js'), ui = read('js/ui/sfx.js');
  assert.match(sc, /import \{ lapAm \} from '\.\.\/world\/chieuAm\.js'/); assert.match(sc, /playFile\(it\.file/); assert.match(sc, /preloadFiles/); assert.match(sc, /chatLieu = 'dathit'/);
  assert.match(ui, /function playFile/); assert.match(ui, /preloadFiles/); assert.match(ui, /KHO_AM\[id\] \? KHO_AM\[id\]\.file/); assert.match(ui, /LGT\.sfx = \{ play, playFile, preloadFiles/);
});
