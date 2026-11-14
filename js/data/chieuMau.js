// BẢNG MÀU + PHÁC THẢO HÌNH 30 chiêu (prompt "chiêu thức 3D chuyên nghiệp" mục 4 và mục 2 bước 1; mục 14 điểm 2). DỮ LIỆU THUẦN, có test: tests/chieumau.test.mjs.
// Mỗi Hệ có bảng 4 màu: nen (nền tối) → chu (màu chủ) → sang (màu sáng) → loi (lõi trắng ngà), cộng MỘT màu bổ sung nhỏ (buSung) để tạo tương phản (Thủy: vàng nhạt ánh trăng, Hỏa: tím khói...).
// Quy tắc: lõi sáng nhất, mép/nền đậm nhất; một chiêu dùng tối đa 4 màu chủ + 1 màu bổ sung (≤ 10% diện tích). Kiểm bằng ảnh đen trắng: độ sáng phải tăng dần nen < chu < sang < loi (test).
// Hai tông hạt trong js/data/chieuFx.js (FX_COLOR) nằm trong họ màu chu/sang của bảng này (test kiểm sắc độ). Số màu là TẠM, chờ ptg nhìn bằng mắt rồi chỉnh MỘT chỗ ở đây.
// Phác thảo: mỗi chiêu 3 hình dáng (phac), chọn 1 (chon = chỉ số 0..2); hình chọn phải khớp vùng cảnh báo của thẻ chiêu (js/world/chieuNguHanh.js). Bản vẽ SVG: node tools/chieuMau.mjs.
import { COMBAT_SKILLS } from './combatSkills.js';

const deepFreeze = (o) => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const k of Object.keys(o)) deepFreeze(o[k]); } return o; };

/** Diện tích tối đa của màu bổ sung trong một chiêu (tỉ lệ 0..1). */
export const TI_LE_BU_SUNG_TOI_DA = 0.1;
/** Số màu chủ tối đa trong một chiêu (không tính màu bổ sung). */
export const SO_MAU_CHU_TOI_DA = 4;

export const BANG_MAU = deepFreeze({
  kim:  { ten: 'Kim',  nen: '#2c303a', chu: '#aab3c4', sang: '#eef1f7', loi: '#fffdf2', buSung: '#c98f3a', tenBuSung: 'vàng đồng ấm' },
  moc:  { ten: 'Mộc',  nen: '#14301c', chu: '#3da55a', sang: '#b8ec8a', loi: '#f7ffe6', buSung: '#e68db0', tenBuSung: 'hồng sen nhạt' },
  thuy: { ten: 'Thủy', nen: '#0e2a3f', chu: '#2b8fd6', sang: '#9ee3f7', loi: '#f3fcff', buSung: '#f2e3a0', tenBuSung: 'vàng nhạt ánh trăng' },
  hoa:  { ten: 'Hỏa',  nen: '#3b1a14', chu: '#e8541c', sang: '#ffc23a', loi: '#fff4d8', buSung: '#6b4a85', tenBuSung: 'tím khói' },
  tho:  { ten: 'Thổ',  nen: '#3a2917', chu: '#b4833f', sang: '#ebd08f', loi: '#fff5d9', buSung: '#5a9e4b', tenBuSung: 'xanh rêu tươi' },
});
export const HE_LIST = Object.freeze(['kim', 'moc', 'thuy', 'hoa', 'tho']);

// ---- màu: các hàm thuần ----
const toRgb = (hex) => { const m = /^#([0-9a-f]{6})$/i.exec(String(hex)); if (!m) return null; const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lin = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
/** Độ sáng tương đối 0..1 (chuẩn WCAG). Màu hỏng → 0. */
export function doSang(hex) { const c = toRgb(hex); return c ? 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]) : 0; }
/** Tỉ lệ tương phản 1..21 giữa hai màu. */
export function tuongPhan(a, b) { const x = doSang(a), y = doSang(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
/** Sắc độ 0..360 và độ bão hòa 0..1 (HSL). Màu hỏng → null. */
export function sacDo(hex) {
  const c = toRgb(hex); if (!c) return null; const [r, g, b] = c.map((v) => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)); let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s };
}
/** Khoảng cách giữa hai sắc độ (0..180). */
export const lechSacDo = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
/** Màu số 0xRRGGBB (cho three.js) từ chuỗi '#rrggbb'. Hỏng → 0. */
export const hexSo = (hex) => { const c = toRgb(hex); return c ? (c[0] << 16) | (c[1] << 8) | c[2] : 0; };
/** Hex xám (ảnh đen trắng) theo độ sáng cảm nhận: để kiểm "hình chiêu vẫn rõ khối". */
export function hexXam(hex) { const c = toRgb(hex); if (!c) return '#000000'; const y = Math.round(0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]).toString(16).padStart(2, '0'); return `#${y}${y}${y}`; }

/** Bảng màu của một Hệ (kim|moc|thuy|hoa|tho); lạ → null. */
export const mauHe = (he) => (typeof he === 'string' && Object.prototype.hasOwnProperty.call(BANG_MAU, he) ? BANG_MAU[he] : null);
/** Màu của một chiêu theo id: bảng màu Hệ của chiêu + tỉ lệ màu bổ sung. Chiêu lạ → null. */
export function mauChieu(id) {
  const s = COMBAT_SKILLS.find((x) => x.id === id); if (!s) return null;
  const b = BANG_MAU[s.he]; if (!b) return null;
  return { id, he: s.he, nen: b.nen, chu: b.chu, sang: b.sang, loi: b.loi, buSung: b.buSung, tiLeBuSung: s.slot === 'tuyet' ? TI_LE_BU_SUNG_TOI_DA : 0.06 };
}

