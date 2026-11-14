# PHIÊN 156 — Bàn giao (Bản 2 chiêu thức: mục 1 đối chiếu + mục 2 luật lõi)

> Dán nguyên file này vào đầu phiên mới. Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh `main`). Người dùng nói tiếng Việt.

## Quy tắc làm việc (chép nguyên văn)
"For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff."
- Làm từng mục, xong chạy test, đẩy `main`, báo, chờ "tiếp tục". Không báo test đạt nếu chưa chạy. Chỉ đọc chỗ cần sửa.

## Mục 1 — Bảng đối chiếu Bản 2 với mã thật (XONG, đã kiểm trên bản clone ngày 2026-11-14)
| Chủ đề | Mã thật | Kết luận |
| --- | --- | --- |
| Hỏa | `combatSkills.js` đã đủ 6 chiêu: Liệt Hỏa Chưởng, Cuồng Long Phẫn Nộ, Hỏa Long Xuất Hải, Bạo Liệt Hỏa Vũ (`hoa_liethoa_4`), Long Tức Trảm (`hoa_hoalong_4`), Liên Hoa Hỏa Thế; Pháp Môn `liethoa`, `hoalong` | GIỮ id/tên/cấp/hồi/hệ số. KHÔNG đổi sang Liệt Diễm/Chu Tước (cần ptg duyệt) |
| Đơn vị | `heSo` × Công; Sinh Lực = 120 + 25 × (Tu Vi − 1) (`stats.js`) | Dùng hệ số |
| Nội lực | Không có | Bỏ nội lực; tài nguyên = hồi chiêu + Tâm Ấn |
| Khắc hệ | `kLoi` 1,3, `kThuong` 1, `kBat` 0,8 | Dùng ×1,3 / ×0,8 |
| Giảm sát thương | `thuNen` 100 ÷ (100 + Thủ) | Giữ; thêm (1 − GST) |
| Tuyệt học hồi chiêu | `TUYET_CD = 60` | 60 s |
| Võ đài | `js/world/duel.js`: sinh lực cố định 1000 | Trang bị không tính ở Võ đài |
| Nón / Gậy | Nón 400 lá giáp +3% (`items.js`, Phiên 154); Gậy như ý 400 lá +1% | Mốc neo giá mục 6 |
| Khung xương | `chibiRig.js` 15 khớp, `armAngle/elbowAngle/kneeAngle/limbPoints/legPoints` | Tư thế mục 4–5 viết theo các khớp này |
Chưa kiểm bằng mắt: mọi thứ liên quan hình/tư thế (không có WebGL ở môi trường AI).

## Mục 2 — Luật lõi (XONG mã + test)
- `js/data/luatChien.js` (số TẠM): `LUAT` (GST tối đa 70%, đoán gồng +20%, hủy gồng mất 30% hồi chiêu, kháng lũy tiến 1/0,6/0,3 trong 8 s rồi miễn 3 s, hất tung lại trong 6 s còn 0,5 s, móc nối, Thiêu đốt 3 s × 8%/s tối đa 3 tầng, chậm tối đa 60%, trần khống chế PvE/Võ đài), `PHAN_UNG` (5 phản ứng).
- `js/world/luatChien.js` (logic thuần): `kHeOf`, `gstTong`, `damage`, `phanUng`, `cdMatKhiHuy`, `dangEpMau`, `gioiHan`, `chamTong`, `createKhang` (kẹp tổng khóa liên tục ≤ 3 s), `khoaLienTuc`, `createThieuDot`, `chuoiMoc`.
- `tests/luatchien.test.mjs` (9 test), đã thêm vào `npm test`.
- Chưa nối vào `skillEngine.js` / `farmCombat.js` (việc sau). `chuoiMoc` đọc `skill.moc`: các chiêu CHƯA khai báo `moc: [id…]` (mục 3 làm).

## Việc tiếp theo (theo mục 7 của Bản 2)
3. Hỏa v2: thêm vào `combatSkills.js` các trường gồng/cảnh báo/giá/`moc`/khắc cho 6 chiêu Hỏa (không đổi id, tên, cấp, hồi, tổng hệ số), không phá `combatskills.test.mjs`, `luyenchieu.test.mjs`.
4. 24 thẻ Kim/Mộc/Thủy/Thổ. 5. Tư thế 30 chiêu vào `chibiPose` (động tác `cast`; mã tư thế ở Bản 2 mục 5, chưa nhìn trên máy thật). 6. Hiệu ứng + âm thanh + bản giảm. 7. Trang bị (`gear.js`). 8. 12 combo mẫu + 5 tình huống khắc chế. 9. Kịch bản cân bằng.
Điểm cần ptg chốt (mặc định đã chọn): giữ tên Hỏa trong mã; "Tốc độ" = tốc chạy; combo mẫu Hỏa ≈ 13,9 hệ số so với Sinh Lực Võ đài 1000 cần cân lại sau playtest.
