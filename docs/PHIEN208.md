# Phiên 208 — VÕ ĐÀI dùng CHUNG thanh chiêu + cụm nút với đánh quái / luyện tập / bình thường

> Repo `main` (đầu phiên: `b9bb75b`, Phiên 207). Yêu cầu của ptg (2026-11-16): (1) tiếp tục phiên trước; (2) Đánh thường lao tới + combo 3 đòn, chiêu phái lướt tay, chiêu định hướng theo hướng lướt; (3) làm tiếp theo "Prompt nâng cấp sức hấp dẫn". Làm từng mục, xong đẩy GitHub rồi báo, chờ "tiếp tục". Phiên này làm mục 1 (Võ đài — việc dở của Phiên 207) + phần mục 2 còn thiếu ở Võ đài.

## Kết quả test
`npm test` trên bản đã đẩy: **1348 test, 1348 đạt, 0 lỗi** (~4,5 phút). Phiên 207 để lại 2 test đỏ (`aimswipe` #46, `heskillui` #575) do regex còn khớp `luyenCast(slot)` trong khi mã đã là `luyenCast(slot, swipe)` — đã sửa regex. `tests/duel.test.mjs` + `duelcontrols.test.mjs` trước đây KHÔNG nằm trong `npm test` → nay đã thêm.

## Phiên này làm
- Võ đài dùng CHUNG thanh chiêu `#hs-bar` (bỏ luật ẩn `body.dl-arena #hs-bar`): ô 1/2/3 = Q/W/E của Võ đài (`SLOT_MOVE` trong `js/world/duel.js`); ô 4 + Tuyệt Học ẩn ở Võ đài; hồi chiêu từ `LGT.duel.cdOfSlot`.
- Lướt tay ở Võ đài: vùng tung chiêu trên đất theo ĐÚNG hình vùng trúng (`hinhOfMove`), nhả tay → chiêu bay đúng hướng (`LGT.duel.castSlot(slot, ry)`). Chạm nhanh = tự ngắm về đối thủ như cũ.
- Cụm nút dock: `luyen()` trả cả `LGT.duel` khi đang trong trận → Đánh thường / Thương / Nhảy hiện và hồi chiêu dùng chung.
- Đánh thường ở Võ đài: LAO TỚI (xa tầm đánh, trong tầm lao; dừng cách ~2 m, không ra khỏi sàn) rồi bấm tiếp mới ra đòn; chuỗi 3 đòn ngang → ngược → xoay 360° (đòn 3 thêm vòng hiệu ứng). Sát thương Võ đài giữ nguyên (chỉ 1 đối thủ).
- Hàng nút riêng `.dl-bar` chỉ còn Chém khí / Thiết đầu công / Hộ thân (xếp dọc bên trái); người chưa có Hệ vẫn thấy Q/W/E ở đó.
- Sửa lỗi cũ: Thiết đầu công / Chiêu 3 ở Võ đài chưa từng lao thật (`landing()` trả `{x,z,dist}`, mã dùng `path.to`).
- File: sửa `js/world/duel.js`, `js/ui/duel.js`, `js/ui/heSkill.js`, `js/ui/dock.js`, `tests/{aimswipe,heskillui}.test.mjs`, `package.json`, `sw.js` (`dgt-v194`); thêm `tests/duelshare.test.mjs`, `docs/PHIEN208.md`.

## CHƯA kiểm / CHƯA làm
- CHƯA xem bằng mắt (không WebGL), CHƯA thử hai máy thật. Thử: vào Võ đài với bạn → thanh chiêu + Đánh thường phải hiện; bấm Đánh thường từ xa → lao tới; lướt Q → vùng đường/quạt hiện trên đất; hàng nút trái (top:38%) không đè gì trên màn hẹp.
- Số đo chiêu Võ đài (`MOVES` q/w/e) vẫn là số TẠM chung cho mọi Hệ; gói tin chỉ mang chữ q/w/e. Muốn sát chiêu thật của Hệ phải thêm mã Hệ vào gói `atk` (đổi giao thức, cả hai máy phải cập nhật).
- Chiêu hỗ trợ (khiên, hồi máu…) không dùng ở Võ đài. "Gọi boss" ở Võ đài chưa có.

## VIỆC KẾ (mục 3): "Prompt nâng cấp sức hấp dẫn"
Phiên S1 chỉ ĐỌC MÃ: lập bảng "Đã có / Chưa có" cho 8 trụ cột (ghi tên file thật), hỏi 8 + 4 câu cần ptg duyệt (repo chính nào; tiền thật không mua sức mạnh; giữ chiến đấu nhẹ hay thêm Quét Sen/Lăn Sen/Thiền Hộ Thể; lời kinh; chỉ code hay chấp nhận GLB; Linh thú; thang PERF; lịch ba trùm; quái "độ hóa"; nhịp gồng 1.350 hay 1.800 ms). KHÔNG viết mã ở S1.

## PROMPT BÀN GIAO CHO PHIÊN SAU (dán nguyên văn)
```
Dự án DIỆU GIANG TỰ — repo https://github.com/tp9sach-ops/duanchuaon (main). Đọc PROMPT.md, rồi docs/PHIEN208.md (và bản PHIEN mới nhất nếu có). Chỉ đọc chỗ cần; việc đã làm thì bỏ qua; cập nhật KHÔNG được gây lỗi (git clone repo rồi `setsid nohup npm test > /tmp/t.log 2>&1 < /dev/null &`, đợi dòng "# fail"; ~5 phút). Đẩy GitHub bằng công cụ github push_files (không có git credential trong container).
Yêu cầu của ptg (2026-11-16): kỹ năng ở võ đài / luyện tập / đánh quái / bình thường HIỂN THỊ VÀ DÙNG NHƯ NHAU; Đánh thường lao tới + chuỗi 3 đòn (đòn 3 lan, quái dính thì đánh lại); lướt tay dùng chiêu định hướng, hiện vùng tung chiêu trên đất, nhả tay tung đúng hướng.
Đã xong: nút ⚙ (204); Đánh thường lao tới + combo 3 đòn ở bãi rừng (198), yêu quái hằng tháng (205), khu luyện tập (206), Võ đài (208); lướt chiêu + vùng tung chiêu 3D cho bãi rừng (198, 207), luyện tập (207), Võ đài (208).
Việc phiên này: mục 3 = "Prompt nâng cấp sức hấp dẫn" — chạy phiên S1: đọc mã, lập bảng Đã có / Chưa có cho 8 trụ cột, hỏi các câu cần ptg duyệt, DỪNG chờ duyệt, chưa viết mã. Xong: tăng VERSION sw.js nếu có đổi mã, thêm docs/PHIEN<N>.md có prompt bàn giao như file này, đẩy GitHub, báo ptg, chờ "tiếp tục".
```

## QUY TẮC BÀN GIAO (nguyên văn)
> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff
