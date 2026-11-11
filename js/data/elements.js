// Số liệu Ngũ Hành (GDD v2 mục 5.3–5.4; kế hoạch G2.1). Mọi con số là QUY ƯỚC TẠM, chờ ptg duyệt và playtest (G8.1).
// Chỉ sửa số / bảng ở file này; logic nằm ở js/world/elements.js (có test: tests/elements.test.mjs).
export const HE_LIST = Object.freeze(['kim', 'moc', 'thuy', 'hoa', 'tho']);
export const HE_NAME = Object.freeze({ kim: 'Kim', moc: 'Mộc', thuy: 'Thủy', hoa: 'Hỏa', tho: 'Thổ' });
// Tương khắc: Kim → Mộc → Thổ → Thủy → Hỏa → Kim (khóa = Hệ đi khắc, giá trị = Hệ bị khắc).
export const HE_KHAC = Object.freeze({ kim: 'moc', moc: 'tho', tho: 'thuy', thuy: 'hoa', hoa: 'kim' });
// Tương sinh: Kim → Thủy → Mộc → Hỏa → Thổ → Kim (khóa = Hệ đi sinh, giá trị = Hệ được sinh).
export const HE_SINH = Object.freeze({ kim: 'thuy', thuy: 'moc', moc: 'hoa', hoa: 'tho', tho: 'kim' });
export const ELEMENT_CFG = Object.freeze({
  tam: true,
  sinhPerAlly: 0.05,   // +5% sát thương cho mỗi đồng đội thuộc Hệ sinh ra Hệ của mình
  sinhMax: 0.10,       // tối đa +10%
  sinhRange: 10,       // mét: đồng đội phải đứng trong tầm này
  hoiTu: 0.10,         // "Ngũ Hành Hội Tụ" (nhóm đủ 5 Hệ): +10% mọi chỉ số
});
