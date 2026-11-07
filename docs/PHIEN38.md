# PHIÊN 38 — Xây nhà, bước 3d-2: BÊN TRONG NHÀ = MỘT CẢNH RIÊNG ĐỂ BƯỚC VÀO (BÀN GIAO, cập nhật sau từng mục nhỏ)

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Nền (đọc thật 07/11/2026 bằng `git clone`):** `main` @ `b5696ce`. HANDOFF.md ở gốc repo đã cũ (chỉ tới Phiên 14a); bản chuẩn là `PROMPT.md` + `docs/PHIEN3x.md`.
**Cách làm (ptg):** làm TỪNG MỤC NHỎ, xong mục nào đưa file lên GitHub, báo, CHỜ ptg nói "tiếp tục". **Giới hạn thật:** tích hợp GitHub chỉ ĐỌC (403) → giao file đúng đường dẫn, ptg tải lên tay (trùng tên ghi đè). Tôi không xóa file trên GitHub; việc xóa ptg làm tay.

## 1. Trạng thái thật của mã (đã kiểm, không suy đoán)
- 3d-2a (`js/world/interior.js` + test), 3d-2b (`js/scene/interior.js`, `LGT.interiorScene`), 3d-2c (`js/ui/house.js`, `world.teleport(x,z,ry)`, `houseAction`, nối `hudMenu.js` + `scene/index.js`) **ĐÃ CÓ trong repo** (docs bản cũ ghi 2b/2c là "chưa" — sai, đã sửa ở đây).
- `sw.js` VERSION = **dgt-v44** (prompt cũ ghi v43). `npm test` trên **Node 22: 516/516 đạt**, smoke đạt, `node --check` mọi file .js/.mjs đạt, không import nào hỏng trong mã đang chạy. Quét bí mật: chỉ có khóa Firebase web trong `js/config.js` — đó là khóa công khai theo thiết kế, luật `firebase/database.rules.json` chặt (chỉ ghi nút của mình, có kiểm kiểu/miền).
- **Chưa làm:** 3d-2d (chạy thử Chromium, chụp 4 cấp nhà, kiểm nút trên điện thoại, camera/va chạm trong phòng).

## 2. LỖI TÌM THẤY (xếp theo mức; chưa sửa cái nào — chờ ptg nói "tiếp tục")
**L1 — CAO, ĐÃ TÁI HIỆN: CI sẽ ĐỎ trên Node 20.** `package.json` gọi `tests/viewport.test.mjs` nhưng file này **chưa từng có trong repo** (git log không thấy; `js/ui/viewportLogic.js` không có test nào). Node 22 lờ file thiếu nên máy chạy xanh; **Node 20 (đúng bản `pages.yml` dùng) báo "Could not find …/viewport.test.mjs", `npm test` thoát mã 1 và không chạy test nào của `node --test`.** `deploy` có `needs: test` → nếu Pages nguồn là GitHub Actions thì web **không cập nhật**. (Lần trước cũng từng xảy ra với `clocklabel.test.mjs`.) Chưa biết 516 test có đạt hết trên Node 20 không vì lần chạy dừng ở file thiếu → sau khi sửa phải chạy lại bằng `npx -y -p node@20 -- npm test`.
**L2 — CAO nếu Pages dùng Actions, CHƯA XÁC NHẬN (không mở được trang thật):** `pages.yml` bước "Gom file tĩnh" chỉ chép `index.html .nojekyll css js assets` vào `_site`. **`sw.js`, `manifest.webmanifest`, `robots.txt`, `sitemap.xml` không được chép** → `main.js` đăng ký `sw.js` sẽ lỗi (bị `.catch` nuốt, không báo), PWA/offline/manifest hỏng. Nếu Pages chạy "từ nhánh main" thì không sao. ptg cần xem: Settings → Pages → Source.
**L3 — TRUNG BÌNH: tải nhầm đường dẫn.** `js/ui/ui.js` là bản **MỚI** của `js/ui.js` (thêm `|| LGT.inHouse` vào `sheltered` của tiếng mưa) nhưng nằm sai chỗ; `js/ui.js` thật vẫn bản cũ → **trong nhà vẫn nghe tiếng mưa**. Hai file khác nhau đúng 1 dòng (dòng 203). Cũng lạc: `landscape.js` ở GỐC là bản **CŨ** (114 dòng; thiếu `NO_TREE_ZONES`, `inHall`, `inNoTree`) so với `js/world/landscape.js` (122 dòng, đang dùng) — không ai import, chỉ gây nhầm. Còn `phien26.patch`, `PHIEN31.md`, `PHIEN33.md` ở gốc (PROMPT/PHIEN34 đã ghi "xóa khi ptg đồng ý").
**L4 — TRUNG BÌNH, suy ra từ mã + luật (chưa thử máy chủ thật): vị trí trong nhà bị gửi lên mạng.** Phòng ở `INTERIOR = (400, 400)` nhưng `js/net/room.js` gửi nguyên `x,z`, không chỗ nào kiểm `LGT.inHouse`. Firebase chỉ nhận |x|,|z| ≤ 200 → ghi bị từ chối (người khác thấy bạn đứng im ở cửa nhà); GAS `Room.gs` kẹp về `LIMIT = 200` → người khác thấy bạn bị kéo về góc (200, 200) ngoài bản đồ. Phải sửa trước bước 5 (tham quan/tiệc).
**L5 — THẤP:** `docs/PHIEN38.md` và `PROMPT.md` mục 7 thiếu 2b, 2c và phiên kiểm tra này (đã bổ sung ở đây).

