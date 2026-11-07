# PHIÊN 39 — Bản đồ mini + sổ tay hướng dẫn + nhiệm vụ chuỗi đổi lá/mua đất/xây nhà (BÀN GIAO)

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Nền:** `main` @ `b5696ce` (đọc thật bằng `git clone` 07/11/2026). `npm test` **533/533 đạt trên cả Node 22 và Node 20** (trước phiên: 516 trên Node 22; Node 20 đỏ vì thiếu `tests/viewport.test.mjs`).
**Cách làm (ptg):** từng mục nhỏ → giao file → báo → chờ "tiếp tục". GitHub tích hợp chỉ đọc (403) → ptg tải file lên tay (trùng tên ghi đè).

## 1. ptg yêu cầu
1. Bản đồ cập nhật: bản đồ mini hiển thị mọi vị trí liên quan và NPC.
2. Cập nhật hệ thống nhiệm vụ, dẫn đường, hướng dẫn để người chơi nắm cách chơi, mua, đổi lá, xây dựng, phóng sinh.

## 2. Đã làm
**Bản đồ**
- `js/world/minimap.js` (logic thuần): khung thế giới x −125..122, z −70..216; đổi tọa độ; danh sách điểm = 15 nơi (PLACES) + 9 Sạch, Tách Hoa, Khu nhà ở + 13 NPC + nhà của bạn (chỉ khi đang xem đúng xóm của mình) + hoa sen vàng + dấu đích đang dẫn; hit-test; mô tả "42 m · phía chánh điện".
- `js/ui/minimap.js`: bản đồ nhỏ ở cột trái-trên (dưới "đang online"), thu gọn được (`localStorage lgt.mm`), nút "Bản đồ" / "Gợi ý"; bản đồ lớn (bấm bản đồ nhỏ, nút "Bản đồ chùa" ở menu dưới, hoặc phím **M**): bấm chấm → tên + khoảng cách + nút **Dẫn tôi tới** (NPC dùng `world.goTo('npc-<id>')`, nơi dùng `walkTo(stand)`); chú giải; nút "Danh sách điểm đến" (mở danh sách chương cũ) và "Hướng dẫn chơi". Trong nhà: chấm người chơi đặt ở cửa nhà; bấm dẫn đường thì nhắc "Ra ngoài" trước. Nút +/− tự đẩy xuống nếu bản đồ nhỏ che.
- `js/ui/guide.js`: thêm `LGT.guide.target` để bản đồ vẽ dấu đích nhiệm vụ.
**Hướng dẫn**
- `js/world/tutorial.js` + `js/ui/tutorial.js`: nút **“?”** (Trợ giúp) mở sổ tay 5 chủ đề: Cách chơi · Kiếm hạt sen · Đổi lá bồ đề · Mua đất và xây nhà · Phóng sinh. Mỗi bước có nút "Đưa tôi tới" (NPC/nơi) hoặc "Chỉ nút" (nút nhấp nháy 6 giây). Đầu bảng có **"Việc nên làm bây giờ"** tự đổi theo số hạt sen, lá bồ đề và nhà: kiếm sen → đổi lá (Thầy Tri khách) → mua đất (Bác Tư) → nâng nhà → vào nhà. Con số lấy từ `merit.js`/`land.js` (đổi giá thì chữ đổi theo). Lần đầu chơi có toast nhắc nút "?" sau 16 giây (`lgt.tut`).
- **Phóng sinh và nội thất ghi thẳng là "sắp có"** — chưa có mã (xem mục 4).
**Nhiệm vụ**
- 3 nhiệm vụ "Hành trình" mới: `m-doila` (đổi lá đầu tiên, +30đ +2 sen), `m-muadat` (mảnh đất đầu tiên, +80đ +5 sen), `m-nangnha` (nâng nhà lần đầu, +60đ +5 sen). Giá trị TẠM. Sự kiện mới `doila`/`muadat`/`nangnha` phát từ `js/ui/merit.js` và `js/ui/land.js`; mỗi nhiệm vụ có nút "Dẫn đường" (đi tới Thầy Tri khách / Bác Tư).
**CI (vá lỗi L1, L2 của Phiên 38)**
- `tests/viewport.test.mjs` (mới, 5 test) — CI Node 20 hết đỏ. `.github/workflows/pages.yml` chép thêm `sw.js manifest.webmanifest robots.txt sitemap.xml` vào bản phát hành.
- `sw.js` VERSION = `dgt-v45`; `index.html` thêm `css/minimap.css`; `package.json` thêm `minimap`, `tutorial` vào danh sách test; `tests/smoke.mjs` kiểm có 5 file mới.

