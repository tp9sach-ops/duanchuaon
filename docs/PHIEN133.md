# PHIÊN 133 — mục 2: hạt sen KHÔNG ảnh hưởng sức mạnh (2026-11-13)

Quy tắc ptg (chép nguyên văn): For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff.

## Yêu cầu của ptg (13/11) — trạng thái
1. Mở rộng map sát vách núi/rừng, càng sâu càng nguy hiểm → **XONG** (Phiên 131 + 132, xem `docs/PHIEN132.md`).
2. Hạt sen không ảnh hưởng sức mạnh; sức mạnh từ EXP/cấp, kỹ năng, cách cộng chiêu, đồ, vật phẩm → **XONG phần số hạng sen** (phiên này); còn 3 điểm cần ptg quyết, ở cuối.

## Đã tìm ra (rà mã, không đoán)
- Chỗ DUY NHẤT hạt sen cộng vào sức mạnh: `strengthOf` trong `js/world/strength.js` có số hạng `Math.sqrt(sen) * 2`, và `js/ui/carry.js` truyền `sen: total()` (tổng sen từng kiếm). `LGT.strength.value` này lại là đầu vào của sát thương ném/khí/thương/yêu quái (`conKhi.js`, `npcThrow.js`, `throwPlayer.js`, `farm.js`, `yeuquai.js`, `thietDau`), nên sen đã gián tiếp tăng sát thương.
- Hệ Tu Vi (`js/world/stats.js`, `js/data/stats.js`) vốn đã KHÔNG dùng sen (chú thích đầu file); `skillEngine.js` chỉ dùng Tu Vi. Cấp độ dùng trong `strengthOf` lấy từ `quests.prog.xp` (công hạnh), không phải sen.

## Đã sửa
- `js/world/strength.js`: `strengthOf({level, khinh, bonus})` = `level*6 + khinh*10 + bonus` (bonus kẹp 0..100); `sen` nếu ai còn truyền thì BỊ BỎ QUA. Cập nhật chú thích đầu file.
- `js/ui/carry.js`: bỏ `total()` và import `lifetimeSen`, không truyền sen nữa.
- Chữ: `js/world/tutorial.js` (chủ đề sức mạnh: "Hạt sen là công đức, KHÔNG làm bạn mạnh hơn"), `js/world/journey.js` (ô danh hiệu sức mạnh).
- `tests/strength.test.mjs`: test mới "hạt sen KHÔNG ảnh hưởng sức mạnh" (sen 0/1/400/1e6/1e9/âm/NaN/chữ → cùng một kết quả); test cũ đổi từ sen sang bonus.
- Kết quả: `npm test` 1046 pass / 0 fail.
- Tác dụng phụ: sức mạnh mọi người chơi hiện tại GIẢM (mất phần √sen×2). Ngưỡng khiêng vật nặng (khúc gỗ lim 200 kg cần sức mạnh ~121) giờ chỉ đạt bằng cấp 10 (60) + Khinh thân bậc 6+ (≥60) hoặc cộng thêm từ yêu quái; chưa chỉnh lại các con số kg.

## Còn lại / cần ptg quyết
1. **Hạt sen vẫn là chi phí học Khinh thân** (`js/world/skills.js`, bậc 2–8 trả 10…400 sen) — nghĩa là có sen thì luyện được thân pháp → sức mạnh tăng gián tiếp. Nếu "sen không ảnh hưởng sức mạnh" phải hiểu tuyệt đối thì đổi chi phí sang EXP/điều kiện khác. Chưa đổi vì là thiết kế cũ của ptg.
2. **Bảng xếp hạng** (`js/world/rank.js`) xếp theo tổng sen/cấp/điểm, không phải sức mạnh — chưa đụng; hỏi ptg có muốn xếp theo sức mạnh/Tu Vi.
3. **Nguồn nạp tiền → sen/lá** (`js/engines/donate.js`): hiện sen không còn tăng sức mạnh trực tiếp; nếu có đường mua lá/sen rồi đổi kỹ năng thì xem điểm 1.
4. Chưa nhìn trong game (nút Khiêng/Ném, số hiển thị trong Túi đồ giảm); các con số vẫn TẠM.

## Việc kế tiếp gợi ý
Chờ ptg trả lời 3 điểm trên; nếu duyệt thì đổi chi phí Khinh thân và/hoặc cân lại kg vật nặng; chơi thử các vùng sâu (mục 1) và chỉnh cân bằng.

## Prompt khởi động cho phiên mới (dán nguyên văn)
> Đọc `HANDOFF.md` mục "Phiên 130–132" và `docs/PHIEN132.md`, `docs/PHIEN133.md`. Chỉ xem các chỗ cần sửa, không đọc hết repo. Mục 1 (map) và mục 2 (sen không ảnh hưởng sức mạnh, đã bỏ số hạng sen trong `strengthOf`) đã xong. Việc tiếp theo tùy ptg quyết 3 điểm cuối `docs/PHIEN133.md`. `npm test` phải xanh, đẩy GitHub rồi báo; cuối phiên gửi bản bàn giao chi tiết và chép nguyên văn quy tắc bàn giao ở trên.
