// Nguồn: dự án "Ô Long Viện" (https://github.com/hoangminhon/olongvien), giấy phép MIT, © 2026 Kent Juno.
// Nội dung chữ do tác giả đó tự biên soạn cho mục đích giải trí/chiêm nghiệm; không phải bản dịch kinh sách, không thay thế tư vấn chuyên môn.
// Đã chỉnh cho Diệu Giang Tự: đổi đuôi .mjs → .js, bỏ phần nhận lệnh từ bình luận TikTok, thêm tham số `rng` (mặc định Math.random) để kiểm thử được, bỏ chữ Hán `glyph` (dự án không dùng chữ Hán trong mã).
// Xem THIRD_PARTY.md ở thư mục gốc.
// Quẻ xăm — 36 thẻ xăm tiếng Việt tự biên soạn cho phần giải trí trong livestream.
// Không phải bản dịch kinh sách hay lời khuyên chuyên môn; chỉ dùng để tham khảo.
//
// Mỗi thẻ gồm: tên, mức cát/hung, bài thơ bốn câu, lời luận giải, lời khuyên
// và bốn nhánh luận theo chủ đề (tài lộc, tình duyên, công danh, sức khỏe).

import { TOPICS, detectTopic } from './iching.js';

const X = (n, name, level, poem, meaning, advice, t) => ({ n, name, level, poem, meaning, advice, t });

