# PHIÊN 100 — Dựng lại chiến đấu yêu quái (mô hình, đánh, skill, nút, thanh máu) — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → HANDOFF.md (đầu file) → docs/PHIEN99.md (nhân vật chibi) → file này. Repo `tp9sach-ops/duanchuaon`, nhánh `main`.

## Yêu cầu Gp (2026-11-11)
Hình ảnh yêu quái, cách đánh, hành động đánh, dùng skill, cách chơi, nút chơi, kỹ năng chiến đấu "quá tệ hại": tái thiết kế cho hoành tráng, đẹp mắt, cuốn hơn. Chỉ xem những chỗ cần thiết, không xem hết.

## Đã làm (chỉ đụng đúng các file chiến đấu)
| File | Nội dung |
|---|---|
| `js/scene/yqModels.js` (mới) | 3 mô hình có hoạt ảnh. **Yêu Đá**: người đá khổng lồ, rune cam phát sáng, vết nứt, sừng, rêu, 5 tảng đá bay quanh. **Yêu Nước**: giọt nước trong, lõi sáng, mắt, xúc tu, vây, giọt bay quanh, gợn sóng dưới chân. **Yêu Lửa**: quỷ dung nham (lưới nứt sáng), 9 cột lửa nhảy múa, sừng, vuốt, tàn lửa bay lên, vết cháy dưới đất. Hoạt ảnh: thở, đi (nhún), GỒNG (giơ tay, co người, rung, sáng lên), ĐÁNH (đập xuống, nén thân, bùng sáng) |
| `js/scene/yeuquai.js` (viết lại) | Vùng đỏ báo đòn có đĩa lấp đầy theo thời gian gồng + viền nháy; sóng xung kích + bụi khi yêu quái đánh; nháy trắng khi trúng; tia lửa; SỐ SÁT THƯƠNG bay lên (to + chấm than khi đòn nặng); đá bay có quầng sáng + đuôi lửa; luồng khí Côn Khí Trảm 3 lớp (lõi, quầng, 2 bóng mờ) + vệt khí; vệt thương khi đâm; hiệu ứng xuất hiện + nổ tung khi thu phục |
| `js/world/yqFx.js` (mới, thuần) + `tests/yqfx.test.mjs` | `cdFrac`, `hitStyle`, `pushHit` (sự kiện đánh trúng id tăng dần), `ghostStep` (vệt máu trễ), `fmtNum`, `isLow`, `SKILL_THEME` |
| `js/ui/yeuquai.js` | Thanh máu mới: khung vàng, huy hiệu độ khó, vệt máu trễ, vạch mốc 1/3, số máu 2.400/2.400, nháy khi dưới 25 %, thanh "Sức bạn". Đẩy sự kiện đánh trúng sang cảnh 3D. RUNG màn hình khi đánh trúng / yêu quái giáng đòn (tôn trọng "giảm chuyển động"). `ramHit(dmg, kind='dau')` |
| `js/ui/conKhi.js` | Truyền `kind='khi'` cho đòn Chém khí |
| `js/ui/dock.js` + `css/dock.css` | Nút chiến đấu có biểu tượng SVG riêng (Ném đá, Thương, Chém khí, Thiết đầu công, Ném yêu quái, Nhảy), màu viền/quầng theo từng chiêu, vòng hồi chiêu quét + số giây còn lại, lóe vòng sáng khi sẵn sàng, nút "hot" bốc sáng, hiệu ứng nhấn |
| `tests/yqfx.test.mjs`, `package.json`, `sw.js` | Test mới (5), `dgt-v107` |

## Kiểm
- `npm test`: **874 tổng, 870 đạt, 4 đỏ có sẵn (#322, #328, #355, #767)**.
- Dựng THẬT bằng three.js trong Node: vẽ ảnh 3 mô hình ở tư thế đứng và gồng (đúng hình, tay giơ lên khi gồng). Chạy 600 khung hình mô phỏng mỗi loại (đi, gồng, đánh, trúng đòn ×3 loại, bị thu phục, boss rỗng): không lỗi, ~0,07 ms CPU/khung, 267 đối tượng cảnh.
- SVG biểu tượng đã kiểm là XML hợp lệ; ngoặc CSS cân.
- **CHƯA xem trong trình duyệt thật**: chưa thấy ánh sáng/sương/bóng thật, chưa thấy hiệu ứng (tia lửa, số bay, luồng khí) chạy, chưa thử bấm nút trên điện thoại, chưa kiểm bố cục thanh máu với cột menu.

## Gp phải làm
1. Tải các file trong `cap-nhat-phien99-100.zip` lên repo đúng đường dẫn (ghi đè). Phiên này KHÔNG đẩy được GitHub. Zip gồm cả phần Phiên 99 (nhân vật chibi + 2 file GLB nhị phân, tải bằng "Add file → Upload files").
2. Thử ngay không cần chờ lịch: mở game với `?yq=da`, `?yq=nuoc`, `?yq=lua` (thêm `&yd=cao` cho độ khó cao). Thử: ném đá, thương, chém khí, thiết đầu công, né vùng đỏ. Báo chỗ xấu/lệch (nói rõ con nào, đòn nào, máy nào).

## Giới hạn / chưa làm
- Mô hình vẫn dựng bằng khối hình học (không phải file 3D vẽ tay); đẹp hơn trước nhưng chưa thể bằng mô hình nghệ sĩ làm. Nếu Gp có GLB yêu quái, làm theo cách nhân vật chibi (Phiên 99).
- Số sát thương bay hiện trong cảnh 3D (không đồng bộ qua mạng: chỉ thấy đòn của chính mình).
- Chưa làm: đồng hồ đếm "sắp đánh" trên màn hình, đường chỉ hướng tới yêu quái, hiệu ứng nhân vật tung chiêu (hào quang trên người), âm thanh riêng cho từng loại yêu quái/đòn nặng, nhạc nền khi đánh, màn hình thu phục (tổng kết).
- Nút "Khiêng/Ném/Nhặt" và các nút ngoài chiến đấu vẫn kiểu cũ (chỉ nút chiến đấu có SVG).
- Chưa đo FPS thật trên điện thoại cũ khi 3 yêu quái hiện cùng đàn (mỗi lúc chỉ 1 con hiện).

## VIỆC KẾ (từng mục, xong báo, chờ Gp "tiếp tục")
1. Sau khi Gp thử trong game thật: chỉnh theo phản hồi (màu, kích cỡ, độ sáng, vị trí nút/thanh máu).
2. Cảnh báo đòn trên màn hình (vòng đếm + mũi tên chỉ hướng vùng đỏ), âm thanh riêng từng loại, màn hình tổng kết thu phục.
3. Động tác nhân vật khi tung chiêu (thương đâm, ném đá) và đồng bộ `setHold/act` người chơi khác (xem PHIEN99).
4. Tiếp tục kế hoạch GDD v2 và 4 test đỏ có sẵn.

## Prompt khởi động cho phiên sau (dán nguyên)
> Đọc PROMPT.md → HANDOFF.md (đầu file) → docs/PHIEN100.md và docs/PHIEN99.md. Repo `tp9sach-ops/duanchuaon`. Phiên 100 đã dựng lại chiến đấu yêu quái (`js/scene/yqModels.js`, `js/scene/yeuquai.js`, `js/world/yqFx.js`, thanh máu `js/ui/yeuquai.js`, nút `js/ui/dock.js` + `css/dock.css`). Kiểm repo đã có các file đó và `assets/models/chibi/*.glb` chưa (chưa thì nhắc Gp tải `cap-nhat-phien99-100.zip`). Gp báo kết quả thử (`?yq=da|nuoc|lua`) → chỉnh theo phản hồi (VIỆC KẾ 1). Chỉ đọc file cần sửa, KHÔNG đọc hết repo. Làm một mục, `npm test` (4 test đỏ có sẵn #322, #328, #355, #767), đẩy GitHub (không đẩy được thì gửi zip), cập nhật PROMPT.md mục 7 + HANDOFF.md + docs/PHIEN101.md, gửi bàn giao, rồi CHỜ Gp nói "tiếp tục".
