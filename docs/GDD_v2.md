# GDD v2 — Diệu Giang Tự 3D

Thiết kế lại theo game đang xây · 11/11/2026 · Soạn cho Giang. Căn cứ: GDD cũ + PROMPT.md / HANDOFF.md (repo duanchuaon, tới Phiên 82). Con số ghi (TẠM) là đề xuất, cần playtest và Giang duyệt.

> Kế hoạch triển khai chia mục nhỏ: `docs/KE_HOACH_GDD_V2.md`.

## 0. Tóm tắt

- Giữ hồn game: chùa Việt, Ngũ Hành, quái là “oán khí” được cảm hóa vào Hồ Lô (không giết, không máu), không hù dọa, không PvP.
- Thêm xương sống MMORPG kiểu Kiếm Thế: chọn Hệ (cấp 10) → Pháp Môn (cấp 30) → kỹ năng → farm theo vùng → săn boss → Thần Khí → Linh Thú → Thiền Phái.
- Hai tầng cấp song song: Tu Vi 1–150 (mới, chiến đấu) và Bậc Công Hạnh 1–10 (đã có, từ nhiệm vụ và tu tập). Không phá hệ nhiệm vụ hiện tại.
- Tái dùng hạ tầng sẵn có: hạt sen / lá bồ đề, 7 chương nhiệm vụ, Khinh thân 8 bậc, bồ đoàn (dùng để chọn Hệ), lịch Âm (sự kiện), ZONE (phó bản), Firebase (boss chung).
- Quyết định kỹ thuật chính: quái thường sinh cục bộ theo từng người (nhẹ máy, nhẹ mạng); chỉ boss dùng chung qua Firebase.
- Thuật ngữ: “Máu” của GDD cũ đổi thành Sinh Lực (người chơi) và Oán Khí (quái), đúng tinh thần không bạo lực.
- Lộ trình: 8 gói G1–G8 (mục 15), mỗi gói làm từng mục nhỏ. Mục 16 có 10 câu cần Giang chốt, đều có mặc định nên không chặn việc.

## 1. Đối chiếu: giữ / đổi / thêm

| Hạng mục | GDD cũ | Game hiện tại (theo nhật ký) | GDD v2 |
|---|---|---|---|
| Cấp độ | Cấp 1–150 | 10 bậc công hạnh, danh hiệu | Giữ bậc; thêm Tu Vi 1–150 |
| Quái | Hai bản mâu thuẫn (máu/sát thương vs oán khí) | Yêu quái gồng chiêu, ném đá + thương, hồi sinh ở cửa chùa | Chuẩn hóa: Oán Khí + Hồ Lô |
| Hệ phái | 5 Hệ Ngũ Hành | Chưa có | Hệ → Pháp Môn → Thiền Phái |
| Kỹ năng | 15 skill | Ném đá, thương, Khinh thân | Giữ 15; thêm 10 Skill 4 + 5 Tuyệt Học |
| Linh thú | Trứng A / A+ / S | Chưa có (con trâu Bé Tí chưa có mô hình) | Hệ thống đầy đủ |
| Thần khí | Trang bị Ngũ Hành | Chưa có | 5 Thần Khí + cường hóa |
| Đa người | Không nêu | Firebase + GAS, ~30 người/phòng | Boss chung qua Firebase |
| Tiền tệ | Lá Bồ Đề, Công Đức | Hạt sen, lá bồ đề, ngọc (HUD), thùng công đức | 5 loại, tách rõ nguồn/tiêu |

## 2. Vòng chơi lõi

- Ngắn (5–10 phút): nhận nhiệm vụ → đi tới vùng → hàng yêu 10–20 con → nhặt Linh Ấn, Huyền Tinh → về chùa thanh tẩy → Tu Vi + hạt sen.
- Giữa (30–60 phút): lên cấp mở khóa, boss vùng hoặc phó bản, ấp trứng, nâng Thần Khí.
- Dài (tuần/tháng): Ma Tướng luân phiên Ngũ Hành, Sổ Thu Phục, Thiền Phái, Trùng Sinh.
- Điểm khác biệt: hoạt động chùa là một phần của chiến đấu. Thiền hồi đầy Sinh Lực và cho buff “Tâm An” (+5% Tu Vi, 10 phút); tụng kinh trong nhóm cho buff chung; lạy Phật xóa trạng thái “oán nhiễm” (TẠM). Giữ không khí “bình an có thử thách”.

## 3. Cốt truyện và chương

Bối cảnh giữ nguyên: Diệu Giang Tự ẩn giữa núi, cạnh thác Đại Phật; linh khí suy kiệt, cây Bồ Đề héo, tà khí quấy nhiễu dân làng.

| Chương | Cấp Tu Vi | Nội dung | Mở khóa |
|---|---|---|---|
| 1. Bái Sư Tân Thủ | 1–9 | Chú Tiểu Minh dạy di chuyển, tưới cây Bồ Đề, thiền 3 phút với Trụ Trì (đã có). Cấp 5: Trụ Trì tặng Hồ Lô, thu phục Dã Mèo Rừng lần đầu | Võ Căn Bản, Khinh thân bậc 1, Hồ Lô |
| 2. Lễ Khai Ngộ Ngũ Hành | 10 | Chánh Điện: ngồi vào bồ đoàn của Hệ muốn chọn | Hệ, Skill 1 |
| 3. Thử Thách 8 Bậc Khinh Công | 11–90 | Cứu dân làng, hàng yêu, parkour; mỗi bậc 1 Dấu Ấn Cảnh Giới (≈ 10 cấp/bậc) | Skill 2–4, Pháp Môn, Linh Thú, Thần Khí |
| 4. Hộ Pháp Diệu Giang | 91–150 | Ma Tướng, Boss Hoàng Kim, khôi phục cây Bồ Đề cổ thụ | Linh Thú Bay, Tuyệt Học mạnh, Trùng Sinh |

Cây Bồ Đề trung tâm nở dần theo số Dấu Ấn của người chơi (8 nhánh). Tùy chọn: thêm một cây chung cho cả phòng, nở theo tổng công đức trong tuần.

## 4. Luyện cấp

### 4.1 Nguồn Tu Vi (EXP)

| Nguồn | Tỷ trọng mục tiêu | Ghi chú |
|---|---|---|
| Hàng yêu | 40% | EXP theo chênh lệch cấp quái và cấp mình |
| Nhiệm vụ | 30% | Chính tuyến, hệ phái, hằng ngày |
| Hoạt động chùa | 15% | Thiền, tụng, lạy; mỗi loại tính tối đa 5 lần/ngày |
| Boss, phó bản | 15% | Theo đóng góp |

Khám phá nơi mới lần đầu: thưởng nhỏ một lần (đã có nhiệm vụ ghé nơi).

### 4.2 Đường cong (TẠM)

- EXP để lên cấp kế = 30 × n^1,6: cấp 10 ≈ 1.200 · cấp 30 ≈ 6.900 · cấp 60 ≈ 21.000 · cấp 90 ≈ 40.000 · cấp 120 ≈ 64.000 · cấp 150 ≈ 91.000.
- Mục tiêu thời gian chơi tích lũy: cấp 10 ≈ 1 giờ · cấp 30 ≈ 8 giờ · cấp 60 ≈ 35 giờ · cấp 90 ≈ 90 giờ · cấp 150 ≈ 250 giờ. Cần playtest trước khi chốt.

### 4.3 Mốc mở khóa

| Cấp Tu Vi | Mở khóa |
|---|---|
| 1–9 | Võ Căn Bản (Thương cận chiến, Ném Đá tầm xa), Khinh thân bậc 1 |
| 5 | Hồ Lô, thu phục lần đầu |
| 10 | Lễ Khai Ngộ: chọn Hệ + Skill 1 |
| 14 | Skill 2 |
| 20 | Skill 3 (Trấn Phái) |
| 30 | Pháp Môn + Skill 4 |
| 40 | Thiền Phái, Phó Bản Hộ Pháp |
| 50 | Linh Thú xuất chiến, Ô Ấp Trứng |
| 60 | Tuyệt Học + Tâm Ấn |
| 70 | Chuỗi Tầm Khí (Thần Khí) |
| 90 | Đủ 8 Dấu Ấn |
| 91 | Cưỡi Linh Thú Bay |
| 100 | Đánh Ma Tướng cấp 100 đầy đủ |
| 150 | Trùng Sinh |

### 4.4 Trùng Sinh (cấp 150)

- Về cấp 1, giữ Thần Khí, Linh Thú, Sổ Thu Phục, nhà, hạt sen; chọn lại Hệ miễn phí.
- Mỗi Kiếp: +3% mọi chỉ số vĩnh viễn, khung danh hiệu “Kiếp N”, đổi màu hào quang. Tối đa 3 Kiếp (TẠM).
- Kiếp sau lên nhanh hơn: +50% Tu Vi ở cấp 1–100.

## 5. Hệ phái

### 5.1 Ba tầng

- Hệ (cấp 10): 5 Hệ Ngũ Hành, quyết định bộ kỹ năng và vai trò.
- Pháp Môn (cấp 30): mỗi Hệ có 2 nhánh chuyên sâu, tổng 10 Pháp Môn.
- Thiền Phái (cấp 40): nhóm người chơi (guild), mục 5.7.

### 5.2 Lễ Khai Ngộ (cấp 10)

Trụ Trì mời vào Chánh Điện; năm bồ đoàn sáng lên theo màu năm Hệ. Người chơi ngồi vào bồ đoàn để chọn (tái dùng hệ thống bồ đoàn đã có). Có 60 giây dùng thử Skill 1 của Hệ trước khi xác nhận.

### 5.3 Năm Hệ

| Hệ | Vai trò | Điểm mạnh | Điểm yếu | Khắc / bị khắc |
|---|---|---|---|---|
| Kim | Tiên phong, chống chịu | Giáp cao, phản đòn, choáng | Chậm, tầm gần | Khắc Mộc / bị Hỏa khắc |
| Mộc | Sát thương tầm xa, ám sát | Độc, tàng hình, tốc độ | Sinh Lực thấp | Khắc Thổ / bị Kim khắc |
| Thủy | Hồi phục, khống chế | Hồi Sinh Lực, đóng băng, hỗ trợ đội | Sát thương thấp | Khắc Hỏa / bị Thổ khắc |
| Hỏa | Sát thương bùng nổ diện rộng | Chí mạng cao | Mong manh | Khắc Kim / bị Thủy khắc |
| Thổ | Phòng thủ, kiểm soát vùng | Khiên đá, trọng lực | Sát thương chậm | Khắc Thủy / bị Mộc khắc |

### 5.4 Tương sinh – tương khắc

- Tương khắc: Kim → Mộc → Thổ → Thủy → Hỏa → Kim. Đánh trúng hệ bị khắc ×1,3; đánh trúng hệ khắc mình ×0,8 (TẠM).
- Tương sinh: Kim → Thủy → Mộc → Hỏa → Thổ → Kim. Đồng đội thuộc Hệ sinh ra Hệ của mình, đứng trong 10 m: +5% sát thương mỗi người, tối đa +10% (TẠM).
- Nhóm đủ 5 Hệ: buff “Ngũ Hành Hội Tụ” +10% mọi chỉ số (TẠM).

### 5.5 Mười Pháp Môn và Skill 4 (cấp 30)

| Hệ | Pháp Môn | Vai trò | Skill 4 |
|---|---|---|---|
| Kim | Kim Cang Môn | Chống chịu thuần | Bất Hoại Kim Thân: 4s giảm 30% sát thương, miễn khống chế; hồi chiêu 30s |
| Kim | Thiết Kỵ Môn | Cận chiến xung phong | Phá Trận Trảm: chém xuyên 220%, giảm giáp 15% trong 6s; hồi chiêu 14s |
| Mộc | U Minh Môn | Độc, sát thương theo thời gian | Độc Vụ Lan Tỏa: độc lan sang quái trong 5 m; hồi chiêu 16s |
| Mộc | Ẩn Thân Môn | Ám sát, bùng nổ | Lạc Diệp Truy Hồn: lao ra sau lưng, 250% (400% nếu đang ẩn thân); hồi chiêu 15s |
| Thủy | Cam Lộ Môn | Hồi phục, hỗ trợ đội | Thanh Tâm Chú: hồi 15% Sinh Lực tối đa cả đội trong 6 m, xóa debuff; hồi chiêu 24s |
| Thủy | Huyền Băng Môn | Khống chế | Hàn Băng Tỏa: trói 1 mục tiêu 3s + 120%; hồi chiêu 14s |
| Hỏa | Liệt Hỏa Môn | Diện rộng | Bạo Liệt Hỏa Vũ: mưa lửa 8 m trong 4s, 60%/s; hồi chiêu 20s |
| Hỏa | Hỏa Long Môn | Đơn mục tiêu, săn boss | Long Tức Trảm: nạp 2s rồi bắn tia 500%; hồi chiêu 18s |
| Thổ | Đại Địa Môn | Khiên cho đội | Thạch Giáp Trấn Phái: mỗi đồng đội có khiên 15% Sinh Lực tối đa trong 8s; hồi chiêu 28s |
| Thổ | Hư Không Môn | Kiểm soát vùng | Dẫn Lực Địa Mạch: kéo quái trong 8 m về tâm, choáng 1s; hồi chiêu 22s |

### 5.6 Đổi Hệ / Pháp Môn (TẠM)

- Đổi Pháp Môn: lần đầu miễn phí, các lần sau 1 lá bồ đề.
- Đổi Hệ (“Tái Khai Ngộ”): 20 lá bồ đề, giữ Tu Vi, kỹ năng về cấp 1.

### 5.7 Thiền Phái (guild)

- Tối đa 30 người (khớp giới hạn phòng hiện tại). Tạo cần cấp 40 và 30 lá bồ đề (TẠM).
- Phái Đài dựng trên lô đất chung (tái dùng hệ thống xây nhà); kho chung, nhiệm vụ công quả chung, buff phái nhỏ, Bảng Xếp Hạng Phái.
- Nút “Thiền phái” trong menu dưới (hiện đang mờ) sẽ mở tại đây.

## 6. Kỹ năng

### 6.1 Cấu trúc thanh kỹ năng

- Đánh thường: Thương (cận) hoặc Ném Đá (xa), đã có. Mỗi đòn trúng +1 Tâm Ấn (tối đa 5).
- 5 ô Skill (1–5): chỉ dùng hồi chiêu, không có thanh nội lực để dễ chơi trên điện thoại.
- Tuyệt Học (cấp 60): tốn 5 Tâm Ấn, hồi chiêu 60s.
- Ngoài ra: Khinh công (nhảy nhiều tầng theo bậc), Hồ Lô, Tương tác.

### 6.2 Mười lăm skill gốc (giữ GDD cũ)

| Hệ | Skill 1 (chủ động) | Skill 2 (buff) | Skill 3 (Trấn Phái) |
|---|---|---|---|
| Kim | Kim Cương Trảm: 150%, 30% choáng 2s; hồi 6s | Hộ Thân Cương Khí: +20% giáp, phản 10% cận chiến, 10s; hồi 20s | Thiết Kỵ Xung Trận: lao 10 m, 300% diện rộng, hất văng; hồi 15s |
| Mộc | U Minh Độc Tiễn: 3 phi đao 100% + độc 20%/s trong 6s; hồi 5s | Ẩn Thân Thuật: tàng hình 4s, +30% tốc chạy, đòn đầu chí mạng 200%; hồi 12s | Vạn Độc Quy Tâm: sương độc bán kính 8 m, chậm 40%, mòn 5%/s trong 6s; hồi 20s |
| Thủy | Huyền Băng Chưởng: 130% băng, chậm 50% trong 4s; hồi 6s | Cam Lộ Hộ Thể: hồi 25% Sinh Lực trong 5s, bị đánh thì có khiên băng; hồi 25s | Băng Phong Thiên Lý: đóng băng mọi quái trong 10 m, 3s; hồi 22s |
| Hỏa | Liệt Hỏa Chưởng: 180%, nổ lan 4 m; hồi 7s | Cuồng Long Phẫn Nộ: +40% chí mạng, +25% tốc đánh, 8s; hồi 18s | Hỏa Long Xuất Hải: 450% trên đường rồng, thiêu 3s; hồi 25s |
| Thổ | Địa Sách Chưởng: 140%, choáng 1,5s; hồi 6s | Đại Địa Chi Khiên: hấp thụ 30% Sinh Lực tối đa trong 10s; hồi 20s | Hư Không Trận: vùng trọng lực chậm 60% + sát thương liên tục 6s; hồi 24s |

