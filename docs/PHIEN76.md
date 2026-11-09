# PHIÊN 76 — Suối Trong: nơi câu thứ 4 (mục 3/3) — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → KE_HOACH_TONG.md → PHIEN74.md → PHIEN75.md → file này.

## ĐÃ LÀM
- `js/world/river.js`: `SUOI` = Suối Trong (99,2 ; 112,7), r2 — đặt đúng giữa dòng Sông Thác, bờ Đông bãi thác (đứng sát mép sông, cách ≤ 3,2 m là câu được).
- `js/world/fishing.js`: `FISH_WATERS` có nước thứ 4 `suoitrong`; 3 loài RIÊNG của suối (`nuoc: ['suoitrong']`): **Cá bống suối** (thường), **Cá chạch suối** (thường), **Cá lăng** (hiếm). Loài không có `nuoc` gặp ở mọi nước kể cả suối. `speciesFor(waterId)`, `rollCatch(orb, rng, waterId)`, `rareChance(orb, waterId)` biết nước; `startCast` truyền nước vào. `fishingView.WATER_Y.suoitrong = 0.15`.
- Sổ sưu tầm (Lộ trình · Gieo duyên) tự có thêm 3 ô loài mới (vòng lặp `SPECIES`). Sổ tay (`tutorial.js`) nhắc Suối Trong.
- Tests: `tests/fishing.test.mjs` +1 (nước thứ 4, loài riêng không lọt ra nước khác, câu thử ở suối), sửa 2 test cũ. `npm test` **737/737**. `sw.js` = `dgt-v82`.

## CHƯA LÀM / CHƯA KIỂM
- Chưa nhìn bằng mắt: cầu quăng rơi vào dòng sông ở bãi thác có đẹp/đúng chỗ không (`castTarget` lấy điểm cách mép vào trong ≤ 0,4·r nên sát tâm suối).
- Cá 3D hiện trong ao riêng của người chơi (ptg yêu cầu 07/11) CHƯA làm — việc kế; cá suối mới dùng chung hình loại 'ca'.
- Chưa có nhiệm vụ riêng "Câu ở Suối Trong" và chưa có điểm Dẫn đường tới suối (có thể thêm `PLACES` 'suoitrong' như 'thuyta').
- Mở: cá 3D ao riêng, trang Tu tập/NPC trong Lộ trình, Xếp hạng, bơi–lặn; ptg thử 2 điện thoại (yêu quái chung, ném người).
