// Thông tin + biểu tượng chiêu (Phiên 162, Bản 2 mục 1): LOGIC THUẦN, có test (tests/chieuinfo.test.mjs). Giao diện (js/ui/heSkill.js) chỉ vẽ lại kết quả.
// infoOf(id, {tuvi, level}) → bảng giữ-để-xem: tên, Hệ, ô, cấp mở, cấp chiêu, hồi chiêu, gồng/hậu động, sát thương mẫu, nội tại, giá, móc nối, cách khắc, vùng cảnh báo.
// iconSpec(id) → mô tả biểu tượng (màu Hệ + hình theo hoa văn + chữ cái) để UI vẽ bằng SVG.
import { skillById } from './skillCatalog.js';
import { chieuOf } from './chieuNguHanh.js';
import { describeSkill } from './luyenChieu.js';
import { SKILL_CAP } from '../data/combatSkills.js';
import { congOf } from './stats.js';
import { effectiveHeSo, skillLevelCap, levelMult } from './skillEngine.js';

export const HE_TXT = { kim: 'Kim', moc: 'Mộc', thuy: 'Thủy', hoa: 'Hỏa', tho: 'Thổ' };
export const HE_COLOR = { kim: '#dfe3e8', moc: '#3f9b4a', thuy: '#2f6fd0', hoa: '#d9432b', tho: '#c9a227' };
const SLOT_TXT = { 1: 'Chiêu 1', 2: 'Chiêu 2', 3: 'Chiêu 3', 4: 'Chiêu 4', tuyet: 'Tuyệt học' };
const VAN_TXT = { vachCheo: 'vạch chéo', hoaVanLa: 'hoa văn lá', gonSong: 'gợn sóng', oVuong: 'ô vuông', socNhon: 'sọc nhọn' };
const HINH_TXT = (h) => (!h ? '' : h.kieu === 'duong' ? `đường dài ${h.dai} m, rộng ${h.rong} m` : h.kieu === 'non' ? `hình quạt ${h.goc}°, dài ${h.dai} m` : h.kieu === 'tron' ? `vòng bán kính ${h.r} m` : '');
const secs = (n) => `${String(Math.round(n * 100) / 100).replace('.', ',')} s`;
const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);

/** Giá phải trả: chuỗi, hoặc object { giamGiap, chayCham, trongLucDung } → câu tiếng Việt. */
function giaTxt(g) {
  if (typeof g === 'string') return g;
  if (!g || typeof g !== 'object') return '';
  const p = [];
  if (g.giamGiap) p.push(`giáp giảm ${Math.round(g.giamGiap * 100)}%`);
  if (g.chayCham) p.push(`chạy chậm ${Math.round(g.chayCham * 100)}%`);
  if (g.trongLucDung) p.push('trọng lực dừng lại khi dùng');
  return p.join(', ');
}

/** Nội tại: các dòng mô tả cơ chế riêng của thẻ chiêu (chỉ cái thẻ thật sự khai báo). */
function noiTai(sk, c) {
  const out = [];
  const fx = describeSkill(sk); if (fx && fx !== 'Chiêu hỗ trợ') out.push(...fx.split(' · ').filter((x) => !/^Gây /.test(x)));
  if (!c) return out;
  if (c.thieuDot) out.push(`Áp ${num(c.thieuDot.tang, 1)} tầng Thiêu đốt`);
  if (c.thieuDotDonThuong) out.push(`Đòn thường áp ${num(c.thieuDotDonThuong.tang, 1)} tầng Thiêu đốt (tối đa 1 lần / ${secs(num(c.thieuDotDonThuong.moiGiay, 1))})`);
  if (c.noLan) out.push(`Nổ lan bán kính ${c.noLan.r} m, người xung quanh nhận ${Math.round(num(c.noLan.pctSatThuong) * 100)}%`);
  if (c.hatTung) out.push(`Hất tung ${secs(c.hatTung.giay)}${c.hatTung.tangToiThieu ? `, từ ${c.hatTung.tangToiThieu} tầng Thiêu đốt hất ${secs(c.hatTung.giayTuNhieuTang)}` : ''}`);
  if (c.tieuTang) out.push(`Tiêu hết tầng Thiêu đốt, mỗi tầng cộng ${c.tieuTang.congHeSoMoiTang} hệ số`);
  if (c.moMoCombo) out.push('Mắt xích mở combo trên không');
  if (c.phanTran) out.push(`Phản ${Math.round(c.phanTran * 100)}% sát thương nhận (có trần)`);
  if (c.lao) out.push(`Lao tới ${secs(c.lao)}`);
  if (c.noCuoi) out.push(`Nổ cuối ${Math.round(num(c.noCuoi.pct) * 100)}% sát thương`);
  if (c.batKhaXamPham) out.push(`Bất khả xâm phạm ${secs(c.batKhaXamPham.pve)} (đấu trường ${secs(c.batKhaXamPham.voDai)})`);
  if (c.huyKhiGong) out.push(`Bị ngắt lúc gồng: hoàn ${Math.round(num(c.huyKhiGong.hoanCd) * 100)}% hồi chiêu`);
  if (c.huyDuoc) out.push('Có thể bị ngắt khi đang gồng');
  return out;
}

/** Bảng thông tin một chiêu. id lạ → null. opts: { tuvi (Tu Vi/cấp hiệu dụng), level (cấp chiêu đã nâng, mặc định 1) }. */
export function infoOf(id, opts = {}) {
  const sk = skillById(id); if (!sk) return null;
  const c = chieuOf(id), tuvi = Math.max(1, num(opts.tuvi, 1));
  const cap = num(SKILL_CAP[sk.slot], 0), moKhoa = tuvi >= cap;
  const lvCap = Math.max(1, skillLevelCap(tuvi)), level = Math.max(1, Math.min(lvCap, Math.floor(num(opts.level, 1))));
  const heSoCap = effectiveHeSo(sk, level), cong = congOf(tuvi);
  const he = sk.he, cb = c && c.canhBao ? c.canhBao : null;
  return {
    id, ten: sk.ten, he, heTen: HE_TXT[he] || he, slot: sk.slot, slotTen: SLOT_TXT[sk.slot] || String(sk.slot),
    cap, moKhoa, level, levelToiDa: lvCap, nhanCap: levelMult(level),
    cd: num(sk.cd), gong: c ? num(c.gong) : 0, hauDong: c ? num(c.hauDong) : 0,
    heSo: num(sk.heSo), heSoCap, ho_tro: !(sk.heSo > 0),
    satThuongMau: sk.heSo > 0 ? Math.round(cong * heSoCap) : 0,   // Công × hệ số cấp (chưa tính Thủ mục tiêu / khắc Hệ)
    noiTai: noiTai(sk, c), gia: c ? giaTxt(c.gia) : '', moc: c && Array.isArray(c.moc) ? c.moc.map((m) => (skillById(m) || {}).ten || m) : [],
    khac: c && c.khac ? c.khac : '',
    canhBao: cb ? { hinh: HINH_TXT(cb.hinh), hoaVan: VAN_TXT[cb.hoaVan] || '', loi: !!cb.loi } : null,
  };
}

/** Các dòng chữ cho bảng giữ-để-xem (UI chỉ gán textContent). Trả mảng [nhãn, nội dung]. */
export function infoRows(info) {
  if (!info) return [];
  const r = [['Hệ', `${info.heTen} · ${info.slotTen}`]];
  r.push(['Mở ở cấp', `${info.cap}${info.moKhoa ? '' : ' (chưa mở)'}`]);
  r.push(['Cấp chiêu', `${info.level} / ${info.levelToiDa}  (×${String(info.nhanCap).replace('.', ',')} sát thương)`]);
  r.push(['Hồi chiêu', secs(info.cd)]);
  if (info.gong || info.hauDong) r.push(['Gồng / hậu động', `${secs(info.gong)} / ${secs(info.hauDong)}`]);
  r.push(['Sát thương', info.ho_tro ? 'Chiêu hỗ trợ, không gây sát thương' : `${info.satThuongMau} (hệ số ${String(info.heSoCap).replace('.', ',')} × Công)`]);
  if (info.noiTai.length) r.push(['Nội tại', info.noiTai.join('; ')]);
  if (info.canhBao) r.push(['Vùng báo', `${info.canhBao.hinh}${info.canhBao.hoaVan ? `, ${info.canhBao.hoaVan}` : ''}${info.canhBao.loi ? ' (có lợi cho người dùng)' : ''}`]);
  if (info.gia) r.push(['Cái giá', info.gia]);
  if (info.moc.length) r.push(['Nối tiếp', info.moc.join(', ')]);
  if (info.khac) r.push(['Bị khắc bởi', info.khac]);
  return r;
}

/** Biểu tượng: màu Hệ + hình nền theo hoa văn vùng cảnh báo + 2 chữ cái đầu tên. UI vẽ bằng SVG (createElementNS). */
export function iconSpec(id) {
  const sk = skillById(id); if (!sk) return null;
  const c = chieuOf(id), van = c && c.canhBao ? c.canhBao.hoaVan : 'vachCheo';
  const words = sk.ten.trim().split(/\s+/);
  return { id, he: sk.he, mau: HE_COLOR[sk.he] || '#f1db9f', van, chu: (words[0] || '?').slice(0, 1) + (words.length > 1 ? words[words.length - 1].slice(0, 1) : ''), tuyet: sk.slot === 'tuyet', hoTro: !(sk.heSo > 0) };
}
