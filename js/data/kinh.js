// Lời kinh cho hoạt động Tụng kinh (Phiên 14b). Văn bản truyền thống đọc âm Hán-Việt, lưu truyền công cộng.
// CẦN ptg (hoặc người am hiểu) đối chiếu trước khi coi là chuẩn. Mỗi phần tử trong `lines` là một câu.
const NIEM = 'Nam mô A Di Đà Phật';

const BAT_NHA = [
  'Quán Tự Tại Bồ Tát, hành thâm Bát Nhã Ba La Mật Đa thời,',
  'chiếu kiến ngũ uẩn giai không, độ nhất thiết khổ ách.',
  'Xá Lợi Tử, sắc bất dị không, không bất dị sắc,',
  'sắc tức thị không, không tức thị sắc,',
  'thọ tưởng hành thức, diệc phục như thị.',
  'Xá Lợi Tử, thị chư pháp không tướng,',
  'bất sanh bất diệt, bất cấu bất tịnh, bất tăng bất giảm.',
  'Thị cố không trung, vô sắc, vô thọ tưởng hành thức,',
  'vô nhãn nhĩ tỷ thiệt thân ý, vô sắc thanh hương vị xúc pháp,',
  'vô nhãn giới, nãi chí vô ý thức giới,',
  'vô vô minh, diệc vô vô minh tận,',
  'nãi chí vô lão tử, diệc vô lão tử tận,',
  'vô khổ tập diệt đạo, vô trí diệc vô đắc.',
  'Dĩ vô sở đắc cố, Bồ Đề Tát Đỏa,',
  'y Bát Nhã Ba La Mật Đa cố, tâm vô quải ngại,',
  'vô quải ngại cố, vô hữu khủng bố,',
  'viễn ly điên đảo mộng tưởng, cứu cánh Niết Bàn.',
  'Tam thế chư Phật, y Bát Nhã Ba La Mật Đa cố,',
  'đắc A Nậu Đa La Tam Miệu Tam Bồ Đề.',
  'Cố tri Bát Nhã Ba La Mật Đa,',
  'thị đại thần chú, thị đại minh chú,',
  'thị vô thượng chú, thị vô đẳng đẳng chú,',
  'năng trừ nhất thiết khổ, chân thật bất hư.',
  'Cố thuyết Bát Nhã Ba La Mật Đa chú, tức thuyết chú viết:',
  'Yết đế, yết đế, Ba la yết đế, Ba la tăng yết đế, Bồ đề tát bà ha.',
];

const VANG_SANH = [
  'Nam mô A Di Đa Bà Dạ', 'Đa Tha Dà Đa Dạ', 'Đa Điệt Dạ Tha', 'A Di Rị Đô Bà Tỳ', 'A Di Rị Đa',
  'Tất Đam Bà Tỳ', 'A Di Rị Đa', 'Tỳ Ca Lan Đế', 'A Di Rị Đa', 'Tỳ Ca Lan Đa',
  'Già Di Nị', 'Già Già Na', 'Chỉ Đa Ca Lệ', 'Ta Bà Ha',
];

const HOI_HUONG = [
  'Nguyện đem công đức này', 'Hướng về khắp tất cả', 'Đệ tử và chúng sanh', 'Đều trọn thành Phật đạo.',
  'Nguyện tiêu ba chướng, trừ phiền não,', 'Nguyện được trí huệ, thật sáng suốt,', 'Nguyện cho tội chướng, thảy tiêu trừ,', 'Đời đời thường hành Bồ Tát đạo.',
];

const DAI_BI_1 = ["Nam mô hắc ra đát na, đa ra dạ da", "Nam mô a rị da", "Bà lô yết đế, thước bát ra da", "Bồ đề tát đỏa bà da", "Ma ha tát đỏa bà da", "Ma ha ca lô ni ca da", "Án", "Tát bàn ra phạt duệ", "Số đát na đát tỏa", "Nam mô tất kiết lật đỏa, y mông a rị da", "Bà lô kiết đế, thất Phật ra lăng đà bà", "Nam mô na ra cẩn trì", "Hê rị ma ha bàn đa sa mế", "Tát bà a tha đậu thâu bằng", "A thệ dựng", "Tát bà tát đa, na ma bà già", "Ma phạt đạt đậu", "Đát điệt tha", "Án", "A bà lô hê", "Lô ca đế", "Ca ra đế", "Di hê rị", "Ma ha bồ đề tát đỏa", "Tát bà tát bà", "Ma ra ma ra", "Ma hê ma hê, rị đà dựng", "Cu lô cu lô yết mông", "Độ lô độ lô, phạt xà da đế", "Ma ha phạt xà da đế", "Đà ra đà ra", "Địa rị ni", "Thất Phật ra da", "Giá ra giá ra", "Mạ mạ phạt ma ra", "Mục đế lệ"];
const DAI_BI_2 = ["Y hê y hê", "Thất na thất na", "A ra sâm Phật ra xá lợi", "Phạt sa phạt sâm", "Phật ra xá da", "Hô lô hô lô ma ra", "Hô lô hô lô hê rị", "Ta ra ta ra", "Tất rị tất rị", "Tô rô tô rô", "Bồ đề dạ, bồ đề dạ", "Bồ đà dạ, bồ đà dạ", "Di đế rị dạ", "Na ra cẩn trì", "Địa rị sắc ni na", "Ba dạ ma na", "Ta bà ha", "Tất đà dạ, ta bà ha", "Ma ha tất đà dạ, ta bà ha", "Tất đà du nghệ, thất bàn ra dạ, ta bà ha", "Na ra cẩn trì, ta bà ha", "Ma ra na ra, ta bà ha", "Tất ra tăng a mục khê da, ta bà ha", "Ta bà ma ha a tất đà dạ, ta bà ha", "Giả kiết ra a tất đà dạ, ta bà ha", "Ba đà ma yết tất đà dạ, ta bà ha", "Na ra cẩn trì bàn đà ra dạ, ta bà ha", "Ma bà lợi thắng yết ra dạ, ta bà ha", "Nam mô hắc ra đát na, đa ra dạ da", "Nam mô a rị da", "Bà lô kiết đế", "Thước bàn ra dạ", "Ta bà ha", "Án, tất điện đô", "Mạn đa ra", "Bạt đà dạ", "Ta bà ha"];
export const DAI_BI = [...DAI_BI_1, ...DAI_BI_2];

export const KINH = [
  { id: 'niemphat', ten: 'Niệm Phật', lines: Array.from({ length: 9 }, () => NIEM) },
  { id: 'batnha', ten: 'Bát Nhã Tâm Kinh', lines: BAT_NHA },
  { id: 'vangsanh', ten: 'Chú Vãng Sanh', lines: VANG_SANH },
  { id: 'daibi', ten: 'Chú Đại Bi', lines: DAI_BI },
  { id: 'hoihuong', ten: 'Kệ Hồi Hướng', lines: HOI_HUONG },
];