## 3. File thay đổi / thêm (đường dẫn repo, trùng tên ghi đè)
Mới: `js/world/minimap.js`, `js/world/tutorial.js`, `js/ui/minimap.js`, `js/ui/tutorial.js`, `css/minimap.css`, `tests/minimap.test.mjs`, `tests/tutorial.test.mjs`, `tests/viewport.test.mjs`, `docs/PHIEN39.md`.
Sửa: `js/ui/hudMenu.js` (khởi tạo + nối nút map/help + `LGT.getSen`), `js/ui/guide.js`, `js/ui/merit.js`, `js/ui/land.js`, `js/world/quests.js`, `js/world/questGuide.js`, `index.html`, `sw.js`, `package.json`, `tests/smoke.mjs`, `.github/workflows/pages.yml`, `PROMPT.md` (1 dòng mục 7).

## 4. Chưa làm / chưa kiểm được (nói thật)
- **Phóng sinh chưa có tính năng**: chưa có mã thả cá/ nhận sen ở Hồ cá. Sổ tay nói rõ "sắp có". Cần ptg chốt luật (mỗi lần thả tốn gì, được bao nhiêu hạt sen, trần/ngày) rồi làm một phiên riêng.
- **Nội thất, tham quan nhà, tiệc** (bước C/D của Phiên 38) chưa làm.
- Giao diện mới chỉ chụp thử **trên trang thử riêng** bằng Chrome (điện thoại 390/320, máy tính 1280) với dữ liệu giả — **chưa chạy trong cảnh 3D thật** (không có mạng tới CDN three.js). Cần ptg mở trang thật xem: bản đồ nhỏ có che nút nào không, nhất là điện thoại ngang/Z Fold.
- Chưa sửa L3 (`js/ui/ui.js` đặt nhầm chỗ → trong nhà vẫn nghe tiếng mưa; file lạc `landscape.js`, `phien26.patch`, `PHIEN31.md`, `PHIEN33.md`) và L4 (vị trí trong nhà bị gửi lên mạng vượt ±200) của `docs/PHIEN38.md`.
- Dấu hướng nhìn của người chơi trên bản đồ chưa có (chỉ có chấm sáng).

## 5. Việc ptg làm
1. Tải các file mục 3 lên GitHub (kéo cả thư mục, giữ đường dẫn, trùng tên ghi đè).
2. Settings → Pages → Source: nếu là "GitHub Actions" thì tab Actions phải xanh sau khi tải lên.
3. Trả lời luật **phóng sinh** (mục 4) và các câu 2–4 của `docs/PHIEN38.md` mục 4.

## 6. Phiên sau (từng mục, chờ "tiếp tục")
Đề xuất: (a) sửa L3 + L4; (b) phóng sinh ở Hồ cá khi ptg chốt luật; (c) 3d-2d chụp 4 cấp nhà; (d) nội thất; (e) tham quan + tiệc; (f) máy chủ xác nhận giao dịch lá.

## Prompt bàn giao (dán nguyên văn vào phiên mới)
```
Dự án DIỆU GIANG TỰ. Repo: https://github.com/tp9sach-ops/loinhuan.github.io
Đọc PROMPT.md, rồi docs/PHIEN39.md (mới nhất), docs/PHIEN38.md (lỗi L3, L4 chưa sửa + kế hoạch C–F). HANDOFF.md ở gốc đã cũ.
Phiên 39 xong: bản đồ mini + bản đồ lớn (phím M), sổ tay hướng dẫn nút “?”, gợi ý việc kế tiếp, 3 nhiệm vụ đổi lá/mua đất/nâng nhà, vá CI (viewport test, pages.yml). npm test 533/533 trên Node 22 và 20. sw dgt-v45.
Chưa làm: phóng sinh (chưa có luật), nội thất, tham quan/tiệc, sửa L3/L4, xem giao diện mới trong cảnh 3D thật.
Làm TỪNG MỤC NHỎ, xong giao file đúng đường dẫn (trùng tên ghi đè), báo, chờ tôi nói "tiếp tục". GitHub tích hợp chỉ đọc (403): git clone, sửa, chạy npm test trên Node 22 VÀ Node 20 (npx -y -p node@20 -- npm test), giao file để tôi tải lên tay.
Tôi nói tiếng Việt thường ngày. Cuối mỗi mục: viết lại prompt bàn giao này + đính kèm docs/PHIEN39.md đã cập nhật.
```
