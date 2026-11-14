// NPC trong chùa (Phiên 14g): thầy Trụ trì (chánh điện), thầy Tri khách (trước Nhà Khách), cư sĩ vườn thiền.
// DỮ LIỆU + LOGIC THUẦN (không three.js, có test). Bấm vào NPC → nhân vật đi tới điểm đứng → NPC nói một câu (bong bóng + thông báo),
// mỗi NPC tặng 1 hạt sen mỗi ngày (giá trị TẠM, chờ ptg duyệt). Cảnh 3D: js/scene/npc.js; giao diện: js/ui/npc.js.
import { addCircle } from './layout.js';
import './outside.js';   // đăng ký vùng đi bộ ngoài cổng (dân làng đứng ngoài chùa)

/** Mỗi lời ≤ 80 ký tự (giới hạn bong bóng của avatar). Lời do dự án tự soạn, mang tính nhắc nhở nhẹ nhàng, không bói toán. */
const TEMPLE_NPCS = [
  { id: 'truru', ten: 'Thầy Trụ trì', color: 'casa', hair: 'troc', beard: 'bac', x: 2.6, z: -40.6, ry: 0, stand: { x: 2.0, z: -37.6 },
    lines: [
      'A Di Đà Phật. Thấy bạn ghé chùa, lòng thầy cũng nhẹ đi.',
      'Thở vào biết mình đang thở vào, thở ra biết mình đang thở ra.',
      'Việc nhỏ làm bằng lòng tử tế cũng là một nén nhang.',
      'Đừng vội tìm bình an ở xa; nó ở ngay nơi bạn dừng lại.',
      'Mỗi sáng thức dậy, hỏi mình hôm nay có thể giúp được ai.',
      'Ngồi yên một lát, mây tự tan. Đừng đuổi theo suy nghĩ.',
      'Lời nói dịu dàng là món quà không tốn gì mà quý nhất.',
      'Cảm ơn bạn đã đến. Chúc bạn một ngày an lạc.',
    ] },
  { id: 'trikhach', ten: 'Thầy Tri khách', color: 'nau', hair: 'troc', x: 34.5, z: -19.5, ry: 0, stand: { x: 34.5, z: -16.4 },
    lines: [
      'Mời bạn vào Nhà Khách uống chén trà nóng nhé.',
      'Chánh điện ở phía trước, cứ đi thẳng lối giữa rồi lên bậc thềm.',
      'Vào điện nhớ bước nhẹ, nói khẽ, cho người khác được yên lòng.',
      'Chỉ giúp người khác một câu đường cũng là việc thiện.',
      'Vườn thiền phía Tây, hồ cá phía Đông, bạn cứ thong thả dạo.',
      'Trà thất phía Tây có chén trà ấm đang chờ bạn.',
      'Quan Âm đài ở sau chánh điện, đi theo hành lang là tới.',
    ] },
  { id: 'cusi', ten: 'Cư sĩ vườn thiền', color: 'lam', hair: 'bui', x: -58.5, z: -23, ry: Math.PI / 2, stand: { x: -57, z: -20.5 },
    lines: [
      'Sỏi này tôi cào mỗi sáng. Cào xong, lòng cũng phẳng như sỏi.',
      'Hòn đá ngồi yên cả trăm năm mà chẳng than mệt.',
      'Nhìn một hòn đá thật lâu, bạn sẽ nghe được chính mình.',
      'Đừng cào cho thật thẳng; đường lượn cũng đẹp.',
      'Gió qua tre nghe như tiếng kinh, bạn thấy không?',
    ] },
  { id: 'chutieu', ten: 'Chú tiểu Minh', color: 'nau', hair: 'troc', scale: 0.85, x: -4.5, z: 44.5, ry: 0, stand: { x: -4.5, z: 47.5 },
    lines: [
      'Hà! Con tập võ mỗi sáng cho khỏe người, tâm cũng tỉnh theo.',
      'Hành giả cứ thong thả. Tu tập là việc đường dài, không cần vội.',
      'Thầy Trụ trì ở trong chánh điện, đi thẳng qua Tam quan là tới.',
      'Cây bồ đề cổ phía Tây chánh điện đã lâu chưa đâm chồi mới.',
      'Con nghe nói tám cảnh giới khinh công đã thất truyền từ lâu lắm.',
    ] },
];

/** Dân làng ngoài chùa (Phiên 17). Cùng cách hoạt động với NPC trong chùa. scale < 1 = trẻ em. */
export const VILLAGERS = [
  { id: 'bacnong', ten: 'Bác Hai nông dân', color: 'nau', hair: 'troc', x: -10, z: 78, ry: Math.PI / 2, stand: { x: -7.5, z: 78 },
    lines: [
      'Chào cháu. Mùa này lúa trổ đòng, nhờ trời thuận mưa hòa.',
      'Sáng nào bác cũng lên chùa thắp nén nhang rồi mới ra đồng.',
      'Làm ruộng cũng như tu: gieo đúng lúc thì gặt đúng mùa.',
      'Cháu cứ đi thẳng ra chợ làng, chiều có nhiều người lắm.',
      'Muốn nghe thác thì rẽ phải ở ngã ba, đi hết đường mòn.',
      'Muốn vào rừng thông thì rẽ trái. Nhớ mang theo ngụm nước nhé.',
    ] },
  { id: 'cohoa', ten: 'Cô Lan bán hoa', color: 'do', hair: 'bui', x: -19, z: 123.8, ry: 0, stand: { x: -19, z: 126.5 },
    lines: [
      'Hoa sen, hoa cúc, hoa huệ đây. Mua một bó dâng Phật nhé?',
      'Hoa tươi cắt từ sáng sớm, còn đọng sương đấy.',
      'Dâng hoa không cần nhiều, cốt ở tấm lòng thành.',
      'Ở làng này ai cũng quý chùa Diệu Giang lắm.',
      'Sen cô hái ở đầm sau làng, thơm lắm. Cháu ngửi thử xem.',
      'Chúc cháu một ngày bình an, hoa nở cả đường đi.',
    ] },
  { id: 'embe', ten: 'Bé Tí chăn trâu', color: 'lam', hair: 'bui', scale: 0.7, x: 11, z: 95, ry: -Math.PI / 2, stand: { x: 9, z: 95 },
    lines: [
      'Cháu chào anh chị ạ! Cháu đang đi tìm con trâu của ông.',
      'Trâu nhà cháu hiền lắm, nó thích ăn cỏ ven đường mòn.',
      'Anh chị có thấy con diều của cháu không? Nó bay lên chùa rồi.',
      'Cháu thích nghe chuông chùa, nghe xong thấy vui vui.',
      'Ra thác chơi mát lắm, nhưng đừng lội xuống sâu nhé!',
    ] },
  { id: 'ongcu', ten: 'Ông Ba gốc đa', color: 'xam', hair: 'troc', beard: 'bac', x: -4, z: 129.6, ry: Math.PI / 2, stand: { x: -4, z: 126.6 },
    lines: [
      'Gốc đa này già hơn cả làng. Ông ngồi đây nghe chuyện đời.',
      'Người ta đi rồi đến, cây đa cứ đứng yên mà thấy hết.',
      'Sống chậm lại một nhịp, mọi chuyện sẽ tự êm.',
      'Hồi xưa chùa chỉ là gian tranh nhỏ, nay khang trang thế này.',
      'Nghe ông: gặp ai cũng chào, ăn ở hiền thì phúc đến.',
    ] },
  { id: 'tieuphu', ten: 'Chú Sáu tiều phu', color: 'nau', hair: 'troc', x: -101, z: 83, ry: 0, stand: { x: -100, z: 86 },
    lines: [
      'Chú chỉ nhặt cành khô thôi, cây sống để lại cho rừng.',
      'Rừng thông nghe gió reo như tiếng kinh, cháu có thấy không?',
      'Đường mòn phía Đông thẳng tới thác nước, mát lắm.',
      'Sương sớm trong rừng lạnh. Mặc ấm vào nhé cháu.',
      'Gốc cổ thụ kia đã mấy trăm tuổi, đừng khắc tên lên thân cây.',
    ] },
  { id: 'nvdidong', ten: 'Nhân viên Di Động Sen Vàng', color: 'vang', hair: 'bui', x: -14.6, z: 109.9, ry: Math.PI / 2, stand: { x: -12.2, z: 109.9 },
    lines: [
      'Chào bạn! Tiệm Sen Vàng mới khai trương, mời bạn ghé xem.',
      'Điện thoại dùng bền là nhờ giữ gìn. Ốp lưng tốt đỡ hao hơn máy mới.',
      'Tiệm có kệ đủ màu, nhưng điện thoại hay nhất vẫn là cất đi khi ngồi thiền.',
      'Mua gì cũng cân nhắc nhu cầu thật, đừng chạy theo mẫu mới mỗi năm.',
      'Làng mình sóng yếu ở gần thác, muốn gọi điện thì ra đường làng nhé.',
      'Cảm ơn bạn đã ghé tiệm. Chúc bạn một ngày an lạc!',
    ] },
  { id: 'nvdienmay', ten: 'Nhân viên Điện Máy Lam Sen', color: 'lam', hair: 'troc', x: -14.6, z: 71.2, ry: Math.PI / 2, stand: { x: -11.5, z: 71.2 },
    lines: [
      'Chào bạn! Siêu thị Lam Sen có đủ tivi, tủ lạnh, máy giặt, điều hòa.',
      'Mua đồ điện nên chọn loại tiết kiệm điện, bền hơn và nhẹ hóa đơn.',
      'Tủ lạnh đừng nhét quá đầy, lạnh mới đều và đỡ tốn điện.',
      'Điều hòa để khoảng hai tám độ là mát mà không hại sức khỏe.',
      'Tiệm có nhận giao tận làng, kể cả ngoài chợ.',
      'Cảm ơn bạn đã ghé. Chúc cả nhà một ngày an lạc!',
    ] },
  { id: 'nvkimhoan', ten: 'Nhân viên Kim Hoàn Ngọc Lan', color: 'trang', hair: 'bui', x: 16.4, z: 129.6, ry: -Math.PI / 2, stand: { x: 12.4, z: 129.6 },
    lines: [
      'Kính chào quý khách đến với Kim Hoàn Ngọc Lan.',
      'Vàng đẹp nhất là vàng giữ được lâu, quý nhất vẫn là tấm lòng.',
      'Mời bạn ngắm trang sức qua tủ kính, cứ thong thả không vội.',
      'Món quà nhỏ tặng người thân luôn đáng giá hơn món đắt tặng người lạ.',
      'Tiệm mở cửa suốt ngày; hôm nay trời đẹp, bạn nhớ ghé vườn sen sau chùa nhé.',
      'Chúc bạn bình an, may mắn và nhiều niềm vui.',
    ] },
  // Mục 3 (14/11): nhân viên tiệm Bánh Sầu Riêng 9 Sạch (nhà phố 9 Sạch, STORE_9SACH ở outside.js) — bán Bánh sầu riêng 3 vị + Bánh sầu riêng pho mai than tre (js/ui/npc.js mở cửa hàng 'banhsr').
  // Đứng ở sân trước cửa tiệm, quay mặt ra đường (−x) như nhân viên Kim Hoàn; chỗ đứng 12,8 nằm trên vỉa hè (vùng duong-lang). Cách phông / hai giỏ hoa / standee ≥ 2,9 m. Vị trí là số TẠM, chưa nhìn bằng mắt.
  // 14/11: z 82,2 (trước 81,6) để điểm thử lối đi (16,5; 81,5) của tests/outside.test.mjs không bị NPC chặn.
  { id: 'nv9sach', ten: 'Nhân viên Bánh Sầu Riêng 9 Sạch', color: '9sach', hair: 'bui', x: 16.4, z: 82.2, ry: -Math.PI / 2, stand: { x: 12.8, z: 82.2 },
    lines: [
      'Chào bạn! Bánh Sầu Riêng 9 Sạch, sạch là chính, ngon là mười.',
      'Bánh sầu riêng 3 vị ăn vào là khỏe, hồi sức nhanh gấp năm lần.',
      'Bánh pho mai than tre: lỡ gục xuống vẫn đứng dậy ngay tại chỗ.',
      'Sầu riêng tươi chọn từng trái, làm bánh trong ngày.',
      'Mua một được ba, nhớ quay vòng may mắn trước cửa nhé.',
      'Cảm ơn bạn đã ghé tiệm. Chúc bạn một ngày an lạc!',
    ] },
  // Phiên 163: nhân viên tiệm trà Tách Hoa (STORE_TACHHOA ở outside.js, sân x 13–19, z 87–95, ngay cạnh tiệm 9 Sạch) — bán Trà sữa xoài hoàng kim 39 lá (+30 phút tự động hàng yêu hôm nay; js/ui/npc.js mở cửa hàng 'tachhoa').
  // Đứng sân trước cửa tiệm, quay mặt ra đường (−x) như nhân viên 9 Sạch; chỗ đứng 12,8 nằm trên vỉa hè (vùng duong-lang). Cách chiếc xe tay ga (15,9; 93,7) ≈ 3,6 m; để trống điểm giữa sân (16,5; 89) cho test lối đi. Vị trí là số TẠM, chưa nhìn bằng mắt.
  // 14/11: mặc đồng phục Tách Hoa (color 'tachhoa': áo trắng, yếm + nón beret xanh nhạt) theo ảnh nhân viên ptg gửi.
  { id: 'nvtachhoa', ten: 'Nhân viên Tách Hoa', color: 'tachhoa', hair: 'bui', x: 16.4, z: 90.2, ry: -Math.PI / 2, stand: { x: 12.8, z: 90.2 },
    lines: [
      'Chào bạn! Tách Hoa mới khai trương, mời bạn thử ly trà sữa nhé.',
      'Trà sữa xoài hoàng kim: ngọt thanh, uống vào tỉnh táo đánh quái cả buổi.',
      'Uống một ly là thêm nửa tiếng tự động hàng yêu hôm nay đó nha.',
      'Xoài chín cây chọn từng trái, làm ly nào tươi ly đó.',
      'Trà ngon thì cứ thong thả nhấp, đừng vội.',
      'Cảm ơn bạn đã ghé quán. Chúc bạn một ngày an lạc!',
    ] },
  { id: 'bacphuong', ten: 'Bác Tư khu phố', color: 'xam', hair: 'troc', beard: 'bac', x: 3.6, z: 153, ry: Math.PI / 2, stand: { x: 0.8, z: 153 },
    lines: [
      'Chào cháu. Xóm mình mỗi xóm mười nhà, đông quá thì lập xóm mới.',
      'Muốn dựng nhà thì cháu chọn một lô đất, bác ghi sổ cho.',
      'Ở xóm này hàng xóm tối lửa tắt đèn có nhau, cháu nhé.',
      'Muốn sang xóm khác chơi thì bảo bác, bác chỉ đường cho.',
      'Nhà cửa tươm tất thì lòng cũng yên, cháu cố gắng nhé.',
    ] },
  { id: 'haithuoc', ten: 'Cô Mai hái thuốc', color: 'trang', hair: 'bui', x: 93, z: 115, ry: Math.PI, stand: { x: 93, z: 112 },
    lines: [
      'Cô hái lá thuốc nam bên suối, ngày nào cũng vài rổ.',
      'Nước thác trong và mát, rửa mặt xong thấy nhẹ cả đầu.',
      'Cô tin một giấc ngủ ngon là thang thuốc quý nhất.',
      'Tiếng thác nghe lâu thì tâm cũng lắng. Cháu thử đứng nghe đi.',
      'Đừng hái hoa dại ven bờ nhé, để ong bướm còn chỗ ghé.',
    ] },
];

/** Mọi nhân vật có thể thưa chuyện: NPC trong chùa + dân làng. */
/** Người dẫn vào PHÓ BẢN (Phiên 139, mục 4c): đứng ở lối vào bốn khu rừng sâu. Bấm vào → bảng phó bản (js/ui/dungeonPanel.js). `dungeon` = id trong js/data/dungeons.js. Chỗ đứng đã dò bằng tests/npc.test.mjs (va chạm, tới được từ cổng). */
export const DUNGEON_NPCS = [
  { id: 'pbmoc', ten: 'Lão tiều phu', color: 'nau', hair: 'trang', beard: 'dai', x: -55, z: 77, ry: Math.PI / 2, stand: { x: -52.5, z: 77 }, dungeon: 'rungmoc',
    lines: ['Rừng Cổ Mộc phía trong tối lắm, cây già hóa yêu cả rồi.', 'Cháu muốn vào thì nói lão một tiếng, lão chỉ đường.', 'Quái trong đó hồi sinh mỗi lượt một mạnh, một to hơn.', 'Hạ được chín lượt, Lão Mộc Tinh mới chịu lộ mặt.', 'Ai từng thắng rồi quay lại, rừng còn dữ hơn lần trước.'] },
  { id: 'pbkim', ten: 'Thợ mỏ già', color: 'xam', hair: 'troc', x: 50, z: 120, ry: Math.PI / 2, stand: { x: 52.5, z: 120 }, dungeon: 'hangkim',
    lines: ['Hang Sơn Cước đào sâu vào núi, giặc cướp chiếm cả rồi.', 'Muốn xuống hang thì cứ bảo ta, ta mở lối cho.', 'Mỗi lượt bọn cướp quay lại, chúng đông và hung hơn.', 'Hết chín lượt thì Sơn Cước Đầu Mục tự ra mặt.', 'Thắng một lần chưa đủ, hang này càng thắng càng khó.'] },
  { id: 'pbthuy', ten: 'Ngư ông', color: 'lam', hair: 'bui', x: -55, z: 105, ry: Math.PI / 2, stand: { x: -52.5, z: 105 }, dungeon: 'hothuy',
    lines: ['Động Thủy Mẫu ngầm dưới hồ, nước đen như mực.', 'Bác chài cả đời, chưa dám xuống tận đáy động.', 'Thủy quỷ chết rồi lại trồi lên, lần sau to và dữ hơn.', 'Qua chín lượt sóng, Thủy Mẫu mới nổi lên đón khách.', 'Cháu muốn xuống động thì nói bác, bác đưa tới miệng hang.'] },
  { id: 'pbtho', ten: 'Sư thầy giữ tháp', color: 'casa', hair: 'troc', x: 60, z: 56, ry: Math.PI / 2, stand: { x: 62.5, z: 56 }, dungeon: 'thaptho',
    lines: ['Bảo Tháp có mê cung dưới chân, tượng đá canh giữ.', 'Thầy giữ tháp đã lâu, ít ai dám xuống mê cung.', 'Đá hộ tháp vỡ rồi lại ghép, mỗi lượt một vững hơn.', 'Chín lượt qua rồi, Thạch Linh mới thức giấc.', 'Con muốn thử sức thì thưa thầy, thầy mở cửa tháp.'] },
];
export const NPCS = [...TEMPLE_NPCS, ...VILLAGERS, ...DUNGEON_NPCS];

