# PHIÊN 168 — Bàn giao (prompt "chiêu thức 3D chuyên nghiệp": mục 2 — bảng màu + phác thảo hình 30 chiêu)

> Dán nguyên file này vào đầu phiên mới. Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh `main`). Người dùng (ptg) nói tiếng Việt, không rành kỹ thuật: trả lời NGắN GỌN, DỄ HIỂU. Đọc thêm `docs/PHIEN167.md`, `PHIEN165.md`, `PHIEN163.md`.

## Quy tắc làm việc (chép nguyên văn)
"For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff."
- Làm từng mục, xong chạy test, đẩy `main`, báo, chờ "tiếp tục". Việc đã làm thì bỏ qua. Chỉ đọc chỗ cần sửa (HANDOFF.md rất lớn, đừng đọc cả file). Không báo test đạt nếu chưa chạy. Có thể clone repo và chạy `npm test` (Node 22).

## Danh sách 11 mục "Nộp theo thứ tự" của prompt chiêu thức 3D (mục 14)
1. Thẻ chiêu + dòng thời gian mili-giây — XONG (Phiên 167; `js/world/chieuTimeline.js`, `docs/CHIEU_THOI_GIAN.md`).
2. **Bảng màu + phác thảo hình — XONG phiên này (xem dưới).**
3. Hoạt ảnh nhân vật (4 khung + clip) — có mã gồng/phát/thu (`chieuPose.js`); thiếu khung "trúng" và "hồi", theo đà (áo/đai bay).
4. VFX theo lớp + số hạt + bản giảm — có mã (`chieuFx.js`, `chieuFxPlan.js`, `scene/chieuFx.js`); thiếu lõi sáng, ribbon trail, decal nền, tàn dư; rung/khựng chưa nối camera.
5. Kho âm thanh + giấy phép — chưa.
6. Hoạt ảnh trúng đòn + trạng thái kẻ địch (mục 7 prompt) — chưa. (Gợi ý: làm trước vì mọi chiêu đều cần.)
7. Clip 5 giây ở ba cảnh — cần mắt người, AI không làm được.
8. File JSON số liệu — chưa (hiện là `.js` trong `js/data/`).
9. Điều khiển + camera (mục 10, 10A Khinh Thân cấp 8, mục 11) — chưa.
10. 12 combo mẫu + 5 tình huống khắc chế — chưa.
11. Báo cáo cân bằng — chưa.

## Mục 2 — đã làm gì
- `js/data/chieuMau.js` (dữ liệu thuần, đóng băng): `BANG_MAU` (mỗi Hệ: nền tối, màu chủ, màu sáng, lõi trắng ngà + 1 màu bổ sung tương phản: Kim vàng đồng, Mộc hồng sen, Thủy vàng ánh trăng, Hỏa tím khói, Thổ xanh rêu tươi), `PHAC_THAO` (30 chiêu × [ý tưởng 1 câu, 3 từ khóa, 3 hình dáng, 1 hình được chọn]), hàm `doSang`, `tuongPhan`, `sacDo`, `lechSacDo`, `hexSo` (ra số 0xRRGGBB cho three.js), `hexXam`, `mauHe(he)`, `mauChieu(id)`, `phacThao(id)`. Quy tắc: ≤ 4 màu chủ + 1 màu bổ sung ≤ 10% diện tích (`mauChieu(...).tiLeBuSung`: 0,06; tuyệt học 0,10).
- `tests/chieumau.test.mjs` (8 test, ĐÃ đăng ký vào `npm test`): đủ 5 Hệ, độ sáng tăng dần nền < chủ < sáng < lõi (kiểm đen trắng, ngưỡng tương phản), màu bổ sung lệch sắc ≥ 60° và đủ đậm, hai tông hạt `FX_COLOR` (Phiên 165) cùng họ màu với bảng (≤ 30°, bỏ Kim), đủ 30 chiêu, hình khớp kiểu vùng cảnh báo của thẻ chiêu.
- `tools/chieuMau.mjs`: `node tools/chieuMau.mjs md > docs/CHIEU_BANG_MAU.md` và `node tools/chieuMau.mjs svg > docs/chieu-bang-mau.svg` (bản vẽ vùng cảnh báo tô đúng màu của 30 chiêu).
- Kết quả đã chạy: clone mới của `main` (commit `c4e6383`) → `npm test` **1179 đạt, 0 lỗi**. Bản vẽ SVG: **CHƯA đưa lên GitHub** (file 26 KB, dán qua connector dễ sai); tạo bằng `node tools/chieuMau.mjs svg > docs/chieu-bang-mau.svg` (đã kiểm hợp lệ XML, chưa nhìn bằng mắt vì máy làm việc không có công cụ vẽ ảnh). Phiên sau: tạo SVG và commit nó nếu có quyền ghi bằng git.
- Một lỗi đã gặp và sửa: Thổ có màu bổ sung ban đầu `#6f9a5e` quá nhạt (test bắt) → đổi `#5a9e4b`.

