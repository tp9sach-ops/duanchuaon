# Phiên 217 — Đồ họa điện thoại: bớt mờ/răng cưa (bước 1/… trong yêu cầu "chơi trên điện thoại bất tiện")

ptg báo: chơi trên điện thoại bất tiện, đồ họa xấu. Chọn cả 4: nút/bảng che màn hình, joystick khó dùng, giật lag, nút nhỏ khó bấm. Làm từng bước; đây là bước 1: đồ họa + giật lag.

## Nguyên nhân (đọc code, chưa nhìn trên máy thật)
- `js/scene/perfLogic.js`: điện thoại (coarse) luôn bắt đầu bậc 1 = pixelRatio **1** dù màn thật 2–3× → mờ. Bị hạ thêm thì tắt bloom/bóng/rừng thưa và **nhớ 7 ngày** trong localStorage (`lgt.perf`) → máy từng giật một lần bị kẹt đồ họa thấp.
- `js/scene/index.js` dòng `new THREE.WebGLRenderer({ antialias: !coarse })`: điện thoại tắt khử răng cưa (MSAA). (CHƯA đụng; khi có EffectComposer/bloom, MSAA của renderer vốn không áp lên tiếp, nên tăng pixelRatio là cách rẻ nhất.)

## Đã sửa
- `levelPlan`: pixelRatio theo bậc = 2 → **1,5** → 1,25 → 1,25 → 1 → 0,75 (tối đa, không kéo màn dpr thấp lên). Bậc 2 vẫn tắt bloom ngay nên giảm tải nhanh khi giật.
- `KEY` đổi `lgt.perf` → `lgt.perf2`: bỏ mọi bậc thấp đã lưu dưới quy ước cũ (chỉ một lần).
- `tests/perf.test.mjs`: sửa 1 test cũ (bậc 1 dpr 2 = 1,5), thêm 2 test (bảng pixelRatio dpr 3 / dpr 1; khóa mới). `sw.js` `dgt-v204`.

## CHƯA KIỂM
- Chưa chạy `npm test` (chỉ có công cụ GitHub). Kỳ vọng test perf pass; các test khác không import `levelPlan`/`KEY`.
- Chưa thử FPS trên điện thoại thật: nếu máy yếu, governor sẽ hạ dần (mỗi bậc ~6 giây). Có thể ép thử bằng `?perf=0..5`.
- Việc kế (chờ ptg báo "tiếp tục"): (2) nút nhỏ/khó bấm, (3) joystick, (4) nút/bảng che màn hình chơi.
