# LINH GIANG TỰ— Web tâm linh 3D trên Google Apps Script
Kế hoạch cấu trúc, thiết kế chi tiết và bộ prompt tạo web

---

## PHẦN A. NHẬN XÉT TRANG THAM KHẢO (KAGE) VÀ CÁCH ÁP DỤNG
THAM KHẢO NHƯNG LẤY BỐI CẢNH TỪ CHÙA CỦA VIỆT NAM
Trang Kage là một trang cuốn (scroll-driven) gồm:
- Một canvas WebGL cố định toàn màn hình (three.js), camera chạy dọc theo đường cong qua 6 điểm mốc (`CAM[]`), mỗi section HTML ứng với một điểm mốc (`data-cam`).
- Cuộn trang → `progressFor(scrollY)` → camera trượt mượt (damp) → cảnh 3D đổi góc nhìn.
- Nội dung HTML nằm đè lên canvas, hiện dần bằng reveal (mask-line, word reveal).
- Hậu kỳ: bloom, vignette, grain, chromatic aberration.
- Hạt khí quyển: đom đóm/tàn lửa, mưa, lá rơi, sương, wisp theo con trỏ.
- Lớp tiền cảnh PNG trong suốt (cỏ, đá, cành) trượt vào theo từng chương.

**Áp dụng cho web tâm linh:** giữ nguyên *cơ chế* (camera rail + section + hậu kỳ), thay *cảnh* bằng một **"Thiên Đàn / Linh Sơn Tự"** về đêm gồm: chùa trên núi, trăng, bầu trời sao, lư hương, đèn lồng, hoa sen trên mặt nước. Mỗi chương là một "cung" trong hành trình tâm linh.

**Lưu ý khi chạy trong GAS (rất quan trọng):**
| Vấn đề | Cách xử lý |
|---|---|
| Web app GAS chạy trong iframe sandbox | Dùng `HtmlService` với `XFrameOptionsMode.ALLOWALL`. Đường dẫn tương đối tới asset không có → dùng CDN hoặc Drive/GitHub raw. |
| Không có thư mục asset như `secret-pathways-assets/` | Three.js, font: nạp từ cdnjs / Google Fonts. Ảnh/âm thanh: để trên GitHub Pages, Cloudflare R2 hoặc Drive (link `uc?export=download&id=`). |
| Camera (`getUserMedia`) thường bị chặn trong iframe GAS | Dùng `<input type="file" accept="image/*" capture="environment">` → chụp bằng app camera hệ điều hành, đáng tin cậy hơn. |
| Âm thanh không tự phát | Bắt buộc có thao tác bấm đầu tiên ("Bước vào chùa") mới phát tiếng chuông/kinh. |
| Giới hạn thời gian 6 phút/lần chạy, UrlFetch 20.000 lượt/ngày (tài khoản thường) | Tính toán lịch/tử vi ở **client (JS)**, chỉ gọi server cho AI vision, lưu dữ liệu, cache. |
| Khóa API (Gemini/Claude) | Chỉ lưu ở `PropertiesService.getScriptProperties()`, không bao giờ để ở client. |
| File HTML lớn | Tách `Index.html`, `Style.html`, `Scene3D.html`, `Engines.html`... và dùng `include()` bằng `HtmlService.createTemplateFromFile`. |

---

## PHẦN B. CẤU TRÚC TỔNG THỂ

### B1. Cây thư mục GAS

```
Code.gs              → doGet, include, router, API cho client
Config.gs            → hằng số, đọc Script Properties
Vision.gs            → gọi AI vision (chỉ tay, nhân tướng, tướng mặt)
Storage.gs           → lưu hồ sơ, nhật ký, sổ nhang (Google Sheet)
Cache.gs             → CacheService cho kết quả nặng
Index.html           → khung trang, canvas, các section
Style.html           → CSS (design tokens, layout)
Scene3D.html         → three.js: cảnh chùa, camera rail, hậu kỳ
Engines.html         → toàn bộ bộ máy tính (xem B2)
Knowledge.html       → dữ liệu tri thức dạng JSON (bảng tra)
UI.html              → form, reveal, tab, modal, hành vi giao diện
Temple.html          → chùa online: thắp nhang, kinh, chuông, mõ
```

### B2. Các "bộ máy" tính toán (chạy ở client, thuần JS)

1. **Lịch vạn niên**
   - Dương ↔ Âm lịch (thuật toán Hồ Ngọc Đức, múi giờ UTC+7), tháng nhuận.
   - Can chi ngày/tháng/năm/giờ, tiết khí (24 tiết), Nạp âm.
2. **Bói ngày** (theo tục Việt – Hoa)
   - 12 Trực, 28 Tú (Nhị thập bát tú), 12 thần Hoàng đạo/Hắc đạo, giờ Hoàng đạo, Ngày Tam nương, Nguyệt kỵ, Dương công kỵ nhật, Sát chủ, Thọ tử, Bành Tổ bách kỵ, Xung – hợp theo tuổi (Lục hợp, Tam hợp, Lục xung, Tứ hành xung, Hình, Hại, Phá).
   - Việc nên/không nên làm theo từng Trực + Tú.
   - Cá nhân hóa: so tuổi người dùng với Can Chi ngày.