## Chưa nối vào game (cố ý, chưa ai yêu cầu)
- Chưa chỗ nào trong cảnh 3D dùng `BANG_MAU`; `js/data/chieuFx.js` vẫn dùng `FX_COLOR` (hai tông). Khi làm mục 4 (VFX 6 lớp) thì lấy màu lõi/sáng/chủ/nền/bổ sung từ `mauChieu(id)` + `hexSo`.
- Màu và hình phác thảo là TẠM, cần ptg nhìn bảng `docs/CHIEU_BANG_MAU.md` (hoặc SVG sau khi tạo) rồi nói chiêu nào muốn đổi; đổi tại MỘT chỗ `js/data/chieuMau.js` rồi chạy lại 2 lệnh tool ở trên.

## Điều còn treo từ Phiên 167 (cần ptg quyết, chưa đổi mã)
Prompt đòi báo trước tối thiểu 0,4 s (chiêu thường) / 0,8 s (diện rộng); mã hiện dùng 0,25 s / 0,5 s. Theo ngưỡng mới có 9 chiêu gây hại không đạt (Kim Cương Trảm 375 ms, Huyền Băng Chưởng 350, Thiết Kỵ Xung Trận 675, Vạn Hương Quy Tâm 600, Hỏa Long Xuất Hải 600, Hư Không Trận 700, Mê Vụ Lan Tỏa 600, Lạc Diệp Truy Phong 275, Dẫn Lực Địa Mạch 600). Hỏi ptg: giữ Bản 2 hay kéo dài gồng cho đạt (sửa `gong` trong `js/data/chieuNguHanh.js`, `chieuHoa.js`, rồi `node tools/chieuThoiGian.mjs > docs/CHIEU_THOI_GIAN.md`).

## Lưu ý về các mục vật phẩm cũ (danh sách 7 mục ngày 14/11)
Kiểm code ở phiên này: mục 2 (nón Jingasa 400 lá, +3% giáp), mục 3–4 (đổi ngọc thành bánh sầu riêng) đã có trong `js/world/items.js` (Phiên 154/163); mục 6 (phó bản) và mục 7 (linh thú) CHƯA kiểm kỹ ở phiên này: nếu ptg nhắc thì đọc `docs/PHIEN156..165.md` trước, đừng làm lại.

## Việc tiếp theo
Mục 3 của danh sách trên (hoặc mục 6 nếu ptg muốn) — hỏi ptg chọn; nhớ hỏi chuyện ngưỡng 0,4/0,8 s.

## Prompt bàn giao (dán vào phiên mới)
Bạn tiếp tục dự án Diệu Giang Tự (https://github.com/tp9sach-ops/duanchuaon, nhánh main). Quy tắc: For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff. Đọc docs/PHIEN168.md (và 167), clone repo, chạy `npm test`. Làm mục tiếp theo của prompt chiêu thức 3D (mục 3: hoạt ảnh nhân vật, thêm khung "trúng" + "hồi" + theo đà) khi ptg nói "tiếp tục"; hỏi ptg chuyện ngưỡng 0,4/0,8 s. Xong thì chạy test, viết docs/PHIEN169.md, đẩy main, báo ptg và chờ "tiếp tục".