## 3. KẾ HOẠCH — từng mục nhỏ, xong mục nào báo rồi CHỜ "tiếp tục"
| Mục | Làm gì | File (đường dẫn repo) | Xong khi |
|---|---|---|---|
| **A1** | Sửa L1: **viết `tests/viewport.test.mjs`** thật cho `viewportLogic.js` (mặc định; nếu ptg không muốn thì gỡ dòng khỏi script). Chạy `npm test` trên Node 22 **và** Node 20 | `tests/viewport.test.mjs` (mới), (`package.json` nếu gỡ) | `npm test` xanh cả Node 20 và 22 |
| **A2** | Sửa L2: thêm vào bước gom file `cp sw.js manifest.webmanifest robots.txt sitemap.xml _site/` (an toàn cho cả hai kiểu Pages) | `.github/workflows/pages.yml` | ptg thấy Actions xanh, trang có `/sw.js` |
| **A3** | Sửa L3: đặt bản đúng vào `js/ui.js` (= nội dung `js/ui/ui.js`). **ptg xóa tay** `js/ui/ui.js`, `landscape.js` (gốc), và nếu đồng ý `phien26.patch`, `PHIEN31.md`, `PHIEN33.md` | `js/ui.js`, `sw.js` (dgt-v45) | trong nhà hết tiếng mưa; không còn file lạc |
| **B1** | Sửa L4: khi `LGT.inHouse` thì gửi lên mạng **vị trí cửa nhà** (mặc định; hoặc ẩn — ptg chọn), + test | `js/net/room.js`, `tests/…` | giả lập vào nhà: dữ liệu gửi luôn trong ±200 |
| **B2 = 3d-2d** | Chạy trò chơi trong Chromium (thư mục riêng cài `three@0.160.1` + `playwright-core` + `@sparticuz/chromium`, importmap trỏ local, máy chủ http tĩnh, dùng args của `@sparticuz/chromium`, **không thêm cờ GL**); `localStorage 'lgt.land'` có `own { xom:1, plot:<id>, lv:0..3 }`, đứng gần cửa → Vào nhà / Ra ngoài; **chụp 4 cấp nhà**; kiểm nút `#house-btn` (`bottom: 150px`) có che menu trên điện thoại không; kiểm camera/va chạm trong phòng; cập nhật `docs/PHIEN37.md` (mục 3d-2), `docs/PHIEN38.md`, `PROMPT.md` mục 7 | ảnh chụp + sửa lỗi tìm ra | 4 cấp nhà vào/ra được, không lỗi JS, ảnh kèm theo |
| **C = bước 4** | Nội thất đặt/xoay/xóa: danh mục lớn (giá theo `docs/PHIEN34.md`: nhỏ 1–10 lá, vừa 10–60, lớn 80–300; bán lại hoàn 50%), lưới đặt, giới hạn số món theo cấp nhà, lưu bố trí (cục bộ trước). **Cần ptg chốt trước:** (1) danh mục đầu tiên gồm món nào / bao nhiêu món; (2) đặt đồ bằng chạm-kéo hay chọn ô; (3) giới hạn số món mỗi cấp. Mặc định nếu ptg bảo "tùy": ~30 món, chạm chọn ô, giới hạn 20/40/60/80 theo cấp | `js/world/furniture.js` (+test), `js/ui/furnish.js`, `js/scene/interior.js` | đặt/xoay/xóa/lưu được, test đạt, ảnh chụp |
| **D = bước 5** | Tham quan nhà người khác (chỉ đọc) + mở tiệc: lưu nhà + sổ xóm lên máy chủ (Firebase có sẵn luật — cần thêm nhánh `houses/` và luật mới, không nới luật cũ), cờ "đang tiệc" có hẹn giờ, danh sách tiệc ở NPC bác khu phố. **Phụ thuộc B1** | `firebase/database.rules.json`, `js/net/…`, `js/ui/house.js` | hai tab: khách thấy nhà chủ chỉ-đọc |
| **E = bước 6** | Máy chủ xác nhận trừ/cộng lá, mua đất, nâng nhà (chống sửa localStorage). **Nạp tiền (MoMo) chỉ khi ptg có tài khoản thương mại; không giả giao dịch** | `gas/…`, `js/…` | mọi giao dịch lá đi qua máy chủ |
| **F** | Việc dở cũ (PHIEN34): bình tưới + cây bồ đề lớn lên, khinh công 8 bậc + parkour, thả cá/bơi, cấp/danh hiệu/xếp hạng, tiệm thời trang, phương tiện, QA cuối; đo FPS điện thoại thật; chụp ngày mưa; âm thanh theo mùa | (từng phiên riêng) | theo từng phiên |

