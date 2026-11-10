// Zone thử "Vườn thử" (Phiên 87): một khoảng đất trống nhỏ để kiểm hệ thống nhiều không gian chạy thật (cổng ở rìa làng → đi sang → quay về). LOGIC THUẦN, có test.
// Đặt xa hub (x 500…540) để không lẫn với cảnh chùa. Khi có zone thật (Zone 2, 3…) thì bỏ hoặc đổi chỗ này.
export const THU_ID = 'vuon-thu';
export const HUB_GATE = { id: 'toi-vuon-thu', x: 0, z: 206, r: 3, to: THU_ID, spawn: 'default', ten: 'Vườn thử' };
export const HUB_RETURN_SPAWN = { x: 0, z: 201, ry: Math.PI };
export const THU_DEF = {
  id: THU_ID, ten: 'Vườn thử', loai: 'AN',
  bounds: { x0: 500, x1: 540, z0: -20, z1: 20 },
  spawns: { default: { x: 520, z: 10, ry: 0 } },
  gates: [{ id: 've-chua', x: 520, z: -15, r: 3, to: 'chua', spawn: 'tu-vuon-thu', ten: 'Về chùa Diệu Giang' }],
  budget: { meshes: 60, drawCalls: 30, textures: 4, trees: 1, maxPlayers: 30 },
};
