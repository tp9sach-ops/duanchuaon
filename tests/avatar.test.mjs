import test from 'node:test';
import assert from 'node:assert/strict';
import { AVATAR_COLORS, colorById, DEFAULT_COLOR, BELL_PROFILE, bellRadius, logoPatch, POLO_LOGOS, cleanName, cleanSay, bubbleLife, wrapText, poseFor, STATES, turnToward } from '../js/world/avatarLogic.js';

test('màu áo: id hợp lệ trả đúng, id lạ/rỗng về mặc định', () => {
  assert.equal(AVATAR_COLORS.length, 7);
  assert.equal(colorById('lam').id, 'lam');
  assert.equal(colorById('xyz').id, DEFAULT_COLOR); assert.equal(colorById().id, DEFAULT_COLOR);
  assert.equal(new Set(AVATAR_COLORS.map((c) => c.id)).size, 7);
});
test('tên: cắt 20 ký tự, gộp khoảng trắng, bỏ HTML/link, rỗng thì Khách', () => {
  assert.equal(cleanName('  Phan   Trường  Giang '), 'Phan Trường Giang');
  assert.equal(cleanName('<b>Hi</b>'), 'b Hi /b');
  assert.equal(cleanName('https://x.com/abc'), 'Khách');
  assert.equal(cleanName(''), 'Khách'); assert.equal(cleanName(null), 'Khách');
  assert.equal(Array.from(cleanName('A'.repeat(50))).length, 20);
  assert.equal(cleanName('\u202eabc\u200b'), 'abc');
});
test('tên: không cắt đôi ký tự emoji (cặp thay thế)', () => {
  const n = cleanName('🙏'.repeat(30)); assert.equal(Array.from(n).length, 20); assert.ok(!/[\ud800-\udbff]$/.test(n));
});
test('chat: cắt 80, bỏ link, rỗng thì không hiện', () => {
  assert.equal(cleanSay('Nam mô A Di Đà Phật'), 'Nam mô A Di Đà Phật');
  assert.equal(cleanSay('xem www.abc.com nhé'), 'xem nhé');
  assert.equal(cleanSay('   '), ''); assert.equal(Array.from(cleanSay('a '.repeat(100))).length <= 80, true);
});
test('thời gian bong bóng 3–8 giây, dài hơn thì lâu hơn', () => {
  assert.equal(bubbleLife(''), 3000); assert.equal(bubbleLife('x'.repeat(200)), 8000); assert.ok(bubbleLife('x'.repeat(40)) > bubbleLife('x'.repeat(10)));
});
test('ngắt dòng: mỗi dòng ≤ 18, giữ đủ chữ, tối đa 4 dòng có dấu …', () => {
  const l = wrapText('Nam mô A Di Đà Phật cầu cho gia đình bình an', 18);
  assert.ok(l.every((x) => Array.from(x).length <= 18)); assert.equal(l.join(' '), 'Nam mô A Di Đà Phật cầu cho gia đình bình an');
  assert.deepEqual(wrapText('a'.repeat(40), 18), ['a'.repeat(18), 'a'.repeat(18), 'aaaa']);
  const long = wrapText('abcde '.repeat(30), 10, 4); assert.equal(long.length, 4); assert.ok(long[3].endsWith('…'));
  assert.deepEqual(wrapText('', 18), []);
});
test('tư thế đi: chân đối nhau, nhanh hơn thì bước rộng hơn, biên độ có giới hạn', () => {
  const p = poseFor('walk', 0.3, 2); assert.ok(Math.abs(p.legL + p.legR) < 1e-9); assert.ok(Math.abs(p.armL + p.legL * 0.8) < 1e-9);
  let slow = 0, fast = 0; for (let i = 0; i < 200; i++) { slow = Math.max(slow, Math.abs(poseFor('walk', i * 0.01, 0.5).legL)); fast = Math.max(fast, Math.abs(poseFor('walk', i * 0.01, 2.2).legL)); }
  assert.ok(fast > slow); assert.ok(fast <= 0.62 * 1.15 + 1e-9);
});
test('ngồi/gõ mõ: sit = 1; gõ mõ có tay phải dao động; đứng: sit = 0', () => {
  assert.equal(poseFor('sit', 1).sit, 1); assert.equal(poseFor('mo', 1).sit, 1); assert.equal(poseFor('idle', 1).sit, 0);
  const v = []; for (let i = 0; i < 100; i++) v.push(poseFor('mo', i * 0.02).armR); assert.ok(Math.max(...v) - Math.min(...v) > 0.4);
});
test('lạy: cúi tới ~1 rad rồi trở lại thẳng; mọi trạng thái cho số hữu hạn', () => {
  let mx = 0, mn = 9; for (let i = 0; i < 400; i++) { const l = poseFor('bow', i * 0.01).lean; mx = Math.max(mx, l); mn = Math.min(mn, l); }
  assert.ok(mx > 1.0 && mx <= 1.05 + 1e-9); assert.ok(mn < 0.01);
  for (const s of STATES) for (const t of [0, 0.7, 3.3, 100]) for (const v of Object.values(poseFor(s, t, 1.5))) assert.ok(Number.isFinite(v), s);
  assert.equal(poseFor('khong-co', 1).sit, 0);   // trạng thái lạ → đứng yên
});
test('quay mặt theo đường ngắn nhất, bước tối đa maxStep', () => {
  assert.ok(Math.abs(turnToward(3.0, -3.0, 10) - (-3.0 + Math.PI * 2)) < 1e-9);   // 3 → -3 đi qua π là cung ngắn
  assert.ok(Math.abs(turnToward(0, 1, 0.1) - 0.1) < 1e-9); assert.ok(Math.abs(turnToward(0, -1, 0.1) + 0.1) < 1e-9);
  assert.equal(turnToward(1, 1, 0.5), 1);
});

test('đồng phục 9 Sạch: có trong danh sách, thân vàng + tay/cổ xanh, chỉ kiểu này là polo', () => {
  const u = colorById('9sach');
  assert.equal(u.id, '9sach'); assert.equal(u.polo, true);
  assert.ok(u.tay && u.co && u.soc && u.dai && u.ao);
  assert.notEqual(u.ao, u.tay);                                   // thân và tay khác màu
  assert.equal(AVATAR_COLORS.filter((c) => c.polo).length, 1);
});
test('bán kính thân áo: khớp mốc, giảm dần khi lên cao, kẹp ngoài khoảng', () => {
  for (const [r, y] of BELL_PROFILE.slice(2)) assert.ok(Math.abs(bellRadius(y) - r) < 1e-9);
  assert.ok(bellRadius(0.3) > bellRadius(0.6) && bellRadius(0.6) > bellRadius(0.8));
  assert.equal(bellRadius(-1), BELL_PROFILE[0][0]); assert.equal(bellRadius(9), BELL_PROFILE.at(-1)[0]);
});
test('logo trên áo: tròn (cung = đường kính), ôm đúng thân áo, ngực trái lệch trái, lưng ở phía sau', () => {
  for (const spec of [POLO_LOGOS.chest, POLO_LOGOS.back]) {
    const q = logoPatch(spec);
    assert.ok(q.rBot > q.rTop && q.rTop > bellRadius(spec.y + spec.d / 2));          // nổi hơn mặt áo, đáy rộng hơn đỉnh
    assert.ok(Math.abs(q.thetaLength * (q.rTop + q.rBot) / 2 - spec.d) < 1e-9);      // chiều dài cung = đường kính → không méo
    assert.ok(Math.abs(q.thetaStart + q.thetaLength / 2 - spec.theta) < 1e-9);
    assert.ok(spec.y - spec.d / 2 > 0.1 && spec.y + spec.d / 2 < 0.8);               // nằm trọn trên thân, trên gấu, dưới cổ
  }
  assert.ok(POLO_LOGOS.chest.theta > 0 && POLO_LOGOS.chest.theta < 1);                // bên trái người mặc (+x), không lấn nẹp giữa
  assert.ok(POLO_LOGOS.chest.theta - logoPatch(POLO_LOGOS.chest).thetaLength / 2 > 0.1);
  assert.equal(POLO_LOGOS.back.theta, Math.PI);
  assert.ok(POLO_LOGOS.back.d > POLO_LOGOS.chest.d * 2);                              // lưng lớn hơn ngực (như áo mẫu)
});
