# PHIÊN 67 — Yêu quái theo khung giờ (15:00 trung bình, 20:00 cao) + nút chiến đấu gọn — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → KE_HOACH_TONG.md → PHIEN65.md → PHIEN66.md → file này.

## ĐÃ LÀM (ptg 08/11: "3h là trung, 20h là cao … các nút tự thiết kế cho khỏi vướng")
- `js/world/yeuquai.js`: bảng `DIFF` (trung: giờ 3, mọi hệ số 1, thưởng 60 điểm + 3 sức mạnh; cao: giờ 20, máu ×1.6, sát thương ×1.35, gồng ×0.8 (ngắn hơn), nghỉ giữa chiêu ×0.75, lá rơi ×1.5, thưởng 100 điểm + 5 sức mạnh — **số TẠM chờ ptg chỉnh**). `monthEvents(y,m)` = 2 sự kiện CÙNG NGÀY (5..25), mỗi cái 90 phút; key `YYYY-MM-trung|cao`; loại yêu quái luân phiên theo khung. `eventAt`/`nextEvent` biết 2 khung; `createBoss/hitDamage/bossHp/lootDrops/rewardFor/windupOf` nhận `diff`. `loadYq` nhận key cũ `YYYY-MM` lẫn key mới.
- `js/ui/yeuquai.js`: truyền `diff` xuyên suốt, thanh máu ghi độ khó; thử nhanh `?yq=lua&yd=cao` (mặc định cao, `yd=trung` cho trung bình).
- Nút chiến đấu (`js/world/dock.js`, `js/ui/dock.js`, `css/dock.css`): khi có yêu quái chỉ còn Ném đá / Thương / Ném yêu quái (nếu đủ mạnh) / Nhảy (nếu đã mở) — ẩn Kỹ năng, Túi đồ, Nhảy mờ; nút đang hồi chiêu mờ đi (`wait`), vẫn bấm được (hiện thông báo).
- Sổ tay (`tutorial.js`) mô tả 2 khung giờ + thưởng theo độ khó. `sw.js` = `dgt-v76`.
- Tests: yeuquai (+2), dock (+1), tutorial cập nhật.

## CHƯA LÀM
- **Chơi chung qua mạng** (bước lớn kế tiếp; ptg tự sửa thư mục `gas`): máu yêu quái chung, nhặt lá tranh nhau, ném người chơi khác (dùng `throwCheck`, hồi chiêu 10 giây, −1 hạt sen). Cần `gas/Code.gs` + `engines/room.js` + `js/net/roomClient.js`; không thử được GAS ở đây.
- ptg thử `?yq=lua&yd=cao` trên điện thoại rồi cho ý kiến độ khó; các mục "người không rành" còn lại (PHIEN66.md).
