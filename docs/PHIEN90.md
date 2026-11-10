# PHIÊN 90 — Thiết đầu công (Khinh thân bậc 4) + đổi địa chỉ sang repo duanchuaon — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → PHIEN88.md → PHIEN89.md → file này.

## Yêu cầu ptg (2026-11-10)
1. **Đổi theo kho `duanchuaon`** → `index.html` (og/canonical), `sitemap.xml`, `PROMPT.md` mục 1 nay ghi repo `tp9sach-ops/duanchuaon` và trang `https://tp9sach-ops.github.io/duanchuaon/` (suy từ tên repo, ptg chưa gửi địa chỉ thật). Các dòng nhật ký cũ trong PROMPT/HANDOFF vẫn nhắc repo cũ (lịch sử, để nguyên). `js/PROMPT.md`, `js/sw.js` là file lạc (PHIEN88 đã ghi) — chưa xóa, chờ ptg.
2. **Ném NPC chỉ để vui** → giữ nguyên, không thêm nhiệm vụ/thưởng.
3. **THIẾT ĐẦU CÔNG:** "khi nhảy lên bậc 4, bấm nhảy lên sẽ có nút thiết đầu công, nhân vật dùng đầu bay nhanh tới một khoảng ngắn, đâm vào quái gây sát thương; tùy cấp độ mà bay xa/gần và sát thương cao/thấp".
   - **Cách hiểu của mình (nếu sai ptg bảo):** "cấp độ" = **bậc Khinh thân** (4 Tứ Phong … 8 Bát Thiên); "quái" = **yêu quái hằng tháng** (js/world/yeuquai.js). Nút hiện khi bậc ≥ 4 và nhân vật **đang bay hoặc vừa chạm đất ≤ 1,6 s**.
   - `js/world/thietDau.js` (thuần, test `tests/thietdau.test.mjs`): lao **0,32 s** thẳng trước mặt (dừng trước vật cản, dùng `landing`): quãng **6 / 8 / 10 / 12 / 15 m** và sát thương gốc **70 / 110 / 160 / 220 / 300** cho bậc **4/5/6/7/8**, cộng **sức mạnh × 0,5**; hồi chiêu 5 s; đâm trúng khi đường lao cách tâm yêu quái ≤ thân (`YQ.body`) + 0,7 m. Mọi con số là QUY ƯỚC TẠM.
   - `js/world/world.js`: `LGT.world.dash(to, dur)` + `dashing` (nhân vật chúi đầu, bỏ qua đi bộ lúc lao). `js/ui/skill.js`: `LGT.skill.air` / `sinceAir`. `js/ui/yeuquai.js`: `LGT.yq.ramHit(dmg)` (đi qua `hit()` nên chạy cả khi đánh chung). `js/ui/thietDau.js` (`LGT.thietDau`: `status()`, `dash()`; tiếng vèo + tiếng đâm, rung điện thoại, tôn trọng tắt tiếng/giảm chuyển động). Nút ☄️ "Thiết đầu công" trong cụm nút (`js/world/dock.js`, `js/ui/dock.js`), hiện cả lúc đang đánh yêu quái; bấm xuống là chạy (FAST).

## Kiểm
- `npm test` **812/812** (Node 22). Trình duyệt thật (giả lập, `?yq=da`): bậc 5 → nhảy → nút mở → lao 8 m → yêu quái 2400 → 2261 máu (−139). Chưa xem bằng mắt tư thế chúi đầu (ảnh chụp lúc đó bị yêu quái che kín màn hình) và chưa thử trên điện thoại thật.

## CHƯA LÀM / CHỜ PTG
- Thiết đầu công chỉ đánh yêu quái (chưa có "quái" nào khác). Chưa có nhiệm vụ / bảng Kỹ năng ghi chú Thiết đầu công; chưa có hiệu ứng hạt/rung màn hình khi đâm.
- Việc kế (PHIEN88/89): room.js đổi phòng theo zone; kiến trúc thêm (chờ ptg chọn); GAS Donations; THIET_KE_CHIEU_SAU mục 6.
