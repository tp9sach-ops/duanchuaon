# Phiên 207 — Lướt chiêu: VÙNG TUNG CHIÊU TRÊN MẶT ĐẤT (như Liên Quân / Liên Minh) + khu luyện tập nhận hướng lướt

> Repo `main` (đầu phiên: `476ab91`, Phiên 206). ptg nói "tiếp tục" và thêm yêu cầu: (1) các kỹ năng ở võ đài / luyện tập / đánh quái / bình thường PHẢI hiển thị và dùng GIỐNG HỆT nhau, không phân biệt; (2) khi lướt tay dùng chiêu định hướng phải hiện VÙNG TUNG CHIÊU / vùng chọn chiêu trên mặt đất, nhả tay là thực hiện đúng chiêu, đúng hướng đó. Quy tắc giữ nguyên: làm từng mục, xong đẩy GitHub rồi báo, chờ "tiếp tục".

## Phiên này làm (bước 1 + 2 của yêu cầu mới)
- **Vùng tung chiêu 3D trên đất khi lướt (mọi nơi dùng thanh chiêu `heSkill.js`: đánh quái, bình thường, khu luyện tập):** khi bấm giữ nút chiêu rồi lướt ≥ 22 px với chiêu ĐỊNH HƯỚNG (vùng báo dạng đường / nón — `isDirectional`), hình chiêu được tô màu Hệ trên mặt đất, gốc ở chân nhân vật, xoay theo hướng ngón tay (đổi hướng màn hình → thế giới theo góc camera, `swipeDir`), vẽ lại mỗi 60 ms (đi hoặc xoay camera khi đang ngắm vẫn đúng). Nhả tay mới tung, đúng hướng đó (`castDir`, Phiên 198). Kéo ngược về chỗ bấm = hủy. Mũi tên 2D cũ giữ lại.
  - `js/world/aimPreview.js` (logic thuần, có test): `previewPoly(hinh)` → đa giác [x,z] cục bộ (+z = hướng chiêu): `duong` = chữ nhật `dai` × `rong`; `non` = đỉnh + cung `goc`; vòng tròn/lạ → null. Thiếu số đo dùng mặc định trùng `aimSwipe.js` (nón dài 8 m góc 70°, đường rộng 2 m).
  - `js/scene/aimPreview.js` (three.js): `createAimPreview(scene)` → `show({x,z,ry,hinh,mau})` / `hide()` / `dispose()`. Quạt tam giác trong suốt + viền, `y = 0.14`, không đèn động. Nạp lười từ `heSkill.js` (`aimReady()` trong `paint()`); nạp lỗi thì còn mũi tên 2D như cũ.
- **Khu luyện tập nhận hướng lướt:** trước đây `heSkill.cast()` ở khu luyện tập gọi `luyenCast(slot)` và BỎ `swipe` nên chiêu định hướng luôn bay về mộc nhân gần nhất. Nay `luyenCast(slot, swipe)` truyền `{ ry }` cho `LGT.luyenChieu.castById(id, aim)` → `luyenChieu.cast(i, aim)`: nhân vật quay + hiệu ứng 3D bay theo hướng lướt; chỉ mộc nhân GẦN NHẤT nằm trong vùng báo (`pickInDir`) mới nháy; lướt vào chỗ trống vẫn tung, không mộc nhân nào nháy. Chạm nhanh (không lướt) = như cũ.
- File: thêm `js/world/aimPreview.js`, `js/scene/aimPreview.js`, `tests/aimpreview.test.mjs`, `docs/PHIEN207.md`; sửa `js/ui/heSkill.js` (24 dòng thêm, 7 bớt), `js/ui/luyenChieu.js` (`cast(i, aim)`, `castById`, import), `package.json` (thêm test), `sw.js` (`dgt-v193`).

## CHƯA kiểm được
- CHƯA chạy `npm test` (không có bản repo để chạy trong môi trường AI). Phiên 206 + 207 đều chưa được chạy test — chạy `npm test` (~5 phút) TRƯỚC KHI làm tiếp. Test mới `tests/luyenbasic.test.mjs`, `tests/aimpreview.test.mjs` mới tính tay.
- CHƯA xem bằng mắt (không WebGL). ptg thử trên điện thoại: giữ một nút chiêu có vùng báo dạng đường/nón (vd. Kim Cương Trảm, Liệt Hỏa Chưởng), lướt ngón tay → phải thấy hình chiêu tô trên đất xoay theo ngón; nhả tay → chiêu bay đúng hướng. Thử cả ở Võ đường luyện chiêu.
- `W.camera.yaw` / `W.pos` dùng như `heSkill.js` đã dùng từ Phiên 198; chưa kiểm hướng khi camera xoay ngược.

## CHƯA làm: "hiển thị như nhau ở mọi nơi" — VÕ ĐÀI / GIAO LƯU (`js/ui/duel.js`) — MỤC KẾ
Võ đài đang dùng bộ nút RIÊNG, khác hẳn: `body.dl-arena #hs-bar{display:none}` ẩn thanh chiêu phái, thay bằng `.dl-bar` (8 nút tròn nhỏ Q W E A T B C G, có chữ phím) và động cơ trận riêng `js/world/duel.js` (`MOVES`, `createDuel`). Để "như nhau, không phân biệt":
1. Hiện lại thanh chiêu `#hs-bar` + cụm nút `#dock` (Đánh thường / Thương / Nhảy) trong Võ đài, bỏ (hoặc ẩn) hàng `.dl-bar` cho các ô trùng (Q W E, Đánh thường, Thương).
2. Trong `heSkill.cast()`: khi `LGT.duel.mode === 'arena'` → chuyển cho `LGT.duel` (thêm `cast`-theo-ô, có nhận `swipe`/hướng) thay vì đường farm; ở võ đài hướng lướt = hướng chiêu (hiện tại `duel.cast` tự ngắm về đối thủ).
3. Dock: `ACT.da/thuong` ở võ đài gọi `duel.cast('a'/'t')` (dock.js `ACT` hiện chỉ biết `luyen()` hoặc `LGT.yq`); `dockButtons` cần `combat: true` ở zone Võ đài.
4. Đồng bộ `MOVES` phái (q/w/e) với chiêu thật của Hệ (hiện `nameOf` chỉ lấy TÊN theo hệ; sát thương/hình vùng là số tạm trong `js/world/duel.js`).
Phải giữ phím Q W E R / 1–6 và bắt phím pha CAPTURE của duel (đang `stopImmediatePropagation`). Cần hai máy thật để thử (gói tin qua `LGT.room`).
Việc nhỏ còn sót: Đánh thường lao tới + chuỗi 3 đòn ở Võ đài (dùng `basicCombo.planTap`, `LGT.farm.rushPoint/chainStep`).

## PROMPT BÀN GIAO CHO PHIÊN SAU (dán nguyên văn)
```
Dự án DIỆU GIANG TỰ — repo https://github.com/tp9sach-ops/duanchuaon (main). Đọc PROMPT.md, rồi docs/PHIEN207.md (và bản PHIEN mới nhất nếu có). Chỉ đọc chỗ cần; việc đã làm thì bỏ qua; cập nhật KHÔNG được gây lỗi (npm test chạy ~5 phút: chạy nền `setsid nohup npm test > /tmp/t.log 2>&1 < /dev/null &`, đợi dòng "# fail"). ĐẦU TIÊN chạy npm test để xác nhận Phiên 206 + 207 (chưa từng được chạy).
Yêu cầu của ptg (2026-11-16): kỹ năng ở võ đài / luyện tập / đánh quái / bình thường phải HIỂN THỊ VÀ DÙNG NHƯ NHAU, không phân biệt; lướt tay dùng chiêu định hướng thì hiện vùng tung chiêu trên đất, nhả tay là tung đúng chiêu đúng hướng (như Liên Quân / Liên Minh).
Đã xong: mục 1 nút ⚙ dưới bản đồ (Phiên 204); Đánh thường lao tới + combo 3 đòn ở quái bãi rừng (198), yêu quái hằng tháng (205), khu luyện tập (206); lướt chiêu định hướng ở bãi rừng (198) và khu luyện tập + vùng tung chiêu 3D trên đất (207).
Việc phiên này: VÕ ĐÀI / GIAO LƯU (js/ui/duel.js, js/world/duel.js) dùng CHUNG thanh chiêu #hs-bar + cụm nút dock với phần còn lại (xem mục "CHƯA làm" trong docs/PHIEN207.md: bước 1–4), có lướt chiêu + vùng tung chiêu; Đánh thường lao tới + combo 3 đòn ở võ đài. Tái dùng js/world/basicCombo.js, js/world/aimSwipe.js, js/world/aimPreview.js, js/scene/aimPreview.js, LGT.farm.rushPoint/chainStep. Xong: tăng VERSION sw.js, thêm docs/PHIEN<N>.md có prompt bàn giao như file này, đẩy GitHub (trùng tên ghi đè), báo ptg, chờ "tiếp tục".
```

## QUY TẮC BÀN GIAO (nguyên văn)
> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff
