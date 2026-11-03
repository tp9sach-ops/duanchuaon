import test from 'node:test';
import assert from 'node:assert/strict';
import { HEXAGRAMS, TOPICS, LEVELS, detectTopic, drawReading } from '../js/engines/iching.js';
import { XAM_COUNT, XAM_LIST, drawXam } from '../js/engines/xam36.js';

const seq = (...v) => { let i = 0; return () => v[i++ % v.length]; };

test('Kinh Dịch: đủ 64 quẻ, số 1..64 không trùng, nhị phân 6 hào không trùng', () => {
  assert.equal(HEXAGRAMS.length, 64);
  assert.deepEqual(HEXAGRAMS.map((h) => h.number), Array.from({ length: 64 }, (_, i) => i + 1));
  assert.equal(new Set(HEXAGRAMS.map((h) => h.binary)).size, 64);
  for (const h of HEXAGRAMS) { assert.match(h.binary, /^[01]{6}$/); assert.equal(h.lines.length, 6); }
});
test('Kinh Dịch: mỗi quẻ đủ chữ, mức hợp lệ, đủ 4 luận giải theo chủ đề', () => {
  for (const h of HEXAGRAMS) {
    assert.ok(LEVELS.includes(h.level), h.name); assert.ok(h.judgment && h.meaning && h.advice, h.name);
    for (const k of Object.keys(TOPICS)) assert.ok(h.topics[k] && h.topics[k].length > 10, `${h.name}/${k}`);
  }
  assert.equal(Object.keys(TOPICS).length, 4);
});
test('gieo quẻ có thể kiểm thử: cùng rng → cùng quẻ; sáu hào dương là Thuần Càn, sáu hào âm là Thuần Khôn', () => {
  assert.equal(drawReading('', seq(0.1)).name, 'Thuần Càn'); assert.equal(drawReading('', seq(0.9)).name, 'Thuần Khôn');
  assert.equal(drawReading('', seq(0.1)).glyph, '\u4dc0'); assert.equal(drawReading('', seq(0.9)).glyph, '\u4dc1');
  const a = drawReading('x', seq(0.1, 0.9, 0.1, 0.9, 0.1, 0.9)), b = drawReading('x', seq(0.1, 0.9, 0.1, 0.9, 0.1, 0.9));
  assert.deepEqual(a, b); assert.deepEqual(a.lines, [1, 0, 1, 0, 1, 0]);
});
test('gieo quẻ ngẫu nhiên thật: luôn ra quẻ hợp lệ (500 lần)', () => {
  for (let i = 0; i < 500; i++) { const r = drawReading('tài lộc'); assert.ok(r.number >= 1 && r.number <= 64 && r.lines.length === 6 && r.name && r.topic.key === 'taiLoc'); }
});
test('nhận chủ đề từ câu hỏi có/không dấu, bỏ qua câu không rõ', () => {
  assert.equal(detectTopic('Tôi muốn hỏi về tài lộc năm nay'), 'taiLoc'); assert.equal(detectTopic('tinh duyen cua toi'), 'tinhDuyen');
  assert.equal(detectTopic('xin việc có đậu phỏng vấn không'), 'congDanh'); assert.equal(detectTopic('sức khỏe của mẹ'), 'sucKhoe');
  assert.equal(detectTopic('Nam mô A Di Đà Phật'), null); assert.equal(detectTopic(''), null); assert.equal(drawReading('').topic, null);
});
test('xăm 36: đủ 36 thẻ, mỗi thẻ 4 câu thơ, đủ luận giải, rút theo rng', () => {
  assert.equal(XAM_COUNT, 36); assert.equal(XAM_LIST.length, 36);
  for (const x of XAM_LIST) { assert.equal(x.poem.length, 4); assert.ok(LEVELS.includes(x.level)); for (const k of Object.keys(TOPICS)) assert.ok(x.t[k], `${x.n}/${k}`); }
  assert.equal(drawXam('', seq(0)).number, 1); assert.equal(drawXam('', seq(0.9999)).number, 36);
  const r = drawXam('công việc', seq(0.5)); assert.equal(r.total, 36); assert.equal(r.topic.key, 'congDanh'); assert.equal(r.poem.length, 4);
  assert.ok(drawXam('', seq(1)).number >= 1, 'rng=1 không vượt biên');
});