// ---- phác thảo hình (3 hình dáng, chọn 1) ----
// y = ý tưởng một câu · tk = 3 từ khóa cảm xúc · phac = 3 hình dáng · chon = chỉ số hình được chọn (0..2)
const P = (y, tk, phac, chon) => ({ y, tk, phac, chon });
export const PHAC_THAO = deepFreeze({
  kim_1: P('Một nhát chém quạt ánh bạc trước mặt, để lại vệt kim loại.', ['sắc lạnh', 'dứt khoát', 'ánh bạc'], ['Vệt cung trăng khuyết một nét, mép mỏng', 'Ba vạch chéo song song kiểu móng vuốt', 'Cánh quạt mảnh thoi tỏa ra từ tay'], 0),
  moc_1: P('Ba mũi tên lá xanh mờ xuyên bóng tối, để lại vệt phấn.', ['lặng lẽ', 'xuyên thấu', 'huyền ảo'], ['Một mũi tên dài rồi tách ba', 'Ba mũi tên hình lá nhọn tỏa nhẹ trong nón hẹp', 'Rễ cây phóng thẳng như mũi tên'], 1),
  thuy_1: P('Chưởng đẩy ra một luồng băng hẹp, mép tinh thể.', ['lạnh', 'thẳng', 'trong suốt'], ['Cột băng nhọn dài một khối', 'Luồng sương gợn sóng hẹp', 'Chuỗi mảnh tinh thể nối nhau bay thẳng'], 2),
  hoa_1: P('Chưởng đẩy một dải lửa hẹp, đầu nhọn như mũi giáo.', ['nóng', 'dồn nén', 'bùng'], ['Quả cầu lửa tròn', 'Dải lửa hẹp đầu mũi giáo', 'Ba tia lửa xòe ra'], 1),
  tho_1: P('Đập chưởng xuống, một dải đá trồi lên dọc đường ngắn.', ['nặng', 'vững', 'trầm'], ['Cột đá mọc thành hàng', 'Sóng đất cuộn ngắn', 'Bàn tay đá khổng lồ vỗ xuống'], 0),
  kim_2: P('Vòng khí bạc bao quanh người, vân chéo như giáp.', ['vững', 'sáng', 'kín'], ['Vòng tròn ánh bạc mỏng', 'Giáp mảnh thoi xếp lớp', 'Chuông úp vàng nhạt'], 1),
  moc_2: P('Lá xoáy quanh người rồi tan thành bóng mờ.', ['nhẹ', 'lặng', 'biến mất'], ['Lá xoáy thành cột rồi tan', 'Sương xanh nhạt phủ người', 'Dây leo cuộn rồi buông'], 0),
  thuy_2: P('Màn nước trong bao người như bong bóng sen.', ['dịu', 'trong', 'mềm'], ['Bong bóng nước nguyên khối', 'Giọt sương rơi thành vòng', 'Cánh sen nước khép lại quanh người'], 2),
  hoa_2: P('Lửa rồng xoáy quanh người, gân lửa chạy dọc tay.', ['phẫn nộ', 'nóng rực', 'bùng'], ['Rồng lửa cuộn quanh thân', 'Vòng lửa quay tăng tốc', 'Gân lửa nổi trên hai tay'], 0),
  tho_2: P('Khiên đá trồi lên trước ngực, vỡ thì bắn mảnh.', ['chắc', 'nặng', 'đẩy lùi'], ['Phiến đá lớn dựng đứng', 'Vòng đá nhỏ lơ lửng quanh người', 'Mai rùa đất úp lên'], 1),
  kim_3: P('Bóng kỵ binh kim loại lao thẳng một đường.', ['dồn dập', 'xung phong', 'nặng'], ['Mũi tên kim loại lớn', 'Bóng ngựa chiến mờ sau vệt sáng', 'Ba lưỡi giáo song song'], 1),
  moc_3: P('Hương trầm xanh tỏa rộng, cánh hoa rơi.', ['thơm', 'lan tỏa', 'ru ngủ'], ['Sóng hương tròn lan ra', 'Mưa cánh hoa rơi chậm', 'Dây leo mọc lan từ tâm'], 1),
  thuy_3: P('Băng lan nhanh khắp mặt đất rồi vỡ thành tinh thể.', ['bao trùm', 'giá buốt', 'tĩnh lặng'], ['Mặt băng phẳng hình tròn', 'Băng lan hình bông tuyết sáu cánh', 'Cột băng mọc dày đặc'], 1),
  hoa_3: P('Rồng lửa lao khỏi biển lửa dọc một đường dài.', ['uy mãnh', 'lao vút', 'rền vang'], ['Rồng lửa thẳng một khối', 'Cột lửa trồi lên nối nhau theo đường', 'Hai rồng lửa đan nhau'], 0),
  tho_3: P('Trận đá lõm xuống, hút mọi thứ vào tâm.', ['hút', 'nặng', 'trầm'], ['Vòng đá xoáy lõm vào', 'Hố đất nứt sâu', 'Cột đá nghiêng về tâm'], 0),
  kim_kimcang_4: P('Thân hóa kim loại, vân vàng sáng chạy khắp người.', ['bất động', 'bóng loáng', 'nặng'], ['Áo giáp vàng phủ kín người', 'Tượng kim loại đứng yên', 'Vòng sáng vàng thu sát thân'], 1),
  kim_thietky_4: P('Nhát chém dọc hẹp, xẻ không khí thành khe sáng.', ['xé', 'thẳng', 'sắc'], ['Một vạch sáng dài', 'Hai vệt chéo hình chữ X', 'Lưỡi trăng dựng đứng'], 0),
  moc_uminh_4: P('Sương mê bốc lên từ mục tiêu rồi lan rộng.', ['mờ', 'ngấm', 'mê hoặc'], ['Khói cuộn tròn', 'Bào tử phát sáng bay lơ lửng', 'Sợi khói nối các mục tiêu'], 1),
  moc_anthan_4: P('Cơn lốc lá cuốn người lao ra sau lưng mục tiêu.', ['nhanh', 'lặng', 'vụt qua'], ['Lốc lá nhỏ tại chỗ', 'Vệt lá kéo dài sau người', 'Bóng người hóa thành lá rồi hiện ra'], 2),
  thuy_camlo_4: P('Giọt cam lộ rơi thành vòng sáng, rửa sạch vết xấu.', ['thanh tịnh', 'ấm', 'rửa sạch'], ['Mưa giọt sương', 'Chữ Phạn bằng nước nổi lên', 'Vòng sóng nở rộng từ chân'], 2),
  thuy_huyenbang_4: P('Xích băng bay thẳng, quấn chân mục tiêu.', ['trói', 'buốt', 'thẳng'], ['Mũi băng nhọn', 'Xích băng xoắn', 'Dây băng uốn như roi'], 1),
  hoa_liethoa_4: P('Mưa lửa rơi từ trên cao, nổ thành chấm.', ['dồn dập', 'rực', 'rơi xuống'], ['Một thiên thạch lửa lớn', 'Mưa tia lửa nhỏ dày', 'Ba cột lửa rơi'], 1),
  hoa_hoalong_4: P('Hơi thở rồng nổ ngay trên đầu mục tiêu.', ['nghẹt thở', 'nổ', 'uy'], ['Vòng lửa nổ tròn', 'Đầu rồng phun tia xuống', 'Cột lửa dựng đứng'], 1),
  tho_daidia_4: P('Giáp đá nở ra bao cả nhóm.', ['che chở', 'nặng', 'chắc'], ['Vòng cột đá', 'Mái vòm đá', 'Giáp vảy rùa'], 1),
  tho_hukhong_4: P('Mạch đất sáng chảy từ ngoài vào, hút về tâm.', ['kéo', 'ngầm', 'sâu'], ['Mạng nứt sáng hội tụ về tâm', 'Vòng xoáy bụi', 'Cột đá hút bụi'], 0),
  kim_tuyet: P('Chày kim cang khổng lồ giáng xuống, tiếng chuông vang.', ['uy nghiêm', 'giáng xuống', 'ngân vang'], ['Chày kim cang to rơi từ trời', 'Bóng sáng pho tượng Kim Cang', 'Chuông lớn úp xuống'], 0),
  moc_tuyet: P('Muôn lá cuốn thành cây lớn, hé nở hoa sen.', ['muôn lá', 'sinh sôi', 'hé nở'], ['Lốc vạn chiếc lá', 'Cây cổ thụ vươn lên', 'Hoa sen khổng lồ nở ra'], 2),
  thuy_tuyet: P('Thủy triều trăng dâng nhẹ khắp vùng, sen nở trên mặt nước.', ['êm', 'dâng', 'thanh khiết'], ['Sóng triều tràn', 'Mưa cam lộ dưới ánh trăng', 'Hồ sen nổi lên'], 1),
  hoa_tuyet: P('Hoa sen lửa nở dưới chân, cánh bung tỏa ra.', ['rực rỡ', 'bung nở', 'thiêng'], ['Sen lửa tám cánh', 'Chim lửa vút lên', 'Vòng lửa đồng tâm'], 0),
  tho_tuyet: P('Bóng núi lớn đè xuống, mặt đất nứt toác.', ['đè nặng', 'tối', 'rung chuyển'], ['Núi đá rơi', 'Bóng núi tối phủ cả vùng', 'Bàn tay đá khổng lồ'], 1),
});

/** Phác thảo của một chiêu: { ...ý tưởng, hinhChon } hoặc null nếu chiêu lạ. */
export function phacThao(id) { const p = Object.prototype.hasOwnProperty.call(PHAC_THAO, id) ? PHAC_THAO[id] : null; return p ? { ...p, hinhChon: p.phac[p.chon] } : null; }