Thứ tự đề xuất: **A1 → A2 → A3 → B1 → B2 → C → D → E → F.** A1–A3 là việc nhỏ, làm trước vì A1 đang có khả năng chặn mọi lần deploy.

## 4. ptg cần làm / trả lời
1. Settings → Pages → **Source** đang là gì ("GitHub Actions" hay "Deploy from a branch")? Mở tab Actions xem lần chạy gần nhất đỏ hay xanh.
2. A1: viết test viewport (mặc định) hay gỡ khỏi `package.json`?
3. A3: cho phép xóa `phien26.patch`, `PHIEN31.md`, `PHIEN33.md` ở gốc không (không bắt buộc).
4. B1: người ở trong nhà thì người khác thấy **đứng ở cửa nhà** (mặc định) hay **biến mất**?

## 5. Chưa kiểm được (nói thật)
- Chưa mở Chromium (3d-2d chưa làm) → chưa nhìn bằng mắt phòng 3D, nút "Vào nhà" trên điện thoại, camera trong phòng, FPS.
- Chưa mở được trang thật (không nằm trong danh sách cho phép của phiên) → L2 chưa xác nhận.
- Chưa thử máy chủ thật (GAS/Firebase) → L4 suy ra từ mã và luật.
- Node 20: mới chứng minh được `npm test` thoát lỗi vì file thiếu; chưa biết 516 test có qua hết trên Node 20.

## File thay đổi trong lần kiểm này (tải lên đúng đường dẫn, trùng tên ghi đè)
`docs/PHIEN38.md` (file này), `PROMPT.md` (thêm 1 dòng ở mục 7). **Không sửa mã.**

## Prompt bàn giao (dán nguyên văn vào phiên mới)
```
Dự án DIỆU GIANG TỰ. Repo: https://github.com/tp9sach-ops/loinhuan.github.io
Đọc PROMPT.md, rồi docs/PHIEN38.md (bản chuẩn, mục 2 = lỗi, mục 3 = kế hoạch), rồi docs/PHIEN37.md. HANDOFF.md trên web đã cũ (tới Phiên 14a).
Đã xong: 3d-2a, 2b, 2c (mã đã có trong repo; sw dgt-v44; npm test 516/516 trên Node 22). Mới kiểm tra tổng ngày 07/11: tìm ra L1–L5 (CI đỏ trên Node 20 vì thiếu tests/viewport.test.mjs; pages.yml không chép sw.js/manifest; js/ui/ui.js tải nhầm chỗ; vị trí trong nhà bị gửi lên mạng; docs lệch). CHƯA sửa cái nào.
Việc kế, làm TỪNG MỤC NHỎ theo thứ tự A1 → A2 → A3 → B1 → B2(3d-2d) → C(bước 4) → D(bước 5) → E(bước 6) → F; xong mục nào giao file đúng đường dẫn (trùng tên ghi đè), báo, rồi chờ tôi nói "tiếp tục".
Lưu ý: GitHub tích hợp chỉ đọc (403) → git clone repo vào máy chạy, sửa, giao file để tôi tải lên tay; không tự xóa file trên GitHub. Sau khi sửa phải chạy npm test trên Node 22 VÀ Node 20 (npx -y -p node@20 -- npm test).
Tôi nói tiếng Việt thường ngày, không cần biết tên file. Cuối mỗi mục: viết lại prompt bàn giao này + đính kèm docs/PHIEN38.md đã cập nhật.
```

## Cập nhật sau Phiên 39
L1 (CI Node 20 đỏ) và L2 (`pages.yml` thiếu `sw.js`…) **ĐÃ SỬA** ở Phiên 39 (xem `docs/PHIEN39.md`): `tests/viewport.test.mjs` mới, `pages.yml` chép thêm 4 file; `npm test` 533/533 trên Node 22 và Node 20. L3, L4 vẫn chưa sửa. Mục A1, A2 coi như xong; kế tiếp A3 → B1.