/** Hoạt động tại các điểm cảnh (Phiên 17): bấm vào cảnh → đi tới → mô tả việc làm + 1 hạt sen/ngày. Không có nhân vật; pick = khối cầu bấm được. id trùng PLACES nếu có. */
export const ACTS = [
  { id: 'gieng', ten: 'Giếng làng', act: true, x: 10, z: 127, stand: { x: 10, z: 123.8 }, pick: { c: [10, 0.8, 127], r: 1.8 },
    lines: ['Bạn kéo gầu lên: nước giếng trong và mát lạnh.', 'Một gầu nước mát rửa tay, lòng cũng nhẹ đi.', 'Nước giếng làng ngọt thanh, uống một ngụm là tỉnh người.'] },
  { id: 'dalang', ten: 'Gốc đa làng', act: true, x: 0, z: 131, stand: { x: 0, z: 127.6 }, pick: { c: [0, 3, 131], r: 3.2 },
    lines: ['Bạn ngồi dưới gốc đa hóng mát, tiếng ve rền rĩ xa xa.', 'Gió qua tán đa nghe như ai thì thầm kể chuyện xưa.', 'Dưới gốc đa, mọi bước chân vội vã đều chậm lại.'] },
  { id: 'thacnuoc', ten: 'Thác nước', act: true, x: 106, z: 104, stand: { x: 95, z: 104 }, pick: { c: [110, 6, 104], r: 9 },
    lines: ['Hơi nước mát phả vào mặt, tiếng thác át hết ồn ào trong lòng.', 'Bạn đứng lặng nghe thác đổ. Nước cứ đi, núi cứ đứng yên.', 'Cầu vồng nhỏ hiện lên trong làn hơi nước, đẹp lạ.'] },
  { id: 'hoca', ten: 'Hồ cá chép', act: true, x: 60, z: 10, stand: { x: 50, z: 10 }, pick: { c: [58, 0.2, 10], r: 5 },
    lines: ['Bạn rải một nhúm thức ăn, đàn cá chép đỏ quây lại đớp mồi.', 'Cá bơi lượn dưới lá sen, mặt nước loang những vòng tròn nhỏ.', 'Nhìn cá bơi một lát, tâm cũng thong thả theo.'] },
  { id: 'vuonthien', ten: 'Vườn thiền', act: true, x: -62, z: -20, stand: { x: -54, z: -20 }, pick: { c: [-62, 0.3, -20], r: 5 },
    lines: ['Bạn cầm cây cào, kéo từng đường sỏi chậm rãi.', 'Những vòng sóng trên sỏi như vòng tròn của hơi thở.', 'Đứng giữa vườn đá, không cần nghĩ gì cả.'] },
  { id: 'trathat', ten: 'Trà thất', act: true, x: -64, z: 8, stand: { x: -64, z: 13.5 }, pick: { c: [-64, 2, 8], r: 5 },
    lines: ['Bạn nhấp một chén trà sen, hương thơm dịu lan khắp miệng.', 'Chén trà ấm đặt trong tay, một ngày dường như chậm lại.', 'Hơi trà bốc lên mờ cả mặt kính. Bình yên là đây.'] },
  { id: 'quanam', ten: 'Quan Âm đài', act: true, x: 0, z: -63, stand: { x: 0, z: -59.5 }, pick: { c: [0, 6, -63], r: 5 },
    lines: ['Bạn chắp tay hướng về Quan Âm, lòng nhớ những người thương.', 'Ngài nhìn xuống với ánh mắt hiền từ. Bạn cúi đầu thầm niệm.', 'Một nén hương lòng gửi tới những ai đang cần được che chở.'] },
  { id: 'luongdinh', ten: 'Lương đình giữa hồ', act: true, x: 60, z: 10, stand: { x: 60, z: 10 }, pick: { c: [60, 2.5, 10], r: 3 },
    lines: ['Bạn ngồi trong lương đình giữa hồ, gió mát từ mặt nước lùa vào.', 'Từ đây nhìn mái chùa nhỏ lại, chỉ còn tiếng nước chảy.', 'Một chiếc lá sen khẽ nghiêng, giọt sương lăn xuống mặt hồ.'] },
];

export const NPC_R = 0.5;
export const REWARD = 1;   // hạt sen mỗi NPC mỗi ngày (TẠM)
let done = false;
export function registerNpcs() { if (done) return; done = true; NPCS.forEach((n) => addCircle({ x: n.x, z: n.z, r: NPC_R })); }
registerNpcs();

/** Tất cả đối tượng bấm-để-thưa-chuyện: nhân vật (NPCS) và hoạt động tại điểm cảnh (ACTS). */
export const TALKERS = [...NPCS, ...ACTS];
export const npcById = (id) => TALKERS.find((n) => n.id === id) || null;

/** Spot kiểu chương (spots.js) cho từng NPC để dùng chung cơ chế bấm → đi tới → tới nơi. */
export const npcSpot = (n) => (n.act
  ? { id: 'npc-' + n.id, num: '', label: n.ten, npc: n.id, act: true, look: [n.x, 3, n.z], stand: n.stand, r: 2.5, face: [n.x, 1, n.z], pick: n.pick }
  : { id: 'npc-' + n.id, num: '', label: n.ten, npc: n.id, look: [n.x, 2.4, n.z], stand: n.stand, r: 2.2, face: [n.x, 1, n.z], pick: { c: [n.x, (n.hy || 0) + 1.0 * (n.scale || 1), n.z], r: 1.0 * (n.scale || 1) } });

