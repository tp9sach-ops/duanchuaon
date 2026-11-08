# THIẾT KẾ CHIỀU SÂU & NHIỀU KHÔNG GIAN — DIỆU GIANG TỰ

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Trạng thái: ptg ĐÃ DUYỆT hướng cốt truyện "Chuông Diệu Giang + tam độc" và hướng nhiều không gian (2026-11-09). Chi tiết số liệu là ĐỀ XUẤT, chỉnh khi làm. Tác giả chưa đọc js/world/story.js, world.js, layout.js: phiên đầu phải ĐIỀU TRA mã thật trước.

## 1. Cốt truyện: Chuông Diệu Giang
Đại hồng chung của chùa vỡ làm 3 mảnh. Ba yêu quái hằng tháng (Đá, Nước, Lửa) là tam độc hiện hình, mỗi con giữ một mảnh.
- Chương 1: đã có (js/world/story.js).
- Chương 2: mảnh ĐÁ (vách Đại Phật / hang): khinh công + khiêng đá.
- Chương 3: mảnh NƯỚC (hồ, vịnh): câu cá, bơi/lặn.
- Chương 4: mảnh LỬA (núi lửa tro): thiền Vipassana "dập lửa".
- Chương 5: đúc lại chuông, lễ Rằm; cả máy chủ cùng thỉnh chuông.

NPC: Thầy trụ trì (dạy thiền, nhiệm vụ chính), Bác khu phố (có sẵn), Cụ giữ chuông (truyền thuyết), Bé thợ câu (nhiệm vụ phụ). Mỗi NPC có mức "mến" mở lời thoại và quà.

## 2. Kiến trúc nhiều không gian (ZONE) — chống lag
Nguyên tắc: mỗi lúc chỉ MỘT zone chạy đầy đủ; zone kế tiếp tải trước khi người chơi tiến gần cổng; zone cũ được giải phóng.
- Mỗi zone là một module riêng: dựng cảnh, bố cục + va chạm, điểm xuất hiện, danh sách cổng, ngân sách.
- ZoneManager (logic thuần, có test): đăng ký zone, điều kiện mở, zone đang chạy, tải trước, chuyển, giải phóng (dispose geometry/texture/material).
- Cổng chuyển: cổng đá, thuyền, cáp treo, đường mòn, thang mây. Có màn che ~1 giây để che việc tải; có thanh tiến độ khi tải lâu.
- Ngân sách mỗi zone: số mesh/draw call/texture/cây; tối đa ~30 người hiển thị; có mức PERF riêng.
- Nhiều người: phòng theo zone (zone id nằm trong khóa phòng); chỉ thấy người cùng zone. Giảm tải GAS/Firebase.
- Lưu: zone cuối + vị trí cuối + zone đã mở (localStorage; máy chủ xác nhận làm sau, mục 6.2).
- RỦI RO ĐÃ BIẾT: js/world/layout.js là va chạm TOÀN CỤC (addCircle/addRect; placements.js tự gọi registerPlacements khi import). Phải đổi thành va chạm THEO ZONE trước khi thêm zone thứ hai. Bản đồ nhỏ (minimap.js) cũng phải theo zone.
- Mọi zone phải có test: bố cục không kẹt, điểm xuất hiện đi được tới mọi cổng, ngân sách không vượt.

## 3. Các không gian (ĐỀ XUẤT; loại: AN = an toàn, KQ = kỳ quan, QUÁI = săn yêu quái, HẦM = nhiệm vụ)
| # | Zone | Loại | Nội dung chính | Mở khi |
|---|---|---|---|---|
| 0 | Chùa Diệu Giang (hub, đã có) | AN | Chánh điện, sân, nhà, cửa hàng. Không đánh quái | Mặc định |
| 1 | Rừng Thông & Suối Trong | AN/KQ | Câu cá, nhiệm vụ nhẹ, đom đóm, mảnh LỬA phụ | Mặc định |
| 2 | Chợ Chùa ven sông | AN | NPC, cửa hàng, tụ họp, tiệc, tham quan nhà | Mặc định |
| 3 | Vách Đại Phật & Thác | KQ/QUÁI | Chương 2 (mảnh ĐÁ), leo vách, thác | Cấp/Đạo hạnh nhẹ |
| 4 | Thung Lũng Sương Mù | KQ | Biển mây, bình minh, cầu treo, điểm chiêm bái | Sau chương 1 |
| 5 | Hồ Gương & Đảo Sen Nổi | KQ/HẦM | Sen phát sáng đêm, bơi/lặn, chương 3 (mảnh NƯỚC) | Sau chương 2 |
| 6 | Hang Thạch Nhũ Phát Sáng | HẦM/QUÁI | Hầm nhỏ, câu đố ánh sáng, yêu quái Đá | Sau chương 2 |
| 7 | Vịnh Trăng | KQ/QUÁI | Bãi biển đêm, thủy triều, thả hoa đăng, yêu quái Nước | Sau chương 3 |
| 8 | Núi Lửa Tro | KQ/QUÁI | Đá nóng, khói, chương 4 (mảnh LỬA), thiền dập lửa | Sau chương 3 |
| 9 | Đỉnh Tháp Mây | KQ/HẦM | Đích cuối, chương 5, Khinh công bậc cao | Sau chương 4 |