const DATA = [
  X(1, 'Sen Nở Đầu Xuân', 'Đại Cát',
    ['Sen nở đầu xuân tỏa sắc hồng', 'Hương thơm theo gió khắp mười phương', 'Một niệm thành tâm ơn Phật độ', 'Vạn sự hanh thông, phước đức đong'],
    'Vận may đang nở như sen đầu mùa, việc cầu xin có người che chở. Tâm thiện thì duyên lành tự đến.',
    'Giữ lòng thành và làm việc thiện nhỏ mỗi ngày; đừng vì may mắn mà sinh kiêu.',
    { taiLoc: 'Tiền tài hanh thông, có lộc bất ngờ; nên chia sẻ một phần làm phước.',
      tinhDuyen: 'Duyên lành chớm nở, người thành tâm sẽ gặp đúng người.',
      congDanh: 'Công danh rộng mở, việc khó có quý nhân nâng đỡ.',
      sucKhoe: 'Sức khỏe tốt lên; giữ nếp ăn ngủ điều độ.' }),

  X(2, 'Mưa Thuận Gió Hòa', 'Đại Cát',
    ['Mưa thuận gió hòa khắp ruộng nương', 'Cây cối đâm chồi, lúa trổ bông', 'Lòng người an lạc theo năm tháng', 'Phúc đức vun trồng tự nở hoa'],
    'Thời tiết và lòng người đều thuận, gieo gì gặt nấy. Đây là lúc vun thêm nền tảng để hưởng quả ngọt lâu dài.',
    'Làm việc đúng thời vụ, kiên nhẫn chăm sóc; thành quả sẽ đến đúng lúc.',
    { taiLoc: 'Lộc làm ăn dồi dào; nên tái đầu tư vào việc bền vững.',
      tinhDuyen: 'Tình cảm hòa thuận, gia đạo yên vui; nên vun đắp bằng lời nói dịu dàng.',
      congDanh: 'Công việc thuận buồm xuôi gió; giữ chữ tín để đường dài rộng mở.',
      sucKhoe: 'Thân tâm an ổn; chú ý giữ ấm khi trời trở gió.' }),

  X(3, 'Trăng Sáng Đầy Sân', 'Cát',
    ['Trăng sáng đầy sân tỏa ánh vàng', 'Gió đưa hương trúc nhẹ qua làn', 'Việc đời mờ tối nay đã rõ', 'Một bước an nhiên, một bước sang'],
    'Điều còn khuất lấp dần được soi tỏ. Người giữ tâm ngay thẳng sẽ thấy đường đi rõ ràng.',
    'Nhìn kỹ trước khi bước, nhưng đừng chần chừ khi lòng đã sáng.',
    { taiLoc: 'Tài lộc sáng tỏ, khoản tiền cũ có thể thu hồi; nên ghi chép rõ ràng.',
      tinhDuyen: 'Hiểu lầm dần tan; nói thật lòng sẽ giữ được duyên.',
      congDanh: 'Công việc sáng tỏ đường hướng; nên trình bày kế hoạch rõ ràng.',
      sucKhoe: 'Tinh thần nhẹ nhõm; giấc ngủ tốt hơn nếu bớt nghĩ đêm khuya.' }),

  X(4, 'Chim Én Về Tổ', 'Cát',
    ['Chim én về tổ giữa chiều xuân', 'Mang theo hơi ấm của người thân', 'Đi xa rồi cũng quay về cội', 'Sum họp một nhà, phước đức dâng'],
    'Tin lành từ người thân hoặc nơi xa đang trở về. Việc sum họp, đoàn tụ được ủng hộ.',
    'Dành thời gian cho gia đình; lời thăm hỏi nhỏ cũng là phước lớn.',
    { taiLoc: 'Có khoản tiền từ nơi xa hoặc người thân gửi về; dùng vào việc chính đáng.',
      tinhDuyen: 'Duyên cũ có thể quay lại; nên bình tâm lắng nghe.',
      congDanh: 'Tin tốt từ công việc đang đến; giữ liên lạc với người đã hứa giúp.',
      sucKhoe: 'Sức khỏe ổn định; người lớn tuổi trong nhà cần được thăm nom.' }),

  X(5, 'Cây Khô Gặp Xuân', 'Đại Cát',
    ['Cây khô gặp lại tiết xuân sang', 'Chồi biếc đâm ra khắp mọi ngành', 'Vận rủi qua rồi duyên tốt tới', 'Một đời an lạc, phước vô vàn'],
    'Sau chuỗi ngày khó khăn, thời vận đang hồi sinh mạnh mẽ. Việc tưởng đã tàn bỗng có đường sống.',
    'Nắm lấy cơ hội mới, nhưng làm từ gốc rễ để cây không lại héo.',
    { taiLoc: 'Tài vận hồi phục, nợ cũ có cách hóa giải; nên ưu tiên trả bớt.',
      tinhDuyen: 'Duyên tưởng lỡ làng bỗng có chuyển biến tốt; mở lòng đón nhận.',
      congDanh: 'Cơ hội mới xuất hiện sau chuỗi ngày trì trệ; chuẩn bị kỹ rồi bước.',
      sucKhoe: 'Sức khỏe hồi phục rõ rệt; tiếp tục kiêng khem đúng cách.' }),

  X(6, 'Thuyền Qua Sóng Lặng', 'Cát',
    ['Thuyền qua sóng lặng tới bờ xa', 'Bến cũ người xưa vẫn đợi chờ', 'Một chuyến gian nan rồi cũng tới', 'Lòng ngay giữ trọn, phước như hoa'],
    'Việc đang ở đoạn cuối của hành trình gian khó. Giữ vững tay chèo thì bến bờ sum họp.',
    'Đừng đổi hướng giữa chừng; hoàn tất việc đã bắt đầu.',
    { taiLoc: 'Tài lộc đến sau công sức bỏ ra; chuyến làm ăn xa có kết quả.',
      tinhDuyen: 'Duyên bền sau thử thách; người kiên nhẫn sẽ được đền đáp.',
      congDanh: 'Dự án sắp cập bến; hoàn thiện phần cuối chu đáo.',
      sucKhoe: 'Sức khỏe khá dần; tránh đi xa quá sức.' }),

  X(7, 'Hoa Nở Giữa Đông', 'Trung Cát',
    ['Hoa nở giữa đông dưới tuyết rơi', 'Một nhành kiên nhẫn thắm màu tươi', 'Gian nan chẳng diệt mầm trong đất', 'Đợi nắng xuân về, hưởng vị đời'],
    'Giữa hoàn cảnh lạnh giá vẫn có mầm tốt đang lớn. Thành quả chưa đến ngay nhưng đang hình thành.',
    'Nuôi dưỡng việc đúng trong âm thầm; đừng khoe khoang khi chưa chín.',
    { taiLoc: 'Tài lộc chậm nhưng có mầm mới; kiên trì tích lũy.',
      tinhDuyen: 'Tình cảm cần vun đắp qua mùa khó; đừng vội buông.',
      congDanh: 'Việc khó cần thêm thời gian; tiếp tục trau dồi chuyên môn.',
      sucKhoe: 'Cần giữ ấm, bồi bổ; đừng để cái lạnh ảnh hưởng xương khớp.' }),

  X(8, 'Đèn Sáng Cửa Thiền', 'Cát',
    ['Đèn sáng cửa thiền giữa đêm thanh', 'Soi đường lữ khách bước chân lành', 'Một niệm từ bi hơn vạn lửa', 'Lòng người ấm lại giữa trời xanh'],
    'Việc thiện nhỏ có sức soi sáng lớn. Sự tử tế của bạn đang giúp người và mở phước cho chính mình.',
    'Tiếp tục làm điều thiện trong khả năng; giúp người đúng cách.',
    { taiLoc: 'Lộc đến từ việc thiện và quan hệ chân thành; không nên tính toán quá nhiều.',
      tinhDuyen: 'Duyên lành gặp nhau nhờ sự chân thành; nên sống thật lòng.',
      congDanh: 'Có người ghi nhận công sức; việc thiện cũng mở đường cho sự nghiệp.',
      sucKhoe: 'Tinh thần an vui giúp thân thể khỏe; nên ngủ đủ giấc.' }),

  X(9, 'Ngựa Về Chuồng Cũ', 'Cát',
    ['Ngựa quen đường cũ lại quay về', 'Một chuyến đi xa đã thỏa thuê', 'Bến cũ đò xưa người vẫn đợi', 'An cư một chỗ, phước ê hề'],
    'Thời vận hợp với sự trở về, ổn định và tiếp nối việc cũ. Có tin lành từ nơi quen thuộc.',
    'Trân trọng nền tảng cũ; sửa lại việc dang dở thay vì mở hướng mới.',
    { taiLoc: 'Tiền cũ có thể thu hồi; việc làm quen thuộc đem lại lộc ổn định.',
      tinhDuyen: 'Người cũ có thể gặp lại; nhưng cần nhìn rõ điều đã thay đổi.',
      congDanh: 'Trở lại môi trường quen thuộc có lợi; phát huy kinh nghiệm đã có.',
      sucKhoe: 'Sức khỏe ổn định; nên duy trì thói quen vận động cũ.' }),

  X(10, 'Suối Chảy Đá Mòn', 'Trung Cát',
    ['Suối nhỏ qua ngày chảy đến đâu', 'Đá dày năm tháng cũng mòn sâu', 'Việc đời chưa thấy điều chuyển biến', 'Kiên nhẫn buông lời, chớ bỏ câu'],
    'Sức nhỏ nhưng bền hơn sức mạnh nhất thời. Việc đang tiến chậm; đừng nản.',
    'Chia việc lớn thành từng bước nhỏ và làm đều mỗi ngày.',
    { taiLoc: 'Tiền nhỏ góp đều thành vốn; tránh mạo hiểm vì sốt ruột.',
      tinhDuyen: 'Duyên sâu nhờ thời gian; kiên nhẫn lắng nghe người kia.',
      congDanh: 'Tiến bộ đều và chắc; đừng so sánh nhanh chậm với người khác.',
      sucKhoe: 'Cần vận động nhẹ đều đặn; bệnh mãn tính kiên trì điều trị.' }),

  X(11, 'Mây Tan Trăng Tỏ', 'Đại Cát',
    ['Mây tan rồi lại thấy trăng thanh', 'Lối cũ chợt thông, bước đá lành', 'Gỡ một nút thắt bao năm tháng', 'Lòng trước sáng trong, việc tự thành'],
    'Khó khăn chịu động một chút là tan. Điều còn vướng mắc sẽ được hóa giải nhờ nói ra và sớm giải quyết.',
    'Gỡ chuyện nhỏ trước khi nó thành lớn; nói rõ và xin lỗi khi cần.',
    { taiLoc: 'Nút thắt tài chính sắp được gỡ; nên dứt khoát sửa khoản chi sai.',
      tinhDuyen: 'Hiểu lầm tan, duyên sáng trở lại; nên chủ động làm hòa.',
      congDanh: 'Công việc thông sau thời gian bế tắc; chủ động báo cáo và xin hướng dẫn.',
      sucKhoe: 'Bệnh nhẹ sớm khỏi; nên khám để yên tâm.' }),

  X(12, 'Gương Soi Bóng Nước', 'Bình',
    ['Gương soi bóng nước giữa đêm trăng', 'Thấy rõ mình mà chẳng thấy chân', 'Một niệm tĩnh tâm nhìn lại chính', 'Đừng mê bóng ảo, hãy nhìn thân'],
    'Việc đang bị che bởi ảo tưởng hoặc mong muốn riêng. Nhìn thẳng vào hoàn cảnh thật sẽ thấy lối ra.',
    'Tự kiểm điểm trước, đừng vội đổ lỗi cho bên ngoài.',
    { taiLoc: 'Lợi nhuận trên giấy chưa phải thật; cần kiểm tra sổ sách và giấy tờ.',
      tinhDuyen: 'Có thể đang yêu hình ảnh hơn con người thật; nên tìm hiểu chậm.',
      congDanh: 'Đánh giá đúng năng lực bản thân trước khi đòi hỏi vị trí mới.',
      sucKhoe: 'Căng thẳng do suy nghĩ nhiều; nên nghỉ ngơi và tĩnh tâm.' }),

  X(13, 'Lửa Thử Vàng Son', 'Trung Cát',
    ['Lửa thử vàng son giữa bão giông', 'Khó khăn làm rõ tấm lòng trong', 'Giữ được chữ tín khi cùng khổ', 'Vượt một chặng đường, phước vững lòng'],
    'Thử thách này đang lọc lại điều quý giá. Người trung thành và giữ lời sẽ được nhận ra.',
    'Giữ chữ tín và bình tĩnh; đừng vì áp lực mà làm điều sai.',
    { taiLoc: 'Giai đoạn khó giúp lọc rõ khoản đầu tư tốt; giữ vốn chờ thời.',
      tinhDuyen: 'Thử thách làm duyên bền hơn; người thật lòng sẽ ở lại.',
      congDanh: 'Áp lực công việc là dịp chứng minh năng lực; giữ phong độ.',
      sucKhoe: 'Sức khỏe bị thử thách; nên nghỉ đủ và ăn uống lành mạnh.' }),

  X(14, 'Chim Lạc Tìm Đàn', 'Bình',
    ['Chim lạc tìm đàn giữa trời xa', 'Tiếng gọi từng cơn lẫn gió già', 'Lạc bước một phen rồi tỉnh ngộ', 'Tìm đúng đường xưa, lại mái nhà'],
    'Đang có chút lạc lõng, thiếu người đồng hành. Nhưng đây chỉ là giai đoạn tạm, sẽ tìm lại được hướng đi.',
    'Đừng vội tin mọi lời mời gọi; hỏi người đi trước rồi hãy theo.',
    { taiLoc: 'Tiền lẫn lộn nhiều hướng; nên tách rõ khoản cần chi, tránh góp vốn mơ hồ.',
      tinhDuyen: 'Có thể đang chọn sai đối tượng; tìm hiểu qua người thân quen.',
      congDanh: 'Công việc chưa hợp môi trường; tìm người hướng dẫn đáng tin.',
      sucKhoe: 'Đầu óc căng thẳng; nên ra ngoài, kết nối người thân.' }),

  X(15, 'Cầu Vồng Sau Mưa', 'Cát',
    ['Cầu vồng sau mưa ló dạng xa', 'Bảy sắc tươi hồng nối sơn hà', 'Gian nan rồi sẽ thành kỷ niệm', 'Nắng mới lên rồi, phước an hòa'],
    'Sau chuỗi ngày mệt mỏi, dấu hiệu tốt đã xuất hiện. Việc khó sắp qua, hãy giữ tinh thần lạc quan.',
    'Tận hưởng giai đoạn nhẹ lại nhưng đừng chủ quan; tiếp tục vì mục tiêu.',
    { taiLoc: 'Sau thời tiết xấu, lộc mới bắt đầu; nên chuẩn bị cho chu kỳ tới.',
      tinhDuyen: 'Đau buồn cũ dần qua; trái tim ấm lại đón duyên mới.',
      congDanh: 'Kết quả tốt sắp tới; hãy hoàn tất báo cáo cuối.',
      sucKhoe: 'Bệnh thuyên giảm; tiếp tục giữ nếp sống lành.' }),

  X(16, 'Đường Xa Có Bạn', 'Cát',
    ['Đường xa có bạn bớt đơn côi', 'Một bước cùng đi, một bước vui', 'Chông gai chia nửa thành nhẹ nhẹ', 'Nắng đẹp hai người, phước đức bồi'],
    'Có người đồng hành đáng tin. Việc lớn nên chia sẻ, không nên tự ôm hết.',
    'Tìm đúng người đồng hành và giữ lời với họ; hợp tác sẽ đi xa.',
    { taiLoc: 'Có bạn làm ăn cùng chí hướng; nên thỏa thuận rõ ràng ngay từ đầu.',
      tinhDuyen: 'Đồng hành cùng người hiểu mình; duyên bền nhờ sẻ chia.',
      congDanh: 'Hợp tác đem lại tiến bộ; đừng tranh công một mình.',
      sucKhoe: 'Duy trì vận động cùng bạn bè; tinh thần vui khỏe.' }),

  X(17, 'Sóng Gió Qua Ghềnh', 'Trung Cát',
    ['Sóng gió qua ghềnh thuyền chớ xoay', 'Một tay vững lái, một tay chèo', 'Qua đoạn hiểm sâu rồi sẽ thấy', 'Bến lặng trời quang đón gió reo'],
    'Đang qua đoạn khó, cần tập trung xử lý từng việc nhỏ. Bình tĩnh giữ tay lái thì sẽ qua.',
    'Đừng ôm nhiều mục tiêu lúc này; làm chắc từng việc trước mắt.',
    { taiLoc: 'Tài chính chảy mạnh; nên giữ khoản dự phòng ít nhất ba tháng.',
      tinhDuyen: 'Sóng gió thử lòng; tránh nói nặng khi mất bình tĩnh.',
      congDanh: 'Một dự án lớn đang ở cao điểm; cần sắp việc và nghỉ ngơi hợp lý.',
      sucKhoe: 'Dễ đuối sức; nên chia thời gian làm và nghỉ rõ ràng.' }),

  X(18, 'Hạt Lúa Nảy Mầm', 'Cát',
    ['Hạt lúa nảy mầm dưới lớp bùn', 'Một đời gieo thiện, phúc vô cùng', 'Gió mưa chưa ghé thăm ruộng nhỏ', 'Thì nắng lên rồi, lúa cũng sung'],
    'Mầm tốt đã có, nhưng cần thời gian và chăm sóc. Đừng đào lên xem mỗi ngày.',
    'Gieo đúng thời và kiên nhẫn; việc nhỏ đều đặn hơn việc lớn bất chợt.',
    { taiLoc: 'Đầu tư nhỏ nhưng đều đặn sẽ sinh lợi; tránh lãi nhanh.',
      tinhDuyen: 'Duyên cần thời gian nảy nở; đừng kiểm tra quá sát sao.',
      congDanh: 'Khởi đầu khiêm tốn nhưng có tương lai; chăm chỉ học việc.',
      sucKhoe: 'Cơ thể dần thích nghi; duy trì dinh dưỡng và vận động.' }),

  X(19, 'Đêm Tối Có Sao', 'Trung Cát',
    ['Đêm tối còn sao sáng một vùng', 'Lối mòn vẫn đó giữa mông lung', 'Một niệm không buông thì còn thấy', 'Bình minh chưa đến, chớ vội dừng'],
    'Hoàn cảnh còn tối nhưng vẫn có dấu hiệu dẫn đường. Đừng bỏ cuộc trước khi trời sáng.',
    'Bám vào điều chắc chắn nhỏ nhất; nhờ người đáng tin cùng soi đường.',
    { taiLoc: 'Chưa nên bung vốn; giữ khoản nhỏ đều đặn qua thời khó.',
      tinhDuyen: 'Còn chút hy vọng; cần bình tĩnh nhìn lại thay vì vội chia tay.',
      congDanh: 'Khó thấy kết quả nhưng hướng đi không sai; cần kiên trì.',
      sucKhoe: 'Tinh thần dễ xuống; nên ngủ đủ và trò chuyện với người thân.' }),

  X(20, 'Hoa Rơi Cửa Phật', 'Bình',
    ['Hoa rơi cửa Phật chẳng ai hay', 'Một cánh thơm rơi giữa đất dày', 'Việc đời có lúc lặng như thế', 'Giữ tâm thanh tịnh, phước tự đầy'],
    'Việc đang lặng lẽ, ít người biết. Đây là lúc tích phước và giữ tâm tĩnh hơn là phô bày.',
    'Làm việc tốt mà không cần khoe; giữ lời nói nhẹ nhàng.',
    { taiLoc: 'Lộc đến âm thầm; nên tiết kiệm và tránh khoe của.',
      tinhDuyen: 'Tình cảm lặng lẽ nhưng bền; đừng đòi hỏi ồn ào.',
      congDanh: 'Công việc ít tiếng tăm nhưng ổn; làm tròn phần mình.',
      sucKhoe: 'Sức khỏe bình thường; chú ý thư giãn và hít thở sâu.' }),

  X(21, 'Rồng Mây Gặp Hội', 'Đại Cát',
    ['Rồng gặp mây lành hội gió xuân', 'Một phen vùng vẫy khắp xa gần', 'Vận thời đã tới, lòng ngay giữ', 'Danh lợi vẹn toàn, phước đức thân'],
    'Thời cơ lớn đang đến, đúng người đúng lúc. Việc lớn có thể thành nếu giữ chính trực.',
    'Nắm thời cơ nhưng đừng tham; chia sẻ thành quả với người đã giúp.',
    { taiLoc: 'Tài lộc bùng nở, có cơ hội lớn; nên tính đường dài thay vì hưởng ngay.',
      tinhDuyen: 'Duyên tốt gặp đúng thời; có thể tiến tới hôn nhân nếu thành tâm.',
      congDanh: 'Cơ hội thăng tiến rõ rệt; thể hiện năng lực nhưng giữ khiêm tốn.',
      sucKhoe: 'Sức khỏe dồi dào; tránh tiệc tùng quá độ.' }),

  X(22, 'Đèn Trước Gió', 'Hung',
    ['Đèn trước gió lay ngọn chập chờn', 'Một phen lỡ tay, tối cả đêm', 'Việc đang mong manh, đừng thêm động', 'Che gió giữ lửa, ắt yên miền'],
    'Việc đang rất mỏng manh, dễ đổ nếu hành động mạnh. Cần bảo vệ những gì đang có thay vì mở rộng.',
    'Tạm dừng việc lớn, kiểm tra rủi ro; tránh quyết định khi đang nóng giận.',
    { taiLoc: 'Tài chính dễ thất thoát; khóa khoản chi không cần thiết, tránh vay nóng.',
      tinhDuyen: 'Dễ va chạm chỉ vì lời nói; hãy ngừng tranh luận khi mất bình tĩnh.',
      congDanh: 'Công việc mong manh; đừng nhận thêm việc ngoài sức.',
      sucKhoe: 'Sức khỏe yếu; tránh thức khuya và điều khiển xe khi mệt.' }),

  X(23, 'Thuyền Bến Lạ', 'Bình',
    ['Thuyền ghé bến lạ giữa chiều mưa', 'Chưa rõ người quen, chớ vội đưa', 'Hỏi một đôi lời cho tỏ mặt', 'Kẻo mang sầu lạc tới sân chùa'],
    'Có cơ hội hoặc người mới nhưng chưa đủ thông tin. Cần tìm hiểu trước khi tin tưởng.',
    'Chậm lại, hỏi cho rõ; đừng ký kết hay hứa hẹn vội.',
    { taiLoc: 'Cơ hội lạ cần kiểm chứng; tránh chuyển tiền cho người chưa rõ lai lịch.',
      tinhDuyen: 'Người mới đến cần thời gian tìm hiểu; đừng vội trao niềm tin.',
      congDanh: 'Đối tác mới cần xác minh; đọc kỹ hợp đồng.',
      sucKhoe: 'Đổi môi trường dễ mệt; giữ nếp sinh hoạt quen thuộc.' }),

  X(24, 'Núi Cao Có Đường', 'Cát',
    ['Núi cao vẫn có một đường lên', 'Người chịu khó đi ắt tới bên', 'Từng bước một, không cần vội vã', 'Đỉnh trời mây trắng đợi chờ tên'],
    'Mục tiêu khó nhưng có lối đi. Kiên trì từng bước sẽ tới nơi.',
    'Chia mục tiêu dài thành chặng ngắn; giữ sức để đi đường dài.',
    { taiLoc: 'Thành quả lớn cần tích lũy lâu; đừng tìm đường tắt.',
      tinhDuyen: 'Duyên khó nhưng có cách vun đắp; kiên nhẫn và chân thành.',
      congDanh: 'Mục tiêu cao cần lộ trình rõ; học hỏi người đi trước.',
      sucKhoe: 'Đi bộ và leo nhẹ tốt; tránh gắng sức đột ngột.' }),

  X(25, 'Hương Trầm Tỏa Ngát', 'Cát',
    ['Hương trầm tỏa ngát giữa gian thờ', 'Một nén lòng thành chẳng phải mơ', 'Đức dày sinh phước, nhà êm ấm', 'Gió mát đưa hương khắp bến bờ'],
    'Lòng thành của bạn đang được hồi đáp. Gia đạo ấm êm, việc cầu nguyện có kết quả tốt.',
    'Dâng lòng thành thật, sống hòa nhã; phước đến từ nếp sống mỗi ngày.',
    { taiLoc: 'Lộc đến từ việc làm chân chính; nên giữ sổ sách minh bạch.',
      tinhDuyen: 'Gia đạo êm ấm; nên thắp hương trò chuyện cùng người thân.',
      congDanh: 'Uy tín tốt giúp công việc thuận; giữ lời hứa.',
      sucKhoe: 'Sức khỏe ổn; giữ không gian sống thoáng và sạch.' }),

  X(26, 'Chim Sẻ Qua Sông', 'Hung',
    ['Chim sẻ qua sông cánh mỏng manh', 'Sóng to gió lớn chẳng thể dành', 'Việc ngoài sức mình đừng gắng sức', 'Ở lại bờ này, đợi nước xanh'],
    'Đang định làm việc vượt sức hoặc vượt thời. Cố quá dễ mất cả phần đang có.',
    'Dừng những việc quá sức; củng cố cái đang có trước.',
    { taiLoc: 'Tránh đầu tư lớn lúc này; giữ tiền mặt và trả nợ nhỏ.',
      tinhDuyen: 'Đừng cố giữ người không thuộc về mình; bình an trước đã.',
      congDanh: 'Không nên nhận việc ngoài khả năng; nói thật để được hỗ trợ.',
      sucKhoe: 'Dễ quá sức; nghỉ ngơi là ưu tiên.' }),

  X(27, 'Cá Vượt Vũ Môn', 'Đại Cát',
    ['Cá vượt vũ môn hóa rồng vàng', 'Một phen nỗ lực rạng đôi đàng', 'Cửa cao đã mở cho người chí', 'Danh vọng từ nay rộng chữ sang'],
    'Cơ hội đổi đời đang mở cho người đã chuẩn bị. Nỗ lực đúng hướng sẽ được ghi nhận lớn.',
    'Tập trung vào mục tiêu chính; chuẩn bị kỹ cho buổi quyết định.',
    { taiLoc: 'Cơ hội tài chính lớn; đọc kỹ điều khoản trước khi nhận.',
      tinhDuyen: 'Có thể gặp người xứng đáng ở nơi mới; giữ mình trong sáng.',
      congDanh: 'Thi cử, phỏng vấn, thăng chức đều thuận; hãy tự tin.',
      sucKhoe: 'Tinh thần sung mãn; đừng thức quá khuya vì hưng phấn.' }),

  X(28, 'Lá Rụng Về Cội', 'Cát',
    ['Lá rụng về cội, nước về nguồn', 'Một đời đi lại, một đời thương', 'Ơn cũ đền đáp, lòng nhẹ nhõm', 'Cội rễ vun bồi, phước vững hơn'],
    'Việc nên quay về gốc: gia đình, ơn nghĩa, nền tảng cũ. Đền đáp ơn cũ sẽ mở đường mới.',
    'Thăm hỏi người đã giúp mình; sửa lại việc gốc thay vì chạy theo mới.',
    { taiLoc: 'Khoản đầu tư cũ nên xem lại; thu hồi vốn về nơi an toàn.',
      tinhDuyen: 'Duyên cũ cần nhìn lại; ơn nghĩa giữ được lâu bền.',
      congDanh: 'Kinh nghiệm cũ là vốn quý; dùng lại nền tảng đã có.',
      sucKhoe: 'Chăm sóc sức khỏe từ gốc: ăn ngủ, vận động đều.' }),

  X(29, 'Mưa Dầm Lâu Tạnh', 'Trung Cát',
    ['Mưa dầm lâu cũng có ngày tạnh', 'Nắng lên rồi sẽ ấm mái tranh', 'Việc khó kéo dài nhưng còn sức', 'Đợi một hai phen, ắt đặng thành'],
    'Giai đoạn mệt mỏi kéo dài nhưng đang dần qua. Kiên trì thêm một chút sẽ thấy chuyển biến.',
    'Giữ sức và làm đều; đừng thay đổi liên tục vì sốt ruột.',
    { taiLoc: 'Tài chính còn chật vật nhưng sắp có lối; tiếp tục tiết giảm chi.',
      tinhDuyen: 'Hiểu lầm kéo dài sẽ được gỡ nếu cả hai cùng chịu nói chuyện.',
      congDanh: 'Dự án chậm nhưng không chết; giữ tiến độ đều.',
      sucKhoe: 'Bệnh mãn tính cần kiên trì điều trị; đừng bỏ thuốc giữa chừng.' }),

  X(30, 'Trăng Khuyết Rồi Tròn', 'Cát',
    ['Trăng khuyết rồi tròn theo tháng ngày', 'Việc đời thịnh suy có đổi thay', 'Đang lúc thiếu thời chờ đủ tháng', 'Đủ duyên ắt sẽ sáng như ngày'],
    'Chu kỳ đang ở đoạn thiếu, nhưng sẽ đầy trở lại. Đừng đánh giá thấp tương lai từ hiện tại.',
    'Kiên nhẫn đi qua chu kỳ; giữ việc đều và không bỏ dở.',
    { taiLoc: 'Lộc theo chu kỳ; tháng tới có thể khá hơn, nên chuẩn bị kế hoạch.',
      tinhDuyen: 'Tình cảm có lúc nhạt; kiên nhẫn vun lại sẽ ấm.',
      congDanh: 'Sự nghiệp có nhịp lên xuống; giữ năng lực chờ thời.',
      sucKhoe: 'Sức khỏe theo mùa; giữ ấm và ngủ đủ.' }),

  X(31, 'Lửa Gần Rơm', 'Hung',
    ['Lửa gần rơm khô cháy một khi', 'Một lời nóng giận, mất bao nghì', 'Việc đang căng thẳng, đừng thêm lửa', 'Lùi một bước nhỏ, được yên bình'],
    'Có nguy cơ bùng nổ từ việc nhỏ. Một lời nói nóng có thể làm hỏng mối quan hệ lâu năm.',
    'Tuyệt đối tránh tranh cãi lúc nóng; rời khỏi tình huống rồi nói lại sau.',
    { taiLoc: 'Đừng đầu tư theo cảm xúc; tránh vay nóng và cam kết vội.',
      tinhDuyen: 'Dễ chia tay vì lời nói; hãy im lặng khi tức giận.',
      congDanh: 'Xung đột nơi làm việc dễ lan rộng; giữ quy trình và lời lẽ mềm.',
      sucKhoe: 'Huyết áp và giấc ngủ dễ bị ảnh hưởng; cần thư giãn.' }),

  X(32, 'Bến Cũ Đò Xưa', 'Bình',
    ['Bến cũ đò xưa vắng khách qua', 'Nước trôi năm tháng chẳng phôi pha', 'Việc xưa nhắc lại còn dư âm', 'Nhẹ lòng buông bỏ, bước đường xa'],
    'Còn vương chuyện cũ nhưng thời đã đổi. Giữ kỷ niệm vừa đủ, đừng để quá khứ chặn bước.',
    'Buông điều không còn phù hợp; giữ bài học, bỏ oán giận.',
    { taiLoc: 'Khoản đầu tư cũ nên đóng lại; đừng cố cứu việc đã hết thời.',
      tinhDuyen: 'Chuyện cũ còn vương; cần nói rõ để cả hai nhẹ lòng.',
      congDanh: 'Kinh nghiệm cũ còn dùng được nhưng đừng bám mãi vị trí cũ.',
      sucKhoe: 'Tâm trạng còn nặng; nên đi bộ và trò chuyện với người tin cậy.' }),

  X(33, 'Hoa Sen Giữa Bùn', 'Cát',
    ['Hoa sen giữa bùn vẫn ngát hương', 'Một đời thanh tịnh giữa vô thường', 'Hoàn cảnh chẳng làm lòng ô uế', 'Phước đức từ tâm, sáng tỏ đường'],
    'Hoàn cảnh chưa tốt nhưng bạn có thể giữ mình trong sạch. Chính nghị lực đó tạo phước.',
    'Giữ nguyên tắc sống, tránh bị cuốn theo đám đông; làm việc tốt trong khả năng.',
    { taiLoc: 'Tiền nên kiếm bằng việc chính đáng; tránh lợi nhuận mờ ám.',
      tinhDuyen: 'Duyên tốt đến từ phẩm cách; không cần chiều lòng người sai.',
      congDanh: 'Giữ chuyên môn và đạo đức; thành quả sẽ bền.',
      sucKhoe: 'Thân tâm dần nhẹ; tiếp tục giữ nếp thanh đạm.' }),

  X(34, 'Gió Thổi Mây Bay', 'Trung Cát',
    ['Gió thổi mây bay khắp bốn phương', 'Một lòng thanh thản chẳng vấn vương', 'Việc đời có lúc nên buông bớt', 'Để bước chân nhẹ tới con đường'],
    'Nên linh hoạt và buông bớt cái không cần thiết. Nhẹ lòng thì đường đi rộng hơn.',
    'Sắp xếp lại ưu tiên; bỏ việc không còn giá trị.',
    { taiLoc: 'Có thể xoay hướng đầu tư nhỏ; tránh giữ tài sản đã hết giá trị.',
      tinhDuyen: 'Đừng giữ người đã muốn đi; nhẹ lòng rồi duyên mới sẽ tới.',
      congDanh: 'Nên chuyển hướng linh hoạt; giữ kỹ năng cốt lõi.',
      sucKhoe: 'Đầu óc dễ nặng; đi dạo ngoài trời giúp thư thái.' }),

  X(35, 'Người Đi Đêm Có Đuốc', 'Cát',
    ['Người đi đêm có đuốc trong tay', 'Bước tới từng phen chẳng lạc bày', 'Có bạn dẫn đường, lòng vững chí', 'Về tới nhà mình, ấm chén say'],
    'Có người chỉ đường hoặc kiến thức giúp bạn đi đúng. Đừng ngại hỏi và đi theo lối hợp lẽ.',
    'Tìm người thầy đáng tin; ghi chép và áp dụng từng bước.',
    { taiLoc: 'Cố vấn tài chính đúng sẽ giúp tránh lỗ; nghe nhưng vẫn tự kiểm chứng.',
      tinhDuyen: 'Người đi trước giúp bạn hiểu mình cần gì; đừng mù quáng làm theo.',
      congDanh: 'Học từ người giỏi sẽ lên nhanh; nhận việc đúng sở trường.',
      sucKhoe: 'Điều trị đúng thầy sẽ khỏi; tái khám đúng hẹn.' }),

  X(36, 'Vườn Hồng Nở Muộn', 'Trung Cát',
    ['Vườn hồng nở muộn cuối mùa xuân', 'Hoa ít nhưng thơm, cánh vẫn tươi', 'Việc đến chậm mà lòng không ngại', 'Thành quả đong đầy, phước đức người'],
    'Thành quả đến muộn hơn dự định nhưng vẫn đáng quý. Đừng so sánh với người khác.',
    'Giữ vững nhịp làm việc; chấp nhận đúng thời của mình.',
    { taiLoc: 'Lộc đến muộn nhưng bền; đừng bỏ cuộc trước mùa thu hoạch.',
      tinhDuyen: 'Duyên đến muộn nhưng chín; ổn định hơn những đám rộn ràng.',
      congDanh: 'Thành tựu đến sau năm tháng; hồ sơ cần hoàn thiện dần.',
      sucKhoe: 'Sức khỏe hồi phục chậm; kiên trì nếp sống lành.' }),
];

const LEVELS = new Set(['Đại Cát', 'Cát', 'Trung Cát', 'Bình', 'Hung']);
const seen = new Set();
for (const x of DATA) {
  if (!Number.isInteger(x.n) || x.n < 1 || x.n > DATA.length) throw new Error(`Xăm: số thẻ không hợp lệ (${x.n})`);
  if (seen.has(x.n)) throw new Error(`Xăm: trùng số thẻ ${x.n}`);
  seen.add(x.n);
  if (seen.size !== x.n) throw new Error(`Xăm: thiếu số thẻ trước ${x.n}`);
  if (!LEVELS.has(x.level)) throw new Error(`Xăm: mức ${x.level} không hợp lệ ở thẻ ${x.n}`);
  if (!Array.isArray(x.poem) || x.poem.length !== 4) throw new Error(`Xăm: thẻ ${x.n} phải có 4 câu thơ`);
  for (const key of Object.keys(TOPICS)) if (!x.t[key]) throw new Error(`Xăm: thẻ ${x.n} thiếu luận giải ${key}`);
}
if (DATA.length !== 36) throw new Error('Xăm: phải có đủ 36 thẻ');

export const XAM_COUNT = DATA.length;
export const XAM_LIST = DATA;

export function drawXam(text, rng = Math.random) {
  const x = DATA[Math.floor(rng() * DATA.length) % DATA.length];
  const key = detectTopic(text);
  return {
    number: x.n,
    total: XAM_COUNT,
    name: x.name,
    level: x.level,
    poem: x.poem.slice(),
    meaning: x.meaning,
    advice: x.advice,
    topic: key ? { key, label: TOPICS[key], text: x.t[key] } : null,
  };
}
