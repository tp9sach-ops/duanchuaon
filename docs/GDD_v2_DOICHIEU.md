# Đối chiếu GDD v2 với mã thật (G0.1, Phiên 99)

> Ngày 2026-11-11. Nguồn đã đọc trên `main`: `js/world/yeuquai.js`, `skills.js`, `conKhi.js`, `thietDau.js`, `strength.js`, `merit.js`, `quests.js`, `fishing.js`, `zones.js`, `js/ui/bag.js`, `docs/PHIEN65.md`, `docs/PHIEN97_NHA_CAP45.md`, `PROMPT.md` mục 7, danh sách tên file trong `js/world` và `js/ui`.
> **Giới hạn:** công cụ tìm mã trả "incomplete_results" nên mục "chưa có" được xác định bằng danh sách tên file, không phải grep toàn repo. Phiên sau nên `git clone` và grep thật trước khi viết G1. Chưa đọc: `docs/PHIEN81/90/91.md`, `yqCoop.js`, `zoneRuntime.js`, `zoneGate.js`, `zoneThu.js`, `throwPlayer.js`.

## 1. Nguyên tắc
Mã thật luôn đúng hơn tài liệu. Chỗ nào GDD mâu thuẫn mã thì ghi "LỆCH" và đưa vào câu hỏi cho ptg (mục 7), không tự chọn.

## 2. Bảng đối chiếu

| Hạng mục GDD | Thực tế trong mã | Kết luận | File |
|---|---|---|---|
| Cấp độ | 10 cấp công hạnh (`LEVELS`, xp 0 → 1800, danh hiệu Khách vãng lai … Trưởng lão cư sĩ). Dùng khắp nơi: Sinh lực, sát thương nhận, ném người, Khinh thân | ĐÚNG (bậc công hạnh). Tu Vi 1–150 **chưa có**, phải là hệ riêng (biến `tuvi`), không đè `level` | `js/world/quests.js` |
| Quái | Boss sự kiện: Yêu Đá (hp 2400), Yêu Nước (1900), Yêu Lửa (1600), gồng chiêu rồi đánh diện rộng, nhiều người đánh chung (+50% máu/người), rơi lá bồ đề | ĐÚNG một phần. Chưa có Oán Khí, Dao Động, Cảm Hóa. Chưa có quái thường (Dã Mèo Rừng…) | `js/world/yeuquai.js` |
| Lịch quái | **Mỗi ngày 3 lần: 12:00, 16:00 (trung bình), 20:00 (cao)**, mỗi lần 90 phút, loại xoay theo ngày | **LỆCH**: GDD ghi "hiện hằng tháng" (câu 2). Thực tế đã đổi từ Phiên 67 | `yeuquai.js` SLOTS, DIFF |
| Hồi sinh | Mất hết máu → hồi sinh đầy máu tại (0,38) trước cổng Tam quan, bất tử 3 giây, không mất đồ | ĐÚNG (GDD mục 8) | `yeuquai.js` |
| Sinh Lực người chơi | `maxHp = 100 + 20/cấp`; đòn trúng giảm 5%/cấp (tối đa 50%) | Tên khác ("máu"); GDD đổi thành Sinh Lực, dùng lại công thức này làm nền | `yeuquai.js` |
| Chỉ số Công/Thủ | Chưa có. Có `strengthOf = cấp×6 + khinh×10 + √sen×2 + bonus` | THIẾU. Đề xuất: Công dựa trên `strengthOf` để không phá luật khêng/ném | `strength.js` |
| Kỹ năng tầm xa | Ném đá (tầm 18 m, hồi 1,4s, 8+0,35×sức mạnh), Thương (3,6 m, 0,7s, 20+0,5×sức mạnh) | ĐÚNG (Võ Căn Bản) | `yeuquai.js` |
| **Chém khí** | Cầm côn chém luồng khí, tầm 16 m, hồi 3s, 45+0,8×sức mạnh, tự ngắm | **GDD KHÔNG NHẮC** (Phiên 93). Cần chỗ đặt trong hệ skill | `conKhi.js` |
| **Thiết đầu công** | Khinh thân bậc ≥4: lao đầu 6–15 m, 70–300 sát thương gốc, hồi 5s | **GDD KHÔNG NHẮC** (Phiên 90) | `thietDau.js` |
| Khinh thân | 8 bậc (Nhất Diệp … Bát Thiên), bậc 1 mở bằng cốt truyện, bậc 2–8 luyện bằng cấp công hạnh 2–10 + hạt sen 10–400 | LỆCH nhẹ: GDD nói mỗi bậc 1 Dấu Ấn, ≈10 cấp Tu Vi/bậc. Dấu Ấn chưa có | `skills.js` |
| Ném người/vật | 8 vật khêng (6–200 kg), luật ném người (không trong chùa, hồi 10s/cặp, trừ 1 hạt sen) | ĐÚng, GDD không nêu | `strength.js` |
| Hệ Ngũ Hành, Pháp Môn, Skill 1–5, Tâm Ấn, Tuyệt Học | Không có | THIẾU (mới hoàn toàn) | — |
| Bồ đoàn chánh điện | 48 bồ đoàn (Phiên 14) | ĐÚNG, dùng cho Lễ Khai Ngộ; cần chọn 5 bồ đoàn riêng | `js/world/seats.js` |
| Hồ Lô, Quy Y Viện, Sổ Thu Phục | Không thấy file. Có mẫu `dex` (sổ sưu tầm cá) để tái dùng | THIẾU | `fishing.js` |
| Linh Thú, Thần Khí, 10 ô trang bị, Thiền Phái | Không thấy file (`js/world`, `js/ui`) | THIẾU | — |
| Tiền tệ | Hạt sen (ví `lgt.wallet`), lá bồ đề (`la`, `spent`, `gift`; 10 sen = 1 lá), thùng công đức (1.000đ = 1 sen, tạm), ngọc (HUD, 0) | ĐÚNG. Thiếu: Điểm Công Đức riêng, Huyền Tinh, Linh Ấn, Mảnh | `merit.js`, `donate.js` |
| Túi đồ | Lưới ô 4 cột (tiền, cầu, cá, nội thất, Khinh thân, nhà, mảnh chuông…), nội dung từ `bagSections` | ĐÚNG, cần mở rộng cho vật phẩm chiến đấu | `js/ui/bag.js`, `js/world/dock.js` |
| ZONE/Phó bản | Quản lý zone có loại `AN, KQ, QUAI, HAM`, cổng, ngân sách, travel | ĐÚNG hạ tầng; **chưa xác nhận đã nối vào game** (có `zoneRuntime.js`, `zoneGate.js`, `zoneThu.js`) | `zones.js` |
| Đa người boss | Phiên 65 ghi chưa nối mạng; sau đó có `yqCoop.js` | CHƯA KIỂM | `yqCoop.js` |
| Cốt truyện | Chương 1 (`story.js`: Chú tiểu Minh, tưới cây, thiền 3 phút), chương 2 "Mảnh chuông Đá" (`story2.js`, chuông Diệu Giang + tam độc) | **LỆCH**: chương 2 của GDD là Lễ Khai Ngộ (câu 14) | `story.js`, `story2.js` |
| 7 chương nhiệm vụ | `chapters.js` (Phiên 60), nhiệm vụ ghé `v-<id>` | ĐÚNG (GDD dùng lại khung này) | `chapters.js`, `quests.js` |

## 3. Danh mục nội dung đang có (nền để thêm nội dung mới)

**Quái:** Yêu Đá / Nước / Lửa (kiểu đòn: slam / ring / burst). Độ khó `trung` và `cao`.
**Kỹ năng chiến đấu:** Ném đá, Thương, Chém khí, Thiết đầu công, Ném yêu quái/vật/người, Khinh thân 8 bậc.
**Vật phẩm:** 5 quả cầu (Gỗ, Đá Suối, Ngọc Bích, Lưu Ly, Kim Quang), 16 loài cá/rùa/ba ba/mực (7 thường, 6 hiếm, 3 riêng Suối Trong), 8 vật khêng, nội thất, 5 cấp nhà (Tuscan, La Mã là cấp 4–5), mảnh chuông Diệu Giang.
**Tiền:** hạt sen, lá bồ đề, ngọc (chưa dùng).
**Nơi chốn:** 4 vùng nước, rừng thông, thác, Bảo tháp, Vách Đại Phật, làng, chợ (xem `PLACES` trong `js/world/outside.js`).

## 4. Kế hoạch bổ sung nội dung (cách chơi, quái, vật phẩm, skill)

Mỗi dòng dưới đây là NỘI DUNG cần thêm vào mã, gắn vào mục của `KE_HOACH_GDD_V2.md`. Dữ liệu đặt trong module `.js` (xem KE_HOACH mục B).

| Nội dung | Cách làm phù hợp mã hiện có | Mục |
|---|---|---|
| Quái thường 7 vùng (Dã Mèo Rừng, Rêu Tinh, Đạo Tặc Sơn Cước…) | Module mới `monsters.js` + `js/data/monsters.js`, sinh cục bộ. KHÔNG dồn vào `yeuquai.js` (đó là boss sự kiện); tái dùng `hitDamage`, `hurt`, `RESPAWN` | G1.6, G3.6, G4.1–4.2 |
| Oán Khí đổi tên cho máu quái; Dao Động khi ≤25% | Thêm trường hiển thị "Oán Khí" trên HUD; boss sự kiện giữ cơ chế gồng chiêu, thêm trạng thái Dao Động ở `capture.js` | G1.6, G3.1 |
| 5 Hệ + 15 skill + 10 Skill 4 + 5 Tuyệt Học | `js/data/skills.js` + `skills` engine mới (tên khác `js/world/skills.js` đang là Khinh thân): đề xuất `skillbook.js` | G2.2–2.3 |
| Chém khí, Thiết đầu công vào bảng skill | Mặc định: Chém khí = skill chung Võ Căn Bản mở rộng; Thiết đầu công = tuyệt kỹ Khinh công; cả hai giữ nguyên mã, chỉ đăng ký vào dữ liệu để thanh skill hiển thị | G2.2, G2.5 |
| Skill bố trí trên điện thoại | Cụm nút góc phải-dưới đã có Ném đá/Thương/Chém khí/Nhảy/Thiết đầu công/Ném (`dock.js`): phải xem ảnh thật trước khi thêm 5 ô | G2.5 |
| Vật phẩm mới: Linh Ấn (5 Hệ), Huyền Tinh 1–12, Mảnh Thần Khí, Phù Cảm Hóa, Thức Ăn Linh Thú, đá cường hóa Lam→Cam, Trứng A/A+/S | `js/data/items.js` + `bagSections` mở rộng, chỉ thêm dần khi hệ thống dùng đến (không thêm ô rỗng) | G3.5, G5.1, G6.4 |
| Điểm Công Đức riêng (không tiêu) | Trường mới trong trạng thái người chơi, khác `merit.js` hạt sen | G3.4 |
| Nhiệm vụ Hệ Phái, hằng ngày mới | Thêm vào `QUESTS` + loại sự kiện mới trong `EVENT_TYPES` (`hangyeu`, `boss`, `skill`…), theo quy tắc `v-<id>` + `PLACE_STAND` + chương | G2.7, G4.5 |
| Tháp Sổ Thu Phục | Sao chép mẫu `dex` của cá | G3.5 |
| Ma Tướng tuần (Kim, Mộc, Thủy, Thổ) | Mở rộng `YQ`: hiện đã có Đá≈Thổ, Nước≈Thủy, Lửa≈Hỏa; thêm Kim và Mộc (pattern mới) | G7.3 |

## 5. Điều chỉnh kế hoạch (đọc trước khi làm G1)

- **G1.1:** `stats.js` tính Công từ `strengthOf`, Sinh Lực từ `maxHp`; Tu Vi là biến riêng `tuvi`. Không sửa `level` công hạnh.
- **G1.3:** công thức sát thương mới chỉ dùng cho skill mới; phải giữ kết quả của `stoneDamage`, `spearDamage`, `khiDamage`, `dashDamage` (có test hiện có) trừ khi ptg đồng ý đổi. Thêm test chứng minh không đổi.
- **G1.6:** tách thành 2: (a) đổi nhãn máu boss thành Oán Khí và thêm khung mục tiêu; (b) quái thường Dã Mèo Rừng sinh cục bộ. Làm (a) trước.
- **G2.2:** dữ liệu skill phải có bản ghi cho Ném đá, Thương, Chém khí, Thiết đầu công để thanh skill dùng chung một nguồn.
- **G2.4 (Khai Ngộ):** chọn 5 trong 48 bồ đoàn; xem `seats.js`.
- **G4.5:** chương GDD 2–4 cần hợp nhất với `story2.js` (xem câu 14 mục 7). Chưa làm gì cho đến khi ptg chọn.
- **G7.4:** trước hết xác nhận `zoneRuntime/zoneGate/zoneThu` đã nối hay chưa.
- **G7.1:** đọc `yqCoop.js` + `docs/PHIEN65.md` mục "Chưa làm" trước khi thiết kế Firebase.
- Thêm **G0.5:** `git clone`, grep thật các tên `hulo`, `pet`, `artifact`, `guild`, `tuvi`, `huyentinh`, `linhan` để xác nhận "THIẾU".

## 6. Tiến độ (nguồn đúng, thay cho cột Trạng thái trong KE_HOACH_GDD_V2.md cho đến khi được cập nhật)

| ID | Trạng thái |
|---|---|
| G0.1 đối chiếu | **XONG (Phiên 99)** |
| G0.2 ptg trả lời câu hỏi | chưa |
| G0.3 sửa 4 test hỏng | **XONG (Phiên 100)** — 4 test đỏ #322, #328, #355, #767 đã sửa, `npm test` 869/869 |
| G0.4 hỏi thứ tự phần CÁ | chưa |
| G0.5 grep xác nhận mục THIẾU | **XONG (Phiên 101)** — xem mục 8 |
| G1.1 trở đi | chưa |

## 7. Câu hỏi mới cho ptg (phát sinh từ đối chiếu; có mặc định, cộng thêm vào 10 câu của GDD mục 16)

11. Tu Vi 1–150 **tách riêng** với 10 cấp công hạnh hay **thay thế** chúng? Mặc định: tách riêng (GDD v2 mục 0).
12. Giữ yêu quái sự kiện **3 lần/ngày** (Phiên 67) cho Yêu Đá/Nước/Lửa, và thêm Ma Tướng hằng tuần ở giai đoạn sau? Mặc định: giữ 3 lần/ngày, Ma Tướng tuần là sự kiện riêng (thay câu 2).
13. **Chém khí** và **Thiết đầu công** đặt ở đâu trong hệ skill? Mặc định: Chém khí là skill chung (ai cũng có), Thiết đầu công là tuyệt kỹ Khinh công; không thuộc Hệ nào.
14. Truyện: giữ `story.js`/`story2.js` (chuông Diệu Giang, tam độc) làm tuyến chính, còn chương 2–4 của GDD thành tuyến Hệ Phái? Mặc định: có. Gợi ý liên kết: ba mảnh chuông Đá/Nước/Lửa ứng ba loại yêu quái hiện có.

## 8. Bổ sung Phiên 101 (đã `git clone` và grep thật; Node 22)

**G0.5 — xác nhận mục THIẾU:** grep trong `js/` và `gas/` các từ `tu vi`, `oán khí`, `sinh lực`, `hồ lô`, `linh ấn`, `sổ thu phục`, `linh thú`/`ấp trứng`, `thần khí`/`trang bị`, `khai ngộ`/`pháp môn`/`hệ phái`, `Dã Mèo Rừng`, `thiền phái`/`guild` → **không có mã nào** (chỉ chữ "Linh thú" và "Thiền phái" trong nhãn nút mờ của `js/ui/menuLogic.js`). Mục THIẾU ở bảng mục 2 được xác nhận. `Khinh thân`, `Thiết đầu công` có đủ ở `js/world` và `js/ui`.

**Phần "chưa kiểm" ở đầu file nay đã kiểm:**
- **Boss chung (`yqCoop.js`)**: máu + túi lá chung chạy qua **Google Apps Script `gas/Yq.gs`** (thăm dò), KHÔNG qua Firebase. Firebase chỉ lo vị trí và chat (`js/net/firebaseTransport.js`, ≤ 4 lần gửi/giây, phòng tối đa 30 người). Kế hoạch G7.1 ("boss chung qua Firebase") phải đổi: hoặc giữ GAS, hoặc chuyển có chủ đích.
- **ZONE**: đã nối một phần vào game (`js/ui/zoneGate.js`, `js/main.js`; cổng "Vườn thử"; test `zoneruntime`, `zonethu`). G7.4 không còn từ con số 0.

**MÂU THUẪN MỚI (quan trọng): nạp tiền thật làm tăng sức mạnh.** `strengthOf = lv*6 + khinh*10 + √(tổng hạt sen từng kiếm)*2 + bonus` (`js/world/strength.js`, dòng 12–16). Thùng công đức (`js/ui/donate.js` → `addMerit`) đổi 1.000đ = 1 hạt sen, tối đa 50.000 sen mỗi khoản. Ví dụ: người chơi cấp 10 + Khinh thân 8 được 60 + 80 = 140; nạp 50.000 sen cộng thêm khoảng +447 sức mạnh, vượt xa mọi cách chơi thường. Điều này **trái GDD mục 13 và câu 5** (sức mạnh chiến đấu chỉ kiếm bằng chơi), và G1.1 dự định dựng Công trên `strengthOf` nên sẽ thừa hưởng lỗi này. **Đề xuất (chờ ptg):** bỏ thành phần `√sen` khỏi `strengthOf`, hoặc chỉ tính hạt sen kiếm bằng chơi (không tính khoản donate). Sửa nhỏ, test có sẵn (`tests/strength.test.mjs`) sẽ phải đổi theo. Cũng xem lại: hạt sen đang ảnh hưởng quy tắc "ném người" qua `strengthOf`.

**Câu hỏi thêm cho ptg (có mặc định):**
15. Bỏ `√hạt sen` khỏi `strengthOf` (nạp tiền không tăng sức mạnh)? Mặc định: bỏ.
16. Boss chung giữ **GAS** (đã chạy) hay chuyển Firebase như GDD? Mặc định: giữ GAS cho tới khi đo thấy trễ.
