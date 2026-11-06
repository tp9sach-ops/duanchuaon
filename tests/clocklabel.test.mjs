import test from 'node:test';
import assert from 'node:assert/strict';
import { clockLabel } from '../js/ui/hudLogic.js';
test('nhãn đồng hồ đủ ba phần', () => assert.equal(clockLabel('09:30', 'Ban ngày', 'Quang đãng'), '09:30 · Ban ngày · Quang đãng'));
test('thiếu phần nào bỏ phần đó', () => { assert.equal(clockLabel('21:00', '', 'Mưa nhỏ'), '21:00 · Mưa nhỏ'); assert.equal(clockLabel('21:00'), '21:00'); });
test('giá trị không phải chuỗi/rỗng bị bỏ', () => assert.equal(clockLabel(null, '  ', undefined), ''));
