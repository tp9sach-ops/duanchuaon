# HANDOFF — Web tâm linh "LINH QUANG / Linh Giang Tự" (chùa Việt 3D)

> Đọc file này đầu tiên. Nó đủ để một phiên mới, không có trí nhớ, tiếp tục đúng và chi tiết.
> Phiên hiện tại: **Phiên 2** (2026-10-31) — đã đẩy mã lên GitHub; Giai đoạn 2 đã xong phần mã và test. Cập nhật mục 2, 7, 8 ở cuối MỖI phiên.

## 0. QUY TẮC BÀN GIAO (chép nguyên văn vào mọi bản bàn giao)

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Diễn giải thực hành: sau MỖI câu trả lời, đính kèm HANDOFF.md đã cập nhật; nếu không đủ chỗ làm hết thì gửi bàn giao TRƯỚC; luôn chép nguyên văn quy tắc này vào bản bàn giao mới.

## 1. Chủ dự án và cách làm việc

- Chủ dự án: ptg (quản lý tại 9 Sạch). Nói tiếng Việt thường ngày, **không cần biết tên file/kỹ thuật**.
- Sửa mã có sẵn: đưa đoạn **TÌM** (nguyên văn, đầy đủ, không viết tắt, không "...") rồi đoạn **THAY BẰNG** đầy đủ để dán vào Find & Replace.
- Cần đoạn mã nào thì **yêu cầu ptg gửi**, không đoán.
- Môi trường làm việc của AI có thể chặn mạng (npm/CDN); phải nói rõ phần nào chưa chạy được.
- Điều tra trước khi sửa; không bịa yêu cầu/kiến trúc; không nói test đã qua nếu chưa chạy.

## 2. Trạng thái hiện tại

| Hạng mục | Trạng thái |
|---|---|
| Repo GitHub `https://github.com/tp9sach-ops/loinhuan.github.io` | Phiên 2: ban đầu rỗng; **đã đẩy toàn bộ mã Giai đoạn 1 (đã đổi tên LINH QUANG) + HANDOFF.md + docs/KE_HOACH.md lên nhánh `main`**. Cần ptg bật Pages (Settings → Pages → Source: GitHub Actions). |
| Bản mã Giai đoạn 1 | Nằm trong `linh-giang-tu.zip` (ptg đã gửi, 168 KB, ~1.430 dòng). Gồm: index.html, css/style.css, js/{main,ui,util,api,config}.js, js/scene/{index,rail,temple,nature,particles,textures}.js, gas/Code.gs, tests/smoke.mjs, package.json, .github/workflows/pages.yml, README.md, HANDOFF.md (cũ). |
| Giai đoạn 1 (khung + cảnh 3D + camera rail) | Đã chạy thử trong Chromium (Playwright, three.js cài cục bộ, WebGL phần mềm): cảnh chùa hiện đúng, không lỗi JS, không tràn ngang ở 1366px và 390px. **Chưa đo FPS trên điện thoại thật.** |
| Giai đoạn 2 (lịch Âm, Can Chi, bói ngày chung, vòng 12 giờ) | **Xong mã + 17 test đạt + đã xem giao diện.** Còn: đối chiếu Trực/Tú/Dương công kỵ với lịch vạn niên (mục 8). |
| Giai đoạn 3–9 | Chưa làm. |
| Phiên 2 | Đổi tên mã sang LINH QUANG (chữ Hán 靈光), đẩy lên GitHub. Cấu trúc thư mục vẫn PHẲNG (chưa tách theo cây mới). |

Chi tiết giai đoạn: 1 khung+cảnh · 2 lịch Âm/Can Chi/bói ngày · 3 form hồ sơ + lưu Sheet + bói ngày cá nhân · 4 thần số/hoàng đạo/thiên văn · 5 bát tự/tử vi/vận trình · 6 bộ tổng hợp + thẻ "Lá bùa" · 7 chỉ tay/nhân tướng AI vision · 8 chùa online · 9 tối ưu/PWA/SEO/a11y/hướng dẫn triển khai.

## 3. Xung đột đã gặp và cách phiên 2 xử lý (ptg chưa trả lời, chỉ nói "thực hiện tiếp và đẩy lên github")

1. **Tên:** prompt/cây thư mục mới của ptg dùng **"LINH QUANG"** (`linh-quang/`). Mã Giai đoạn 1 và HANDOFF cũ dùng **"Linh Giang Tự (靈江寺)"** và `tests/smoke.mjs` **báo LỖI nếu còn chữ "Linh Quang" hoặc "Kage"** trong mã. → **Phiên 2 đã chọn "LINH QUANG"** (theo prompt mới nhất của ptg): đổi tiêu đề, wordmark, chữ Hán 靈江寺→靈光 (hoành phi, font subset), README, GAS, package.json (`linh-quang`); smoke test nay báo lỗi nếu còn "Linh Giang" hoặc "Kage". Giữ nguyên định danh nội bộ `LGT`, `lgt.userKey`, `lgt.sound`. Nếu ptg muốn quay lại tên cũ thì đảo ngược.
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

