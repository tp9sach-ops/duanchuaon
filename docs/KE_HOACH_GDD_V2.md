# KẾ HOẠCH TRIỂN KHAI GDD v2 — Diệu Giang Tự 3D

> Soạn Phiên 98 (2026-11-11). Căn cứ: `docs/GDD_v2.md`, `PROMPT.md`, `docs/PHIEN96.md`, `docs/PHIEN97_NHA_CAP45.md`.
> Nguồn trạng thái: mã thật trong repo luôn đúng hơn tài liệu. Cột "Game hiện tại" của GDD mới dựa vào nhật ký, nên **G0.1 đối chiếu là bước đầu tiên bắt buộc**.

## A. Quy tắc làm việc cho MỌI mục
1. **Mỗi lần chỉ làm MỘT mục nhỏ** (một dòng trong bảng dưới).
2. Xong mục: `npm test` đạt → đẩy GitHub (trùng tên ghi đè, commit `Phiên N (G#.#): mô tả`) → đọc lại từ GitHub đối chiếu → báo ptg → **CHỜ ptg nói "tiếp tục"** (quy tắc từ Phiên 18).
3. Đánh dấu mục xong bằng cách sửa cột Trạng thái trong file này thành `XONG (Phiên N)`.
4. Cuối **mỗi** câu trả lời: đính kèm file bàn giao cập nhật (`docs/PHIENxx.md`), chép nguyên văn quy tắc bàn giao; nếu sắp hết chỗ thì gửi bàn giao TRƯỚC.
5. **Điểm dừng an toàn:** mỗi mục kết thúc khi mã vẫn chạy và test xanh. Nếu không kịp, lùi về trạng thái xanh gần nhất rồi bàn giao; không để repo ở trạng thái dở.
6. Không phá tính năng cũ. Số liệu (TẠM) nằm trong file dữ liệu riêng, ptg duyệt rồi mới chốt. Cần đoạn mã nào thì hỏi ptg, không đoán.
7. Thuật ngữ không bạo lực: người chơi có **Sinh Lực**, quái có **Oán Khí**, không máu, không xác, không PvP.

## B. Quyết định kỹ thuật mặc định (ptg có thể đổi)
- Dữ liệu số liệu dùng module `.js` xuất đối tượng (ví dụ `js/data/skills.js`) thay vì `.json`, vì `npm test` chạy bằng Node không cài gói và import JSON khác nhau giữa các bản Node. Nếu ptg muốn `.json` thì xác minh cách nạp trước.
- Quái thường sinh cục bộ theo từng người; chỉ boss chung qua Firebase (GDD câu 10).
- Lưu tiến trình chiến đấu: cục bộ + lưu GAS khi đổi vùng và mỗi 60 giây, dùng tài khoản tên + mật khẩu đã có.
- Pháp Môn + Skill 4 (cấp 30) và Tuyệt Học (cấp 60) **không có gói riêng trong GDD mục 15**; kế hoạch này xếp vào G4 (đề xuất của Phiên 98, ptg duyệt).

## C. Các mục

### G0 — Chuẩn bị (chưa viết tính năng)
| ID | Việc | File | Xong khi | Trạng thái |
|---|---|---|---|---|
| G0.1 | Đối chiếu GDD với mã thật: đọc `docs/PHIEN62–67`, `PHIEN81`, `PHIEN90`, `PHIEN91` và mã chiến đấu hiện có (ném đá, thương, yêu quái hằng tháng, Thiết đầu công, Khinh thân, Hồ Lô nếu có). Sửa cột "Game hiện tại" | tạo `docs/GDD_v2_DOICHIEU.md` | Mỗi dòng bảng GDD mục 1 có "đúng / lệch / thiếu" + đường dẫn file; liệt kê chỗ GDD mâu thuẫn mã | XONG (Phiên 99, `docs/GDD_v2_DOICHIEU.md`; bổ sung Phiên 101) |
| G0.2 | Hỏi ptg 10 câu GDD mục 16 (cho phép trả lời "mặc định"); ghi vào `PROMPT.md` mục 7 | `PROMPT.md` | Có câu trả lời cho cả 10 câu, ghi trong nhật ký | chưa |
| G0.3 | Sửa 4 test hỏng sẵn: `312`, `318`, `345`, `tutorial: chủ đề mới` (xem `docs/PHIEN97_NHA_CAP45.md`) | `tests/*` và mã liên quan | `npm test` xanh hoàn toàn | XONG (Phiên 100: 4 test đỏ đã sửa, 869/869) |
| G0.4 | Hỏi ptg: làm phần CÁ (tồn từ Phiên 97) trước hay sau G1? Mặc định: sau G1 | — | ptg trả lời | chưa |

### G1 — Lõi chiến đấu (xong khi: đánh Dã Mèo Rừng lên cấp 5; test công thức đạt)
| ID | Việc | File dự kiến | Xong khi | Trạng thái |
|---|---|---|---|---|
| G1.1 | Dữ liệu cấu hình số liệu (đánh dấu TẠM) + module chỉ số: Công, Thủ, Sinh Lực theo Tu Vi (logic thuần) | `js/data/stats.js`, `js/world/stats.js`, `tests/stats.test.mjs` | Test: chỉ số tăng đúng theo cấp | XONG (Phiên 102) |
| G1.2 | Đường cong Tu Vi: EXP lên cấp kế = 30 × n^1,6; hàm tính cấp từ EXP, EXP còn thiếu | `js/world/stats.js` hoặc `levels.js` | Test mốc: cấp 10 ≈ 1.200, 30 ≈ 6.900, 60 ≈ 21.000, 90 ≈ 40.000, 120 ≈ 64.000, 150 ≈ 91.000 | XONG (Phiên 103) |
| G1.3 | Công thức sát thương: Công × hệ số skill × (1 + cường hóa) × K_hệ × 100 ÷ (100 + Thủ), chí mạng ×1,5 | `js/world/combat.js`, `tests/combat.test.mjs` | Test có đáp án tay (vài ca) | XONG (Phiên 104) |
| G1.4 | Nguồn Tu Vi: hàng yêu 40%, nhiệm vụ 30%, hoạt động chùa 15% (mỗi loại tối đa 5 lần/ngày), boss/phó bản 15%; cộng EXP từ sự kiện hiện có | `js/world/stats.js`, nối `quests`/`temple` | Test trần 5 lần/ngày; cộng EXP khi xong hoạt động | XONG (Phiên 105, logic thuần; nối vào game ở Phiên 107 cho nguồn hàng yêu) |
| G1.5 | Lưu Tu Vi: cục bộ + GAS (mỗi 60 giây và khi đổi vùng) theo tài khoản; cần xem `gas/Accounts.gs` (hỏi ptg nếu cần đoạn mã) | `js/net/*`, `gas/*` | Đăng nhập máy khác thấy đúng Tu Vi; test logic lưu | MỘT PHẦN (Phiên 107): lưu cục bộ `lgt.farm` ngay mỗi lần thu phục; khóa `lgt.*` tự thuộc diện đồng bộ tài khoản (`isSyncKey`). CHƯA kiểm trên máy thật và chưa có lưu riêng "mỗi 60 giây / khi đổi vùng" lên GAS |
| G1.6 | HUD tối thiểu: thanh Sinh Lực, khung mục tiêu (tên, cấp, Hệ, Oán Khí); chuẩn hóa Võ Căn Bản (Thương, Ném Đá) và nối quái hiện có sang Oán Khí; Dã Mèo Rừng cấp 3 | `js/ui/combat.js`, `js/world/monsters.js`, css | Đánh Dã Mèo lên cấp 5, thấy thanh Oán Khí giảm; ảnh chụp desktop + điện thoại | MỘT PHẦN (Phiên 107): khung mục tiêu (tên, cấp, Hệ, Oán Khí) + dòng Tu Vi/hạt sen còn; Ném đá + Thương đánh được quái bãi rừng. CHƯA có thanh Sinh Lực người chơi (quái không đánh trả) và chưa chụp ảnh desktop + điện thoại |

### G2 — Hệ phái và kỹ năng (xong khi: chọn được 5 Hệ; mỗi Hệ dùng đủ 3 skill; K_hệ đúng)
| ID | Việc | File dự kiến | Xong khi | Trạng thái |
|---|---|---|---|---|
| G2.1 | Logic Ngũ Hành: tương khắc (×1,3 / ×0,8), tương sinh (+5%/người, tối đa +10%), Ngũ Hành Hội Tụ +10% | `js/world/elements.js`, test | Test bảng khắc/sinh đủ 5×5 | XONG (Phiên 109) |
| G2.2 | Dữ liệu 15 skill gốc + 10 Skill 4 + 5 Tuyệt Học (chưa nối giao diện) | `js/data/skills.js`, test tự kiểm dữ liệu | Test: đủ trường, hồi chiêu > 0, mỗi Hệ đủ 3 skill | XONG (Phiên 110) |
| G2.3 | Bộ máy kỹ năng: hồi chiêu, Tâm Ấn (+1/đòn trúng, tối đa 5), cấp skill 1–10 (+6%/cấp, tối đa = Tu Vi ÷ 10) | `js/world/skills.js`, test | Test hồi chiêu, Tâm Ấn, trần cấp | XONG (Phiên 111) |
| G2.4 | Lễ Khai Ngộ cấp 10: ngồi vào bồ đoàn chọn Hệ (dùng bồ đoàn chánh điện đã có), 60 giây dùng thử Skill 1 | `js/world/khaiNgo.js`, `js/ui/*` | Chọn được 5 Hệ trên cảnh; hỏi ptg cách ngồi/bấm hiện có nếu chưa rõ | (a) logic thuần XONG (Phiên 112, `js/world/khaiNgo.js`); (b) nối bồ đoàn + giao diện: chưa |
| G2.5 | Thanh skill 5 ô trên điện thoại + PC (phím 1–5): thiết kế KHÔNG chồng cụm nút phải-dưới hiện có (cần xem giao diện hiện tại, hỏi ptg ảnh chụp), nhấn giữ xem tên, bong bóng chỉ chỗ khi mở khóa | `js/ui/skillbar.js`, css | Ảnh chụp điện thoại: nút không chồng nhau | chưa |
| G2.6 | Hiệu ứng skill nhẹ + nối PERF governor (từ bậc 3 giảm hiệu ứng) | `js/scene/*`, `js/world/perf*` | Chạy mượt trên mức PERF thấp | chưa |
| G2.7 | Mở khóa theo cấp (14: Skill 2, 20: Skill 3) + nhiệm vụ Hệ Phái nhập môn cấp 10 | `js/world/quests.js` | Test mở khóa đúng mốc; nhiệm vụ theo quy tắc `v-<id>` + `PLACE_STAND` | chưa |

### G3 — Hàng yêu (xong khi: thu phục và thanh tẩy được; có mốc Sổ Thu Phục)
| ID | Việc | File dự kiến | Xong khi | Trạng thái |
|---|---|---|---|---|
| G3.1 | Trạng thái "Dao Động" khi Oán Khí ≤ 25% (quầng xanh, chậm 3 giây); thu phục tự động khi về 0 (thưởng ×1, không Linh Ấn) | `js/world/capture.js`, test | Test chuyển trạng thái | chưa |
| G3.2 | Cảm Hóa chủ động: mini Niệm Chú 2–3 giây, tỉ lệ (nền 70%, +15% hệ khắc, +10% Phù Cảm Hóa, −5%/cấp quái cao hơn tối đa −25%, tối thiểu 20%), tối đa 3 lần thử | `js/world/capture.js`, `js/ui/hulo.js` | Test tỉ lệ; thành công ×1,5 thưởng | chưa |
| G3.3 | Hồ Lô: chứa 5 yêu, mở rộng 10/20 bằng cấp hoặc lá bồ đề; nối nút Hồ Lô | `js/world/hulo.js`, `js/ui/hulo.js` | Test sức chứa; lưu theo tài khoản | chưa |
| G3.4 | Quy Y Viện (kiến trúc cạnh Chánh Điện) + thanh tẩy 1 lần/ngày/ô → Điểm Công Đức, Linh Ấn, nguyên liệu | `js/scene/quyyvien.js`, `js/world/*` | Thanh tẩy được; nơi mới có nhiệm vụ `v-quyyvien` | chưa |
| G3.5 | Linh Ấn (10 cùng Hệ → Trứng hạng A) + Sổ Thu Phục (10/25/50 loài) | `js/world/sothuphuc.js`, test | Test mốc danh hiệu | chưa |
| G3.6 | Hai vùng đầu (Bìa Rừng Thông 3–20, Đường Mòn Đông–Tây 12–25): quái sinh cục bộ, tối đa ~12 con, hồi sinh 30–60 giây | `js/world/spawn.js`, `js/data/monsters.js` | Test spawn/hồi sinh; chơi thử 2 vùng | XONG (Phiên 106 logic; Phiên 107 nối cảnh 3D + nút + thưởng; CHƯA chơi thử trên trình duyệt thật) |

### G4 — Đủ vùng, nhiệm vụ, Pháp Môn (xong khi: chơi liền cấp 1 → 60 không bí đường)
| ID | Việc | Xong khi | Trạng thái |
|---|---|---|---|
| G4.1 | Vùng 3–4: Hồ Thác Đại Phật (25–45), Đồi Bảo Tháp (40–65); mỗi vùng có boss vùng (45 phút hồi sinh, chung phòng) | Mỗi vùng có nhiệm vụ ghé + PLACE_STAND + chương | chưa |
| G4.2 | Vùng 5–7: Rừng Thiêng Sâu, Vách Đá Đại Phật, Đỉnh Núi Bí Mật (phó bản để G7) | Như trên | chưa |
| G4.3 | Pháp Môn cấp 30 (10 Pháp Môn) + Skill 4 + đổi Pháp Môn/Hệ (lần đầu miễn phí) | Test Skill 4 + chi phí đổi | chưa |
| G4.4 | Tuyệt Học cấp 60 (5 Tâm Ấn, hồi 60 giây) + Tâm Ấn | Test tiêu Tâm Ấn | chưa |
| G4.5 | Nhiệm vụ: chính tuyến chương 2–4 theo mốc cấp; Hệ Phái (8 mỗi Hệ); hằng ngày +3; hằng tuần 4. Dùng đúng khung Dẫn Đường, thẻ "Việc kế tiếp" không bao giờ trống | Không có chỗ bí; test `nextGoal` | chưa |
| G4.6 | Điểm Linh Khí (mở rộng hoa sen vàng ra vùng farm) + Tự Động Hàng Yêu (tối đa 60 phút/ngày, dừng khi mở bảng/rời tab) | Test giới hạn thời gian | MỘT PHẦN (Phiên 108): Tự Động Hàng Yêu xong; Điểm Linh Khí chưa |

### G5 — Linh Thú (xong khi: một Linh Thú ấp xong, đánh cùng, cưỡi được)
| ID | Việc | Xong khi | Trạng thái |
|---|---|---|---|
| G5.1 | Dữ liệu Linh Thú + Ô Ấp Trứng (3 ô; A 6h, A+ 12h, S 24h giờ thật; giảm 10 phút/lần thiền/tụng, tối đa 5 lần/ngày) | Test thời gian ấp | chưa |
| G5.2 | Nuôi (No, Thân Thiết), xuất chiến (1 + 2 dự bị), thú "mệt" không chết | Test | chưa |
| G5.3 | Tiến hóa (thú cấp 30 / 60) + cộng hưởng Hệ (+8%) | Test | chưa |
| G5.4 | Mô hình Trâu Con của Bé Tí (hỏi ptg khi có mô hình; qua `tools/optimize-glb.mjs`) + Linh Thú khởi đầu | Có mô hình, ghi giấy phép | chưa |
| G5.5 | Cưỡi: chạy đất +30% (A+), bay cấp 91+ (S) | Cưỡi được | chưa |

