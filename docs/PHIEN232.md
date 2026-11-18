# Phiên 232 — Mục 1 (đợt 1): ĐỒ HỌA + ĐÒN ĐÁNH CỦA YÊU QUÁI

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Yêu cầu ptg (2026-11-18): xem lại repo, việc đã làm thì bỏ qua; làm từng mục, xong đẩy GitHub rồi báo. Mục 1 = đồ họa/hình ảnh yêu quái đẹp, sắc nét, chuyên nghiệp hơn + đòn đánh, chiêu thức, phạm vi đánh, vùng tấn công, tư thế đánh, hướng đánh. Mục 2 = người chơi ảo (`/nguoichoiao`) — CHƯA làm.
Việc "quái bị trúng chiêu" (hiệu ứng/âm thanh/tư thế) đã có từ phiên trước (`js/world/hitReact.js`), không làm lại.

## Phát hiện
- `js/data/monsters.js` có 24 loại quái nhưng `js/scene/farm.js` chỉ dựng riêng 6 loại; 18 loại còn lại bị vẽ chung thành "Cướp Đường".
- Đòn đánh của mọi quái chỉ là VÒNG TRÒN quanh thân (không hướng), hướng quái bám theo người chơi tới tận lúc đánh nên không né ngang được.

## Đã làm
1. `js/scene/monsterModels.js` (MỚI): hình riêng + hoạt ảnh cho ĐỦ 24 loại. Bộ dựng theo họ: người (đạo tặc, cướp, sơn cước, giáp kim, hỏa ly, viêm ma…), khối đá (rêu tinh, thạch tinh, hộ tháp, nham cự…), cây yêu, mèo rừng, thủy quỷ, sứa mẹ, cá chép. Chân/tay/đuôi/xúc tu là khớp xoay: đi thì chân vung, GỒNG thì giơ tay/nhún thấp, VUNG thì bổ xuống/vồ/lao; thở, lắc đầu khi đứng. Hình học + vật liệu dùng chung qua bộ nhớ đệm (không rò bộ nhớ khi ô đổi loại). Boss/tinh anh to hơn nhóm của chúng.
2. `js/data/monsterAI.js`: `PATTERNS` (vuot, chem, nen, lao, xoay, xung) + `MON_PATTERNS` (mỗi loại 2 kiểu đòn luân phiên). Kiểu: `non` (quạt, góc độ), `duong` (lao thẳng, rộng), `tron` (đập quanh thân). TẠM, chờ ptg duyệt.
3. `js/world/monsterAttack.js`: `zoneOf(m)`, `inZone(z, m, px, pz)`, `patternIds(type)`. Hướng quái KHÓA lúc gồng (chạy ngang/ra sau lưng là né được); trúng/trượt tính theo vùng đúng hình; `m.pat` = kiểu đòn đang dùng; `m.strikeT` = 0,45 s sau khi vung (cho cảnh vẽ). Boss vẫn cứ 3 đòn 1 lần giậm đất (vòng tròn). Sát thương/tầm/hồi chiêu/tốc độ KHÔNG đổi.
4. `js/scene/farm.js`: dùng mô hình mới; vùng báo đòn đúng HÌNH và HƯỚNG (quạt cam, đường tím, vòng đỏ), nháy sáng ở đúng vùng vừa đánh; đòn lao có quái lao tới; bóng dưới chân; thanh Oán Khí đặt theo chiều cao mô hình.
5. Test: `tests/monsterpattern232.test.mjs` (8 test) + `tests/sim/{three-mini,hooks-mini,reg-mini,monstermodels-sim}.mjs` (three giả CÓ TRẠNG THÁI: dựng đủ loại, chạy hoạt ảnh mọi trạng thái, không NaN). Đăng ký vào `npm test`. `sw.js` = `dgt-v217`.

## CHƯA kiểm / giới hạn (nói thẳng)
- CHƯA nhìn bằng mắt: môi trường không có three.js thật (CDN bị chặn) nên chưa chụp hình. Cần ptg mở game xem: hình dáng, tỉ lệ, màu, độ mượt hoạt ảnh, vùng báo đòn. Mọi số đo là TẠM.
- Bóng quái của người khác (qua mạng, `combatLink`) không mang `pat`: vẽ vùng báo đòn theo kiểu ĐẦU của loại quái (đúng hình nhưng có thể khác kiểu đang đánh). Đồng bộ `pat` qua mạng là việc sau nếu cần.
- Chưa có tiếng riêng cho từng kiểu đòn của quái (vẫn dùng `da-trung`); chưa có hiệu ứng hạt riêng khi quái vung đòn.

## VIỆC KẾ
- Mục 2: người chơi ảo (`/nguoichoiao` thêm 1 người ảo mỗi lần gõ; tên ngẫu nhiên tự nhiên kiểu người Việt; tin nhắn bắt đầu bằng `/` chỉ người gõ thấy, không gửi lên mạng; người ảo làm nhiệm vụ/câu cá/xây nhà/luyện cấp/đánh quái/học chiêu/phó bản/lá bồ đề; tỷ thí được). Làm khi ptg nói "tiếp tục".