### 6.3 Năm Tuyệt Học (cấp 60, TẠM)

| Hệ | Tuyệt Học | Hiệu ứng |
|---|---|---|
| Kim | Kim Cang Phục Ma | 5s bất khả xâm phạm, cuối chiêu nổ lại 50% sát thương đã chịu |
| Mộc | Vạn Diệp Quy Tâm | 12 lá đao bay quanh 6s, mỗi lá 80%, ẩn thân suốt thời gian chiêu |
| Thủy | Cam Lộ Triều Âm | Sóng nước 12 m: hồi 40% Sinh Lực đồng đội, chậm quái 50% trong 5s |
| Hỏa | Liên Hoa Hỏa Thế | 9 đóa sen lửa nổ liên hoàn, mỗi đóa 100% diện rộng |
| Thổ | Thái Sơn Áp Đỉnh | Núi nhỏ giam quái trong 8 m, choáng 3s + 400% |

### 6.4 Cấp kỹ năng và công thức

- Cấp skill 1–10, mỗi cấp +6% hệ số; cấp tối đa = Tu Vi ÷ 10 (làm tròn xuống, tối đa 10). Nâng bằng điểm dùng skill + hạt sen (TẠM).
- Sát thương = Công × Hệ số skill × (1 + Cường hóa) × K_hệ × 100 ÷ (100 + Thủ đối thủ). K_hệ = 1,3 / 1 / 0,8. Chí mạng ×1,5.
- Khinh công trong chiến đấu: bậc N cho N lần nhảy liên hoàn, hồi 3s (giữ GDD cũ). Dùng để né vòng đỏ của boss.

## 7. Thu phục quái (Hàng Yêu)

### 7.1 Nguyên lý (giữ GDD cũ)

Thanh Oán Khí của quái giảm dần khi bị đánh; về 0 thì quái hóa ánh sáng tâm linh, thu nhỏ rồi bay vào Hồ Lô. Không máu, không xác.

### 7.2 Cảm Hóa chủ động (mới)

1. Giao tranh làm giảm Oán Khí.
2. Khi Oán Khí ≤ 25%, quái “Dao Động”: quầng sáng xanh, chậm lại 3s.
3. Bấm Hồ Lô: mini “Niệm Chú” 2–3s (giữ nút hoặc gõ theo nhịp mõ).
4. Thành công: thưởng ×1,5 và có cơ hội rơi Linh Ấn. Thất bại: quái bừng Oán Khí hồi 10% và gồng một chiêu; tối đa 3 lần thử mỗi quái.
5. Nếu để Oán Khí về 0: vẫn thu phục tự động, thưởng ×1, không rơi Linh Ấn.

Tỷ lệ thành công (TẠM): nền 70%; +15% nếu dùng skill hệ khắc quái; +10% nếu có Phù Cảm Hóa; −5% cho mỗi cấp quái cao hơn mình (tối đa −25%); tối thiểu 20%.

### 7.3 Hồ Lô và Quy Y Viện

- Hồ Lô chứa 5 yêu, mở rộng lên 10 và 20 bằng cấp hoặc lá bồ đề.
- Quy Y Viện (cạnh Chánh Điện): đưa yêu đã thu về chùa “tu tâm”, mỗi ô thanh tẩy 1 lần/ngày, đổi lấy Điểm Công Đức, Linh Ấn, nguyên liệu. Tạo lý do quay về chùa sau mỗi chuyến farm.

### 7.4 Linh Ấn và Sổ Thu Phục

- Linh Ấn: 10 Linh Ấn cùng Hệ đổi 1 Trứng Linh Thú hạng A, chắc chắn, không quay số.
- Sổ Thu Phục: thu đủ 10 / 25 / 50 loài nhận danh hiệu, Huyền Tinh, thời trang.

## 8. Farm quái: bản đồ vùng

| Vùng | Cấp | Hệ | Quái thường / tinh anh | Boss vùng | Rơi nổi bật |
|---|---|---|---|---|---|
| Bìa Rừng Thông | 3–20 | Mộc | Dã Mèo Rừng (3), Rêu Tinh (10) | Lão Mộc Tinh (20) | Linh Ấn Mộc, Huyền Tinh 1–2 |
| Đường Mòn Đông–Tây | 12–25 | Kim | Đạo Tặc Sơn Cước (15), Cướp Đường (22) | Sơn Cước Đầu Mục (25) | Linh Ấn Kim, đá cường hóa lam |
| Hồ Thác Đại Phật | 25–45 | Thủy | Thủy Quỷ Hồ Thác (28), Lý Ngư Tinh (38) | Thủy Mẫu Hồ Thác (45) | Linh Ấn Thủy, Huyền Tinh 3–4 |
| Đồi Bảo Tháp | 40–65 | Thổ | Thạch Tinh Khổng Lồ (45, đi cùng 3 quái nhỏ), Hộ Tháp Thạch Nhân (58) | Thạch Linh Hộ Tháp (65) | Linh Ấn Thổ, Huyền Tinh 5–6 |
| Rừng Thiêng Sâu | 60–80 | Mộc | Mộc Tinh Cổ Thụ (65) | U Mộc Xà Vương (70) | Linh Ấn Mộc, Huyền Tinh 7–8 |
| Vách Đá Đại Phật | 85–110 | Hỏa, Kim | Hỏa Diệm Quỷ (90), Kim Thiết Hộ Pháp Ma (95) | Hỏa Thần Ma Tướng (100, World Boss) | Linh Ấn Hỏa/Kim, Huyền Tinh 9–10 |
| Đỉnh Núi Bí Mật | 110–150 | Hỗn hợp | Phó bản Bí Cảnh Bồ Đề (dùng ZONE) | Hoàng Kim Ma Vương (150) | Mảnh Thần Khí, Huyền Tinh 11–12 |

Quy tắc farm:

- Quái thường sinh cục bộ theo từng người, không đồng bộ mạng; tối đa ~12 con/vùng cùng lúc; hồi sinh 30–60s. Tinh anh 5 phút. Boss vùng 45 phút, dùng chung cả phòng.
- Điểm Linh Khí: mở rộng hoa sen vàng (đã có) ra vùng farm, 30 phút xuất hiện 1 lần, nhặt được +50% Tu Vi trong 5 phút.
- Tự Động Hàng Yêu (tùy chọn): tự xoay skill trong tầm 15 m, dừng khi mở bảng hoặc rời tab; tối đa 60 phút/ngày (TẠM).
- Hết Sinh Lực: hồi sinh ở cửa chùa (giữ quy tắc đã chốt), không mất đồ, không mất cấp.

## 9. Săn boss

### 9.1 Các loại boss

| Loại | Hình thức | Lịch | Người | Cơ chế chính |
|---|---|---|---|---|
| Boss Vùng (5 con) | Ngoài trời, chung phòng | Hồi sinh 45 phút | 1–6 | 1–2 chiêu báo hiệu bằng vòng đỏ |
| Ngũ Ma Tướng (World Boss) | Chung cả phòng qua Firebase | Mỗi tuần một con, luân phiên Hệ (hiện đang hằng tháng, xem câu hỏi 2) | 10–30 | 3 pha, Yếu Hệ, Ngũ Hành Hội Tụ |
| Phó Bản Hộ Pháp | Instance riêng (ZONE) | 3 lượt/ngày | 3–5 | Phân vai chống chịu / hồi / sát thương |
| Hoàng Kim Ma Vương | Chung cả phòng | Hằng tháng và ngày lễ lớn | 15–30 | Cuối chương 4, cả 5 Hệ phối hợp |

### 9.2 Ngũ Ma Tướng ứng Ngũ Độc (đề xuất)

Kim Thần Ma Tướng (Tham) · Mộc Thần Ma Tướng (Nghi) · Thủy Thần Ma Tướng (Si) · Hỏa Thần Ma Tướng (Sân, đã có, cấp 100) · Thổ Thần Ma Tướng (Mạn). Mỗi con trấn một vùng; thu phục thành công là “gột rửa” độc ấy, vùng sáng lên và Bảng Vàng khắc tên người tham gia.

### 9.3 Cơ chế trận đánh (mở rộng từ Hỏa Thần Ma Tướng cũ)

- Oán Khí 5 thanh (GDD cũ: 500.000, sát thương 1.200); tổng chia theo số người tham gia (TẠM).
- Pha 1: chém quạt 180° trước mặt.
- Pha 2 (còn 2 thanh): cơ chế riêng của từng con. Hỏa: mưa lửa toàn bản đồ, vòng đỏ báo hiệu, né bằng Khinh công nhảy cao hoặc dập lửa bằng skill Thủy (giữ GDD cũ). Kim: giáp vàng chỉ vỡ bằng đòn Hỏa. Mộc: dây leo, cần Kim chặt. Thủy: vùng trượt băng, cần Thổ chặn. Thổ: đá rơi, cần Mộc xuyên. Luôn có một Hệ “khắc” là chìa khóa.
- Pha 3 (còn 1 thanh) “Dao Động”: cửa sổ Khai Ngộ Cơ 10s. Nếu cả 5 Hệ tung Skill 3 trong 5s thì kích “Ngũ Hành Hội Tụ”, boss vào Cảm Hóa; trượt thì boss gồng lại.
- Thu phục: thành công thì Ma Tướng hóa quang vào Hồ Lô thiêng, vùng trở lại thanh tịnh.

### 9.4 Thưởng theo đóng góp (TẠM)

| Xếp hạng đóng góp | Thưởng |
|---|---|
| Top 3 | 1 mảnh Thần Khí chắc chắn + Rương Công Đức vàng |
| Top 10 | Rương Công Đức bạc + tăng 50% cơ hội rơi mảnh |
| Từ 1% đóng góp | Rương bạc |
| Có tham gia (≥ 1 đòn, ở trong vùng) | Rương đồng + Tu Vi |
| Thu phục thành công | Cả phòng nhận Linh Ấn Ma Tướng, tên lên Bảng Vàng |

Lá bồ đề rơi dưới đất vẫn theo luật “ai nhanh tay nhặt” đã chốt, nhưng phần thưởng chính nằm ở rương theo đóng góp để không ai trắng tay.

### 9.5 Kỹ thuật chung

- Oán Khí boss nằm ở Firebase; mỗi client gom sát thương và gửi mỗi 2 giây bằng transaction (nằm trong giới hạn ≤ 4 lần ghi/giây hiện có). Mỗi người ghi tổng đóng góp riêng.
- Thưởng: GAS đọc bảng đóng góp sau trận rồi phát qua sheet (chống nhận lặp); đặt trần sát thương/giây theo cấp để chặn gian lận đơn giản.
- Không có PvP và không bán sức mạnh bằng tiền nên chấp nhận mức tin cậy client vừa phải.

