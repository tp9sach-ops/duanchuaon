# Phiên 209 — S1 "Prompt nâng cấp sức hấp dẫn": đọc mã, bảng Đã có / Chưa có, câu hỏi cần duyệt

> Repo `main` (đầu phiên: sau Phiên 208). Yêu cầu của ptg (2026-11-16): xem lại repo duanchuaon, việc nào đã làm thì bỏ qua, cập nhật KHÔNG lỗi; làm theo "Prompt nâng cấp sức hấp dẫn — Diệu Giang Tự" từng mục, bắt đầu từ mục 1 (= S1), xong đẩy GitHub rồi báo, chờ "tiếp tục".
> Phiên này CHỈ ĐỌC MÃ + viết tài liệu. KHÔNG sửa mã nên KHÔNG tăng `sw.js` VERSION, KHÔNG chạy lại `npm test` (lần gần nhất, Phiên 208: 1348/1348 đạt).

## Đã đọc kỹ (nội dung) / chỉ biết tên file
- Đọc kỹ: `docs/PHIEN208.md`, `docs/CHIEU_AM_THANH.md`, `js/world/{loadout,gearSync,items,camFeel,skillCatalog,yeuquai,yqCoop}.js`, `js/net/firebaseTransport.js`, `js/scene/perfLogic.js`.
- Chỉ biết tên + cỡ file (CHƯA đọc nội dung, ghi "chưa kiểm" bên dưới): các file còn lại trong `js/world`, `js/ui`, `js/net`, `gas/`, `firebase/`.
- Không đọc: `HANDOFF.md` (176 KB), `PROMPT.md` (74 KB). `PROMPT.md` mục 7 CHƯA được thêm dòng mới (file quá lớn, sửa dễ lỡ tay) — phiên sau thêm nếu ptg muốn.

## Điểm LỆCH giữa prompt nâng cấp (soạn khi repo mới tới Phiên 82) và mã thật
1. **Số phiên:** prompt ghi "Phiên 83"; repo đã tới 208 (và `docs/PHIEN83.md` đã có việc khác) → phiên này đặt tên PHIEN209.
2. **Lịch yêu quái:** prompt nói mỗi tháng, khung 3 giờ và 20 giờ. Mã thật (`js/world/yeuquai.js`): MỖI NGÀY 3 khung 12:00 / 16:00 (trung bình) / 20:00 (cao), mỗi khung 90 phút; ba loại Đá / Nước / Lửa xoay theo ngày.
3. **Ném đá:** đã BỎ từ Phiên 127, thay bằng "Đánh thường" cận chiến (+ Thương). Đánh thường lao tới + chuỗi 3 đòn đã xong (198, 205–208).
4. **Chiến đấu:** repo đã có hệ Hệ/ngũ hành + 4 ô chiêu + Tuyệt học mở theo Tu Vi + Pháp Môn (`skillCatalog.js`, `data/combatSkills.js`, `skillEngine.js`) — lớn hơn nhiều so với danh sách trong prompt (Quét Sen, Lăn Sen, Thiền Hộ Thể, Tụng Chú) và có phần trùng chức năng.
5. **Thời gian gồng yêu quái:** Đá 1,9 s · Nước 1,7 s · Lửa 1,5 s; độ khó cao ×0,8 → 1,2–1,5 s. Prompt đề xuất tối thiểu 1.800 ms nếu mạng chỉ thăm dò → hiện NGẮN HƠN ngưỡng đó.
6. **Mạng:** người chơi qua Firebase Realtime DB có listener (đẩy tức thời, gửi vị trí tối đa 4 lần/giây) = "Chế độ F". Nhưng yêu quái dùng Apps Script `gas/Yq.gs` thăm dò 2,5 s (`COOP_POLL_MS`) và CHỈ đồng bộ máu chung + túi lá; chuyển động + vùng đỏ MỖI MÁY TỰ MÔ PHỎNG (không đồng bộ trạng thái đòn). Chưa có "người phân xử"/chủ tick.
7. **Gói tin vật phẩm `i`:** chuỗi chữ a–z dài 1–8, hiện chỉ 7 chữ hợp lệ (`n k p q v h d`); luật Firebase + `gas/Room.gs` kiểm `/^[a-z]{1,8}$/`. Thêm trang bị mới (7 ô) = đổi giao thức, phải cập nhật cả luật Firebase và GAS.
8. **Tiền tệ:** đồ mua bằng LÁ BỒ ĐỀ (`items.js`); "hạt sen" cũng có (`merit.js`, chưa đọc). Prompt dùng hạt sen cho nhiều thứ → cần chốt dùng cái nào.
9. **Hai file PROMPT:** có cả `PROMPT.md` (gốc, 74 KB) và `js/PROMPT.md` (57 KB). ptg đã xác nhận repo chính là duanchuaon.
10. **PERF governor:** 6 bậc (0–5) — `js/scene/perfLogic.js` (trả lời câu 8 của prompt).

## Bảng Đã có / Chưa có — 8 trụ cột
| Trụ cột | ĐÃ CÓ (file thật) | CHƯA có / chưa kiểm |
| --- | --- | --- |
| A. Cảm giác chơi | `js/world/camFeel.js`: rung màn (trần 0,12 m, tắt dần), khựng hình 40–120 ms chỉ làm chậm nhân vật/mục tiêu, đẩy FOV theo chiêu 4/tuyệt học, camera nhảy trễ ~0,2 s; công tắc rung/khựng/giảm chuyển động. Đánh thường lao tới + combo 3 đòn (`basicCombo.js`, `combo.js`). | Số sát thương nổi 600 ms, độ trễ nút: chưa kiểm. Chưa ai nhìn bằng mắt (PHIEN208: không có WebGL). |
| B. Trang bị | Bản NHỎ: `loadout.js` (cầm Thương / Gậy như ý / Ván trượt), `items.js` (Nón Jingasa +3% giáp, Gậy như ý +1% sát thương), `hatMesh.js`, `staffMesh.js`, `ui/remoteGear.js` (người khác thấy đồ), `gearSync.js` (gói `i`), `ui/bag.js` (túi đồ — chưa đọc). | 7 ô trang bị, 4 bậc hiếm, bộ (set), nâng cấp, thẻ vật phẩm, xem trước 3D; chuỗi hạt, nón lá sen trăng, dép, dải vai, cà sa, mõ, lồng đèn, linh vật. |
| C. Vật phẩm | `items.js`: Bánh sầu riêng 3 vị (hồi máu ×5, 10 phút), Bánh pho mai than tre (hồi sinh tại chỗ, 20 phút), Trà sữa xoài (+30 phút tự động hàng yêu); mua bằng lá bồ đề; lá bồ đề rơi từ yêu quái; ảnh `js/data/itemImages.js`. | Nguyên liệu (vảy, lông, lõi gỗ…), nhang, nước cam lồ, chế tác, vật rơi cá nhân. |
| D. Nội tại | Chiêu thức có mục "nội tại" (`chieuInfo.js` — chưa đọc kỹ). Trang bị hiện có 1 hiệu ứng cố định mỗi món (giáp 3%, sát thương 1%, tốc độ cưỡi ×1,25 / ×1,5). | Khung nội tại cho trang bị: kích hoạt, hồi chiêu, cộng dồn, trần hệ số, hiển thị khi kích hoạt. |
| E. Kỹ năng + chiến đấu | Hệ ngũ hành (`elements.js`), 4 ô + Tuyệt học theo Tu Vi (`skillCatalog.js`, `skillEngine.js`, `skillBuff.js`, `ui/heSkill.js`), pose/timeline/trúng chiêu (`chieuPose*.js`, `chieuTimeline.js`, `chieuTrung.js`), lướt tay ngắm + vùng tung chiêu, Võ đài (`duel.js`), khu luyện tập, đánh quái tự động (`autoHunt.js`), khinh công/lướt (`glide.js` — chưa đọc). | Quét Sen, Lăn Sen, Thiền Hộ Thể, Tụng Chú Đại Bi (chờ ptg quyết có thêm hay không vì trùng hệ hiện có). |
| F. Hiệu ứng + âm thanh | 15 tiếng chiêu (gồng/phát/dư âm theo Hệ + 3 tiếng trúng) tổng hợp bằng `tools/make-chieu-am.py`, định dạng m4a, ~145 KB (`docs/CHIEU_AM_THANH.md`); `chieuAm.js`, `chieuFxPlan.js`, `fxGlsl.js`; bảng màu `docs/CHIEU_BANG_MAU.md`; âm xa nhỏ dần (đủ 4 m, tắt 40 m). Tiếng CHƯA ai nghe bằng tai (tài liệu ghi rõ). | Giọng nhân vật (cần thu thật); bảng chuẩn hiệu ứng/âm cho hành động đời thường (đi, lạy, thiền, gõ mõ, ngã): chưa kiểm; ducking nhạc khi chuông: chưa kiểm. |
| G. Vòng lặp + tiến trình | Nhiệm vụ chương (`quests.js`, `chapters.js`, `nextGoal.js`, `questGuide.js`), yêu quái 3 khung/ngày, tự động hàng yêu, câu cá, nông trại, nhà/nội thất, hành trình (`journey.js`), `ui/today.js` (chưa đọc). | Vòng 30 giây / 5 phút / ngày / tuần: chưa đối chiếu; nhiệm vụ ngày + chuỗi ngày liên tục: chưa kiểm. |
| H. Xã hội | Đa người Firebase (`js/net/firebaseTransport.js`, `room.js`, `roomClient.js`), chat, giao lưu võ thuật (`#dg`), tặng quà (`world/gift.js`, `ui/gift.js` — chưa đọc), yêu quái đánh CHUNG: máu chung + túi lá nhặt tranh nhau qua `gas/Yq.gs` (`yqCoop.js`), Võ đài 2 người, bảng xếp hạng (`rank.js`), bản đồ nhỏ. | Đồng bộ trạng thái/đòn yêu quái (mỗi máy tự mô phỏng), đồng bộ tư thế hoạt động (ngồi, lạy, thiền, tụng, gõ mõ), đồng tâm / cùng tụng, hiển thị trang bị đủ 7 ô. |

## Câu hỏi cần ptg duyệt (đã gạn bớt: câu nào mã đã trả lời thì bỏ)
Đã tự trả lời từ mã: repo chính (duanchuaon, ptg xác nhận); hệ máu (người: 100 + 20×(cấp−1); quái đánh −5% mỗi cấp, tối đa −50%); quái hiện có (Đá/Nước/Lửa, thu phục); thang PERF (6 bậc).
1. **Tiền thật (thùng công đức / quyên góp)** chỉ đổi danh hiệu + đồ thẩm mỹ, KHÔNG mua sức mạnh, KHÔNG hộp quà ngẫu nhiên? *(Đề xuất: đồng ý.)*
2. **Chiến đấu:** (a) giữ hệ chiêu hiện có, chỉ thêm trang bị/nội tại/linh thú/quái; hay (b) thêm cả Quét Sen, Lăn Sen, Thiền Hộ Thể, Tụng Chú? *(Đề xuất: a — tránh trùng với hệ đang chạy.)*
3. **Quái:** (a) giữ Đá/Nước/Lửa, chỉ thêm quái nhỏ Ma Trơi để tập tay; (b) thêm 3 trùm Ngư Tinh / Hồ Tinh / Mộc Tinh theo prompt; (c) khác. *(Đề xuất: a trước.)*
4. **Tài nguyên ngoài:** chỉ dựng bằng code (như `tools/make-chieu-am.py`) hay chấp nhận hình/âm có giấy phép rõ? *(Đề xuất: chỉ code.)*
5. **Linh thú** (rùa nhỏ, hạc, cá chép): có làm không, con nào trước? *(Chưa có trong mã.)*
6. **Nhịp gồng yêu quái:** giữ như hiện nay (1,2–1,9 s) hay nâng tối thiểu 1,8 s cho người mạng chậm? *(Chỉ cần khi làm đồng bộ đòn quái.)*
7. **Tiền tệ cho trang bị/nâng cấp:** lá bồ đề hay hạt sen? *(Repo hiện mua đồ bằng lá bồ đề.)*
8. **Lời kinh/chú** (nếu làm Tụng Chú): dùng văn bản công cộng nào, có giọng thật không? *(Chỉ cần nếu chọn 2b.)*
Mặc định nếu ptg không nói khác: 1 đồng ý · 2a · 3a · 4 chỉ code · 5 chưa làm · 6 giữ nguyên · 7 lá bồ đề · 8 bỏ.

## Lộ trình đề xuất sau khi ptg duyệt (mỗi dòng 1 phiên nhỏ, xong thì chờ "tiếp tục")
- S2: dữ liệu trang bị mới đặt chỗ MỚI (`js/gear/`, cờ `features.gear` mặc định tắt trong `js/config.js`), mở rộng gói `i` + luật Firebase + `gas/Room.gs` (đổi giao thức → cả hai máy cập nhật), test lưu/đọc, KHÔNG phá Gậy/Nón/Ván đang có.
- S3+: từng món theo khung 14 lớp (chuỗi hạt trước), rồi khung nội tại, rồi vật phẩm/nguyên liệu, linh thú, quái nhỏ.
- Mỗi phiên: grep trùng tên/id/phím tắt trước; tăng `sw.js` VERSION; chạy `npm test` (~5 phút); đẩy bằng github push_files.

## PROMPT BÀN GIAO CHO PHIÊN SAU (dán nguyên văn)
```
Dự án DIỆU GIANG TỰ — repo https://github.com/tp9sach-ops/duanchuaon (main). Đọc PROMPT.md, rồi docs/PHIEN209.md (và bản PHIEN mới nhất nếu có). Chỉ đọc chỗ cần; việc đã làm thì bỏ qua; cập nhật KHÔNG được gây lỗi (git clone repo rồi `setsid nohup npm test > /tmp/t.log 2>&1 < /dev/null &`, đợi dòng "# fail"; ~5 phút). Đẩy GitHub bằng công cụ github push_files (không có git credential trong container). ptg nói tiếng Việt, không rành kỹ thuật: trả lời ngắn gọn, dễ hiểu; làm TỪNG MỤC; khi sửa code đưa đoạn "tìm" đầy đủ rồi code thay thế đầy đủ.
Tình hình: S1 của "Prompt nâng cấp sức hấp dẫn" đã xong (docs/PHIEN209.md: bảng Đã có / Chưa có + 8 câu hỏi + mặc định). Việc phiên này: hỏi ptg đã duyệt câu nào (nếu im lặng thì dùng mặc định ghi trong PHIEN209.md), rồi làm S2 (hạ tầng trang bị, chỗ mới, cờ tính năng tắt mặc định). Xong: tăng VERSION sw.js nếu có đổi mã, thêm docs/PHIEN<N>.md có prompt bàn giao như file này, đẩy GitHub, báo ptg, chờ "tiếp tục".
```

## QUY TẮC BÀN GIAO (nguyên văn)
> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff
