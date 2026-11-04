// Chạy js/scene/hoasen.js với three.js GIẢ: hoa nở, đứng gần thì nhận lộc đúng một lần, hết hồi chiêu thì hoa chuyển điểm. Chạy bởi tests/worldsim.test.mjs.
const mkEl = () => new Proxy(function () {}, { get: (t, k) => (k === 'getContext' ? () => new Proxy({}, { get: () => () => ({ addColorStop() {} }) }) : undefined), set: () => true, apply: () => undefined });
globalThis.document = { createElement: mkEl };
const store = {}; globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); } };
const { buildHoaSen } = await import('../../js/scene/hoasen.js');
const { LOC_SPOTS, LOC_COOLDOWN_MS } = await import('../../js/world/loc.js');
const LGT = { panelOpen: false, world: { pos: { x: 0, z: 54 } } }; let got = 0; LGT.onLoc = () => { got++; };
const real = Date.now; let now = real(); Date.now = () => now;
const h = buildHoaSen(LGT); const out = {};
h.update(1); out.activeStart = LGT.loc.active();
h.update(2); out.farGot = got;
LGT.world.pos = { x: LOC_SPOTS[0].x + 0.5, z: LOC_SPOTS[0].z }; h.update(3); out.nearGot = got; h.update(3.1); out.again = got; out.savedLoc = JSON.parse(store['lgt.loc']).count; out.activeAfter = LGT.loc.active();
now += LOC_COOLDOWN_MS + 10; h.update(4); out.activeBack = LGT.loc.active(); out.spot = LGT.loc.spot.x === LOC_SPOTS[1].x;
LGT.panelOpen = true; LGT.world.pos = { x: LOC_SPOTS[1].x, z: LOC_SPOTS[1].z }; h.update(5); out.panelBlocks = got;
console.log(JSON.stringify(out));
