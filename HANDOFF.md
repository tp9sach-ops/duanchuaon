# HANDOFF — Web tâm linh "DIỆU GIANG TỰ" (chùa Việt 3D) — tên cũ: Linh Giang Tự (Phiên 5 đổi tên theo ptg)

> Đọc file này đầu tiên. Nó đủ để một phiên mới, không có trí nhớ, tiếp tục đúng và chi tiết.
> Phiên hiện tại: **Phiên 7** (2026-10-31 → 11-01). **SEO/chia sẻ:** `assets/og.png` (1200×630, vẽ bằng PIL), og:url/og:image/canonical/twitter large, `sitemap.xml`, `robots.txt` có dòng Sitemap. **GIẢ ĐỊNH CẦN PTG XÁC NHẬN:** địa chỉ trang là `https://tp9sach-ops.github.io/loinhuan.github.io/` (suy từ tên repo; không gọi được API Pages để xác nhận). Nếu khác (tên miền riêng) thì thay trong index.html, robots.txt, sitemap.xml. **Tử vi thêm Địa Không, Địa Kiếp (từ Hợi theo giờ), Tuần (2 cung trống của tuần Giáp chứa năm sinh) và Triệt (theo Can năm):** `tuanTriet` trong tuvi.js, huy hiệu 'Tuần'/'Triệt' đỏ trên cung; 3 test mới (tổng 127). Không tính điểm cho Tuần/Triệt. **Cố ý bỏ Hỏa Tinh/Linh Tinh** vì các phái an khác nhau; cần ptg chọn phái trước khi làm. Chưa đối chiếu phần mềm. **Tử vi có thêm 9 phụ tinh:** `anPhuTinh` trong `js/engines/tuvi.js` (Tả Phụ/Hữu Bật theo tháng từ Thìn/Tuất; Văn Xương/Văn Khúc theo giờ từ Tuất/Thìn; Lộc Tồn, Kình Dương, Đà La theo Can năm; Thiên Khôi/Việt theo bảng Can; Tứ hóa nay gắn được lên Xương Khúc Tả Hữu; điểm phụ tinh ±2–3 trong `scoreTuVi`), UI hiện chữ nhỏ mờ (`.tv-phu`), 3 test mới (tổng 124). Công thức theo cách phổ biến; **chưa đối chiếu sách/phần mềm**. Vẫn thiếu: Không Kiếp, Hỏa Linh, Tuần Triệt, vòng Thái Tuế/Bác Sĩ/Tràng Sinh, miếu hãm, Tiểu hạn. **Nhật/Nguyệt thực xong (thô):** `js/engines/eclipse.js` (`moonLatitude` theo các số hạng chính của Meeus, `phanLoai`, `sapXayRa` tìm trăng non/tròn kế tiếp rồi phân loại theo |vĩ độ|; ngưỡng ĐÃ CHỈNH theo các lần thực 2025–2028 đã biết: nguyệt thực toàn phần <0.40°, một phần <1.03°, nửa tối <1.55°; nhật thực trung tâm <0.96°, một phần <1.55°), 5 test (tổng 121) khớp 8 lần thực 3/2025–8/2026 và kiểu thực, không báo nhầm 60 ngày đầu 2025; thẻ 'Nhật thực và Nguyệt thực sắp tới' trong `js/ui/planets.js` (giờ Việt Nam, đánh dấu 'sát ngưỡng'). Đã chụp Chromium. **Giới hạn:** không có vùng nhìn thấy, độ che, thời lượng; ngưỡng chỉnh từ ít mẫu nên các ca sát ngưỡng có thể sai kiểu. **Tường nguyện chung xong (cần deploy GAS):** `gas/Prayers.gs` (`addPrayer_`, `listPrayers_`: ẩn danh, ≤120 ký tự, chặn link/email/số điện thoại, tối đa 5 điều/người/ngày, chỉ liệt kê điều có congKhai TRUE, đọc 200 hàng cuối), router `addPrayer`/`listPrayers` trong `gas/Code.gs`, `kiemTraNguyen` trong `js/engines/temple.js` (phải giữ GIỐNG `prayerOk_`; 1 test mới, tổng 116), `js/ui/temple.js` (tick 'đăng lên tường chung' + danh sách tường chung, chỉ hiện khi có `apiUrl`; nội dung từ máy chủ luôn qua `esc()` và cắt 120). Đã kiểm trình duyệt với API GIẢ (đăng, tải, chặn số điện thoại, không chèn được HTML). Chưa có kiểm duyệt từ khóa nhạy cảm hay nút báo cáo; sheet Prayers cần tạo bằng `setup()` (đã có). Chưa thử với GAS thật. **Thêm cuối phiên 7:** 5 hành tinh lúc sinh vẽ lên bánh xe hoàng đạo (`planetMarks` trong js/ui/charts.js); icon PNG 192/512 (`assets/icon-192.png`, `icon-512.png`, sinh bằng PIL từ icon.svg) và manifest/apple-touch-icon dùng chúng; README thêm mục bật AI chỉ tay và cài PWA. Đã chụp bánh xe bằng Chromium. **Vẫn chưa:** font tự host (cần tải file font, sandbox bị chặn), `og:image` (cần URL tuyệt đối của trang), sitemap, Lighthouse, Nhật/Nguyệt thực, lớp phủ chỉ tay, tường nguyện chung, nghe kinh, thử Anthropic API thật. **Giai đoạn 7 (Chỉ tay/Nhân tướng) xong KHUNG, CHƯA thử với AI thật:** `gas/Vision.gs` (hàm `analyzeImage_`, gọi Anthropic Messages API bằng `UrlFetchApp`, khóa `ANTHROPIC_API_KEY` và `VISION_MODEL` ở Script Properties, bắt buộc `consent:true`, giới hạn ~1,5 MB base64, không ghi ảnh vào Sheet/Logs), router `analyzeHand`/`analyzeFace` trong `gas/Code.gs`, `js/engines/vision.js` (chuẩn hóa/giới hạn kết quả, thu nhỏ ảnh, thông báo lỗi; 4 test, tổng 115), `js/ui/vision.js` (`#vision-app` trong chương Reading: tick đồng ý → chọn/chụp ảnh → thu nhỏ 1024px JPEG ở máy → gửi → hiển thị; ảnh không lưu), CSS `.vs-*`. Đã kiểm trình duyệt với API GIẢ (ô chọn ảnh bị khóa tới khi tick, gửi đúng `analyzeHand` + consent, kết quả hiện). **Chưa làm:** lớp phủ vẽ đường lên ảnh, kết quả chưa vào Lá bùa (môn `tayTuong` trọng số 0), chưa thử Anthropic API thật (ptg cần dán khóa, deploy GAS phiên bản mới, đặt `apiUrl` trong `js/config.js`). Lời nhắc prompt nằm ở `VISION_PROMPTS_`; ptg nên đọc lại. Tiếp: **Môn Hoàng đạo đã vào Lá bùa:** `scoreHoangDao(natal, nay)` trong `js/engines/planets.js` (hành tinh thời điểm xem chiếu vào Mặt Trời/Trăng lúc sinh, orb 4°; Mộc/Kim thuận cộng, Thổ/Hỏa vuông-đối trừ, Thủy nghịch trừ nhẹ sự nghiệp; kẹp 30–75; độ tin cậy 0.3; đây là QUY ƯỚC DỰ ÁN cần ptg duyệt), nối vào `compute()` của summary.js cho Hôm nay/Tháng/Năm. Đã chạy `compute` bằng node cho cả 3 khoảng (có điểm hoangDao). 2 test mới (tổng 111). Tab 'Hôm nay' vẫn chưa có Bát tự/Tử vi (chưa có đầu vào theo ngày). Tiếp: **Giai đoạn 4b (hành tinh) xong một phần:** `js/engines/planets.js` (Thủy/Kim/Hỏa/Mộc/Thổ theo yếu tố quỹ đạo Schlyter + nhiễu loạn Mộc/Thổ; Mặt Trời/Trăng lấy từ astro.js; nghịch hành; 5 góc chiếu chính, orb 6° (Mặt Trời/Trăng 8°)), `js/ui/planets.js` (`#planets-app`: bầu trời hôm nay + hành tinh lúc sinh), CSS `.pl-*`, 6 test (tổng 109) gồm kiểm với sự kiện thật: J2000, giới hạn góc Thủy ≤28° / Kim ≤48°, Thủy nghịch 4/2024, Hỏa nghịch 12/2024–2/2025. **Chưa có:** Nhật/Nguyệt thực, góc chiếu phụ, bánh xe hoàng đạo chưa vẽ hành tinh, điểm số `hoangDao` cho bộ tổng hợp, Thiên Vương/Hải Vương/Diêm Vương. Môn `hoangDao` trong weights.json vẫn chưa có đầu vào nên 'Chưa tính'. Tiếp: **Giai đoạn 5b Tử vi (sơ bộ) xong:** `js/engines/tuvi.js` (an Mệnh/Thân theo tháng+giờ, Cục theo nạp âm cung Mệnh bằng Ngũ Hổ độn, Tử Vi theo cục+ngày, 14 chính tinh, Tứ hóa theo Can năm, Đại hạn theo âm dương+giới tính, `scoreTuVi` cho bộ tổng hợp), `js/ui/tuvi.js` (lá số 12 cung, `#tuvi-app` trong chương Lá số), CSS `.tv-*` cuối style.css, môn `tuVi` đã vào tab 'Năm nay' của Lá bùa (độ tin cậy 0.35). 9 test mới (tổng 103). Kiểm bằng tay 1 lá số (17/5/1990 giờ Ngọ → Mệnh Hợi, Thổ ngũ cục) và bảng vị trí Tử Vi quen thuộc; **CHƯA đối chiếu với phần mềm/sách Tử vi uy tín**. Quy ước: giờ theo chi giờ, tháng nhuận từ ngày 16 tính sang tháng sau. **Chưa có:** phụ tinh (Xương Khúc, Tả Hữu, Lộc Tồn, Kình Đà, Không Kiếp, Hỏa Linh...), miếu/hãm, Tiểu hạn/lưu niên, Tứ hóa rơi vào phụ tinh (Văn Xương/Khúc/Tả/Hữu) chưa hiện, Cửu diệu, Hoang ốc. Mốc test: `shot.py` đã dùng `service_workers='block'` và hồ sơ thử `gioSinh:6`. **Sửa chữ 'Diệu Giang Tự' bị che (lần 2):** trên màn hình dọc, `js/scene/rail.js` hạ chùa xuống nửa dưới ở chương đầu (`l.y += 12*(1-f)` khi aspect<0.85) để chữ giới thiệu không đè bảng. Lần 1: hoành phi 3D trên Tam quan bị mái dưới che nửa dưới → nâng bảng và hai ô tròn lên `yl + 2.5`; chữ dọc bên phải hero (`.hero-side .v`) đậm vàng sáng + text-shadow vì lọt vào tán cây. **Lưu ý kiểm thử:** `shot.py` nay dùng `service_workers='block'` (nếu không, SW tự gọi CDN thật và bị chặn nên cảnh 3D hỏng ra nền đen; đó là lỗi của môi trường kiểm, không phải của trang). **Giai đoạn 9 một phần xong:** `manifest.webmanifest`, `assets/icon.svg`, `sw.js` (mạng trước, cache sau; đổi VERSION để làm mới), đăng ký SW cuối `js/main.js`, thẻ og/twitter, liên kết 'Bỏ qua tới nội dung', `:focus-visible`, `robots.txt`. Đã kiểm SW đăng ký được trong Chromium. **Chưa:** font tự host (vẫn Google Fonts), icon PNG 192/512 và ảnh og:image (cần URL tuyệt đối của trang), sitemap, kiểm Lighthouse, mục 'Hướng dẫn triển khai'. Tiếp theo trong phiên 7: **Giai đoạn 8 (Chùa online) xong ở mức chạy trong trình duyệt**: `js/engines/temple.js` (sổ nhang/chuỗi ngày, xăm 100 quẻ, có 7 test), `js/ui/temple.js` (thắp 1/3/9 nén có khói, gõ mõ + chuông tổng hợp bằng Web Audio, niệm 108 hạt, xin xăm, tường nguyện lưu localStorage), CSS cuối style.css, vùng `#temple-app` trong index.html. Đã chụp Chromium desktop (bấm thử đủ 4 khối); mobile mới xem bố cục. Chưa làm: nghe kinh + hẹn giờ tắt (cần file âm thanh), tường nguyện dùng chung qua GAS (hiện chỉ cục bộ), lời xăm là bộ do dự án soạn nên cần ptg duyệt. test 94 đạt. Trước đó, đầu phiên 7: đổi đền sang kiến trúc Việt (Tam quan, tường vàng, ngói âm dương, sân gạch nung, lối đá xanh, cầu đá); thay 3 mảnh tiền cảnh Nhật (tường/đèn đá/tháp) bằng SVG chùa Việt (assets/fg/*.svg); đưa `#fg-sky` xuống z-index 5 (dưới chữ); giảm blur thẻ để chữ rõ. Cây cỏ vẫn là WebP Kage theo yêu cầu (chưa xem được ảnh supabase vì sandbox chặn). test 87 đạt; chụp ảnh bằng Chrome SwiftShader, chưa đo FPS máy thật. Phiên 6 trước đó: **Phiên 6** (2026-10-31): đồng bộ bản phiên 5 lên GitHub (đẩy được, ghi đè file trùng tên, dọn 5 file js lạc ở thư mục gốc) và làm Giai đoạn 6 (bộ tổng hợp + Lá bùa). Phiên 5 trước đó: đổi tên Diệu Giang Tự; thêm lớp tiền cảnh cây cỏ theo mẫu ptg gửi; Giai đoạn 5 (Bát tự + Vận trình, CHƯA có Tử vi); GitHub: xem mục 2. Phiên 4 trước đó: (2026-10-31) — đã xong mã + test Giai đoạn 4 (thần số học, cung hoàng đạo, pha Trăng) và chụp ảnh kiểm; **KHÔNG đẩy được lên GitHub** (công cụ GitHub báo 403, không có quyền ghi) nên giao bản zip để ptg tải lên tay. Cập nhật mục 2, 7, 8 ở cuối MỖI phiên.

## 0. QUY TẮC BÀN GIAO (chép nguyên văn vào mọi bản bàn giao)

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Diễn giải thực hành: sau MỖI câu trả lời, đính kèm HANDOFF.md đã cập nhật; nếu không đủ chỗ làm hết thì gửi bàn giao TRƯỚC; luôn chép nguyên văn quy tắc này vào bản bàn giao mới.

## 1. Chủ dự án và cách làm việc

- Chủ dự án: ptg (Phan Trường Giang, Tg) (quản lý tại 9 Sạch). Nói tiếng Việt thường ngày, **không cần biết tên file/kỹ thuật**.
- Sửa mã có sẵn: đưa đoạn **TÌM** (nguyên văn, đầy đủ, không viết tắt, không "...") rồi đoạn **THAY BẰNG** đầy đủ để dán vào Find & Replace.
- Cần đoạn mã nào thì **yêu cầu ptg gửi**, không đoán.
- Môi trường làm việc của AI có thể chặn mạng (npm/CDN); phải nói rõ phần nào chưa chạy được.
- Điều tra trước khi sửa; không bịa yêu cầu/kiến trúc; không nói test đã qua nếu chưa chạy.

## 2. Trạng thái hiện tại

| Hạng mục | Trạng thái |
|---|---|
| Repo GitHub `https://github.com/tp9sach-ops/loinhuan.github.io` | Phiên 2: ban đầu rỗng; **đã đẩy toàn bộ mã Giai đoạn 1 (đã đổi tên LINH QUANG) + HANDOFF.md + docs/KE_HOACH.md lên nhánh `main`**. Cần ptg bật Pages (Settings → Pages → Source: GitHub Actions). |
| Bản mã Giai đoạn 1 | Nằm trong `dieu-giang-tu.zip` (ptg đã gửi, 168 KB, ~1.430 dòng). Gồm: index.html, css/style.css, js/{main,ui,util,api,config}.js, js/scene/{index,rail,temple,nature,particles,textures}.js, gas/Code.gs, tests/smoke.mjs, package.json, .github/workflows/pages.yml, README.md, HANDOFF.md (cũ). |
| Giai đoạn 1 (khung + cảnh 3D + camera rail) | Đã chạy thử trong Chromium (Playwright, three.js cài cục bộ, WebGL phần mềm): cảnh chùa hiện đúng, không lỗi JS, không tràn ngang ở 1366px và 390px. **Chưa đo FPS trên điện thoại thật.** |
| Giai đoạn 2 (lịch Âm, Can Chi, bói ngày chung, vòng 12 giờ) | **Xong mã + 17 test đạt + đã xem giao diện.** Còn: đối chiếu Trực/Tú/Dương công kỵ với lịch vạn niên (mục 8). |
| Phiên 3 — độ sáng | Đã tăng sáng cảnh 3D (exposure 1.5, đèn môi trường, trời/núi/sân/vật liệu sáng hơn, vignette và lớp phủ chữ nhẹ hơn). **Đã chụp thử bằng Chromium headless (WebGL phần mềm): thấy rõ chùa, trăng, núi, ao sen.** Chưa xem trên điện thoại thật. Nếu ptg thấy vẫn tối/quá sáng: chỉnh `toneMappingExposure` và `AmbientLight` trong `js/scene/index.js`. |
| Phiên 3 — tên và chữ | Tên chùa: **Diệu Giang Tự**. Đã bỏ toàn bộ chữ Hán (hoành phi dựng bằng chữ Việt: DIỆU GIANG TỰ, ĐẠI HÙNG BẢO ĐIỆN; nhãn chương bằng tiếng Việt; bỏ font Noto Serif TC). `tests/smoke.mjs` báo LỖI nếu còn "Linh Quang", "Kage" hoặc chữ Hán trong mã. |
| Giai đoạn 3 (hồ sơ + bói ngày cá nhân) | **Xong mã + 23 test mới (tổng 40 đạt).** `js/engines/personal.js`, `js/data/personal.json`, `js/ui/profile.js`, `gas/Storage.gs`. Đã chụp màn hình form + kết quả. **Chưa chạy trên GAS thật** (apiUrl rỗng) nên đồng bộ Sheet chưa được kiểm. Bảng quan hệ Chi, Hỷ thần, Tài thần đánh dấu `canDoiChieu`, chờ ptg đối chiếu. |
| Giai đoạn 4 (thần số học + hoàng đạo + pha Trăng) | **Xong mã + 27 test mới (tổng 67 đạt).** `js/engines/{numerology,astro,zodiac}.js`, `js/data/{numerology,zodiac}.json`, `js/ui/charts.js` (hiện trong `#charts-app`, chương Lá số), CSS `.ch-*`. Đã chụp ảnh Chromium: bầu trời hôm nay (hình trăng, % sáng, trăng tròn/non kế tiếp), 6 số, chu kỳ cá nhân, lưới mũi tên 3×3, 4 đỉnh cao. Pha Trăng khớp mốc công bố trong ±3 phút. **Chưa làm (Giai đoạn 4b):** vị trí các hành tinh, góc chiếu, hành tinh nghịch hành, Nhật/Nguyệt thực sắp tới, bánh xe hoàng đạo chưa vẽ hành tinh. Chưa xem trên điện thoại thật. |
| Đưa lên GitHub (Phiên 6) | **Đẩy được** (gọi add_repo quyền push rồi git clone/push). Repo `main` của ptg có file tự tải lên thủ công (một số file js nằm lạc ở thư mục gốc); phiên 6 đã chép đè bản phiên 5, xóa 5 file lạc (api.js, config.js, main.js, ui.js, util.js ở gốc; bản đúng nằm trong `js/`) rồi đẩy. Từ nay: file trùng tên ghi đè, file không đổi giữ nguyên (git chỉ ghi các file khác). |
| (cũ) Đưa lên GitHub (Phiên 4) | **Bị chặn (đã được giải quyết ở phiên 6):** `push_files` trả 403 "Resource not accessible by integration"; `git push` không có token. Repo `main` đang dừng ở Giai đoạn 2 (tên LINH QUANG, cảnh tối). Cần ptg: (a) tải zip phiên 4 lên tay (Add file → Upload files, kéo mọi file trừ thư mục `.git`), hoặc (b) cấp quyền ghi nội dung (Contents: Read and write) cho tích hợp GitHub với repo này để phiên sau tự đẩy. |
| Giai đoạn 5 (Bát tự, Vận trình) | **Xong mã + 9 test mới (tổng 76 đạt).** `js/engines/batu.js` (4 trụ, tàng can, Thập thần, ngũ hành, thân vượng/nhược, Dụng thần sơ bộ, Đại vận, Lưu niên: Thái tuế/Tam tai/Kim lâu), `js/ui/fortune.js` (chương #fortune, tab Tháng/Năm/Đường đời), `js/ui/batu.js` (trong #charts), CSS cuối `style.css`. Đã chụp ảnh Chromium. **Chưa làm:** Tử vi đẩu số (5b), Cửu diệu, Hoang ốc, đối chiếu Bát tự với phần mềm uy tín. |
| Tiền cảnh cây cỏ (Phiên 5) | `css/fg.css` + `js/fg.js` + khối `#fg-sky` trong index.html: 10 ảnh WebP trong suốt (tường, thông, cỏ cao, anh đào, lá phong, đèn đá, bụi cây, đá bazan, đồi, tàn tích) **nạp trực tiếp từ link supabase trong code mẫu của ptg**, bố cục sao theo mẫu; chương nào đang xem mới hiện (gate: Hôm nay + Tướng số; pathways: Vận trình + Chùa online; lessons: Lá số; eternity: Tổng kết; foot). Môi trường AI chặn mạng nên **chưa thấy ảnh hiện thật**; nên tải 10 ảnh về `assets/fg/` rồi đổi src nếu link supabase chết. Đèn đá, tàn tích đền, tường đền vẫn là kiểu Nhật theo yêu cầu "giống code". |
| Giai đoạn 6 (bộ tổng hợp + thẻ Lá bùa) | **Xong mã + 11 test mới (tổng 87 đạt).** `js/engines/synthesis.js` (gộp môn theo trọng số, chuẩn hóa khi thiếu môn, độ tin cậy, Tín hiệu mạnh / Cần cân nhắc, 3 lời khuyên, dấu vết), `js/data/weights.json` (bảng trọng số + từ khóa chia lĩnh vực, chỉnh được), `js/ui/summary.js` (chương #summary: tab Hôm nay/Tháng này/Năm nay, thẻ PNG 1080×1350, chia sẻ), CSS cuối `style.css`, `tests/synthesis.test.mjs`. Đã chụp Chromium (có và không hồ sơ) và tải thử thẻ PNG. **Đã sửa lỗi:** lớp CSS `.fg` của tiền cảnh cây cỏ đè lên vòng điểm → đổi vòng điểm sang lớp `.arc`. **Còn thiếu:** môn Tử vi, Hoàng đạo/hành tinh, Chỉ tay/Nhân tướng (bị bỏ và nói rõ ở 'Chưa tính'); khoảng 'đường đời' có trọng số nhưng chưa có giao diện. Cách chia 5 lĩnh vực là quy ước dự án (`canDoiChieu`). |
| Giai đoạn 8 (Chùa online) | Xong phần cục bộ (xem đầu file, Phiên 7). Thiếu: nghe kinh, tường nguyện chung qua GAS. |
| Giai đoạn 9 | Làm một phần (xem đầu file). |
| Giai đoạn 7 | Chưa làm. |
| Phiên 2 | (cũ) Đã đổi sang LINH QUANG; phiên 3 đã đảo lại thành DIỆU GIANG TỰ theo yêu cầu ptg. Cấu trúc thư mục vẫn PHẲNG. |

Chi tiết giai đoạn: 1 khung+cảnh · 2 lịch Âm/Can Chi/bói ngày · 3 form hồ sơ + lưu Sheet + bói ngày cá nhân · 4 thần số/hoàng đạo/thiên văn · 5 bát tự/tử vi/vận trình · 6 bộ tổng hợp + thẻ "Lá bùa" · 7 chỉ tay/nhân tướng AI vision · 8 chùa online · 9 tối ưu/PWA/SEO/a11y/hướng dẫn triển khai.

## 3. Xung đột đã gặp và cách phiên 2 xử lý (ptg chưa trả lời, chỉ nói "thực hiện tiếp và đẩy lên github")

1. **Tên (ĐÃ CHỐT ở phiên 3: ptg nói tên chùa là DIỆU GIANG TỰ, không phải Linh Quang):** (chi tiết cũ bên dưới chỉ để tham khảo)
   - prompt/cây thư mục mới của ptg dùng **"LINH QUANG"** (`linh-quang/`). Mã Giai đoạn 1 và HANDOFF cũ dùng **"Diệu Giang Tự (靈江寺)"** và `tests/smoke.mjs` **báo LỖI nếu còn chữ "Linh Quang" hoặc "Kage"** trong mã. → **Phiên 2 đã chọn "LINH QUANG"** (theo prompt mới nhất của ptg): đổi tiêu đề, wordmark, chữ Hán 靈江寺→靈光 (hoành phi, font subset), README, GAS, package.json (`linh-quang`); smoke test nay báo lỗi nếu còn "Linh Giang" hoặc "Kage". Giữ nguyên định danh nội bộ `LGT`, `lgt.userKey`, `lgt.sound`. Nếu ptg muốn quay lại tên cũ thì đảo ngược.
2. **Cấu trúc thư mục:** cây mới (mục 5) tách CSS thành `tokens/layout/sections.css`, `js/scene/{sky,temple,lotus,particles,camera-rail,post}.js`, `js/engines/*`, `js/data/*.json`, `js/ui/{reveal,tabs,charts,forms}.js`, `js/temple/*`, thư mục `assets/`. Mã Giai đoạn 1 đang là cấu trúc **phẳng** (style.css, ui.js, scene/{index,rail,temple,nature,particles,textures}.js). → Phiên 2 **chưa tách** (không thể xem trình duyệt để kiểm tra, tránh làm vỡ). Việc tách sang cây mới để cho giai đoạn sau, ghi rõ ánh xạ file cũ → mới.
3. **Hạ tầng:** kế hoạch ban đầu chạy trong GAS (iframe); ptg đã chuyển sang **GitHub Pages cho giao diện + GAS chỉ làm backend JSON** (kiến trúc mục 4). Phần "GAS HtmlService/include()" trong kế hoạch gốc `KE_HOACH.md` giờ **không còn áp dụng** cho front-end.

## 4. Kiến trúc đã chốt

- Front-end tĩnh `index.html` + ES modules; **three.js ghim phiên bản**; **font tự host** (subset Vietnamese + latin-ext); không framework nặng. (Giai đoạn 1 hiện nạp three 0.160.1 từ jsdelivr qua importmap và font từ Google Fonts; cây mới yêu cầu font tự host trong `assets/fonts/` → việc cần làm.)
- Mọi tính toán (lịch Âm, can chi, bói ngày, tử vi, bát tự, thần số, hoàng đạo, thiên văn) chạy **ở client**.
- **GAS** chỉ: lưu Sheet (Profiles, Readings, Incense, Prayers, Logs; kế hoạch gốc có thêm Scriptures), cache, gọi AI vision. **Khóa API chỉ ở Script Properties.**
- Client gọi GAS bằng `fetch` POST `Content-Type: text/plain` (tránh preflight). Mọi lệnh có timeout, retry, trạng thái loading; app vẫn chạy khi API lỗi/`apiUrl` rỗng.
- PWA/service worker, PERF governor, `prefers-reduced-motion`, fallback không WebGL, ưu tiên mobile.
- GitHub Actions: chạy test rồi deploy Pages.
- `userKey` = UUID ở `localStorage` (`lgt.userKey`), không bắt đăng nhập.
- Phong cách: tam quan, mái đầu đao, gác chuông, bồ đề, ao sen, trăng vàng, sao, sương. Màu: nền `#06070d`, vàng `#d9b25f`, đỏ chu sa `#c8322b` (nhấn nhẹ), ngọc `#4aa58a`, chữ `#e8eaf2`, "xấu" dùng xanh lạnh `#6b8cc9` (không dùng đỏ gây sợ). Cơ chế camera rail + scroll như trang Kage (không chép asset Kage).
- Nội dung: tham khảo/giải trí/văn hóa, gợi mở, không hù dọa; mỗi kết luận có "dấu vết suy luận"; ảnh tay/mặt xin đồng ý, phân tích xong xóa, không lưu; không phân tích ảnh người khác; kinh/nhạc chỉ dùng nguồn có giấy phép.

## 5. CÂY THƯ MỤC MỤC TIÊU (chép nguyên văn từ ptg)

```
linh-quang/
├─ index.html
├─ css/        tokens.css · layout.css · sections.css
├─ js/
│  ├─ main.js            (khởi động, preloader, PERF governor)
│  ├─ scene/             sky.js · temple.js · lotus.js · particles.js · camera-rail.js · post.js
│  ├─ engines/           lunar.js · canchi.js · dayscore.js · tuvi.js · batu.js
│  │                     numerology.js · zodiac.js · astro.js · synthesis.js
│  ├─ data/              knowledge.json · xam-100.json · weights.json
│  ├─ ui/                reveal.js · tabs.js · charts.js · forms.js
│  ├─ temple/            incense.js · prayer.js · audio.js (Web Audio: mõ, chuông)
│  └─ api.js             (gọi GAS)
├─ assets/  fonts/ (Việt + latin-ext, tự host) · img/ (webp) · fg/ (PNG tiền cảnh) · audio/
├─ tests/                (Vitest: ngày mẫu đối chiếu lịch vạn niên)
├─ gas/                  Code.gs · Vision.gs · Storage.gs (dán vào GAS)
└─ .github/workflows/pages.yml
```

Bản đồ file mã HIỆN CÓ (cấu trúc phẳng, Giai đoạn 1):

```
index.html            khung trang, importmap, 7 section (#hero #today #fortune #charts #reading #temple #summary) + footer
css/style.css         tokens, layout, reveal, responsive, fallback không WebGL
js/main.js            preloader → đợi font → import động cảnh → UI; lỗi WebGL → fallback
js/ui.js              reveal chữ từng từ, nav, rail chấm, menu mobile, nút âm thanh nền
js/util.js            clamp/lerp/damp, mulberry32, cvs()
js/api.js             callApi(action,payload), getUserKey()
js/config.js          apiUrl (rỗng), apiTimeoutMs 15000, apiRetries 1
js/scene/index.js     createScene(): ánh sáng, bloom, vòng lặp, PERF governor, MOOD (window.LGT)
js/scene/rail.js      CAM[] 7 mốc, CatmullRom, cuộn → tiến độ   (≈ camera-rail.js trong cây mới)
js/scene/temple.js    mái đầu đao, tam quan, chính điện, gác chuông, lư hương, đèn lồng
js/scene/nature.js    trời, trăng, núi, nền gạch, ao sen, bồ đề, tre, đá (≈ sky.js + lotus.js)
js/scene/particles.js đom đóm, cánh hoa, khói nhang
js/scene/textures.js  texture canvas (sao, trăng, gạch, hoành phi)
gas/Code.gs           doGet/doPost, setup(), saveProfile/getProfile (LockService)
tests/smoke.mjs       npm test: cú pháp, file bắt buộc, quét tên cũ, số mốc camera = số section
.github/workflows/pages.yml   test rồi deploy Pages (copy index.html, css, js, assets vào _site)
```

Giai đoạn 6 thêm: `js/engines/synthesis.js`, `js/data/weights.json`, `js/ui/summary.js` (khởi tạo bằng `initSummary()` trong `main.js`, mount `#summary-app`), `tests/synthesis.test.mjs`. Lưu ý: dùng thuộc tính `data-sm` cho tab (không dùng `data-tab`, đã trùng chương Vận trình) và lớp `.arc` cho vòng điểm (không dùng `.fg`).
Giai đoạn 4 thêm: `js/engines/numerology.js`, `astro.js`, `zodiac.js`, `js/data/numerology.json`, `zodiac.json`, `js/ui/charts.js`, `tests/numerology.test.mjs`, `tests/astro.test.mjs`; `profile.js` phát sự kiện `lgt:profile` khi lưu/xóa hồ sơ; `index.html` có `#charts-app`.
Đã tạo thêm ở Giai đoạn 3: `js/engines/personal.js`, `js/data/personal.json`, `js/ui/profile.js`, `gas/Storage.gs`, `tests/personal.test.mjs`. Chưa tạo: các engine Giai đoạn 4–6, `js/temple/*`, `js/ui/*`, `gas/Vision.gs`, `gas/Storage.gs`, `assets/`, service worker/manifest, Vitest.

## 6. PROMPT CHỦ (chép nguyên văn từ ptg — dán đầu phiên mới)

```
Bạn là kỹ sư front-end WebGL + chuyên gia văn hóa tâm linh. Xây web "DIỆU GIANG TỰ" (chùa Việt, đêm trên núi)
deploy trên GitHub Pages, backend nhẹ bằng Google Apps Script (Web App, trả JSON).

KIẾN TRÚC
- Front-end tĩnh: index.html + ES modules (cây thư mục tôi đưa). three.js ghim phiên bản, font tự host
  (subset Vietnamese + latin-ext). Không dùng framework nặng.
- Mọi tính toán (lịch Âm, can chi, bói ngày, tử vi, bát tự, thần số, hoàng đạo, thiên văn) chạy ở client.
- GAS chỉ làm: lưu Sheet (Profiles, Readings, Incense, Prayers, Logs), cache, gọi AI vision. Khóa API chỉ ở Script Properties.
- Client gọi GAS bằng fetch POST Content-Type text/plain (tránh preflight). Mọi lệnh gọi có timeout, retry, trạng thái loading,
  và app vẫn chạy được khi API lỗi.
- Có service worker/PWA, PERF governor, prefers-reduced-motion, fallback không WebGL, ưu tiên mobile.
- Thêm workflow GitHub Actions: chạy test rồi deploy Pages.

PHONG CÁCH: tam quan, mái đầu đao, gác chuông, bồ đề, ao sen, trăng vàng, sao, sương; nền #06070d, vàng #d9b25f,
đỏ chu sa #c8322b (nhấn nhẹ), ngọc #4aa58a. Cơ chế camera rail + scroll như trang Kage.
NỘI DUNG: tham khảo/giải trí/văn hóa, văn phong gợi mở, không hù dọa; mỗi kết luận có "dấu vết suy luận";
ảnh tay/mặt xin đồng ý, phân tích xong xóa, không lưu.
CÁCH LÀM: mỗi giai đoạn đưa code đầy đủ từng file, đường dẫn file, lệnh chạy thử, test mẫu có đáp án. Chỉ trả lời "đã hiểu".
```

Lưu ý: dòng cuối "Chỉ trả lời 'đã hiểu'" là phần của prompt gửi cho AI khi **dán prompt chủ ở đầu một cuộc trò chuyện mới**. Khi đã vào làm việc thật (phiên có bàn giao này), tiếp tục theo mục 8.

## 7. Nhật ký phiên

- **Phiên 8 (2026-11-02) — ĐANG LÀM, CHƯA COMMIT:** ptg gửi handoff/zip cũ (phiên 4, cũ hơn repo → dùng repo GitHub hiện tại) và yêu cầu **cải tạo thành "chùa online" kiểu https://s1.niemphat.online/**: nhập tên → thành nhân vật; nhiều người cùng vào, thấy nhau, chat; đi bộ trong chùa (không cuộn trang); đồ họa 3D có hoa viên, sảnh, chánh điện; mỗi chức năng web hiện có (lịch/bói ngày, hồ sơ, thần số/hoàng đạo, Bát tự, Tử vi, hành tinh, lá bùa, chỉ tay/nhân tướng, tường nguyện…) thành **một chỗ để đi tới và bấm vào vật/nhân vật 3D** để ra kết quả; thêm ngồi thiền, gõ mõ, đếm chuỗi 108, công đức, thắp nhang. Trước đó (1/11): đổi biển thành "Diệu Giang Tự", bỏ dải chữ đen (bấm để hiện), thêm tượng Phật ở chánh điện (ptg gửi ảnh tượng Phật vàng ngồi).
  - Quyết định của ptg: **dựng chùa Việt riêng bằng code, GLB để sau** (GLB Lukang Longshan là cả khu phố quét 3D 11 MB, 1,5 triệu tam giác, không có nội thất → không đi bộ được; nếu dùng sau thì chỉ làm cảnh xa bằng GLTFLoader + MeshoptDecoder). **Đa người chơi lưu bằng Google Apps Script** (đã cảnh báo: GAS không realtime, đồng bộ bằng thăm dò 1–2 giây, di chuyển sẽ hơi trễ → nội suy vị trí).
  - ĐÃ XONG (chưa commit): `assets/buddha.webp` (ảnh tượng Phật đã tách nền, 560×876 RGBA, dùng làm tấm billboard trên bàn thờ); `js/world/layout.js` (bố cục + va chạm thuần hàm: `blocked`, `canStep`, `move`, `groundY`, `region`, `addCircle/addRect`; cổng tam quan ba lối, ao sen chỉ qua cầu đá |x|<1.9, bậc thềm chính điện dốc, cột, lư hương, tháp chuông, bàn thờ); `tests/layout.test.mjs` (8 test đạt khi chạy riêng; CHƯA thêm vào `package.json` "test").
  - CÒN LẠI theo thứ tự: (1) `js/world/avatar.js` nhân vật (đầu/thân/áo theo màu chọn, tên nổi trên đầu, bong bóng chat, hoạt ảnh đi/ngồi/gõ mõ); (2) nội thất chính điện trong `js/scene/temple.js`: đổi biển thành **'DIỆU GIANG TỰ'** (cả chuỗi preload font trong `js/main.js`), tượng Phật = tấm `assets/buddha.webp`, bệ nhiều tầng, tượng hai bên, nến, hoa quả, đệm lạy, lư hương, mõ, khánh, đèn điểm trong điện; thêm hoa viên (luống hoa, đèn đá, ghế) và sảnh/nhà tổ (`addCircle/addRect` cho va chạm); (3) `js/world/world.js`: camera góc nhìn thứ ba, bấm-để-đi/WASD/joystick cảm ứng, hotspot có điểm đứng và bán kính, bấm vào vật 3D mở **panel (modal)** chứa các `<section>` cũ (#today #fortune #charts #reading #temple…) thay vì cuộn trang; (4) đổi `index.html`/CSS: màn hình nhập tên + chọn áo, HUD (công đức, chat, số người, âm thanh), bỏ rail/cuộn, giữ fallback `.no-webgl`; (5) hoạt động: thắp nhang 1/3/9, ngồi thiền, gõ mõ, niệm 108, rung chuông, lễ Phật, công đức (`window.LGT.addMerit`, nối với `js/ui/temple.js`); (6) đa người: `gas/Room.gs` + `case 'sync'` trong `gas/Code.gs` (CacheService + LockService, hết hạn ~12 giây, chat có con trỏ, kiểm tra chuỗi), `js/net/room.js` (poll 1,5–2 s, nội suy, thích nghi), adapter BroadcastChannel khi chạy cục bộ; test Node bằng `vm` với dịch vụ giả; (7) sửa `tests/smoke.mjs` (đang kiểm số CAM = số data-cam, phải bỏ khi bỏ rail), thêm test vào package.json, tăng `VERSION` trong `sw.js`, chụp ảnh desktop/mobile, cập nhật mục 2 + 8, commit chỉ file đổi, `git fetch` + rebase, push main.
  - Chưa kiểm được: GAS thật, điện thoại thật; môi trường không truy cập GitHub Pages (403).

- **Phiên 4 (2026-10-31):** ptg gửi lại zip + phien3.patch + HANDOFF, nhờ sửa tiếp và đưa lên GitHub. Xác nhận zip = repo GitHub + phien3.patch (bản zip đã có sẵn Giai đoạn 3; patch không áp lại được lên zip). Làm **Giai đoạn 4**: thần số học Pythagoras (bỏ dấu NFD + đ→d; Y là nguyên âm khi hai chữ cạnh nó đều không phải nguyên âm; số chủ đạo 11/22/33; đường đời/sứ mệnh/linh hồn/nhân cách/ngày sinh/thái độ; năm-tháng-ngày cá nhân; 4 đỉnh cao + thử thách; số thiếu; 8 mũi tên trên ngày sinh dương), thiên văn tự tính (Meeus rút gọn: kinh độ Mặt Trời/Trăng, pha, trăng tròn/non kế tiếp, cung Mọc), cung hoàng đạo nhiệt đới, giao diện chương Lá số. Chụp ảnh xác nhận cảnh đã sáng và tên đúng. Thử đẩy GitHub: 403. Giao zip.
- **Phiên 3 (2026-10-31):** ptg yêu cầu (1) cảnh quá tối → sáng lên; (2) đổi hết tiếng Trung sang tiếng Việt, chùa là Diệu Giang Tự; (3) làm tiếp các bước còn lại. Đã làm 1, 2 và **Giai đoạn 3** (engine cá nhân, form hồ sơ lưu localStorage + Sheet, xuất/nhập JSON, nút xóa toàn bộ, Storage.gs theo bài học GAS: cột văn bản, chuẩn hóa Date, upsert đọc cột khóa, LockService, CacheService). Chụp ảnh kiểm bằng Chromium headless: chạy `node shot.mjs` kiểu như trong ghi chú mục 8D. **Chưa làm Giai đoạn 4–9** (xem mục 8).

- **Phiên 2c (2026-10-31):** ptg bảo "tiếp tục". Dựng Giai đoạn 2: `js/engines/lunar.js` (Hồ Ngọc Đức, UTC+7, nhuận, có cả âm→dương), `canchi.js` (Can Chi ngày/tháng/năm/giờ, 30 Nạp âm), `dayscore.js` (Trực theo tháng tiết, Tú, 12 thần, giờ Hoàng đạo, Tam nương, Nguyệt kỵ, Dương công kỵ, Bành Tổ, tiết khí, điểm 0–100 + dấu vết), `js/data/knowledge.json`, `js/ui/today.js` + CSS (chương #today: chọn ngày, vòng 12 giờ SVG, vòng điểm, nên/tránh, dấu vết suy luận, MOOD theo điểm), `tests/engines.test.mjs` (node:test, KHÔNG dùng Vitest để khỏi phụ thuộc npm). Đã chụp màn hình desktop/mobile kiểm tra.

- **Phiên 1 (2026-10-31):** đổi tên thành Diệu Giang Tự; chọn GitHub Pages + GAS; dựng toàn bộ Giai đoạn 1 (≈1.430 dòng); thêm smoke test + workflow Pages; viết HANDOFF đầu tiên. Môi trường chặn mạng nên chưa chạy trên trình duyệt.
- **Phiên 2b (2026-10-31):** ptg bảo thực hiện tiếp và tự động đẩy lên GitHub. Đổi tên → LINH QUANG, `npm test` đạt (cú pháp, file bắt buộc, quét tên, 7 mốc = 7 section), thêm 大雄寶殿 vào subset font Hán, đẩy mã + docs lên `main`. Chưa xem trình duyệt.
- **Phiên 2 (2026-10-31):** ptg gửi lại kế hoạch (`KE_HOACH.md`, Phần A–F + Prompt 0–9), zip Giai đoạn 1, link repo `tp9sach-ops/loinhuan.github.io` (đọc qua API thấy rỗng), cây thư mục mục tiêu và prompt chủ mới (tên "LINH QUANG"). Yêu cầu: viết bàn giao cho mỗi phiên và chép cây thư mục + prompt vào bàn giao. Đã viết bản này. **Không sửa mã, không đẩy lên GitHub.** Phát hiện 3 xung đột (mục 3).

- **Phiên 6 (2026-10-31):** ptg gửi HANDOFF + zip phiên 5, nhờ làm tiếp và đưa lên GitHub (trùng tên thì ghi đè, file không đổi giữ nguyên). Đã: giải nén zip, đối chiếu repo, chép đè, `npm test` 76 đạt, đẩy; rồi làm Giai đoạn 6 (xem mục 2), test 87 đạt, chụp ảnh kiểm, đẩy.
- **Phiên 5 (2026-10-31):** ptg: (1) đổi tên → Diệu Giang Tự (đã đổi toàn mã, test quét tên cũ "Linh Giang/Linh Quang/Kage"); (2) đền Việt Nam, cây cỏ giống code mẫu → đền 3D vốn đã là chùa Việt, thêm lớp tiền cảnh cây cỏ; (3) làm tiếp → Giai đoạn 5 phần Bát tự + Vận trình; (4) tự đẩy GitHub, trùng tên thì ghi đè. Kết quả đẩy GitHub xem mục 2.

## 8. Việc tiếp theo (theo thứ tự)

**A. ptg cần làm/đối chiếu (Giai đoạn 2):**
- Mở trang, chọn vài ngày, so với lịch vạn niên bạn tin: Trực, Sao (Tú), Thần ngày, giờ Hoàng đạo, Dương công kỵ nhật. Dữ liệu đánh dấu `canDoiChieu` trong `js/data/knowledge.json` (Tú offset `offsetJd`=11, bảng Dương công kỵ, điểm Trực) **chưa được đối chiếu**.
- Đã chắc chắn (có test): âm lịch Tết 2024/2025/2026, tháng 2 nhuận 2023, Can Chi ngày/năm/tháng/giờ, Nạp âm, Trực lặp ở ngày giao tiết, giờ Hoàng đạo ngày Tý.
- Chưa đưa vào: **Sát chủ, Thọ tử** (thiếu bảng tra đáng tin), điểm cho 28 Tú (mỗi sách một kiểu). Cần ptg chọn nguồn/bảng.
- Quy ước đang dùng: tháng Can Chi theo **tháng âm** (kiểu lịch Việt); Trực và thần ngày theo **tháng tiết**; ngày giao tiết thuộc tháng mới; giờ Tý sớm (23h–1h tính cùng ngày).

**B0. ptg đối chiếu Giai đoạn 5:** (a) trụ Bát tự vài ngày sinh bạn biết với phần mềm uy tín (quy ước: năm đổi ở Lập xuân, tháng theo tiết khí, giờ Tý sớm); (b) bảng Tàng can, hệ số tháng sinh 1,5, ngưỡng thân vượng 50% (`BATU_CFG`); (c) Tam tai, Kim lâu. Đại vận: 3 ngày = 1 tuổi tính theo số ngày (không theo giờ).

**B0'. ptg đối chiếu Giai đoạn 6:** bảng trọng số (`weights.json`) lấy từ kế hoạch ban đầu; cách chia 5 lĩnh vực (từ khóa Trực, Thập thần của Can năm, pha Trăng) là quy ước dự án, chưa có nguồn kinh điển; độ tin cậy = trung bình có trọng số × √(tỷ lệ trọng số các môn có mặt).

**B. Việc tiếp theo của AI (Phiên 7 trở đi):** Giai đoạn 5b Tử vi → thêm môn `tuVi` vào tổng hợp; Giai đoạn 4b hành tinh → môn `hoangDao`; Giai đoạn 7 (Chỉ tay/Nhân tướng AI vision, `gas/Vision.gs`); Giai đoạn 8 (Chùa online: nhang, mõ, chuông Web Audio, xin xăm, tường nguyện); Giai đoạn 9 (PWA, font tự host, a11y, SEO). Cũ hơn: (1) Giai đoạn 4b nếu ptg muốn: hành tinh + góc chiếu + nghịch hành + Nhật/Nguyệt thực (tự tính hoặc nhúng `astronomy-engine` ghim phiên bản; nhớ dung lượng file khi đẩy qua công cụ). (2) Giai đoạn 5b: Tử vi đẩu số (an Mệnh/Thân, Cục, Tử Vi + 14 chính tinh, Tứ hóa, Đại hạn) và Cửu diệu/Hoang ốc; rồi 6 → 9 theo mục 2. Engine `batu.js` chưa trả đủ `{tong, tai_loc,...}`: Giai đoạn 6 sẽ thêm hàm chấm điểm. (3) Các engine mới trả điểm qua `scoreNumerology()` (đã có); Hoàng đạo/Thiên văn chưa có hàm chấm điểm 6 lĩnh vực — làm ở Giai đoạn 6. Quy ước đã chọn ở Giai đoạn 4 (cần ptg đối chiếu): Y nguyên âm/phụ âm; năm-tháng-ngày cá nhân rút về 1–9 (không giữ số chủ đạo); mũi tên tính trên ngày sinh dương, không trên tên; bảng lệch điểm theo ngày cá nhân (`mauNgay`) là quy ước dự án; giờ sinh → lấy giữa canh giờ (Tý = 0h) theo giờ UTC+7 để tính Mặt Trăng và cung Mọc; nơi sinh chọn trong 15 thành phố (`zodiac.json › noiSinh`). Mỗi engine phải trả `{tong, tai_loc, su_nghiep, tinh_cam, suc_khoe, quy_nhan}` + `nhan` + `doTinCay` (Giai đoạn 3 hiện đặt 5 lĩnh vực = điểm tổng; Giai đoạn 6 sẽ chia thật).

**B2. ptg cần làm cho Giai đoạn 3:** (a) dán `gas/Code.gs` + `gas/Storage.gs` vào Apps Script, chạy `setup()` một lần, Deploy Web app (Execute as: Me, Access: Anyone), dán URL `/exec` vào `js/config.js` (`apiUrl`), rồi thử lưu hồ sơ và bấm "Xóa dữ liệu của tôi", mở Sheet kiểm các cột ngày không bị đổi thành Date; (b) đối chiếu bảng `js/data/personal.json` (Lục hợp/Tam hợp/Lục xung/Hình/Hại/Phá, Hỷ thần, Tài thần theo Can ngày, số Hà Đồ) với sách bạn tin dùng.

**C. Việc cũ còn lại:**

1. Tên đã chốt (Diệu Giang Tự). Còn hỏi ptg: chuyển sang cây thư mục mới hay giữ phẳng.
2. ptg bật Pages (Settings → Pages → Source: GitHub Actions), xem Actions chạy xanh, mở trang và báo: có hiện cảnh không, FPS, ảnh chụp từng chương. Giai đoạn 1 chỉ coi là xong khi cuộn mượt và camera đúng ở cả 7 chương.
3. Rủi ro Giai đoạn 1 cần kiểm: three.js + addons (EffectComposer, UnrealBloomPass, OutputPass) từ jsdelivr; tỷ lệ mái đầu đao/vị trí công trình/góc camera; chữ Hán hoành phi phụ thuộc font tải kịp; hiệu năng mobile; GAS chưa deploy (`apiUrl` rỗng). Chạy thử cục bộ: `python3 -m http.server 8080` (ES modules không chạy bằng `file://`); `?mood=0.8` / `?mood=-0.8` để xem MOOD.
4. Tự host font vào `assets/fonts/` (Việt + latin-ext) thay Google Fonts; thêm service worker + manifest (PWA); đổi test sang Vitest khi bắt đầu Giai đoạn 2.
5. ~~Giai đoạn 2~~ (XONG, xem mục 7 Phiên 2c). Mô tả gốc: `lunar.js` (Hồ Ngọc Đức, UTC+7, tháng nhuận), `canchi.js`, `dayscore.js` (12 Trực, 28 Tú, 12 thần Hoàng/Hắc đạo, giờ Hoàng đạo, Tam nương, Nguyệt kỵ, Dương công kỵ nhật, Sát chủ, Thọ tử, Bành Tổ); bảng tra `js/data/knowledge.json`; thay khối giữ chỗ ở `#today`; ≥10 ngày kiểm thử có đáp án trong `tests/` để ptg đối chiếu lịch vạn niên; nối `LGT.setMood(...)` theo điểm ngày.

### Quy ước kỹ thuật phải giữ
- Số mốc `CAM` trong rail phải bằng số `data-cam` trong `index.html` (trừ footer); test kiểm tra.
- Mỗi engine trả `{tong, tai_loc, su_nghiep, tinh_cam, suc_khoe, quy_nhan}` (0–100) + `nhan` + `doTinCay` (0–1).
- Chú thích mã tiếng Việt, tên hàm/biến tiếng Anh.
- Các trường phái phải chọn rõ và để cấu hình được trong `knowledge.json`: Tử vi Nam/Bắc phái; giờ Tý sớm/muộn; cách tính tháng nhuận; số học Pythagoras/Chaldean.

### Bảng trọng số bộ tổng hợp (Giai đoạn 6) → `js/data/weights.json`

| Môn | Ngày | Tháng | Năm | Đường đời |
|---|---|---|---|---|
| Bói ngày | .40 | .15 | .05 | 0 |
| Bát tự | .20 | .25 | .25 | .20 |
| Tử vi | .05 | .15 | .30 | .30 |
| Thần số học | .15 | .20 | .20 | .25 |
| Hoàng đạo + hành tinh | .15 | .20 | .15 | .10 |
| Thiên văn | .05 | .05 | .05 | 0 |
| Chỉ tay / nhân tướng | 0 | 0 | 0 | .15 (điều chỉnh) |

Thiếu dữ liệu (vd. không có giờ sinh) → bỏ môn đó, hạ độ tin cậy. ≥3 môn cùng hướng → "Tín hiệu mạnh"; mâu thuẫn → "Cần cân nhắc" nêu môn nào nói gì. Đầu ra: tóm tắt 1 câu, điểm 5 lĩnh vực, 3 lời khuyên, nên làm/nên tránh, giờ–hướng–màu–số, "Dấu vết suy luận".

## 9. Tài liệu đi kèm

- `KE_HOACH.md`: kế hoạch đầy đủ (Phần A nhận xét Kage, B kiến trúc + 11 bộ máy + bộ tổng hợp + Sheet + quyền riêng tư, C thiết kế 7 chương + design tokens + cảnh 3D, D lộ trình, E Prompt 0–9, F lưu ý). Đặt vào repo ở `docs/KE_HOACH.md`. Lưu ý: các phần nói về chạy trong GAS/HtmlService đã bị thay bằng kiến trúc mục 4.

## 10. Prompt khởi động phiên mới (dán nguyên văn)

```
Đọc HANDOFF.md của dự án DIỆU GIANG TỰ trước, rồi làm tiếp phần "Việc tiếp theo" (mục 8).
Tôi nói tiếng Việt thường ngày, không cần biết tên file. Khi sửa mã có sẵn hãy đưa đoạn TÌM (đầy đủ, nguyên văn)
và đoạn THAY BẰNG (đầy đủ). Cần đoạn mã nào thì hỏi tôi. Sau MỖI câu trả lời, đính kèm HANDOFF.md đã cập nhật
(chép nguyên văn quy tắc ở mục 0).
```

## 11. Cách chụp ảnh kiểm giao diện trong môi trường AI (đã dùng được ở phiên 3 và 4; phiên 4 dùng `npm i three@0.160.1 playwright-core @sparticuz/chromium` trong thư mục riêng, script chặn mạng và trả three từ node_modules, đặt `localStorage lgt.profile` bằng addInitScript để thấy chương Lá số)

Môi trường chặn CDN nên cần: `npm i three@0.160.1 playwright-core @sparticuz/chromium` (npm registry được phép), chạy server tĩnh, chặn mọi request ngoài và chuyển hướng `cdn.jsdelivr.net/npm/three@0.160.1/*` sang bản three cài cục bộ; mở Chromium với `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`; chờ ≥14 giây cho cảnh dựng; `page.screenshot({timeout:120000})` (WebGL phần mềm chậm). Font Google không tải được trong môi trường này nên ảnh chụp dùng font dự phòng; trên máy ptg sẽ đẹp hơn.

- **Phiên 7 (2026-10-31):** yêu cầu của ptg: đẩy lên GitHub (ghi đè), đổi đền thành Việt Nam nhưng giữ cây cỏ như Kage, sửa chữ/nền khó nhìn. Việc làm xem đầu file. Repo: https://github.com/tp9sach-ops/loinhuan.github.io . Việc tiếp: Tử vi (5b), 4b, 7, 8, 9.
