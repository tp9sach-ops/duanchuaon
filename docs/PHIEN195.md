# PHIÊN 195 — Mục 1: BIỂU TƯỢNG CHIÊU (vẽ lại lần 2, theo ảnh Liên Quân ptg gửi)

> Repo `main`. ptg: trả lời NGẮN GỌN, làm TỪNG MỤC, xong đẩy GitHub rồi báo, chờ "tiếp tục".
> Quy tắc bàn giao (chép nguyên văn): "For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff."

## Đã có từ trước (bỏ qua)
Phiên 190–191: chiêu + đánh thường dùng được khi không có quái. Phiên 192: cung tròn chiêu (`js/ui/actionArc.js`). Phiên 193: nút ⚙ chỉnh cỡ nút (`js/ui/btnScale.js`). Phiên 194: khung kim loại có khấc + nền cảnh theo Hệ (giữ nguyên).

## Phiên này (mục 1 — chỉ sửa `js/ui/skillIcon.js`)
Đã chụp bằng jsdom + resvg (50 hình = 10 glyph × 5 Hệ) rồi xem lại; Phiên 194 còn nhiều hình "chung chung", nay vẽ lại các hình kém nhất:
- `hoi` (Hồi máu): hai BÀN TAY có ngón, da ấm tách khỏi nền, nâng quả cầu sinh lực có dấu cộng, tia sáng tỏa + vòng phép nghiêng.
- `khoa` (Khống chế): ấn phong — vòng phép có vạch chữ, ngôi sao sáu cánh (hai tam giác), mắt ấn ở giữa.
- `lao` (Lao tới): mũi lao đầu nhọn + đuôi lông, hai vòng gió xé, vệt tốc độ.
- `tia` (Kiếm khí): thanh kiếm đủ lưỡi/rãnh máu/chắn kiếm vàng/chuôi/đốc, vệt chém cong bay theo, quầng sáng ở mũi.
- `vung` (Sóng xung kích): tâm nổ hình sao 8 cánh, ba vành sóng lan, mảnh vỡ văng.
- Giữ nguyên: `an`, `khien`, `toc`, `chem`, `chon`; chữ ký `drawGlyphIcon(mau, glyph, tuyet, dim)` và `GLYPH_D`.
- `sw.js` = `dgt-v182`.

## Kiểm thử
`tests/smoke.mjs` đạt; `heskillui/luyenchieu/btnscale`: 16/17. Test lỗi `Phiên 192: cung tròn chiêu — … chồng hàng đáy 1 -75` (tests/heskillui.test.mjs:29) LỖI SẴN từ trước (cùng kết quả khi chưa sửa gì) — do bố cục Phiên 193 hạ cụm nút xuống đáy; nên xử cùng mục 2 (nút chiêu luyện tập không bấm được) vì có thể liên quan chồng nút.

## ptg kiểm
Tải lại cứng, xem thanh chiêu: 5 hình trên đã giống Liên Quân hơn chưa; chiêu nào còn chưa ưng báo tên chiêu để chỉnh riêng.

## Việc kế (theo danh sách ptg)
2. Nút chiêu trong khu luyện tập không bấm được (kiểm cả test chồng nút ở trên). 3. Nút khinh công: góc quay đi theo, bấm lướt, bay từ từ rồi hạ — chưa giống mô tả. 4. Đánh thường lao tới mục tiêu trong tầm ngắn → combo 3 đòn khác nhau (đòn 3 sát thương lan, quái dính thì đánh lại). 5. Chiêu: bấm rồi lướt ngón tay chọn hướng (chiêu định hướng theo hướng lướt). 6. Không có quái vẫn dùng chiêu + đánh thường nhưng không gây sát thương.