### G6 — Thần Khí và trang bị (xong khi: có 1 Thần Khí bậc Linh; test cường hóa +16 đạt)
| ID | Việc | Xong khi | Trạng thái |
|---|---|---|---|
| G6.1 | 10 ô trang bị, 6 phẩm màu, bộ 5/10 món; thời trang là lớp riêng không chỉ số | Test bộ | chưa |
| G6.2 | Chuỗi Tầm Khí cấp 70 (5 nhiệm vụ qua 5 vùng) → Khí Phôi bậc Linh | Nhiệm vụ chạy được | chưa |
| G6.3 | Nâng bậc Phàm→Linh→Bảo→Thánh→Thần bằng mảnh từ Ma Tướng Hệ sinh ra Hệ mình | Test chi phí | chưa |
| G6.4 | Cường hóa +1…+16 (tỉ lệ TẠM, thất bại từ +13 tụt 1 cấp, không phá trang bị) + khảm Huyền Tinh (3 lỗ, 3→1 ghép) | Test +16 | chưa |
| G6.5 | Tràng Hạt 108 thành Pháp Bảo (mốc 10/50/200 vòng) | Test mốc | chưa |

### G7 — Đa người: Ma Tướng, Phó Bản, Thiền Phái (xong khi: 2 người cùng hạ một Ma Tướng, thưởng đúng)
| ID | Việc | Xong khi | Trạng thái |
|---|---|---|---|
| G7.1 | Boss chung qua Firebase: Oán Khí boss, gửi đóng góp mỗi 2 giây bằng transaction (≤ 4 lần ghi/giây hiện có) | Hai tab cùng đánh một boss | chưa |
| G7.2 | Thưởng theo đóng góp qua GAS (chống nhận lặp, trần sát thương/giây theo cấp) | Test thưởng, không nhận lặp | chưa |
| G7.3 | Cơ chế 3 pha Ngũ Ma Tướng (lịch tuần, theo câu 2) + Yếu Hệ + Ngũ Hành Hội Tụ | Test pha | chưa |
| G7.4 | Phó Bản Hộ Pháp dùng hạ tầng ZONE (lõi `js/world/zones.js` từ Phiên 81, **chưa nối vào game**) | Vào/ra zone đúng, 3 lượt/ngày | chưa |
| G7.5 | Thiền Phái (guild ≤ 30 người, cấp 40, 30 lá bồ đề): kho chung, công quả, xếp hạng; mở nút "Thiền phái" đang mờ | Tạo/vào phái được | chưa |
| G7.6 | Mất mạng: boss chuyển chế độ tập (không thưởng) thay vì báo lỗi | Test | chưa |

### G8 — Cân bằng và hoàn thiện
| ID | Việc | Xong khi | Trạng thái |
|---|---|---|---|
| G8.1 | Playtest đường cong EXP so với mục tiêu giờ chơi (cấp 10 ≈ 1h, 30 ≈ 8h, 60 ≈ 35h...) và chỉnh số liệu TẠM với ptg | ptg duyệt số | chưa |
| G8.2 | Trùng Sinh cấp 150 (tối đa 3 Kiếp, +3%/Kiếp, +50% Tu Vi cấp 1–100) — theo câu 4 có thể để bản sau | Test | chưa |
| G8.3 | Sự kiện lịch Âm (mùng 1 và rằm +50% Công Đức; Phật Đản, Vu Lan, Tết) dùng engine lịch có sẵn | Test | chưa |
| G8.4 | Hoàn thiện: tăng `VERSION` `sw.js`, cập nhật README, ảnh chụp, dọn file thừa | `npm test` xanh; Pages deploy xanh | chưa |

## D. Rủi ro đã biết
- GDD có hai bản hệ thống quái (máu/sát thương trong GDD cũ so với Oán Khí): chỉ dùng Oán Khí.
- Nút góc phải-dưới và menu đã đông (nhiều phiên đã chỉnh): G2.5 phải xem giao diện thật trước, không đoán.
- Tên Thần Khí/Pháp Môn lấy từ Phật giáo: nên nhờ người am hiểu duyệt trước G6.
- Nạp tiền thật (thùng công đức) đổi sức mạnh chiến đấu: **không làm** (GDD mục 13, câu 5); nên hỏi chuyên gia pháp lý.