3. **Tử vi đẩu số**: lập lá số 12 cung (an Mệnh – Thân, Cục, Tử Vi, 14 chính tinh, các phụ tinh chính, Tứ hóa, Đại hạn 10 năm, Tiểu hạn, Lưu niên).
4. **Bát tự (Tứ trụ)**: 4 trụ, Thập thần, Dụng thần sơ bộ, ngũ hành vượng/suy, Đại vận.
5. **Cửu cung – Phi tinh – Nạp âm – Cung phi (Bát trạch)**: hướng tốt/xấu, màu hợp.
6. **Thần số học (Pythagoras + Chaldean tùy chọn)**: Số đường đời, Sứ mệnh (tên), Linh hồn, Nhân cách, Ngày sinh, Thái độ, Năm cá nhân/Tháng cá nhân/Ngày cá nhân, 4 đỉnh cao, các thử thách, chỉ số thiếu, mũi tên (Arrows of Pythagoras). Hỗ trợ **bỏ dấu tiếng Việt** (chuẩn hóa NFD).
7. **Cung hoàng đạo (Tây phương)**: Sun sign, Moon sign, Rising sign (cần giờ & nơi sinh), vị trí hành tinh bằng thư viện `astronomy-engine` (JS, offline), các góc chiếu cơ bản (hợp, đối, tam hợp, vuông), hành tinh nghịch hành, pha Trăng.
8. **Thiên văn học hiển thị**: pha Trăng hôm nay, Nhật/Nguyệt thực sắp tới, vị trí hành tinh, mưa sao băng — dùng làm dữ liệu "hôm nay có gì đặc biệt" và làm bầu trời thật cho cảnh 3D (tùy chọn).
9. **Chỉ tay** (AI vision): đường Sinh mệnh, Trí tuệ, Tâm đạo, Sự nghiệp, Hôn nhân, gò Kim tinh/Mộc tinh/Thổ tinh/Thái dương/Thủy tinh/Mặt trăng, hình dạng bàn tay (4 nguyên tố), dấu đặc biệt.
10. **Nhân tướng học** (AI vision): Tam đình, Ngũ quan, Thập nhị cung, Ngũ nhạc, ấn đường, mi, mắt, mũi, miệng, tai, hình mặt (Kim/Mộc/Thủy/Hỏa/Thổ).
11. **Bộ tổng hợp (Synthesis Engine)** — xem B3.

### B3. Bộ tổng hợp: cách "gom nhiều môn ra một kết quả"

Mỗi môn trả về một **vector điểm** chuẩn hóa theo 6 lĩnh vực, thang 0–100:

`{ tong, tai_loc, su_nghiep, tinh_cam, suc_khoe, quy_nhan }`

Kèm **nhãn giải thích** (tại sao) và **độ tin cậy** (0–1).

| Môn | Trọng số ngày | Trọng số tháng | Trọng số năm | Trọng số đường đời |
|---|---|---|---|---|
| Bói ngày (Trực/Tú/Hoàng đạo/xung hợp) | 0.40 | 0.15 | 0.05 | 0 |
| Bát tự – lưu nhật/nguyệt/niên | 0.20 | 0.25 | 0.25 | 0.20 |
| Tử vi (Lưu niên, Đại hạn) | 0.05 | 0.15 | 0.30 | 0.30 |
| Thần số học (Ngày/Tháng/Năm cá nhân, đường đời) | 0.15 | 0.20 | 0.20 | 0.25 |
| Cung hoàng đạo + hành tinh | 0.15 | 0.20 | 0.15 | 0.10 |
| Thiên văn (Trăng, hành tinh nghịch) | 0.05 | 0.05 | 0.05 | 0 |
| Chỉ tay / Nhân tướng | 0 | 0 | 0 | 0.15 (làm điều chỉnh) |

Quy tắc:
- Điểm cuối = tổng có trọng số, **trừ môn không đủ dữ liệu** (không có giờ sinh → bỏ Tử vi/Bát tự giờ, hạ độ tin cậy).
- **Đồng thuận**: nếu ≥ 3 môn cùng nghiêng một hướng → nhấn "Tín hiệu mạnh". Nếu các môn mâu thuẫn → hiện "Cần cân nhắc", nêu rõ môn nào nói gì.
- Luôn xuất **3 phần**: *Tóm tắt 1 câu → Điểm theo lĩnh vực → Lời khuyên hành động* (nên làm / nên tránh / giờ tốt / hướng tốt / màu hợp / con số may).
- Kết quả có **"Dấu vết suy luận"** (bấm để xem từng môn nói gì) để người dùng thấy minh bạch.

### B4. Dữ liệu lưu (Google Sheet, `SpreadsheetApp`)

| Sheet | Cột chính |
|---|---|
| `Profiles` | profileId, userKey, hoTen, ngaySinhDL, gioSinh, noiSinh, gioiTinh, ngayTao |
| `Readings` | readingId, profileId, loai (ngay/thang/nam/duongdoi/chitay/tuong), ketQuaJSON, diem, ngayTao |
| `Incense` | userKey, soNhangThap, chuoiNgay, lanCuoi, loiNguyen |
| `Prayers` | id, userKey, noiDung, congKhai, ngay |
| `Scriptures` | id, ten, nguon, urlAudio, thoiLuong, loai |
| `Logs` | thoiGian, hanhDong, ghiChu |

`userKey` = UUID tạo ở client, lưu `localStorage` (không bắt đăng nhập). Có tùy chọn xuất/nhập hồ sơ JSON.

### B5. Quyền riêng tư và trung thực

- Ảnh bàn tay/khuôn mặt: **gửi đi phân tích rồi xóa ngay, không lưu**. Hiển thị cảnh báo đồng ý trước khi chụp.
- Hiển thị câu: *"Nội dung mang tính tham khảo, giải trí và chiêm nghiệm văn hóa, không thay thế tư vấn y tế, pháp lý, tài chính."*
- Ngôn ngữ kết quả theo hướng gợi mở, tránh phán xét/hù dọa (không nói "sẽ chết", "bị tai họa nặng").
- Không phân tích ảnh người khác khi chưa có sự đồng ý (hiện checkbox xác nhận).

---

## PHẦN C. THIẾT KẾ GIAO DIỆN — "HÀNH TRÌNH 7 CHƯƠNG"

Cuộn dọc, camera đi từ cổng chùa → sân → chính điện → bầu trời → tay/mặt → mặt hồ sen → thềm sau (giống Kage, thêm chương).

| # | Section (id) | Cảnh 3D / camera | Nội dung |
|---|---|---|---|
| 0 | **Hero** `#hero` | Toàn cảnh chùa trên núi, trăng vàng, sao, sương; wordmark 3D chữ **LINH QUANG** | Câu dẫn, nút "Xem vận hôm nay", 4 chip chương |
| 1 | **Hôm nay** `#today` | Camera tiến lên bậc thềm, ánh sáng đổi theo điểm (tốt: vàng ấm, xấu: xanh lạnh, trung bình: trắng) | Ngày dương/âm, Can Chi, Trực, Tú, giờ Hoàng đạo (vòng 12 giờ), nên/kỵ, pha Trăng, **ô nhập thông tin** → kết quả cá nhân |
| 2 | **Vận trình** `#fortune` | Sân chùa, 3 "cửa sổ" cloth (tháng / năm / đường đời) như thẻ card Kage | Tab Tháng · Năm · Đường đời. Biểu đồ 12 tháng, 4 đỉnh cao đời, Đại vận |
| 3 | **Lá số** `#charts` | Camera đi vào chính điện, sao xoay thành bầu trời | Tử vi 12 cung, Bát tự 4 trụ, Cung hoàng đạo (bánh xe), Thần số học (bảng số) |
| 4 | **Tướng số** `#reading` | Camera dừng trước gương đồng/bàn tay phát sáng | Chụp/tải ảnh **chỉ tay** và **khuôn mặt**, kết quả có ghi chú chồng lên ảnh |
| 5 | **Chùa online** `#temple` | Điện thờ 3D: lư hương, bát nhang, đèn dầu, chuông, mõ | Thắp nhang, khấn nguyện, nghe kinh, gõ mõ, rung chuông, cúng hoa/đèn |
| 6 | **Tổng kết** `#summary` | Camera bay lên cao, bầu trời đầy sao, trăng tròn | Thẻ "Lá bùa của bạn": điểm tổng hợp, lời khuyên, nút chia sẻ ảnh |
| — | Footer | Cỏ + đá tiền cảnh | Giới thiệu, cảnh báo, liên hệ |

**Điều hướng:** thanh nav trên + rail chấm bên phải (giống Kage), nút âm thanh nổi góc dưới trái (bật/tắt nhạc nền).

### C1. Chi tiết từng chương

**Chương 1 — Hôm nay**
- Khối trái: ngày dương lớn, ngày âm, Can Chi (ví dụ *Giáp Tý – tháng… – năm…*), tiết khí.
- Vòng tròn **12 giờ**: cung nào Hoàng đạo tô vàng, Hắc đạo tô tối; hover hiện việc nên làm.
- Thẻ "Hôm nay đặc biệt": Trăng (pha, % sáng), tiết khí gần nhất, ngày Rằm/Mùng 1, Tam nương, Nguyệt kỵ, sự kiện thiên văn.
- Form nhập: Họ tên, ngày sinh (dương/âm chuyển đổi), giờ sinh (12 canh giờ hoặc giờ phút), giới tính, nơi sinh (tùy chọn). Lưu vào `localStorage` + Sheet.
- Kết quả cá nhân: điểm tổng, 5 lĩnh vực, **việc nên làm / nên tránh**, giờ tốt, hướng xuất hành, màu và số may, câu "lời nhắn trong ngày".
- Hiệu ứng: điểm đếm số lên, ánh sáng cảnh đổi màu theo điểm.

**Chương 2 — Vận trình**
- Tab **Tháng**: lịch tháng dạng lưới, mỗi ô tô màu theo điểm, bấm ô → chi tiết ngày. Gợi ý 3 ngày đẹp nhất để khai trương/cưới hỏi/xuất hành/động thổ/ký hợp đồng.
- Tab **Năm**: 12 tháng dạng biểu đồ đường + đoạn tóm tắt, sao hạn (Cửu diệu, Tam tai, Kim lâu, Hoang ốc, Thái tuế), năm cá nhân (số học), lưu niên tử vi.
- Tab **Đường đời**: dòng thời gian tuổi 0 → 90: Đại vận 10 năm, 4 đỉnh cao, các thử thách, chu kỳ 9 năm.

**Chương 3 — Lá số**
- Tử vi: lưới 4×4 truyền thống, hover cung hiện giải nghĩa, nút "Giải đoán tổng quan".
- Bát tự: 4 cột (giờ–ngày–tháng–năm) Thiên can/Địa chi/Tàng can, biểu đồ ngũ hành dạng radar.
- Cung hoàng đạo: bánh xe 12 cung + vị trí hành tinh.
- Thần số học: số đường đời, sứ mệnh, linh hồn, nhân cách + biểu đồ mũi tên Pythagoras 3×3.

**Chương 4 — Tướng số**
- Hai thẻ lớn: **Chỉ tay** và **Nhân tướng**.
- Luồng: đồng ý → chọn tay trái/phải (hoặc mặt chính diện) → hướng dẫn chụp (khung viền gợi ý, đủ sáng, lòng bàn tay mở) → tải lên → loading (hiệu ứng quét sáng) → kết quả.
- Kết quả: ảnh có lớp phủ đường kẻ (AI trả tọa độ chuẩn hóa 0–1 để vẽ canvas), danh sách đặc điểm, giải nghĩa từng đường/bộ phận, điểm 6 lĩnh vực, lời khuyên, độ tin cậy.
- Xử lý ảnh kém chất lượng: AI trả `{"hopLe": false, "lyDo": "..."}` → báo người dùng chụp lại.

**Chương 5 — Chùa online**
- Cảnh 3D điện thờ; chạm vào đối tượng để tương tác:
  - **Thắp nhang**: chọn 1/3/9 nén (3 nén mặc định), hiệu ứng khói + tàn đỏ, đếm ngược 10–30 phút, cộng vào "sổ nhang" và chuỗi ngày liên tục.
  - **Khấn nguyện**: nhập lời nguyện (có mẫu văn khấn), chọn riêng tư/công khai, "tường nguyện" hiển thị ẩn danh.
  - **Nghe kinh**: danh sách (Kinh Bát Nhã Tâm Kinh, Chú Đại Bi, Kinh A Di Đà, Kinh Phổ Môn, Niệm Phật, Chú Lăng Nghiêm...). Trình phát có hẹn giờ tắt, lặp, hiển thị lời kinh chạy chữ.
  - **Gõ mõ / Rung chuông**: nhịp tạo âm, đếm số lần, chế độ "niệm Phật 108".
  - **Dâng hoa / thắp đèn / cúng dường**: hiệu ứng, không dùng tiền thật.
  - **Xin quẻ / xăm**: rút ngẫu nhiên 1 trong 100 quẻ (kèm lời giải).
- Nguồn kinh: tự thu âm hoặc dùng nguồn **có giấy phép** (Public domain/Creative Commons), ghi rõ nguồn; **không nhúng file có bản quyền**.

**Chương 6 — Tổng kết**
- Thẻ tổng hợp cuối: hợp nhất kết quả hôm nay + tháng + năm + đường đời + tướng số.
- Bảng "Các môn nói gì" (minh bạch), 3 lời khuyên ưu tiên, nút **Lưu**, **Tải ảnh thẻ**, **Chia sẻ**.

### C2. Hệ thiết kế (design tokens)

```
--ink:#06070d;      nền đêm
--ink-2:#0d1020;
--gold:#d9b25f;     vàng nhang/chủ đạo
--gold-soft:#f1dba0;
--vermilion:#c8322b; đỏ chu sa (nhấn)
--jade:#4aa58a;     ngọc (tốt)
--moon:#e8eaf2;     chữ chính
--muted:#8a90a6;
--danger:#6b8cc9;   xanh lạnh (xấu → không dùng đỏ để tránh gây sợ)
```
- Font: tiêu đề *Cormorant Garamond* / *Noto Serif* (hỗ trợ tiếng Việt), thân *Be Vietnam Pro*, chữ Hán *Noto Serif TC*. **Bắt buộc có tập ký tự Latin-ext + Vietnamese.**
- Họa tiết: mây (vân vũ), hoa sen, hoa văn bát quái, viền vàng mảnh 1px, tách cung bằng đường mảnh.
- Chuyển động: reveal từng chữ, cloth cho card, đếm số, đường vẽ dần (stroke-dashoffset) cho biểu đồ.
- Hiệu năng: tự giảm chất lượng (PERF governor như Kage), tắt hậu kỳ nặng trên mobile, `prefers-reduced-motion`.
- Responsive: mobile là ưu tiên (đa số người dùng mở bằng điện thoại) → bố cục 1 cột, cảnh 3D nhẹ hơn.

### C3. Cảnh 3D (tái dùng cơ chế Kage)

- **Camera rail**: mảng `CAM` 7 điểm mốc, `CatmullRomCurve3`, `damp` theo scroll.
- **Bầu trời**: texture canvas, sao nhấp nháy, trăng (tái dùng `texMoon`, tint vàng/bạc thay vì đỏ máu), Dải Ngân Hà mờ.
- **Chùa**: tái dùng `buildTemple` (mái cong, bracket, ô lưới giấy phát sáng) + thêm **tháp chuông** nhỏ.
- **Mặt hồ sen** (chương 5–6): mặt phẳng phản chiếu giả (gradient + ripple), hoa sen low-poly phát sáng nhẹ.
- **Hạt**: đom đóm vàng, tro nhang bay lên, cánh sen/hoa đào rơi (thay lá phong).
- **Hậu kỳ**: bloom, vignette, grain (giữ nguyên pipeline).
- **Cảnh theo điểm số**: biến `MOOD` (−1…1) điều khiển màu đèn, độ sáng trăng, tông hậu kỳ.

---

## PHẦN D. LỘ TRÌNH TRIỂN KHAI

| Giai đoạn | Việc | Kết quả kiểm tra |
|---|---|---|
| 1 | Khung GAS + trang cuốn + cảnh 3D tĩnh + nav + reveal | Cuộn mượt, camera đổi theo section |
| 2 | Lịch Âm + Can Chi + bói ngày (Chương 1 phần chung) | So khớp 10 ngày mẫu với lịch vạn niên chuẩn |
| 3 | Form người dùng + lưu Sheet + bói ngày cá nhân | Lưu/đọc hồ sơ ổn định |
| 4 | Thần số học + Cung hoàng đạo + thiên văn | Đối chiếu ví dụ chuẩn |
| 5 | Bát tự + Tử vi + Vận trình tháng/năm/đường đời | Đối chiếu 3 lá số mẫu |
| 6 | Bộ tổng hợp + thẻ tổng kết | Điểm hợp lý, có dấu vết suy luận |
| 7 | Chỉ tay + Nhân tướng (AI vision) | Xử lý ảnh xấu, không lưu ảnh |
| 8 | Chùa online (nhang, kinh, mõ, chuông, xăm) | Âm thanh chạy sau thao tác đầu tiên |
| 9 | Tối ưu mobile, hiệu năng, SEO, thử nghiệm | Giữ ≥ 30fps trên điện thoại tầm trung |

> **Khuyến nghị:** đừng yêu cầu AI viết toàn bộ trong 1 lần. Dán **Prompt 0** trước, rồi lần lượt **Prompt 1 → 9**. Mỗi lần test xong mới sang bước kế.

---

## PHẦN E. BỘ PROMPT

### PROMPT 0 — NGỮ CẢNH CHUNG (dán đầu tiên, giữ nguyên trong suốt cuộc trò chuyện)