Thứ tự dựng: 4 trước (nhẹ nhất, chứng minh đường ống zone), rồi 3, 6, 5, 8, 7, 9, 2.

## 4. Kỳ quan và "Danh thắng"
- Mỗi zone KQ có 3–5 điểm chiêm bái (đứng đúng chỗ, đúng giờ/thời tiết để "mở" cảnh): lần đầu thưởng hạt sen + huy hiệu.
- Bộ sưu tập "Danh thắng" (~30 điểm) có phần thưởng khi đủ bộ.
- Chế độ chụp ảnh: khung kèm tên chùa/zone, lưu ảnh để người chơi tự chia sẻ.
- Cảnh đổi theo giờ/thời tiết/mùa: sương sớm, giờ vàng, mưa, đom đóm, mùa sen.

## 5. Giữ chân người chơi (không ép, không pay-to-win)
- Sự kiện theo lịch Âm (mùng 1, Rằm, Phật Đản, Vu Lan, Trung Thu, Tết): có banner, quà, việc riêng.
- Yêu quái thế giới xoay zone theo lịch (mỗi khung giờ ở một zone khác); thêm lý do đi khắp nơi.
- Nhiệm vụ ngày (3 việc, mỗi zone một loại) + chuỗi ngày, mốc 7/30; có "ngày nghỉ phép" để không phạt nặng.
- "Hành hương": tour nhiều zone trong tuần, thưởng khi đi đủ.
- Đạo hạnh Giới/Định/Tuệ (3 thanh) mở zone và chương truyện; danh hiệu theo cách chơi.
- Bí mật: cổng ẩn, hạt sen ẩn (parkour), NPC hiếm.
- Phương tiện (thuyền, cáp treo, xe) chính là cổng chuyển zone.
- Lựa chọn có đánh đổi (quái mạnh rơi nhiều lá; thiền thay vì câu cá). Xếp hạng theo đạo hạnh tuần, không theo tiền. Không thanh toán tiền thật.

## 6. Lộ trình phiên (mỗi phiên MỘT mục, xong báo, chờ "tiếp tục")
| Phiên | Mục | Xong khi |
|---|---|---|
| 71 | Điều tra mã + hạ tầng ZONE: va chạm theo zone, ZoneManager, hub thành zone "chua", cổng thử, dispose | npm test xanh; chạy y như cũ trong hub; test chuyển zone giả |
| 72 | Sự kiện lịch Âm (Rằm, mùng 1) | Có banner, quà, test theo ngày |
| 73 | Đạo hạnh Giới/Định/Tuệ | 3 thanh, danh hiệu, test cân bằng |
| 74 | Zone 4 Thung Lũng Sương Mù + điểm chiêm bái | Đi qua cổng, ngắm, nhận thưởng, quay lại không lag |
| 75 | Chương 2 + NPC Thầy + zone 3 Vách Đại Phật | Chơi hết một lượt |
| 76 | Nhiệm vụ ngày + chuỗi | Mốc 7/30 đúng |
| 77 | Vipassana (ptg duyệt thiết kế trước) | Thiền ra kết quả |
| 78+ | Zone 6, 5, 8, 7, 9 + chương 3, 4, 5; chế độ chụp ảnh; xã hội theo zone | Theo thứ tự ptg chọn |

Chơi chung qua mạng (6.x) làm ở phiên RIÊNG sau khi hạ tầng zone xong; ptg tự sửa thư mục gas/.

## 7. Việc ptg cần quyết
- Duyệt/chỉnh danh sách zone mục 3 (tên, thêm/bớt).
- Có muốn zone mang văn hóa Việt rõ hơn (ruộng bậc thang, vịnh đá vôi kiểu Hạ Long, hang kiểu Sơn Đoòng)?
- Quái ở zone nào được "đánh chung" khi có mạng.
- Điện thoại yếu: chấp nhận mức đồ họa thấp hơn ở zone nặng?
