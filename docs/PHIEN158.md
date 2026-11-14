# PHIÊN 158 — Bàn giao (Bản 2 chiêu thức: mục 4 — 24 thẻ Kim/Mộc/Thủy/Thổ)

> Dán nguyên file này vào đầu phiên mới. Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh `main`). Người dùng nói tiếng Việt. Đọc thêm `docs/PHIEN156.md`, `docs/PHIEN157.md`.

## Quy tắc làm việc (chép nguyên văn)
"For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff."
- Làm từng mục, xong chạy test, đẩy `main`, báo, chờ "tiếp tục". Không báo test đạt nếu chưa chạy. Chỉ đọc chỗ cần sửa.

## Mục 4 — 24 thẻ chiêu (XONG mã + test)
- `js/data/chieuNguHanh.js`: `KIM_V2`, `MOC_V2`, `THUY_V2`, `THO_V2`, `CHIEU_4HE` (đóng băng). Mỗi thẻ: gồng, hậu động, vùng cảnh báo (hình + hoa văn: Kim `vachCheo`, Mộc `hoaVanLa`, Thủy `gonSong`, Thổ `oVuong`; Hỏa `socNhon`), `loi: true` cho vùng có lợi (viền xanh nhạt), giá phải trả, `moc`, cách khắc, các số đặc thù (Thiết Kỵ vạch 10×2,5 m hở 0,8 s; tuyệt học hoàn 50% hồi chiêu khi bị cắt…). KHÔNG đổi số trong `combatSkills.js`.
- `js/world/chieuNguHanh.js`: `chieuOf(id)` (cả 30 chiêu), `mocOf(id)`, `baoTruoc(id)`, `laVungLoi(id)`.
- `tests/chieunguhanh.test.mjs` (6 test) đã vào `npm test`.
- Móc nối: Bản 2 chỉ khai báo cặp cho Kim Cương Trảm → Thiết Kỵ / Phá Trận Trảm (và Hỏa ở Phiên 157); các chiêu khác `moc: []`. `luatChien.chuoiMoc` mặc định vẫn đọc `skill.moc` (trong `combatSkills.js` chỉ có Hỏa); với Kim phải truyền `mocOf` làm tham số thứ 2. Khi nối vào chiến đấu: đổi mặc định sang `mocOf` hoặc thêm `moc` vào `combatSkills.js`.
- Lệch có chủ đích khỏi Bản 2: Mê Vụ Lan Tỏa gồng 0,5 s (Bản 2 ghi 0,4 s) để đạt ngưỡng 0,5 s cho đòn diện rộng (Bản 2 mục 3.2 nguyên tắc 1). Ptg duyệt hoặc đổi lại.
- Còn mở (Bản 2 ghi "kiểm skillEngine"): hệ số 1,0 của U Minh Linh Tiễn là tổng hay mỗi mũi (`fx.hits` = 3); ghi trong thẻ `moc_1.tongHeSoLaTong`.
- CHƯA nối vào chiến đấu thật; CHƯA nhìn bằng mắt.

## Việc tiếp theo (theo mục 7 của Bản 2)
5. Tư thế 30 chiêu: động tác `cast` trong `chibiPose`/`combo.js` (khung gồng → phát → thu), mã tư thế ở Bản 2 mục 5 (số gợi ý, phải kiểm chiều bằng `limbPoints`/`legPoints`; test không xuyên thân, bàn chân không lún đất). Gói tin mạng mang `skillId` + `t0`.
6. Hiệu ứng + âm thanh + bản giảm (≤ 300 hạt điện thoại, 800 máy mạnh). 7. Trang bị (`gear.js`). 8. 12 combo mẫu + 5 tình huống khắc chế. 9. Kịch bản cân bằng.