```
Bạn là kỹ sư full‑stack + WebGL + chuyên gia văn hóa tâm linh phương Đông/Tây.
Hãy giúp tôi xây dựng web app "LINH QUANG" chạy hoàn toàn trên Google Apps Script (GAS).

MỤC TIÊU
Trang web tâm linh dạng "trang cuốn" (scroll‑driven) có nền 3D (three.js) bằng WebGL, tổng hợp nhiều môn:
tử vi đẩu số, bát tự, nhân tướng học, chỉ tay, bói ngày (Trực, 28 tú, giờ hoàng đạo, xung hợp tuổi),
thiên văn (pha trăng, hành tinh), cung hoàng đạo, thần số học, và khu "chùa online" (thắp nhang, nghe kinh, gõ mõ, xin xăm).
Có phần kết luận tổng hợp các môn thành một kết quả duy nhất, minh bạch cách tính.

RÀNG BUỘC KỸ THUẬT GAS
- File: Code.gs, Config.gs, Vision.gs, Storage.gs, Cache.gs, Index.html, Style.html, Scene3D.html, Engines.html,
  Knowledge.html, UI.html, Temple.html. Dùng hàm include() với HtmlService.createTemplateFromFile.
- doGet trả HtmlOutput với setXFrameOptionsMode(ALLOWALL) và meta viewport.
- Không dùng thư mục asset cục bộ: three.js, font nạp từ CDN (cdnjs, Google Fonts có subset vietnamese + latin-ext).
- Tính toán lịch/tử vi/số học ở CLIENT (JS thuần). Server chỉ: lưu Sheet, cache, gọi AI vision.
- Khóa API chỉ ở PropertiesService; tuyệt đối không đưa xuống client.
- Camera trình duyệt thường bị chặn trong iframe GAS → dùng <input type="file" accept="image/*" capture="environment">.
- Âm thanh chỉ phát sau thao tác người dùng đầu tiên.
- Mọi hàm gọi server dùng google.script.run có withSuccessHandler/withFailureHandler và trạng thái loading.
- Chú thích code bằng tiếng Việt, tên hàm/biến tiếng Anh.

PHONG CÁCH
Đêm trên núi, chùa cổ, trăng vàng, sao, sương, đèn lồng, hoa sen. Tông: nền #06070d, vàng #d9b25f,
đỏ chu sa #c8322b (chỉ nhấn nhẹ), ngọc #4aa58a. Tiêu đề font serif có hỗ trợ tiếng Việt.
Cơ chế 3D theo trang tham khảo "Kage": canvas fixed toàn màn hình, camera chạy trên đường cong CatmullRom qua các
điểm mốc, mỗi section ứng với một mốc (thuộc tính data-cam), camera damp theo scroll, hậu kỳ bloom + vignette + grain,
hạt khí quyển, reveal chữ từng từ, card "cloth" nhấp nhô, có PERF governor tự giảm chất lượng, hỗ trợ prefers-reduced-motion
và fallback không WebGL.

NGUYÊN TẮC NỘI DUNG
- Kết quả mang tính tham khảo/giải trí/văn hóa; luôn hiển thị lời nhắc này.
- Văn phong gợi mở, tích cực, không hù dọa, không phán định bệnh tật/cái chết/tai họa chắc chắn.
- Mỗi kết luận phải kèm "dấu vết suy luận" (môn nào nói gì, theo quy tắc nào).
- Ảnh bàn tay/khuôn mặt: xin đồng ý trước, gửi phân tích rồi xóa, không lưu.

CÁCH LÀM VIỆC
Tôi sẽ giao từng giai đoạn. Mỗi giai đoạn: (1) tóm tắt bạn sẽ làm gì, (2) đưa code ĐẦY ĐỦ từng file (không viết tắt "..."),
(3) hướng dẫn dán vào GAS + triển khai, (4) bộ test mẫu để kiểm tra. Nếu thiếu dữ kiện hoặc quy tắc có nhiều trường phái,
hãy nêu rõ bạn chọn trường phái nào và để cấu hình được. Chỉ trả lời "đã hiểu" cho tin nhắn này.
```

### PROMPT 1 — Khung trang cuốn + cảnh 3D

```
GIAI ĐOẠN 1: Khung GAS + trang cuốn + cảnh 3D.
Tạo Code.gs, Index.html, Style.html, Scene3D.html, UI.html với 7 section: #hero, #today, #fortune, #charts, #reading,
#temple, #summary + footer. Mỗi section có data-cam.
Cảnh 3D: bầu trời sao + trăng vàng (texture sinh bằng canvas), chùa trên núi nhiều tầng có mái cong và cửa giấy phát sáng,
bậc thềm, sương, đom đóm vàng, cánh sen/hoa đào rơi, mặt hồ sen ở cuối trang. Camera 7 điểm mốc đi từ cổng chùa → sân →
chính điện → bầu trời → gương/bàn tay → điện thờ → bầu trời cao.
Hậu kỳ: bloom, vignette, grain. PERF governor, fallback không WebGL, reduced‑motion.
Hero: wordmark "LINH QUANG" 3D, 4 chip chương, câu dẫn tiếng Việt. Nav + rail chấm + nút bật/tắt âm thanh.
Mỗi section tạm thời để nội dung giữ chỗ nhưng đã có reveal chữ từng từ.
Đưa ra biến toàn cục MOOD (−1…1) để sau này đổi màu đèn/trăng/hậu kỳ theo điểm số.
Tối ưu cho mobile (1 cột, giảm hạt, tắt hậu kỳ nặng).
```

### PROMPT 2 — Lịch Âm + bói ngày chung

```
GIAI ĐOẠN 2: Engines.html (module Lịch) + Knowledge.html (bảng tra) + Chương "Hôm nay" (phần chung, chưa cá nhân).
Viết module JS thuần:
- Đổi dương↔âm (thuật toán Hồ Ngọc Đức, UTC+7, có tháng nhuận), Can Chi giờ/ngày/tháng/năm, 24 tiết khí, Nạp âm.
- 12 Trực, 28 Tú, 12 thần Hoàng đạo/Hắc đạo, giờ Hoàng đạo, Tam nương, Nguyệt kỵ, Dương công kỵ nhật, Sát chủ, Thọ tử,
  Bành Tổ bách kỵ. Việc NÊN/KỴ theo Trực + Tú.
- Điểm ngày 0–100 chung, giải thích từng yếu tố cộng/trừ.
Giao diện: ngày dương lớn, ngày âm, Can Chi, vòng 12 giờ (hoàng đạo tô vàng), thẻ "Hôm nay đặc biệt" (Rằm/Mùng 1, tiết khí, Tam nương...), tô cảnh 3D theo điểm.
Cung cấp ít nhất 10 ngày kiểm thử kèm kết quả mong đợi để tôi đối chiếu với lịch vạn niên.
```