Chưa tạo: `js/engines/*`, `js/data/*.json`, `js/temple/*`, `js/ui/*`, `gas/Vision.gs`, `gas/Storage.gs`, `assets/`, service worker/manifest, Vitest.

## 6. PROMPT CHỦ (chép nguyên văn từ ptg — dán đầu phiên mới)

```
Bạn là kỹ sư front-end WebGL + chuyên gia văn hóa tâm linh. Xây web "LINH QUANG" (chùa Việt, đêm trên núi)
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

- **Phiên 2c (2026-10-31):** ptg bảo "tiếp tục". Dựng Giai đoạn 2: `js/engines/lunar.js` (Hồ Ngọc Đức, UTC+7, nhuận, có cả âm→dương), `canchi.js` (Can Chi ngày/tháng/năm/giờ, 30 Nạp âm), `dayscore.js` (Trực theo tháng tiết, Tú, 12 thần, giờ Hoàng đạo, Tam nương, Nguyệt kỵ, Dương công kỵ, Bành Tổ, tiết khí, điểm 0–100 + dấu vết), `js/data/knowledge.json`, `js/ui/today.js` + CSS (chương #today: chọn ngày, vòng 12 giờ SVG, vòng điểm, nên/tránh, dấu vết suy luận, MOOD theo điểm), `tests/engines.test.mjs` (node:test, KHÔNG dùng Vitest để khỏi phụ thuộc npm). Đã chụp màn hình desktop/mobile kiểm tra.

- **Phiên 1 (2026-10-31):** đổi tên thành Linh Giang Tự; chọn GitHub Pages + GAS; dựng toàn bộ Giai đoạn 1 (≈1.430 dòng); thêm smoke test + workflow Pages; viết HANDOFF đầu tiên. Môi trường chặn mạng nên chưa chạy trên trình duyệt.
- **Phiên 2b (2026-10-31):** ptg bảo thực hiện tiếp và tự động đẩy lên GitHub. Đổi tên → LINH QUANG, `npm test` đạt (cú pháp, file bắt buộc, quét tên, 7 mốc = 7 section), thêm 大雄寶殿 vào subset font Hán, đẩy mã + docs lên `main`. Chưa xem trình duyệt.
- **Phiên 2 (2026-10-31):** ptg gửi lại kế hoạch (`KE_HOACH.md`, Phần A–F + Prompt 0–9), zip Giai đoạn 1, link repo `tp9sach-ops/loinhuan.github.io` (đọc qua API thấy rỗng), cây thư mục mục tiêu và prompt chủ mới (tên "LINH QUANG"). Yêu cầu: viết bàn giao cho mỗi phiên và chép cây thư mục + prompt vào bàn giao. Đã viết bản này. **Không sửa mã, không đẩy lên GitHub.** Phát hiện 3 xung đột (mục 3).

## 8. Việc tiếp theo (theo thứ tự)

**A. ptg cần làm/đối chiếu (Giai đoạn 2):**
- Mở trang, chọn vài ngày, so với lịch vạn niên bạn tin: Trực, Sao (Tú), Thần ngày, giờ Hoàng đạo, Dương công kỵ nhật. Dữ liệu đánh dấu `canDoiChieu` trong `js/data/knowledge.json` (Tú offset `offsetJd`=11, bảng Dương công kỵ, điểm Trực) **chưa được đối chiếu**.
- Đã chắc chắn (có test): âm lịch Tết 2024/2025/2026, tháng 2 nhuận 2023, Can Chi ngày/năm/tháng/giờ, Nạp âm, Trực lặp ở ngày giao tiết, giờ Hoàng đạo ngày Tý.
- Chưa đưa vào: **Sát chủ, Thọ tử** (thiếu bảng tra đáng tin), điểm cho 28 Tú (mỗi sách một kiểu). Cần ptg chọn nguồn/bảng.
- Quy ước đang dùng: tháng Can Chi theo **tháng âm** (kiểu lịch Việt); Trực và thần ngày theo **tháng tiết**; ngày giao tiết thuộc tháng mới; giờ Tý sớm (23h–1h tính cùng ngày).

**B. Việc tiếp theo của AI:** Giai đoạn 3 (form hồ sơ, Storage.gs + Sheet, bói ngày cá nhân: xung/hợp theo tuổi, Hỷ thần/Tài thần, màu, số). Trước đó xác nhận tên/cấu trúc (mục 3) nếu ptg đã trả lời.

**C. Việc cũ còn lại:**

1. Xác nhận với ptg: tên LINH QUANG ổn chưa; chuyển sang cây thư mục mới hay giữ phẳng.
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
Đọc HANDOFF.md của dự án LINH QUANG / Linh Giang Tự trước, rồi làm tiếp phần "Việc tiếp theo" (mục 8).
Tôi nói tiếng Việt thường ngày, không cần biết tên file. Khi sửa mã có sẵn hãy đưa đoạn TÌM (đầy đủ, nguyên văn)
và đoạn THAY BẰNG (đầy đủ). Cần đoạn mã nào thì hỏi tôi. Sau MỖI câu trả lời, đính kèm HANDOFF.md đã cập nhật
(chép nguyên văn quy tắc ở mục 0).
```
