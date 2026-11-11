# Phiên 98 — BÀN GIAO: kế hoạch triển khai GDD v2 (Diệu Giang Tự 3D)

> Phiên này CHỈ lập kế hoạch và đưa tài liệu lên repo. KHÔNG đổi mã game, KHÔNG chạy `npm test` (không có gì để test).
> Ngày: 2026-11-11. Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh `main`).

## 0. QUY TẮC BÀN GIAO (nguyên văn — chép vào mọi bản bàn giao)

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

## 1. Việc ptg yêu cầu (Phiên 98)
Lập kế hoạch các bước cần làm từ GDD v2 (file `GDD v2 — Diệu Giang Tự 3D`, soạn 11/11/2026), chia nhỏ, đẩy lên GitHub và bàn giao để phiên sau làm tiếp, đảm bảo không bị hết phiên giữa chừng khi chưa gửi được bàn giao.

## 2. Đã làm (đã đẩy lên `main`)
| File | Nội dung |
|---|---|
| `docs/GDD_v2.md` | Bản GDD v2 đầy đủ. Trước đó trên repo chỉ là file giữ chỗ "(Bản đầy đủ đang được tải lên.)", đã ghi đè |
| `docs/KE_HOACH_GDD_V2.md` | Kế hoạch G0 → G8 chia thành các mục nhỏ (mỗi mục = một lần làm, có "Xong khi") |
| `docs/PHIEN98.md` | File này |

## 3. Chưa làm / lưu ý
- **Chưa thêm dòng nhật ký vào `PROMPT.md` mục 7** (file lớn, sửa nguyên file qua công cụ dễ hỏng). Việc đầu tiên của phiên sau: thêm dòng "2026-11-11 (Phiên 98): ptg yêu cầu lập kế hoạch GDD v2 chia mục nhỏ → `docs/KE_HOACH_GDD_V2.md`" vào cuối mục 7.
- `HANDOFF.md` ở thư mục gốc đã cũ (dừng ở khoảng Phiên 13–14). Nguồn trạng thái mới nhất là `docs/PHIEN96.md`, `docs/PHIEN97_NHA_CAP45.md` và `PROMPT.md` mục 7.
- Cột "Game hiện tại" trong GDD v2 mục 1 chỉ dựa vào nhật ký, chưa đối chiếu mã thật. Bước **G0.1** làm việc này trước khi viết mã.
- Mọi con số đánh dấu (TẠM) cần playtest và ptg duyệt. 10 câu ở GDD mục 16 chưa được ptg chốt, dùng mặc định cho tới khi ptg đổi.
- Có hai việc tồn từ trước, chưa thuộc GDD v2 (xem `docs/PHIEN97_NHA_CAP45.md`): (a) phần CÁ (3 file GLB cá, hiệu ứng chúc mừng cá mới); (b) 4 test hỏng sẵn (`312`, `318`, `345`, `tutorial: chủ đề mới`). Hỏi ptg làm trước hay sau; mặc định: sửa 4 test trước (G0.3) vì cần nền test xanh.
- Đã ghi trong GDD mục 17: mô tả repo trên GitHub còn ghi "trang web hiển thị lợi nhuận kinh doanh 9 Sạch", nên đổi cho đúng (ptg tự sửa ở Settings).

## 4. Việc kế tiếp (theo thứ tự)
1. Đầu phiên: đọc `PROMPT.md`, `docs/KE_HOACH_GDD_V2.md`, file này; thêm dòng nhật ký (mục 3).
2. **G0.1** đối chiếu GDD với mã thật → tạo `docs/GDD_v2_DOICHIEU.md`. Xong khi: mỗi dòng bảng GDD mục 1 có ghi "đúng / lệch / thiếu" kèm đường dẫn file.
3. **G0.2** hỏi ptg 10 câu (GDD mục 16), cho phép trả lời "mặc định".
4. **G0.3** sửa 4 test hỏng.
5. Sau đó làm lần lượt G1.1 → G1.6. **Mỗi mục: làm → `npm test` → đẩy GitHub → báo ptg → CHỜ ptg nói "tiếp tục".**

## 5. Prompt khởi động phiên sau (dán nguyên văn)
```
Dự án DIỆU GIANG TỰ. Repo: https://github.com/tp9sach-ops/duanchuaon
Đọc PROMPT.md, docs/KE_HOACH_GDD_V2.md và docs/PHIEN98.md trước (HANDOFF.md ở gốc đã cũ). Kiểm repo thật, chạy npm test.
Làm đúng MỘT mục nhỏ kế tiếp trong docs/KE_HOACH_GDD_V2.md (mục chưa đánh dấu XONG), xong thì npm test, đẩy GitHub
(trùng tên ghi đè), báo tôi và CHỜ tôi nói "tiếp tục". Cần đoạn mã nào thì hỏi tôi, không đoán. Số liệu (TẠM) không tự chốt.
Cuối câu trả lời LUÔN đính kèm file bàn giao cập nhật (docs/PHIENxx.md) và chép nguyên văn quy tắc bàn giao.
Nếu không đủ chỗ làm hết: gửi bàn giao TRƯỚC.
```

## 6. Quy ước kỹ thuật cần giữ (rút từ PROMPT.md / PHIEN97)
- Logic thuần nằm trong `js/world/*.js` + test `tests/*.test.mjs` chạy bằng `npm test` (chỉ cần Node). Chú thích tiếng Việt, tên hàm/biến tiếng Anh.
- Tăng `VERSION` trong `sw.js` khi đổi tệp được cache (lúc viết: `dgt-v104` sau Phiên 96; kiểm lại trên repo).
- Nơi mới/nhiệm vụ mới phải theo quy tắc Phiên 60: nhiệm vụ `v-<id>` + `PLACE_STAND` + chương.
- File GLB đưa vào phải qua `tools/optimize-glb.mjs` và ghi nguồn/giấy phép ở `THIRD_PARTY.md`.
- Không đưa khóa API/token vào repo. Không nói "đã chạy/đã qua" nếu chưa chạy.
- File tải lên trùng đường dẫn thì ghi đè; không xóa file có sẵn trừ khi ptg yêu cầu.