### PROMPT 3 — Hồ sơ người dùng + bói ngày cá nhân + lưu Sheet

```
GIAI ĐOẠN 3: Form hồ sơ (họ tên, ngày sinh dương/âm, giờ sinh theo 12 canh giờ hoặc giờ phút, giới tính, nơi sinh tùy chọn).
Storage.gs: tạo/đọc Google Sheet với các sheet Profiles, Readings, Incense, Prayers, Scriptures, Logs; userKey UUID lưu localStorage;
khóa lock chống ghi đồng thời (LockService); cache (CacheService).
Bói ngày cá nhân: so tuổi (Can Chi năm sinh, mệnh Nạp âm) với ngày: Lục hợp, Tam hợp, Lục xung, Tứ hành xung, Hình, Hại, Phá,
ngũ hành sinh–khắc. Trả: điểm cá nhân, việc nên/tránh theo mục đích người dùng chọn (khai trương, cưới hỏi, động thổ, xuất hành,
ký hợp đồng, thi cử, khám bệnh...), giờ tốt, hướng xuất hành (Hỷ thần, Tài thần), màu và số may.
Xuất/nhập hồ sơ JSON. Có nút xóa toàn bộ dữ liệu.
```

### PROMPT 4 — Thần số học + Hoàng đạo + Thiên văn

```
GIAI ĐOẠN 4: Thêm các module vào Engines.html.
- Thần số học: chuẩn hóa tên tiếng Việt (NFD, bỏ dấu, đ→d), số Đường đời, Sứ mệnh, Linh hồn, Nhân cách, Ngày sinh, Thái độ,
  Năm/Tháng/Ngày cá nhân, 4 đỉnh cao, 4 thử thách, số thiếu, biểu đồ mũi tên Pythagoras; xử lý số chủ đạo 11/22/33.
- Cung hoàng đạo: Sun, Moon, Rising (khi có giờ + nơi sinh), bánh xe 12 cung bằng SVG; dùng thư viện astronomy-engine (CDN) tính vị trí
  hành tinh, góc chiếu chính, hành tinh nghịch hành.
- Thiên văn: pha trăng + % sáng, thời điểm trăng tròn/mới gần nhất, Nhật/Nguyệt thực sắp tới (nếu có), sự kiện hôm nay.
Giao diện hiển thị trong Chương 3 và đưa dữ kiện thiên văn vào thẻ "Hôm nay đặc biệt". Kèm test mẫu có đáp án.
```

### PROMPT 5 — Bát tự + Tử vi + Vận trình

```
GIAI ĐOẠN 5: Bát tự (4 trụ, tàng can, Thập thần, ngũ hành vượng/suy, Dụng thần sơ bộ, Đại vận) và Tử vi đẩu số
(an Mệnh/Thân, Cục, Tử Vi + 14 chính tinh, các phụ tinh chính, Tứ hóa, Đại hạn, Lưu niên) — nêu rõ trường phái bạn chọn
và cho cấu hình được. Lưới tử vi 4×4 truyền thống, hover hiện giải nghĩa.
Chương "Vận trình": tab Tháng (lịch tô màu điểm, gợi ý 3 ngày đẹp theo mục đích), tab Năm (biểu đồ 12 tháng, Cửu diệu, Tam tai,
Kim lâu, Hoang ốc, Thái tuế, năm cá nhân), tab Đường đời (dòng thời gian 0–90 tuổi: Đại vận, đỉnh cao, thử thách).
Biểu đồ vẽ bằng SVG/canvas có animation vẽ dần. Kèm 3 lá số mẫu để đối chiếu.
```

### PROMPT 6 — Bộ tổng hợp

```
GIAI ĐOẠN 6: Synthesis Engine.
Mỗi môn trả {tong, tai_loc, su_nghiep, tinh_cam, suc_khoe, quy_nhan} (0–100), nhãn giải thích, độ tin cậy (0–1).
Gộp theo bảng trọng số (ngày/tháng/năm/đường đời) mà tôi đưa; thiếu dữ liệu thì bỏ môn đó và hạ độ tin cậy.
Phát hiện đồng thuận (≥3 môn cùng hướng → "Tín hiệu mạnh") và mâu thuẫn (hiện rõ môn nào nói gì).
Đầu ra: 1 câu tóm tắt, điểm 5 lĩnh vực, 3 lời khuyên ưu tiên, nên làm/nên tránh, giờ-hướng-màu-số, và "Dấu vết suy luận" bấm để mở.
Thẻ "Lá bùa của bạn" ở Chương 6: xuất ảnh PNG từ canvas, nút chia sẻ. Cập nhật MOOD của cảnh 3D theo điểm tổng.
Bảng trọng số để ở Knowledge.html dưới dạng JSON dễ chỉnh.
```

### PROMPT 7 — Chỉ tay + Nhân tướng (AI vision)

