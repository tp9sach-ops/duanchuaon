# PHIÊN 157 — Bàn giao (Bản 2 chiêu thức: mục 3 Hỏa v2)

> Dán nguyên file này vào đầu phiên mới. Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh `main`). Người dùng nói tiếng Việt. Đọc thêm `docs/PHIEN156.md` (bảng đối chiếu + luật lõi).

## Quy tắc làm việc (chép nguyên văn)
"For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff."
- Làm từng mục, xong chạy test, đẩy `main`, báo, chờ "tiếp tục". Không báo test đạt nếu chưa chạy. Chỉ đọc chỗ cần sửa.

## Mục 3 — Hỏa v2 (XONG mã + test)
- Giữ nguyên id, tên, cấp, hồi chiêu, tổng hệ số trong `js/data/combatSkills.js` (Liệt Hỏa Chưởng, Cuồng Long Phẫn Nộ, Hỏa Long Xuất Hải, Bạo Liệt Hỏa Vũ, Long Tức Trảm, Liên Hoa Hỏa Thế). Chỉ thêm trường `moc` cho `hoa_1` (→ `hoa_3`) và `hoa_3` (→ `hoa_hoalong_4`).
- `js/data/chieuHoa.js`: `HOA_V2` (đóng băng) — gồng, hậu động, vùng cảnh báo (hoa văn `socNhon`), giá phải trả, Thiêu đốt, hất tung, dạng trên không của Long Tức Trảm, kích nổ của Liên Hoa Hỏa Thế, móc nối, cách khắc. Số (TẠM).
- `js/world/chieuHoa.js` (logic thuần): `chieuHoa`, `baoTruoc`, `hoa3Trung(tang)`, `longTuc(dangHatTung, soNhat)`, `phanThienKichNo(tang, hpRatio)`, `muaLua(giay)`.
- `tests/chieuhoa.test.mjs` (6 test) đã vào `npm test`.
- Lưu ý: Long Tức Trảm trên không = 4 nhát × 0,9 + nhát cuối 1,4 = 5,0 (khớp tổng hệ số trong mã). Liên Hoa Hỏa Thế: mã giữ `heSo` 1,0 × 9 đóa.
- CHƯA nối vào `skillEngine.js`/`heSkill.js`/`farmCombat.js`: hiện chiêu vẫn chạy theo hệ số cũ, chưa có Thiêu đốt thật trong game, chưa có hất tung. Việc này làm khi nối luật lõi vào chiến đấu (sau mục 4).
- CHƯA nhìn bằng mắt: vùng cảnh báo, hiệu ứng.

## Việc tiếp theo (theo mục 7 của Bản 2)
4. 24 thẻ còn lại (Kim, Mộc, Thủy, Thổ): cùng khuôn `js/data/chieu<He>.js` (gồng, cảnh báo, giá, `moc`, khắc), giữ số trong `combatSkills.js`; thêm `moc` vào chiêu.
5. Tư thế 30 chiêu (`chibiPose`, động tác `cast`; mã tư thế ở Bản 2 mục 5, test `limbPoints/legPoints`). 6. Hiệu ứng + âm thanh + bản giảm. 7. Trang bị (`gear.js`). 8. 12 combo mẫu + 5 tình huống khắc chế. 9. Kịch bản cân bằng.