/** Ngày địa phương dạng YYYY-MM-DD (khóa tặng quà theo ngày). */
export const dayKey = (now = Date.now()) => { const d = new Date(now), p = (x) => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };

/** Đọc trạng thái đã lưu (chuỗi JSON hoặc đối tượng); dữ liệu hỏng → trạng thái trống. */
export function loadNpcState(raw) {
  let o = raw; if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch (_) { o = null; } }
  const ok = (x) => x && typeof x === 'object' && !Array.isArray(x);
  const last = {}, n = {};
  if (ok(o)) {
    for (const k of Object.keys(ok(o.last) ? o.last : {})) if (npcById(k) && typeof o.last[k] === 'string') last[k] = o.last[k].slice(0, 10);
    for (const k of Object.keys(ok(o.n) ? o.n : {})) if (npcById(k) && Number.isFinite(+o.n[k])) n[k] = Math.max(0, Math.min(1e6, Math.floor(+o.n[k])));
  }
  return { last, n };
}

/** Một lần thưa chuyện: trả { line, reward, state } (state mới). Lời xoay vòng theo số lần; quà chỉ khi chưa nhận hôm nay. */
export function talk(state, id, now = Date.now()) {
  const npc = npcById(id); if (!npc) return null;
  const st = loadNpcState(state), c = st.n[id] || 0, today = dayKey(now), reward = st.last[id] === today ? 0 : REWARD;
  st.n[id] = c + 1; if (reward) st.last[id] = today;
  return { npc, line: npc.lines[c % npc.lines.length], reward, state: st };
}