## 10. Thần Khí và trang bị

### 10.1 Mười ô trang bị

Vũ khí / Thần Khí · Nón · Áo · Găng · Giày · Đai · Tràng Hạt · Nhẫn · Ngọc Bội · Hộ Phù. Sáu phẩm màu: Trắng – Lục – Lam – Tím – Cam – Đỏ. Mặc đủ 5 hoặc 10 món cùng bộ kích hoạt dòng ẩn Ngũ Hành (giữ GDD cũ). Thời trang (áo polo 9 Sạch…) là lớp riêng, không có chỉ số.

### 10.2 Năm Thần Khí

| Thần Khí | Hệ | Nội tại ở bậc Thánh (TẠM) |
|---|---|---|
| Kim Cang Xử | Kim | +15% giáp; mỗi 8s đòn kế tiếp là “Hàng Ma”: 200% + choáng 1s |
| Dương Liễu Chi | Mộc | Độc +25% sát thương; thu phục thành công hồi 10% Sinh Lực |
| Tịnh Bình Cam Lộ | Thủy | Hồi phục +20%; mỗi 12s để lại vũng Cam Lộ 4 m, hồi 3%/s trong 5s |
| Pháp Luân Chuyển Hỏa | Hỏa | Chí mạng +10%; mỗi đòn chí mạng bắn Hỏa Luân 120% nổ nhỏ |
| Tích Trượng Địa Tạng | Thổ | Khiên +20%; Sinh Lực dưới 30% tự dựng khiên hấp thụ 25% Sinh Lực tối đa (hồi 60s) |

### 10.3 Cách có và nâng bậc

Năm bậc: Phàm → Linh → Bảo → Thánh → Thần.

- Cấp 70: chuỗi “Tầm Khí” (5 nhiệm vụ khám phá qua 5 vùng) cho Khí Phôi, bậc Linh.
- Nâng bậc cần mảnh Thần Khí từ Ma Tướng thuộc Hệ sinh ra Hệ của mình (Kim cần Thổ, Mộc cần Thủy, Hỏa cần Mộc, Thổ cần Hỏa, Thủy cần Kim). Buộc người chơi hợp tác với Hệ khác.
- Chi phí mỗi bậc (TẠM): Linh→Bảo 10 mảnh, Bảo→Thánh 20, Thánh→Thần 40; kèm Huyền Tinh và hạt sen.
- Ở +10: Thức Tỉnh Khí Linh mở nội tại; bậc Thần mở dòng “Thần Uy”.

### 10.4 Cường hóa và khảm

- Đá cường hóa (Lam → Cam) dùng tại Thợ Rèn, +1 → +16 (giữ GDD cũ). Tỷ lệ (TẠM): +1–8: 100%; +9–12: 75 / 60 / 50 / 40%; +13–16: 30 / 25 / 20 / 15%. Thất bại mất đá; từ +13 tụt 1 cấp; không bao giờ phá hủy trang bị.
- Huyền Tinh (cấp 1–12): khảm 3 lỗ mỗi ô; 3 viên cấp n ghép thành 1 viên cấp n+1.

### 10.5 Tràng Hạt 108 thành Pháp Bảo

Tràng hạt đã có (hoạt động lần hạt) thành ô “Tràng Hạt”: số vòng lần hạt tích lũy mở bậc ở 10 / 50 / 200 vòng, mỗi bậc cộng chỉ số nhỏ và đổi hào quang. Nối hoạt động chùa với sức mạnh mà không ép người chơi chỉ cày quái.

## 11. Linh Thú

| Hạng | Nguồn | Ví dụ | Kỹ năng thú | Cưỡi |
|---|---|---|---|---|
| A (trứng tím) | 10 Linh Ấn cùng Hệ; hoặc rơi hiếm từ quái thường | Hạc Trắng, Rùa Vàng, Sư Tử Đá Con, Trâu Con của Bé Tí | 1 | Không |
| A+ (trứng cam) | Boss vùng, phó bản, 30 mảnh trứng | Hươu Thần, Bạch Hổ Con | 2 | Chạy đất (+30% tốc) |
| S (trứng cam, hiếm) | 100 Linh Ấn Ma Tướng (nhận khi thu phục Ma Tướng thành công) | Nghê, Phượng Hoàng, Rồng | 3 | Bay (cấp 91+) |

- Vai trò: 1 thú xuất chiến, 2 dự bị. Thú tự đánh nhẹ và tung kỹ năng riêng; không bao giờ “chết”, chỉ “mệt” (nghỉ 60s rồi quay lại).
- Ấp trứng: 3 ô; hạng A 6 giờ, A+ 12 giờ, S 24 giờ (giờ thực, TẠM). Thiền hoặc tụng kinh cạnh ô ấp giảm 10 phút mỗi lần (tối đa 5 lần/ngày), gắn Linh Thú với hoạt động chùa.
- Nuôi: hai chỉ số No và Thân Thiết (0–100); Thức Ăn Linh Thú tăng cả hai; Thân Thiết 100 cho +10% chỉ số thú.
- Tiến hóa: Ấu → Trưởng thành (thú cấp 30, Thân Thiết từ 50) → Chân Thân (thú cấp 60, Huyền Tinh + Linh Ấn cùng Hệ).
- Cộng hưởng: thú thuộc Hệ sinh ra Hệ của chủ: +8% sát thương cho chủ.
- Khác với yêu trong Hồ Lô: yêu được “tu tâm” ở Quy Y Viện; Linh Thú là bạn đồng hành riêng, có tên, hình và kỹ năng.
- Gợi ý: con “Trâu Con” của Bé Tí (đang chờ mô hình) làm Linh Thú khởi đầu, nhận ở cuối chuỗi nhiệm vụ dân làng.

