import test from 'node:test';
import assert from 'node:assert/strict';
import { lanternGlow, lanternSway, candleFlicker, carriesLantern } from '../js/world/lantern.js';
import { WALKERS } from '../js/world/outside.js';
test('độ sáng theo giờ: 0,35 ban ngày → 1,6 đêm, kẹp 0..1', () => { assert.equal(lanternGlow(0), 0.35); assert.equal(lanternGlow(1), 1.6); assert.equal(lanternGlow(5), 1.6); assert.equal(lanternGlow(-1), 0.35); assert.ok(lanternGlow(0.5) > lanternGlow(0.2)); });
test('đung đưa: đi nhanh lắc hơn đứng yên, không quá 0,35 rad', () => { let a0 = 0, a1 = 0; for (let t = 0; t < 20; t += 0.01) { a0 = Math.max(a0, Math.abs(lanternSway(t, 0))); a1 = Math.max(a1, Math.abs(lanternSway(t, 1.3))); } assert.ok(a1 > a0 && a0 > 0 && a1 <= 0.35); });
test('nến nhấp nháy nhẹ 0,9..1,1', () => { for (let t = 0; t < 30; t += 0.01) { const f = candleFlicker(t, 1); assert.ok(f >= 0.9 && f <= 1.1); } });
test('chỉ trẻ em (scale<1) cầm lồng đèn; có ≥3 bé gồm d8, d9', () => { assert.equal(carriesLantern({}), false); assert.equal(carriesLantern({ scale: 0.7 }), true); const k = WALKERS.filter(carriesLantern).map((w) => w.id); assert.ok(k.includes('d7') && k.includes('d8') && k.includes('d9')); });
