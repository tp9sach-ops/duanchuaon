# PHIÊN 100 — Sửa lỗi văn bản lịch yêu quái (Hành trình + Hướng dẫn) và 3 test đỏ — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → docs/PHIEN99.md → file này. Nguồn mã thật: repo `tp9sach-ops/duanchuaon`, nhánh `main` (commit `3807f43`, 2026-11-11). **Lưu ý: đầu file HANDOFF.md vẫn ghi "Phiên 80"; mã thật đang ở Phiên 99 → 100.**

## Yêu cầu
Gp: xem repo, chỉ xem chỗ cần thiết, cập nhật không lỗi, làm từng bước. Chọn bước nhỏ, an toàn: xử lý 4 test đỏ có sẵn (PHIEN99 ghi #322, #328, #355, #767).

## Phát hiện (đã đo bằng mã)
- **Lỗi chạy thật:** `js/world/journey.js` (trang "Sức mạnh · Yêu quái" của Hành trình) đọc `DIFF[k].hour` với `k` lấy từ `SLOT_ORDER` (`trua/chieu/toi`), nhưng `DIFF` chỉ có `trung/cao` và KHÔNG có `hour` → `buildJourney()` văng `TypeError: Cannot read properties of undefined (reading 'hour')`. Nguyên nhân gốc: lịch yêu quái đã đổi từ "mỗi tháng, 2 khung (15:00, 20:00)" sang "MỖI NGÀY 3 khung 12:00/16:00/20:00" (`js/world/yeuquai.js`, `SLOTS`; `tests/yeuquai.test.mjs` khẳng định lịch này) nhưng `journey.js` và `tutorial.js` còn theo cấu trúc cũ.
- `js/world/tutorial.js` cùng lỗi cũ (`DIFF.trung.hour`, `DIFF.cao.hour` = undefined → in "undefined:00") và nói sai "mỗi tháng / hai khung giờ".

## Đã làm
| File | Thay đổi |
|---|---|
| `js/world/journey.js` | import `SLOTS` thay `SLOT_ORDER`; đọc giờ từ `SLOTS` (`s.hour`, `DIFF[s.diff].ten`); chữ "Mỗi ngày … 3 lần"; ô `mo` = "Mỗi ngày ba khung giờ" |
| `js/world/tutorial.js` | import `SLOTS` + hàm `slotHours(diff)`; chữ "Mỗi ngày … 3 lần: 12:00 và 16:00 độ khó Trung bình, 20:00 độ khó Cao"; tên chủ đề "Yêu quái mỗi ngày" |
| `tests/journey.test.mjs`, `tests/tutorial.test.mjs` | cập nhật kỳ vọng theo lịch mới (12:00, 16:00, 20:00) |
| `sw.js` | `dgt-v107` (buộc máy cũ tải bản mới) |

Con số thưởng (60/100 điểm, 3/5 sức mạnh, 90 phút) KHÔNG đổi. Câu "Khi còn dưới 14 ngày, game báo trước ngày giờ" giữ nguyên vì `js/ui/yeuquai.js` dòng ~100 vẫn có tính năng đó.

## Kiểm
- `npm test` (Node 22): **869 tổng, 869 đạt, 0 đỏ** (đã chạy lại toàn bộ sau khi sửa #355). Trước sửa: 865 đạt, 4 đỏ.
- In thử văn bản thật bằng Node: Hướng dẫn và ô Hành trình ra đúng "12:00 / 16:00 / 20:00".
- **Chưa xem trong trình duyệt** (chỉ đổi chữ + sửa lỗi đọc trường; không đụng cảnh 3D).

## Gp phải làm
1. Tải các file trong `cap-nhat-phien100.zip` lên repo đúng đường dẫn (trùng tên ghi đè): `js/world/journey.js`, `js/world/tutorial.js`, `tests/journey.test.mjs`, `tests/tutorial.test.mjs`, `tests/landpool.test.mjs`, `sw.js`, `docs/PHIEN100.md`. Phiên này không đẩy trực tiếp được GitHub.
2. Mở game → Hành trình → trang Sức mạnh · Yêu quái, và "?" → Yêu quái: xem chữ giờ đã đúng chưa.

## Test #355 (`tests/landpool.test.mjs`) — ĐÃ SỬA (bước 2 cùng phiên)
Test kiểm CHUỖI MÃ dựng hồ trong `js/scene/land.js`, đã không còn vì nhà nay là GLB. Đã đọc `nha-3-villa.glb` ("Modern Luxury Villa With Pool"): 1 mesh, kéo ra phía trước +z tới ~8,4 m, nên hồ nằm trước nhà và vật cản `poolRect` là hợp lý. Test mới kiểm cấp 3 vẫn trỏ tới `nha-3-villa.glb` và file tồn tại. **Chưa nhìn bằng mắt** việc vật cản hồ có khớp chính xác hồ trong mô hình không: Gp thử đi quanh hồ Villa trong game; lệch thì chỉnh hằng số trong `poolRect` (`js/world/land.js`, 0,8 / 3,8 / 1,7).

## VIỆC KẾ (từng mục, xong báo, chờ Gp "tiếp tục")
1. Gp thử chibi (PHIEN99, mục "Gp phải làm" 2–3) và báo chỗ xấu/lệch; chốt #355 ở trên.
2. Động tác chibi còn thiếu: bơi (`js/world/swim.js`), câu cá (`fishing.js`), nhảy; đồng bộ `setHold/act` cho người chơi khác (`js/net/roomClient.js`).
3. Xếp hạng ("Bảng vàng"), nối hạ tầng ZONE, kế hoạch GDD v2 (`docs/KE_HOACH_GDD_V2.md`).

## Prompt khởi động cho phiên sau (dán nguyên)
> Đọc PROMPT.md → docs/PHIEN99.md → docs/PHIEN100.md. Repo `tp9sach-ops/duanchuaon`. Phiên 100 sửa lỗi lịch yêu quái 12/16/20 ở journey.js + tutorial.js (test #355 đã sửa). Kiểm repo đã có bản Phiên 100 chưa (`sw.js` = dgt-v107); nếu chưa, nhắc Gp tải zip. Làm MỘT mục, `npm test`, gửi bàn giao docs/PHIEN101.md, rồi CHỜ Gp nói "tiếp tục".