## 12. Nhiệm vụ

| Loại | Số lượng | Thưởng chính | Ghi chú |
|---|---|---|---|
| Chính tuyến (4 chương) | ~60 | Tu Vi, Dấu Ấn, lá bồ đề | Có Dẫn Đường; chương 1 đã làm |
| Hệ Phái | 8 mỗi Hệ + 2 chuỗi Pháp Môn | Skill, Pháp Môn, Tuyệt Học | Cá nhân; mở ở cấp 10 / 30 / 60 |
| Hằng ngày | 5 đã có + 3 mới | Hạt sen, Tu Vi | Mới: hàng yêu 10 con, hạ 1 boss vùng, chăm Linh Thú |
| Hằng tuần | 4 | Huyền Tinh, mảnh Thần Khí | Ma Tướng tuần; 3 lượt phó bản; Sổ Thu Phục +5 loài; công quả Thiền Phái |
| Khám phá | Đã có | Tu Vi nhỏ | Mỗi nơi mới phải có nhiệm vụ ghé, điểm đứng và nằm trong một chương (quy ước hiện có) |
| Lễ / sự kiện | Theo lịch Âm (engine sẵn có) | Công Đức, thời trang | Mùng 1 và rằm: +50% Công Đức, Ma Tướng tăng thưởng; Phật Đản, Vu Lan, Tết có chuỗi riêng |
| Thành tựu | — | Danh hiệu, thời trang | Sổ Thu Phục, 8 Dấu Ấn, Kiếp Trùng Sinh |

- Dùng đúng khung hiện có: nút Dẫn Đường nhấp nháy, bong bóng chỉ chỗ bấm, thẻ “Việc kế tiếp” không bao giờ trống, để người chưa rành vẫn chơi được.
- Nhiệm vụ Hệ Phái là thử thách nhập môn ngay trên cảnh thật. Ví dụ: Kim “Giữ Cổng” (đứng vững 60s trước 10 Đạo Tặc); Mộc “Hái Thảo Dược” (rừng thông, né cỏ độc); Thủy “Dẫn Dòng Cam Lộ” (hồi cho 3 dân làng); Hỏa “Thắp Đèn Bảo Tháp” (thắp đủ trước khi hết giờ); Thổ “Dựng Lại Kè Đá” (bờ thác).

## 13. Kinh tế và tiền tệ

| Tiền | Kiếm | Tiêu | Ghi chú |
|---|---|---|---|
| Hạt Sen | Thiền, tụng, nhiệm vụ, hàng yêu, thùng công đức (nhận trong 24 giờ) | Thời trang, nhà, nội thất, tiện ích | 10 hạt = 1 lá bồ đề (đã chốt) |
| Lá Bồ Đề | Đổi từ hạt sen, boss rơi, nhiệm vụ lớn | Đất (100 lá), đổi Pháp Môn / Hệ, mở ô Hồ Lô và túi, lập Thiền Phái | Không đổi ngược về hạt sen |
| Điểm Công Đức | Hoạt động chùa, thu phục, thanh tẩy | Không tiêu: dùng cho xếp hạng và danh hiệu | Bảng Vàng |
| Huyền Tinh (1–12) | Quái, boss, phó bản | Khảm, cường hóa, nâng Thần Khí | Ghép 3 → 1 |
| Linh Ấn / Mảnh | Thu phục, boss | Trứng Linh Thú, nâng Thần Khí | Số lượng cố định, không quay số |
| Ngọc | HUD đã có (đang 0) | Đề xuất: tiền sự kiện lễ, không bán | Cần chốt (câu 5) |

Nguyên tắc tách bạch sức mạnh: sức mạnh chiến đấu (Tu Vi, kỹ năng, Thần Khí, Linh Thú) chỉ kiếm bằng chơi. Hạt sen và lá bồ đề mua nhà, thời trang, tiện ích. Lý do: giữ không khí chùa (công đức không “mua” được) và giảm rủi ro pháp lý. Nếu cho tiền thật (thùng công đức) đổi ra thứ ảnh hưởng sức mạnh trong game online ở Việt Nam, nên hỏi chuyên gia pháp lý trước; tôi không phải luật sư.

## 14. Giao diện và kỹ thuật

### 14.1 Điều khiển

- PC: WASD di chuyển, Space Khinh công, 1–5 Skill, Q Tuyệt Học, E Hồ Lô, F Tương tác, Tab chọn mục tiêu gần nhất, chuột phải xoay camera.
- Mobile: joystick trái; cụm nút phải-dưới gồm Đánh thường (lớn), 5 Skill, Tuyệt Học, Hồ Lô, Khinh công, Tương tác. Tự khóa mục tiêu gần nhất. Giữ quy tắc đã có: nút không chồng nhau, nhấn giữ để xem tên, có bong bóng chỉ chỗ bấm khi mở khóa kỹ năng mới.
- HUD chiến đấu: khung mục tiêu (tên, cấp, Hệ, Oán Khí), Sinh Lực, Tâm Ấn 0–5, thanh skill, nút Dẫn Đường.

### 14.2 Kỹ thuật

