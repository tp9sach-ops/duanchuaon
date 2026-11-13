# Phiên 139 — Mục 1 hoàn tất: bỏ nốt trần Tu Vi 150 (kinh nghiệm không còn trần ở mọi hệ)

Quy tắc ptg (chép nguyên văn): For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff.

## Trạng thái 5 mục (ptg giao 13/11)
1. ✅ Kinh nghiệm không giới hạn trần — XONG (Phiên 138 bỏ trần cấp công hạnh + trần Tu Vi/ngày; Phiên 139 bỏ nốt trần Tu Vi 150).
2. ✅ Map mở rộng, quái càng sâu càng mạnh — đã có từ Phiên 131–132 (`docs/PHIEN132.md`).
3. ✅ Hạt sen không ảnh hưởng sức mạnh — đã có từ Phiên 133 (`docs/PHIEN133.md`).
4. ⏳ Phó bản — VIỆC KẾ TIẾP (xem `docs/PHIEN138.md`, phần "Việc kế: MỤC 4").
5. ⏳ Mảnh ghép boss → linh thú trong hồ lô.

## Đã làm ở Phiên 139
- `js/data/stats.js`: `tuViMax: Infinity` (trước 150); thêm `tuViKyThuat: 5000` = chặn kỹ thuật cho bảng EXP/chỉ số (EXP lưu tối đa 1e9 ≈ Tu Vi ~1100 nên chưa bao giờ chạm).
- `js/world/stats.js`: `clampTuVi` chỉ kẹp dưới 1 và trên 5000 kỹ thuật; `expToNext` luôn > 0; `CUM`/`levelFromExp`/`expRemaining`/`progressOf` dùng `tuViKyThuat`. Công/Thủ/Sinh Lực vẫn tuyến tính (10+3(n−1), 5+2(n−1), 120+25(n−1)) nên cấp > 150 mạnh thêm.
- Tests sửa: `tests/stats.test.mjs`, `tests/nguontuvi.test.mjs` (mọi chỗ giả định cấp 150 là tối đa). `npm test`: 1059/1059 xanh (chạy thật trong phiên này).

## Còn là trần (KHÔNG phải kinh nghiệm — giữ nguyên, hỏi ptg nếu muốn bỏ)
Trần hạt sen 100/ngày, 10 lần/ngày hạt sen phóng sinh, 5 lần/ngày/loại hoạt động chùa, 60 phút tự động hàng yêu/ngày, kẹp lưu EXP 1e9 (kỹ thuật), kẹp cấp 99 của máu/sát thương yêu quái hằng tháng.

## Việc kế: MỤC 4 — PHÓ BẢN
Xem `docs/PHIEN138.md` (ý ptg + hướng làm: `js/world/dungeon.js` logic thuần + test → zone/cảnh 3D riêng → NPC + bảng chọn → nối `LGT.addXp`/`settleKill`; dùng cơ chế zone của Võ đài: `zones.js`, `zoneRuntime.js`, `zoneVoDai.js`, `js/scene/voDai.js`, `js/ui/zoneGate.js`).

## Prompt khởi động cho phiên mới (dán nguyên văn)
> Đọc `docs/PHIEN139.md`, `docs/PHIEN138.md`, `docs/PHIEN132.md`, `docs/PHIEN133.md`. Chỉ xem các chỗ cần sửa, không đọc hết repo. Mục 1–3 đã xong; kinh nghiệm không còn trần. Làm MỤC 4: phó bản, từng bước nhỏ, `npm test` phải xanh, đẩy GitHub rồi báo; cuối phiên viết `docs/PHIEN140.md` kèm prompt bàn giao và chép nguyên văn quy tắc bàn giao ở trên.
