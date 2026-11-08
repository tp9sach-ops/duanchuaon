# PHIÊN 61 — Rừng thông dày (việc 1 của "ưu tiên cảnh") — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Yêu cầu (ptg, 2026-11-08):** "Tiếp tục" (sau Phiên 59: ưu tiên kiến trúc, rừng thông, Phật khắc vách đá, sông hồ). Đọc: PROMPT.md → KE_HOACH_TONG.md → PHIEN59.md → PHIEN60.md → file này.

## ĐÃ LÀM
- `js/scene/outside.js`: hàm mới `buildPineWoods(g)` (gọi trong `buildOutside`, `pw.update(t)` trong vòng cập nhật):
  - **340 cây thông** 4 mảnh instanced (thân + 3 tầng nón), mỗi cây một sắc xanh riêng (`setColorAt`), ~12% cây khổng lồ cao gấp 2–3; dày nhất quanh bãi rừng; tránh vùng đi bộ, đường làng, miếu, cổ thụ.
  - **70 tảng đá phủ rêu**, **510 bụi dương xỉ**, 7 thân cây đổ, 6 **đèn đá** dọc đường mòn rừng (sáng hơn về đêm bằng `nightGlow`), **18 đám sương thấp** chuyển động nhẹ quanh bãi rừng/đường mòn.
  - Rừng cũ (`buildForest`) giữ nguyên; rừng mới chỉ là cảnh để nhìn (ngoài vùng đi bộ đã là vật cản) → KHÔNG đổi va chạm.
- Kiểm: dựng thử riêng hàm bằng three trong Node: 32 mesh, ~43,6 nghìn tam giác, `update` chạy; `npm test` **662/662**. `sw.js` = `dgt-v66`.

## CHƯA KIỂM (cần ptg xem trên trang thật)
- Hình ảnh thực tế: độ dày có hợp, có che mất đường mòn/góc camera không, màu thông theo mùa (chạy mã đổi màu lá theo mùa ở `scene/index.js` — vật liệu trắng + màu từng cây có thể lên màu khác thường vào mùa thu/đông: cần nhìn).
- FPS máy yếu: thêm ~340 cây có đổ bóng (thân + tầng nón dưới). Nếu giật: giảm `n < 340` hoặc bỏ `castShadow` ở `inst(c1…)` trong `buildPineWoods`.
- Node 20 chưa chạy.

## VIỆC KẾ (thứ tự ưu tiên của ptg; mỗi việc xong báo, chờ "tiếp tục")
1. **Sông + hồ** (dòng sông từ hồ chân thác `THAC.pool` chảy ra; hồ trong rừng; cần `addWater` trong `js/world/layout.js`, cầu đá nếu cắt đường, cập nhật `minimap.js` `waters`, và nhiệm vụ ghé nơi mới: thêm vào PLACES + `v-<id>` + `PLACE_STAND` + chương, xem PHIEN60).
2. **Thêm kiến trúc** (cầu đá, bảo tháp, thủy tạ… — hỏi ptg loại nào nếu chưa rõ).
3. Suối Trong (nơi câu thứ 4) + cá 3D ao riêng; trang "Tu tập" + "NPC" trong Lộ trình.
4. Xếp hạng, bơi–lặn.
