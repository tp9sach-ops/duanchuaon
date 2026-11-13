// Số liệu PHÓ BẢN (ptg giao 13/11, mục 4; Phiên 139). Mọi con số là QUY ƯỚC TẠM, chờ ptg duyệt và playtest. Logic: js/world/dungeon.js (test: tests/dungeon.test.mjs).
// Ý ptg: gặp NPC ở địa điểm → chọn phó bản → vào khu riêng toàn quái. Quái thu phục xong HỒI SINH mạnh hơn và TO hơn; sau 9 lượt hồi sinh hiện BOSS CHÍNH to/mạnh hơn;
// thu phục boss → nhiều vật phẩm; phó bản đã chinh phục lần sau quay lại MẠNH HƠN.
export const DUNGEON_CFG = Object.freeze({
  tam: true,
  waves: 9,                       // số lượt hồi sinh trước khi boss chính xuất hiện
  perWave: Object.freeze({ base: 3, step: 0.5, max: 8 }),   // số quái mỗi lượt = min(max, round(base + step × (lượt−1))); lượt 3/6/9 có thêm tinh anh
  waveScale: Object.freeze({ hp: 0.35, atk: 0.2, size: 0.06 }),   // mỗi lượt cộng thêm: ×(1 + hp × (lượt−1)) Oán Khí, ×(1 + atk × (lượt−1)) Công, ×(1 + size × (lượt−1)) kích thước
  clearScale: Object.freeze({ hp: 0.4, atk: 0.25, size: 0.05, maxClears: 50 }),   // mỗi lần đã chinh phục cộng thêm cho CẢ khu (kể cả boss); maxClears chỉ là chặn kỹ thuật
  boss: Object.freeze({ hp: 1.5, atk: 1.25, size: 1.7 }),   // boss chính nhân thêm so với boss gốc trong MONSTERS
  reward: Object.freeze({ senPerClear: 0.5, manh: 1, itemRolls: 3 }),   // hạt sen thưởng = boss.drop × (1 + senPerClear × số lần đã chinh phục); 1 mảnh yêu quái mỗi lần chinh phục (mục 5); số lần tung vật phẩm
});

// Mỗi phó bản: { id, ten, npc (người dẫn), dia (địa điểm gặp NPC, mô tả), mobs [loại thường, loại tinh anh], boss (id trong MONSTERS), vatPham (bảng rơi khi hạ boss) }.
// Quái lấy từ MONSTERS (js/data/monsters.js) nên cấp/Hệ/Công/Thủ cùng đường cong với bãi rừng.
export const DUNGEONS = Object.freeze({
  rungmoc: Object.freeze({ id: 'rungmoc', ten: 'Rừng Cổ Mộc', npc: 'Lão tiều phu', npcId: 'pbmoc', dia: 'Cửa rừng phía Bắc làng', mobs: Object.freeze(['dameo', 'reutinh']), boss: 'laomoc', vatPham: Object.freeze([['linhchi', 0.6], ['modeo', 0.3], ['trangcuong', 0.1]]) }),
  hangkim: Object.freeze({ id: 'hangkim', ten: 'Hang Sơn Cước', npc: 'Thợ mỏ già', npcId: 'pbkim', dia: 'Lối vào rừng phía Đông', mobs: Object.freeze(['daotac', 'cuopduong']), boss: 'soncuoc', vatPham: Object.freeze([['quangvang', 0.6], ['giapsat', 0.3], ['kiemdoc', 0.1]]) }),
  hothuy: Object.freeze({ id: 'hothuy', ten: 'Động Thủy Mẫu', npc: 'Ngư ông', npcId: 'pbthuy', dia: 'Lối vào rừng phía Tây', mobs: Object.freeze(['thuyquy', 'lyngu']), boss: 'thuymau', vatPham: Object.freeze([['ngocthuy', 0.6], ['voc', 0.3], ['chauthuy', 0.1]]) }),
  thaptho: Object.freeze({ id: 'thaptho', ten: 'Mê Cung Bảo Tháp', npc: 'Sư thầy giữ tháp', npcId: 'pbtho', dia: 'Chân đồi Bảo Tháp', mobs: Object.freeze(['thachtinh', 'hothap']), boss: 'thachlinh', vatPham: Object.freeze([['thachanh', 0.6], ['tuongda', 0.3], ['linhthach', 0.1]]) }),
});
export const DUNGEON_IDS = Object.freeze(Object.keys(DUNGEONS));