- Mỗi hệ thống là một module logic thuần có test (đúng quy ước repo); số liệu nằm trong file dữ liệu riêng, đánh dấu TẠM. Đề xuất: js/world/{stats,combat,skills,monsters,capture,pets,artifacts}.js, js/data/{skills,monsters,items}.json, js/ui/{combat,hulo,pets,artifacts}.js. (Kế hoạch Phiên 98 đề xuất dùng module .js thay .json cho dữ liệu, xem docs/KE_HOACH_GDD_V2.md mục B.)
- Mạng: Firebase chỉ cho vị trí người, chat và boss chung; phần còn lại chạy cục bộ rồi lưu GAS (tài khoản tên + mật khẩu đã có) khi đổi vùng và mỗi 60 giây.
- Hiệu năng: nối với PERF governor sẵn có; từ bậc 3 giảm hiệu ứng skill; quái thường tối đa ~12 con/vùng; boss chỉ 1 mô hình + 1 vòng cảnh báo.
- Mất mạng: boss chung chuyển sang chế độ tập (không thưởng) thay vì báo lỗi.

## 15. Lộ trình triển khai

| Gói | Nội dung | Xong khi |
|---|---|---|
| G1 | Lõi chiến đấu: chỉ số, Tu Vi 1–150, thanh Sinh Lực / Oán Khí, Võ Căn Bản chuẩn hóa | Đánh Dã Mèo Rừng lên cấp 5; test công thức đạt |
| G2 | Hệ phái: Lễ Khai Ngộ (ngồi bồ đoàn), 15 skill, thanh skill, tương khắc | Chọn được 5 Hệ; mỗi Hệ dùng đủ 3 skill; K_hệ đúng |
| G3 | Hàng yêu: Cảm Hóa, Hồ Lô, Quy Y Viện, Sổ Thu Phục, 2 vùng đầu | Thu phục và thanh tẩy được; có mốc Sổ Thu Phục |
| G4 | Đủ 7 vùng, boss vùng, nhiệm vụ Hệ Phái và hằng ngày mới, Tự Động Hàng Yêu | Chơi liền cấp 1 → 60 không bí đường |
| G5 | Linh Thú: ấp trứng, Linh Ấn, nuôi, xuất chiến, cưỡi bay | Một Linh Thú ấp xong, đánh cùng, cưỡi được |
| G6 | Thần Khí và trang bị: 10 ô, Tầm Khí, cường hóa, khảm, Tràng Hạt | Có 1 Thần Khí bậc Linh; test cường hóa +16 đạt |
| G7 | Ma Tướng đa người (Firebase), Phó Bản (ZONE), Thiền Phái | 2 người cùng hạ một Ma Tướng, thưởng đúng |
| G8 | Cân bằng, playtest, Trùng Sinh, sự kiện lịch Âm | Đường cong EXP khớp mục tiêu giờ chơi |

Mỗi gói tách thành các mục nhỏ: làm một mục, đẩy lên, báo, chờ Giang nói “tiếp tục” (quy tắc đã chốt từ Phiên 18). Mọi mục giữ npm test xanh và không phá tính năng cũ. Gợi ý mục đầu tiên: G1 module chỉ số + Tu Vi (logic thuần, chưa đụng giao diện).

## 16. Mười câu cần Giang chốt (đều có mặc định)

1. PvP: có không? Mặc định: không.
2. Lịch Ma Tướng: hằng tuần luân phiên hay giữ hằng tháng (Phiên 65)? Mặc định: hằng tuần.
3. Ngũ Ma Tướng ứng Ngũ Độc (mục 9.2): dùng không? Mặc định: dùng.
4. Cấp tối đa 150 (~250 giờ): giữ hay thấp hơn? Mặc định: mở tới 100 trước, 101–150 ở bản sau.
5. Hạt sen / lá bồ đề / ngọc có được mua sức mạnh chiến đấu không? Mặc định: không (mục 13).
6. Thùng công đức: tỉ lệ 1.000đ = 1 hạt sen (Phiên 80 đang tạm) và trần nạp mỗi ngày. Mặc định: giữ tỉ lệ, thêm trần theo ngày.
7. Tự Động Hàng Yêu 60 phút/ngày: có không? Mặc định: có.
8. Trùng Sinh tối đa 3 Kiếp: giữ không? Mặc định: giữ.
9. Trâu Con của Bé Tí làm Linh Thú khởi đầu? Mặc định: có.
10. Quái thường sinh cục bộ theo từng người (không đồng bộ): chấp nhận? Mặc định: chấp nhận.

## 17. Ghi chú về nguồn và rủi ro

- Đã đọc: README, PROMPT.md (nhật ký tới Phiên 82), HANDOFF.md (đọc được tới khoảng Phiên 13). Chưa mở: mã trong js/, docs/PHIEN62–67 (chiến đấu, sức mạnh, yêu quái hằng tháng) và docs/PHIEN81 (ZONE). Cột “Game hiện tại” ở mục 1 dựa vào nhật ký, cần đối chiếu trước khi code G1.
- Mô tả repo duanchuaon ghi “trang web hiển thị lợi nhuận kinh doanh 9 Sạch” trong khi nội dung là Diệu Giang Tự; PROMPT.md ghi repo chính là loinhuan.github.io (ptg đã xác nhận 2026-11-10: đổi sang repo duanchuaon). Nên đổi mô tả repo cho đúng.
- Tên quái, Pháp Môn, Thần Khí, Linh Thú là đề xuất của tôi, bám tên đã có trong GDD cũ. Mọi con số cần playtest.
- Tên Thần Khí lấy từ pháp khí Phật giáo (Kim Cang Xử, Tịnh Bình, Tích Trượng Địa Tạng…); nên nhờ người am hiểu duyệt để dùng đúng và tôn kính, cùng với lời kinh đã có.
