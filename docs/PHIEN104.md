# PHIÊN 104 — GDD v2: G1.3 (công thức sát thương) — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → docs/PHIEN103.md → file này → docs/KE_HOACH_GDD_V2.md (mục G1). Chỉ đọc file cần thiết.

## Đã làm (G1.3 XONG)
- `js/data/stats.js`: thêm `COMBAT_CFG` (TẠM, đóng băng): kLoi 1,3; kThuong 1; kBat 0,8; chiMang 1,5; thuNen 100; toiThieu 1.
- `js/world/combat.js` (logic thuần): `kHe(rel)` (rel = 'loi' | 'thuong' | 'bat'), `thuFactor(thu)` = 100÷(100+Thủ), `thuReducePct`, `damageOf({cong, heSo=1, cuongHoa=0, rel='thuong' | số, crit=false, thu=0})`, `damageByTuVi(tuvi, opts)` (Công lấy từ `congOf`, không cho ghi đè), `critRoll(rate, rng)`.
  Công thức: Công × Hệ số skill × (1 + Cường hóa) × K_hệ × (chí mạng ×1,5) × 100 ÷ (100 + Thủ), làm tròn, tối thiểu 1; Công ≤ 0 hoặc hệ số ≤ 0 → 0; đầu vào lạ không bao giờ ra NaN.
- `tests/combat.test.mjs` (10 test) đã đăng ký trong `package.json`. Có test GHIM sát thương cũ: `stoneDamage` [8,10,43], `spearDamage` [20,23,70], `khiDamage` [45,50,125], `dashDamage` bậc 4..8 = 70/110/160/220/300 (+50 khi sức mạnh 100) và 0 khi bậc < 4. Các hàm cũ KHÔNG bị sửa. Nếu test này đỏ, ai đó đã đổi sát thương cũ.
- Không đụng giao diện, không đụng mã cũ.

## Kiểm tra (nói thật)
- Chạy cục bộ 22/22 (stats + combat) trong thư mục thử có BẢN SAO các công thức cũ (chép nguyên văn từ repo) vì bash không có mạng để clone. Phép tính tay đã đối chiếu bằng Python.
- CHƯA chạy `npm test` đầy đủ trên repo thật: lần chạy đầu trong CI/máy có repo, kiểm đặc biệt `tests/combat.test.mjs` (nó import thật từ `yeuquai.js`, `conKhi.js`, `thietDau.js`; `thietDau.js` kéo theo `strength.js` → `layout.js`, vốn đã chạy trong `tests/thietdau.test.mjs`).
- Nợ: cột Trạng thái G1.1, G1.2, G1.3 trong `docs/KE_HOACH_GDD_V2.md` vẫn "chưa" → sửa thành `XONG (Phiên 102)`, `XONG (Phiên 103)`, `XONG (Phiên 104)`.

## Ghi chú thiết kế cho mục sau
- `rel` hiện nhận quan hệ đã tính sẵn. Bảng khắc/sinh 5×5 + Ngũ Hành Hội Tụ là G2.1 (`js/world/elements.js`), sẽ trả 'loi'/'thuong'/'bat' cho `damageOf`.
- Chưa có tỉ lệ chí mạng nền (GDD không ghi số): `critRoll` chỉ nhận `rate` từ ngoài. Hỏi ptg khi nối vào skill (Hỏa có chí mạng cao).
- Thủ đối thủ cho quái sẽ nằm trong `js/data/monsters.js` (G1.6/G3.6); quái chưa có Thủ thì dùng thu = 0.

## VIỆC KẾ (một mục, chờ "tiếp tục")
- **G1.4**: nguồn Tu Vi: hàng yêu 40%, nhiệm vụ 30%, hoạt động chùa 15% (thiền/tụng/lạy, mỗi loại tối đa 5 lần/ngày), boss/phó bản 15%; cộng EXP khi xong sự kiện hiện có (nối `quests`/`temple`). Bắt đầu bằng logic thuần + test (trần 5 lần/ngày theo ngày giờ VN, UTC+7), CHƯA nối giao diện. Cần xem nhanh `js/world/quests.js` (EVENT_TYPES) và cách lưu trạng thái người chơi (`lgt.*`) trước khi nối.
- Sau đó G1.5 (lưu GAS theo tài khoản), G1.6 (HUD + Oán Khí + Dã Mèo Rừng).
- Nhớ: số EXP mỗi nguồn phải hợp với đường cong ở Phiên 103 (tổng đạt cấp 10 = 4.012 EXP); chốt số ở G8.1.

## Câu hỏi còn treo cho ptg (mặc định có sẵn)
G0.2, G0.4, câu 11–16 (docs/GDD_v2_DOICHIEU.md); đặc biệt câu 15: bỏ `√hạt sen` khỏi `strengthOf` (mặc định: bỏ).

## Prompt khởi động cho phiên sau (dán nguyên)
> Đọc PROMPT.md → docs/PHIEN103.md → docs/PHIEN104.md → docs/KE_HOACH_GDD_V2.md. Repo `tp9sach-ops/duanchuaon`. G0.1, G0.3, G0.5, G1.1, G1.2, G1.3 đã XONG (cột Trạng thái trong KE_HOACH cần cập nhật). Chạy `npm test` nếu có thể. Làm MỘT mục (G1.4, logic thuần trước), gửi bàn giao docs/PHIEN105.md, rồi CHỜ ptg nói "tiếp tục". Chỉ đọc những file cần thiết.
