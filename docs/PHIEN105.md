# PHIÊN 105 — GDD v2: G1.4 (nguồn Tu Vi) — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → docs/PHIEN104.md → file này → docs/KE_HOACH_GDD_V2.md (mục G1). Chỉ đọc file cần thiết.

## Đã làm (G1.4 XONG phần logic thuần)
- `js/data/nguon.js`: `NGUON_CFG` (TẠM): hàng yêu 0,02 EXP-cấp/lần (20 lần = 40%), nhiệm vụ 0,10 (3 lần = 30%), hoạt động chùa 0,01 (3 loại × 5 lần/ngày = 15%), boss/phó bản 0,15 (1 lần = 15%); chống cày quái yếu (chênh > 5 cấp thì giảm 10%/cấp, sàn 10%); múi giờ VN UTC+7.
- `js/world/nguonTuVi.js` (không DOM, không đọc đồng hồ, mọi hàm nhận `now`): `dayKeyVN`, `freshState`, `normalizeState` (reset khi sang ngày mới giờ VN, kẹp số hỏng), `chenhLechFactor`, `expPerAction(nguon, tuvi, {monsterLevel})`, `award({exp, nguon, loai, monsterLevel, state, now})` → `{gain, exp, tuvi, leveledUp, state, reason}`; reason: ok | tran-ngay | nguon-la | loai-la | cap-toi-da. Không sửa state đầu vào.
- `tests/nguontuvi.test.mjs` (10 test), đã đăng ký trong `package.json`.
- Quy ước ở đây: 1 lần nhận = (EXP cần lên cấp kế) × moiLan, nên tốc độ lên cấp tỉ lệ theo cấp; chốt số ở G8.1. Chỉ HOẠT ĐỘNG CHÙA có trần ngày (đúng GDD). Nhiệm vụ không có trần ở đây vì đã tự giới hạn theo từng nhiệm vụ (mỗi nhiệm vụ làm một lần).

## Kiểm tra (nói thật)
- Chạy cục bộ 10/10 test `nguontuvi` trên bản sao tối thiểu của `js/data/stats.js` + `js/world/stats.js` (chép đúng các hàm `clampTuVi`, `expToNext`, `totalExpFor`, `levelFromExp`). CHƯA chạy `npm test` đầy đủ trên repo thật (môi trường không clone được).
- Mã chỉ import `../data/nguon.js` và `./stats.js`; không đụng mã cũ, không đụng giao diện.

## Nợ còn lại
- Cột Trạng thái trong `docs/KE_HOACH_GDD_V2.md` chưa sửa: G1.1 → `XONG (Phiên 102)`, G1.2 → `XONG (Phiên 103)`, G1.3 → `XONG (Phiên 104)`, G1.4 → `XONG (Phiên 105, logic thuần; chưa nối sự kiện)`.
- Nối thật vào sự kiện (nhiệm vụ xong, thiền/tụng/lạy, hạ quái) làm cùng G1.5/G1.6, vì cần chỗ lưu `exp` và `state` (hiện game chưa có Tu Vi riêng).

## VIỆC KẾ (một mục, chờ "tiếp tục")
- **G1.5**: lưu Tu Vi (exp + state nguồn) cục bộ + GAS (mỗi 60 giây và khi đổi vùng) theo tài khoản; cần xem `gas/Accounts.gs`, `js/net/*` và cách lưu hiện có (`lgt.*`).
- Sau đó **G1.6** (HUD Sinh Lực/Oán Khí, Dã Mèo Rừng cấp 3, nối `award('hangYeu')`), rồi **G3.6** (quái cố định ở Bìa Rừng Thông và Đường Mòn — mục ptg quan tâm để farm công đức). Nếu ptg muốn có quái farm sớm: có thể đưa G3.6 lên ngay sau G1.5 (cần ptg đồng ý).

## Câu hỏi còn treo cho ptg (mặc định có sẵn)
G0.2, G0.4, câu 11–16 (docs/GDD_v2_DOICHIEU.md); câu 15: bỏ `√hạt sen` khỏi `strengthOf` (mặc định: bỏ).

## Prompt khởi động cho phiên sau (dán nguyên)
> Đọc PROMPT.md → docs/PHIEN104.md → docs/PHIEN105.md → docs/KE_HOACH_GDD_V2.md. Repo `tp9sach-ops/duanchuaon`. G0.1, G0.3, G0.5, G1.1–G1.4 đã XONG (sửa cột Trạng thái trong KE_HOACH nếu chưa). Làm MỘT mục (G1.5), gửi bàn giao docs/PHIEN106.md, rồi CHỜ ptg nói "tiếp tục". Chỉ đọc những file cần thiết.
