# PHIÊN 65 — Yêu quái hằng tháng + luật ném người + sửa cụm nút điện thoại — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

(Số phiên: một phiên khác đã dùng "Phiên 64" cho hiệu ứng ăn mừng nhiệm vụ + sửa cây rừng thông, nên phần này ghi là 65.) Đọc: PROMPT.md → KE_HOACH_TONG.md → PHIEN62.md → PHIEN63.md → PHIEN64.md (có ghi chú nút Nhảy trên điện thoại) → file này.

## ptg chốt (08/11)
Ném người: **trong chùa không ném** · **hồi chiêu 10 giây mỗi cặp người** · **người bị ném rơi an toàn, không mất gì** · **yêu quái bị ném thì mất máu** · **người ném người khác bị trừ 1 công đức**. Yêu quái: **gồng chiêu rồi đánh diện rộng**, không né được, dính nhiều đòn thì ngã và hồi sinh; **máu mất ít/nhiều tùy cấp**; **nhiều người đánh chung**; thu phục xong **rơi lá bồ đề, ai nhanh tay nhặt được**; kỹ năng chiến đấu = **ném đá + thương**; hết máu **hồi sinh ở cửa chùa**; thu phục được **thưởng lá bồ đề + điểm cấp + sức mạnh**.

## ĐÃ LÀM
**1. Luật ném người** (`js/world/strength.js`): `throwCheck`, `inTemple` (từ chánh điện tới hết cổng Tam quan là "trong chùa"), hồi chiêu 10 s theo cặp (`markThrown`, `tickCooldown`, chiều ngược lại không bị), `THROW_COST_SEN = 1` hạt sen, lý do từ chối: `level / strength / weight / temple / meditating / cooldown`. Người bị ném rơi tại `landing()`, không mất gì. **CHƯA NỐI MẠNG** (xem "Chưa làm").
**2. Yêu quái** (`js/world/yeuquai.js` logic thuần · `js/ui/yeuquai.js` · `js/scene/yeuquai.js`):
- Lịch: mỗi tháng (giờ VN) một lần, **20:00–21:30**, ngày 5–25 cố định theo năm-tháng (mọi máy cùng lịch); loại xoay vòng **Đá → Nước → Lửa**. **Tháng 11/2026: 17/11, Yêu Lửa.** Còn ≤14 ngày thì báo "Sắp có…" khi vào game.
- Thử NGAY không cần chờ: thêm `?yq=da` (hoặc `nuoc`, `lua`) vào địa chỉ trang → xuất hiện ở đường làng (0,100), không ghi nhận thu phục thật.
- Đòn gồng: Đá = vòng 6,5 m quanh thân (gồng 1,9 s) · Nước = vành khuyên 3–10 m, **đứng sát thân thì an toàn** (gồng 1,7 s) · Lửa = 3 vòng 3,5 m rơi gần người chơi (gồng 1,5 s). Vùng đỏ hiện trên đất, đậm dần; chạy 7 m/s thoát được.
- Máu người chơi 100 + 20/cấp. Một đòn: cấp 1 mất 34–40 (3 đòn là ngã); mỗi cấp giảm 5% (tối đa 50%) nên cấp 10 mất ~22/280. Ngã → hồi sinh đầy máu tại **(0,38) ngay trước cổng Tam quan**, bất tử 3 s.
- Người chơi: **Ném đá** (tầm 18 m, hồi 1,4 s, 8 + 0,35×sức mạnh) · **Thương** (tầm 3,6 m, hồi 0,7 s, 20 + 0,5×sức mạnh) · **Ném yêu quái** (chỉ khi cấp VÀ sức mạnh lớn hơn nó: lv 8, sức 90–100; 150 + 2×sức mạnh). Máu yêu quái 1600–2400 (+50% mỗi người đánh chung).
- Thu phục: rơi 8 túi lá (1–3 lá/túi, +2 túi mỗi người đánh chung), nằm 150 s, chạm vào là nhặt (ai tới trước lấy trước); đánh ≥5% máu thì thưởng **+60 điểm cấp** và **+3 sức mạnh vĩnh viễn** (`lgt.yq.bonus`, tối đa 100, đã cộng vào `strengthOf`). Mỗi tháng thu phục một lần (`lgt.yq.done['YYYY-MM']`).
- Lá thưởng nhập bằng `LGT.merit.addLa` + trường mới `gift` trong `lgt.la` để **không làm phồng hạt sen từng kiếm** (`spent`).
- HUD: thanh máu yêu quái + thanh máu bạn + còn mấy phút, màn hình chớp đỏ khi trúng.
**3. Cụm nút góc phải-dưới** (`js/world/dock.js`, `js/ui/dock.js`, `css/dock.css`): thêm nút **Ném đá / Thương / Ném yêu quái** (bong bóng chỉ chỗ bấm một lần) · nút **Nhảy luôn hiện** — chưa mở Khinh thân thì mờ, nét đứt, bấm báo "gặp Thầy trụ trì, làm nhiệm vụ tưới cây bồ đề để mở bậc 1" (xử lý ghi chú PHIEN64: phương án A) · cụm **tự đo cột menu dọc bên phải** rồi co lại (1 cột → 2 cột → 2 cột nút nhỏ) để không đè lên menu.
**4. Kiểm thử:** `tests/yeuquai.test.mjs` (14 test mới: lịch, máu theo cấp, hồi sinh, vùng đánh, né được, nhặt lá, luật ném người…), `tests/dock.test.mjs` (+2, sửa 3), `package.json`, `sw.js` = `dgt-v70`. `npm test`: **701/701** (Node 22).

## CHƯA LÀM — cần ptg biết
- **Nhiều người đánh chung / máu chung / tranh nhặt lá / ném người thật qua mạng**: hiện MỖI MÁY tự mô phỏng một con yêu quái từ cùng lịch tháng; máu và túi lá KHÔNG chia sẻ giữa người chơi. Muốn thật phải thêm vào phòng Firebase/Apps Script: máu yêu quái chung, sự kiện "trúng đòn", "nhặt túi lá" (người nào ghi trước được), "bị ném". Cần sửa `gas/Code.gs` + `engines/room.js`, không chạy thử được ở môi trường này (403 tới script.google.com) → làm cẩn thận ở phiên riêng, có chuyển cảnh thử.
- Chưa nhìn bằng mắt: môi trường này không tải được three.js (CDN bị chặn) nên chưa chụp được màn hình thật; bố cục cụm nút được xử lý bằng cách đo thật trong trình duyệt (`fit()`) chứ chưa xác nhận trên điện thoại. **Cần ptg thử trên điện thoại:** `?yq=da`, kiểm vùng đỏ, bấm Ném đá/Thương, ngã và hồi sinh ở cửa chùa, nhặt lá.
- Chưa có: âm thanh/hoạt cảnh đánh, yêu quái chưa tránh vật cản thông minh (chỉ trượt theo `layout.move`), chưa hiện yêu quái trên bản đồ nhỏ/Lộ trình, sát thương lên NPC/dân làng (hiện chỉ đánh người chơi), thanh máu chưa lưu khi tải lại trang (hồi đầy máu mỗi lần vào).
- Con số (máu, sát thương, thưởng 8 túi lá, +3 sức mạnh, lịch 20:00 ngày 5–25) là QUY ƯỚC TẠM chờ ptg duyệt.

## VIỆC KẾ (mỗi việc xong báo, chờ "tiếp tục")
1. Ptg thử `?yq=lua` trên điện thoại và nói cảm nhận (khó/dễ, vùng đỏ rõ chưa) → chỉnh số.
2. Nối mạng: máu yêu quái chung + nhặt lá tranh nhau + ném người (cần ptg đồng ý làm phiên riêng cho phần Apps Script).
3. "Người không rành vẫn chơi được": nút Dẫn đường nhấp nháy cho nhiệm vụ mới, nhãn chữ cho nút góc trên, màn hướng dẫn lần đầu 3 bước.
4. Còn mở: sông + hồ, kiến trúc thêm, Suối Trong, trang Tu tập/NPC trong Lộ trình, kết quả phép 8 `chan-doan.html` (PHIEN55).
