# Phiên 204 — Lộ trình 2 mục (2026-11-16): MỤC 1 XONG — nút ⚙ "Cỡ nút bấm" nằm DƯỚI bản đồ nhỏ trên điện thoại

> Repo `main` (đầu phiên: `6e394bc`, Phiên 203). Quy tắc giữ nguyên: làm từng mục, xong đẩy GitHub rồi báo, chờ ptg nói "tiếp tục".

## Yêu cầu của ptg (2026-11-16)
1. Nút chỉnh nút bấm: khi chơi bằng điện thoại thì nằm ở DƯỚI bản đồ, tránh chồng lên nút di chuyển.
2. Nút Đánh thường: bấm lần 1 lao tới mục tiêu trong phạm vi ngắn; bấm tiếp = combo 3 động tác khác nhau, đòn 3 có sát thương lan, quái dính thì đánh lại. Chiêu trong phái: bấm + lướt tay để dùng (chiêu định hướng thì theo hướng lướt). Không có quái vẫn dùng được chiêu và đánh thường nhưng không gây sát thương.

## Mục 1 — đã làm
- Nguyên nhân: nút ⚙ (`#bs-gear`, `js/ui/btnScale.js`) là `position:fixed; left:184px; bottom: joy-b + joy-s + 10px` — nằm ngay trên cần đi (`#joy`), cùng hàng với nút camera − + ⟲ nên dễ chồng/lấn khi phóng to cần đi (thanh trượt "Di chuyển" tới 180%).
- Sửa: trên điện thoại (máy cảm ứng HOẶC rộng ≤ 899px — trùng mốc CSS điện thoại), `placeGear()` đưa nút vào cột trái-trên `.hud-tl`, chèn liền SAU bản đồ nhỏ `.mm` (`mm.after(gear)`), CSS `.hud-tl #bs-gear{position:static…44×44px}`. Máy tính (chuột, rộng > 899) giữ chỗ cũ. `placeGear` chạy lúc khởi tạo, khi xoay/đổi cỡ màn hình và mỗi 1 giây (phòng bản đồ nhỏ dựng sau file này).
- Hàm thuần `isPhoneLayout({coarse, w})` ở `js/world/btnScale.js` (có test).
- Bảng "Cỡ nút bấm" (`#bs-box`) vẫn giữa màn hình như cũ.

## File
- sửa `js/ui/btnScale.js`, `js/world/btnScale.js`, `tests/btnscale.test.mjs` (thêm 1 test), `sw.js` (VERSION `dgt-v190`); thêm `docs/PHIEN204.md`.
- `npm test`: 1310/1310 đạt (đầu phiên: 1309/1309).

## Chưa kiểm được
- Chưa xem bằng mắt trên điện thoại thật / Chrome iframe baocaonoibo.io.vn (môi trường AI không có thiết bị). ptg kiểm: mở bằng điện thoại, thấy ⚙ ngay dưới bản đồ nhỏ, không đè cần đi; bấm ⚙ ra bảng cỡ nút.
- Màn rất thấp: `compact.js autoHide` tính cả hàng ⚙ vào chiều cao cột trái-trên; nếu cột chạm cần đi thì bản đồ nhỏ tự ẩn TẠM trước, ⚙ ở lại (⚙ không bao giờ bị ẩn).
- Chưa làm (mục 3 trong LO_TRINH_4_MUC_1115.md cũ): cỡ nút trong bảng ⇄ của `compact.js`.
- `PROMPT.md` mục 7 CHƯA được thêm dòng Phiên 204 (file 57 KB, tránh chép lại cả file qua công cụ); phiên sau thêm một dòng ngắn: "2026-11-16 (Phiên 204): ptg giao 2 mục (nút ⚙ dưới bản đồ; Đánh thường combo + lướt chiêu); mục 1 xong, xem docs/PHIEN204.md".

## MỤC KẾ — Mục 2: Đánh thường + combo + lướt chiêu (CHƯA LÀM; chờ ptg "tiếp tục")
Gợi ý điểm bắt đầu (CHƯA đọc kỹ, phải kiểm repo thật): `js/world/dock.js` + `js/ui/dock.js` (nút Đánh thường id `da`, ô `A`), `js/ui/heSkill.js` (thanh chiêu Q W E T Y, `cast`), `js/ui/actionArc.js` (bố cục), `js/ui/combatPose.js`, `js/world/mouseTarget.js` (Phiên 159, chọn mục tiêu), `js/ui/duel.js` (giao lưu võ đài dùng chung nút đánh), `js/ui/farm.js`/`farmCombat.js` (quái bãi rừng). Làm từng bước nhỏ: (a) lao tới mục tiêu tầm ngắn + khoảng ngắt combo, (b) 3 động tác + sát thương lan đòn 3 + quái dính thì phản đòn, (c) bấm-lướt dùng chiêu (hướng lướt = hướng chiêu định hướng), (d) không có quái vẫn đánh/dùng chiêu nhưng sát thương = 0. Phải giữ Q W E R / 1234567 và chuột phải (Phiên 159) hoạt động.

## PROMPT BÀN GIAO CHO PHIÊN SAU (dán nguyên văn)
```
Dự án DIỆU GIANG TỰ — repo https://github.com/tp9sach-ops/duanchuaon (nhánh main). Đọc PROMPT.md, rồi docs/PHIEN204.md (+ bản PHIEN mới nhất nếu có). Chỉ đọc chỗ cần thiết; việc đã làm thì bỏ qua; cập nhật KHÔNG được làm lỗi (chạy npm test; nếu môi trường chạy lâu thì chạy nền `setsid nohup npm test > /tmp/t.log 2>&1 &`).
Mục 1 (nút ⚙ Cỡ nút bấm nằm dưới bản đồ nhỏ trên điện thoại) ĐÃ XONG ở Phiên 204 — đừng làm lại.
Việc phiên này = MỤC 2 của ptg (làm từng bước a→d trong docs/PHIEN204.md, xong đẩy GitHub rồi báo, chờ "tiếp tục"):
 - Nút Đánh thường: bấm lần 1 lao tới mục tiêu trong phạm vi ngắn; bấm tiếp = combo 3 động tác khác nhau; đòn thứ 3 có sát thương lan; quái dính sát thương thì đánh lại người chơi.
 - Chiêu thức trong phái: bấm vào rồi lướt ngón tay để dùng; chiêu có định hướng thì đi theo hướng lướt.
 - Không có quái vẫn dùng được chiêu và đánh thường, nhưng không gây sát thương lên ai.
Quy tắc: giao file hoàn chỉnh (không đoạn vá); sau mỗi mục: tăng VERSION trong sw.js, thêm docs/PHIEN<N>.md có prompt bàn giao như file này, đẩy GitHub (trùng tên ghi đè), rồi báo ptg.
```

## QUY TẮC BÀN GIAO (nguyên văn)
> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff
