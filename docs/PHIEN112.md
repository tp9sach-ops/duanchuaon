# PHIÊN 112 — GDD v2: G2.4(a) logic Lễ Khai Ngộ — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → docs/PHIEN111.md → file này → docs/KE_HOACH_GDD_V2.md. Chỉ đọc file cần thiết.

## Yêu cầu của ptg (2026-11-11, sau Phiên 111)
"Tiếp tục những cập nhật từng bước theo GDD v2 để cập nhật skill, vật phẩm, cách chơi, kỹ năng chiến đấu, thêm quái cố định ở các bãi rừng để farm công đức; sau đó đẩy lên GitHub." → quy tắc dự án "một mục nhỏ rồi chờ": làm đúng MỘT mục là G2.4(a). Quái cố định ở bãi rừng đã có từ Phiên 107–108 (Bìa Rừng Thông, Đường Mòn; thưởng Tu Vi + hạt sen, trần 100 sen/ngày, Tự Động Hàng Yêu). Vùng quái tiếp theo (Hồ Thác Đại Phật, Đồi Bảo Tháp…) cần ptg chọn, xem "Việc kế".

## Đã làm
- `js/data/skillCfg.js`: thêm `KHAI_NGO` (TẠM, đóng băng): `tuViMin` 10, `trialSec` 60, `taiKhaiLa` 20, `heKey` `'lgt.he'`.
- `js/world/khaiNgo.js` (logic thuần, `now` là giây do người gọi đưa vào): `canKhaiNgo(tuvi)`, `loadHe(raw)`, `costOf(current, target)`, `createKhaiNgo({tuvi, he})` với `sit(he, now)`, `standUp()`, `trialLeft(now)`, `trialActive(now)`, `trialSkill()`, `tryTrial(now)`, `confirm({laBoDe})`, cùng `state` (`idle` | `trial` | `done`), `seatHe`, `chosen`, `current`.
- Luồng: đủ Tu Vi 10 → ngồi bồ đoàn một Hệ (60 giây dùng thử Skill 1, dùng `createSkillRuntime` thật nên có hồi chiêu đúng) → `confirm`. Ngồi bồ đoàn khác = làm mới giờ và hồi chiêu; ngồi lại đúng bồ đoàn thì không reset. Lần đầu miễn phí; đã có Hệ mà đổi Hệ khác (Tái Khai Ngộ) tốn 20 lá bồ đề, thiếu thì `{ok:false, reason:'thieu-la'}` và KHÔNG mất chỗ ngồi; chọn lại đúng Hệ đang có → `cung-he`.
- `confirm` trả `{ok, he, cost, reset}`: module KHÔNG trừ lá bồ đề, KHÔNG ghi localStorage, KHÔNG gọi `setHe`. Người gọi (bước b) làm: trừ `cost` lá, lưu `localStorage['lgt.he']`, gọi `skillEngine.setHe(he)` (đổi Hệ khác thì kỹ năng tự về cấp 1).
- `tests/khaingo.test.mjs` (15 test) đã thêm vào `npm test`. Dòng G2.1–G2.3 trong `docs/KE_HOACH_GDD_V2.md` đã đánh dấu XONG; G2.4 ghi "(a) XONG". `npm test` 994/994 trên Node 22 (trước phiên: 979).

## Giả định TẠM cần ptg duyệt
1. 60 giây dùng thử là TÙY CHỌN: hết giờ vẫn xác nhận được (chỉ không dùng thử thêm). Nếu ptg muốn bắt buộc đủ 60 giây mới xác nhận, sửa `confirm`.
2. Mỗi lần ngồi bồ đoàn khác, giờ dùng thử tính lại từ 60 giây (không giới hạn số lần đổi chỗ khi chưa xác nhận).
3. Tái Khai Ngộ dùng cùng luồng bồ đoàn; chỗ trừ lá bồ đề nằm ở bước (b).
4. Tên file theo quy ước camelCase của repo (`khaiNgo.js`); kế hoạch cũ ghi `khaingo.js`, đã sửa trong KE_HOACH.

## Chưa làm / lưu ý
- G2.4(b): nối vào game thật. CHƯẠ đọc `js/world/seats.js`, `js/world/world.js`, `js/world/placements.js` (bồ đoàn chánh điện, 48 cái) nên chưa biết cách "5 bồ đoàn sáng theo màu 5 Hệ" nên gắn thế nào (dùng 5 bồ đoàn riêng cạnh bàn thờ hay tô màu 5 cái trong hàng hiện có). Việc đầu phiên sau: đọc 3 file đó, rồi hỏi ptg nếu chưa rõ.
- Chưa có chỗ lưu Hệ: `lgt.he` mới là tên khóa dự kiến, chưa ai đọc/ghi. Chưa có giao diện chọn Hệ, chưa có lời Trụ Trì mời vào chánh điện.
- `PROMPT.md` mục 7 chưa thêm dòng Phiên 109–112 (file lớn, tải lại nguyên file qua công cụ dễ hỏng); phiên sau nên thêm một dòng gộp.
- Chưa chơi thử Phiên 107–108 trên trình duyệt thật. `sw.js` chưa cần tăng VERSION (chưa có file nào mới được game nạp).

## VIỆC KẾ (một mục, chờ "tiếp tục")
**G2.4(b)**: nối bồ đoàn + giao diện chọn Hệ (đọc seats/world/placements trước). Sau đó G2.5 thanh skill 5 ô (cần ảnh chụp giao diện điện thoại hiện tại để không chồng nút), G2.6 hiệu ứng nhẹ, G2.7 mở khóa theo cấp + nhiệm vụ Hệ Phái.
**Quái cố định thêm vùng (ptg chọn):** vùng kế theo GDD mục 8 là Hồ Thác Đại Phật (Hệ Thủy, cấp 25–45: Thủy Quỷ Hồ Thác 28, Lý Ngư Tinh 38) hoặc Đồi Bảo Tháp (Thổ, 40–65). Thêm vùng = thêm dữ liệu trong `js/data/monsters.js` (`MONSTERS`, `FARM_ZONES` với `rects` nằm trong `OUT_WALKS` của `js/world/outside.js`) + test, không cần đổi logic.

## Prompt khởi động cho phiên sau (dán nguyên)
> Đọc PROMPT.md → docs/PHIEN111.md → docs/PHIEN112.md → docs/KE_HOACH_GDD_V2.md. Repo `tp9sach-ops/duanchuaon`. Đã XONG: G0.1, G0.3, G0.5, G1.1–G1.4, G3.6, G1.6a, Tự Động Hàng Yêu, G2.1–G2.3, G2.4(a). Chạy `npm test` trước, sửa test đỏ nếu có. Làm MỘT mục theo lời ptg (mặc định G2.4(b): đọc js/world/seats.js, world.js, placements.js rồi nối bồ đoàn + giao diện chọn Hệ), gửi bàn giao docs/PHIEN113.md, rồi CHỜ ptg nói "tiếp tục". Chỉ đọc những file cần thiết.
