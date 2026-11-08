# PHIÊN 73 — Lộ trình có trang "Sức mạnh · Yêu quái" — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → KE_HOACH_TONG.md → PHIEN71.md → PHIEN72.md → file này.

## Bối cảnh
ptg báo đã dán xong `gas/Yq.gs` + `gas/Throw.gs` + `Code.gs` (hai case 'yq', 'thr') và deploy phiên bản mới; nói "tiếp tục". Chưa có kết quả thử 2 điện thoại.

## ĐÃ LÀM
- `js/world/journey.js`: trang thứ 5 `pageSucManh` — 4 bậc sức mạnh (Khỏe khoắn → Kim cương lực, lấy từ `TIERS`), "Thu phục yêu quái đầu tiên" (chữ lịch 15:00 độ khó Trung bình / 20:00 độ khó Cao lấy từ `DIFF`, mỗi khung 90 phút), "Sức mạnh từ yêu quái". Ô chưa làm có hướng dẫn từng bước như các trang khác. `js/ui/journey.js` đưa `str` (LGT.strength) và `yq` (kills, bonus) vào.
- Tests: journey +1, sửa 1 (5 trang). `npm test` **729/729**. `sw.js` = `dgt-v79`.

## CHƯA LÀM
- Chờ ptg thử 2 điện thoại: máu yêu quái chung, tranh nhặt lá, nút Ném người; `?yq=lua&yd=cao` độ khó; nhãn nút góc phải-trên; màn hướng dẫn 3 bước.
- Mở: sông + hồ, kiến trúc thêm, Suối Trong + cá 3D ao riêng, trang Tu tập/NPC trong Lộ trình, Xếp hạng, bơi–lặn.