```
GIAI ĐOẠN 7: Chương "Tướng số".
Client: màn hình xin đồng ý, hướng dẫn chụp, <input type=file accept=image/* capture>, nén ảnh về cạnh dài ≤ 1280px JPEG 0.8 bằng canvas,
gửi base64 qua google.script.run.
Vision.gs: gọi API vision (Gemini hoặc Claude) bằng UrlFetchApp với khóa trong PropertiesService; không lưu ảnh; có rate limit theo userKey
(CacheService); xử lý lỗi/timeout.
Prompt gửi AI phải ép trả JSON chặt chẽ:
- Chỉ tay: hopLe, lyDo, loaiTay, hinhDangBanTay(Kim/Mộc/Thủy/Hỏa/Thổ), cacDuong[{ten, dai, sau, ro, dacDiem, giaiNghia, toaDo:[[x,y]…] chuẩn hóa 0–1}],
  cacGo[...], dauDacBiet[...], diem{tai_loc,su_nghiep,tinh_cam,suc_khoe,quy_nhan}, doTinCay, loiKhuyen.
- Nhân tướng: hopLe, lyDo, hinhMat(ngũ hành), tamDinh, nguQuan, thapNhiCung, diemNoiBat, diem{...}, doTinCay, loiKhuyen.
Client vẽ lớp phủ đường lên ảnh bằng canvas, hiệu ứng quét sáng khi đang phân tích. Ảnh mờ/tối → báo chụp lại.
Điểm được đưa vào Synthesis Engine như một môn "điều chỉnh" cho đường đời.
```

### PROMPT 8 — Chùa online

```
GIAI ĐOẠN 8: Temple.html — điện thờ 3D tương tác (raycaster).
- Thắp nhang 1/3/9 nén: khói (particles), tàn đỏ giảm dần, đếm ngược; ghi vào sheet Incense, chuỗi ngày liên tục, sổ nhang.
- Khấn nguyện: mẫu văn khấn + ô nhập, riêng tư/công khai, "tường nguyện" ẩn danh, lọc từ ngữ không phù hợp.
- Nghe kinh: trình phát (hẹn giờ tắt, lặp, chạy chữ lời kinh), danh sách lấy từ sheet Scriptures; chỉ dùng nguồn có giấy phép,
  hiển thị nguồn/giấy phép; hỗ trợ cả URL audio và nhúng YouTube.
- Gõ mõ/rung chuông bằng Web Audio API (tổng hợp âm, không cần file), chế độ niệm 108 kèm đếm.
- Dâng hoa, thắp đèn dầu (hiệu ứng, không dùng tiền thật). Xin xăm: 100 quẻ trong Knowledge.html, mỗi quẻ có thơ + giải nghĩa.
- Nút "Bước vào chùa" để mở khóa âm thanh. Âm lượng và tắt tiếng lưu localStorage.
```

### PROMPT 9 — Tối ưu và hoàn thiện

```
GIAI ĐOẠN 9: Rà soát toàn bộ.
Kiểm tra: hiệu năng mobile (≥30fps), kích thước file HTML GAS, lỗi google.script.run, bộ nhớ WebGL (dispose), accessibility
(aria, tương phản, bàn phím), SEO meta, reduced‑motion, không lộ khóa API, xử lý offline/lỗi mạng.
Viết hướng dẫn triển khai: tạo project, dán file, Script Properties cần thiết, tạo Spreadsheet, deploy Web App (Execute as: Me,
Access: Anyone), quy trình cập nhật phiên bản. Liệt kê rủi ro còn lại và hạn mức GAS cần theo dõi.
```

---

## PHẦN F. LƯU Ý ĐỂ KẾT QUẢ ĐÚNG NHẤT

1. **Các môn có nhiều trường phái** (Tử vi Nam/Bắc phái, Bát tự giờ Tý sớm/muộn, tính tháng nhuận, cách tính số học Pythagoras/Chaldean). Hãy chọn một chuẩn rồi ghi vào Knowledge.html để chỉnh được.
2. **Đối chiếu bằng test**: yêu cầu AI cho test mẫu và bạn đối chiếu với lịch vạn niên/phần mềm tử vi uy tín trước khi sang bước sau.
3. **Dữ liệu tri thức** (nghĩa 14 chính tinh, 100 quẻ xăm, giải nghĩa đường chỉ tay...) nên soạn thành JSON riêng; có thể nhờ AI soạn theo từng đợt nhỏ rồi bạn duyệt.
4. **Chi phí AI vision**: mỗi lần xem tướng/chỉ tay tốn một lượt gọi API; nên giới hạn số lần/ngày/người.
5. **Bản quyền kinh/nhạc**: dùng nguồn được phép; tránh nhúng bản thu có bản quyền.

TÔI CÓ THỂ XÂY DỰNG BẰNG GITHUB ĐỂ HÌNH ẢNH ĐẸP NHẤT, NẾU GAS KO ĐẢM BẢO HÃY THIẾT KẾ CHO TÔI TRIỂN KHAI TRÊN GITHUB