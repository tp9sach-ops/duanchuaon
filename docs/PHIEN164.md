# PHIÊN 164 — Bàn giao (Lộ trình mới, MỤC 1: điều khiển CHUNG Võ đài ↔ đánh quái)

> Dán nguyên file này vào đầu phiên mới. Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh `main`). Người dùng nói tiếng Việt. Làm từng mục, xong đẩy `main`, báo, chờ "tiếp tục". Việc đã làm thì bỏ qua; chỉ đọc chỗ cần sửa; không báo test đạt nếu chưa chạy.

## Quy tắc làm việc (chép nguyên văn)
"For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff."

## Yêu cầu mục 1 của PTG
"Khi giao lưu võ thuật hay thu phục quái thì cũng các nút đánh và combo giống nhau, hãy quy về chung 1 cách điều khiển, tấn công Q W E R, 1234567 để sử dụng các chiêu thức."

## Đã làm (XONG mã + test; CHƯA nhìn bằng mắt vì môi trường AI không có WebGL)
Bộ phím CHUNG (cùng `js/ui/dock.js` + `js/ui/heSkill.js` ngoài rừng):

| Phím | Ngoài rừng (đánh quái) | Võ đài (giao lưu) |
|---|---|---|
| 1 | Đánh thường (ô A dock) | Đánh thường `a` |
| 2 hoặc R | Thương | Thương `t` (MỚI: tầm 3,6 m, 60 sát thương, hồi 1,8 s) |
| 3 | Chém khí | Chém khí `b` |
| 4 | Thiết đầu công | Thiết đầu công `c` |
| Q / W / E | Chiêu 1/2/3 của phái | Chiêu `q`/`w`/`e` (MỚI: chuẩn hoá, ai cũng có, KHÔNG gắn cấp/hệ cho công bằng; hệ chỉ đổi TÊN hiển thị) |
| 6 | (chưa dùng) | Hộ thân `g` (đổi từ phím U cũ) |
| 5, 7 | 5 = Tự động hàng yêu | chưa dùng |

Thay đổi:
1. `js/world/duel.js`: `MOVES` thêm `t,q,w,e` + trường `shape` ('melee'|'wave'|'dash') — `resolveIncoming` xử lý theo `shape` thay vì cứng `a/b/c`; `ATTACKS = a,t,b,c,q,w,e`; xuất `KEY_CODES` (phím → chiêu). Gói tin mạng không đổi định dạng (chữ loại chiêu vẫn 1 ký tự a–z); máy cũ gặp chiêu mới thì bỏ qua gói.
2. `js/ui/duel.js`: bỏ phím J/K/L/U; nghe `keydown` ở pha CAPTURE + `stopImmediatePropagation` (để heSkill/farm không báo "chưa có quái" khi bấm Q/W/E/R ở Võ đài); thanh nút 8 chiêu (2 hàng, có nhãn phím); `body.dl-arena` ẩn thanh Q/W/E của heSkill khi đang ở Võ đài (tránh hai bộ nút chồng nhau); hiệu ứng theo `shape`; Đánh thường/Thương gọi `LGT.combatPose.strike` (combo múa côn như ngoài rừng); Q/W/E gọi `avatar.cast(id chiêu phái)`.
3. `js/ui/combatPose.js`: thêm `strike(ry)` (quay mặt + nối chuỗi combo + vệt chém + vào thế chiến đấu) và `inDuel` → đứng thế chiến đấu khi ở Võ đài (kéo theo `board.js` tự xuống ván).
4. `tests/duelcontrols.test.mjs` (MỚI, 3 test: bảng phím, gói tin chiêu mới, tầm Thương/Chiêu 1/2/3). `node --test tests/duelcontrols.test.mjs tests/duel.test.mjs` = 18/18; `npm test` = 1145/1145. LƯU Ý: cả `duel.test.mjs` lẫn `duelcontrols.test.mjs` chưa nằm trong script `npm test` của package.json — nên thêm.

## Còn lại / cần PTG thử bằng mắt (hai máy thật)
- Ở Võ đài, bấm 1 liên tục có ra chuỗi múa côn giống ngoài rừng không; Q/W/E có đổi tư thế; thanh nút 8 chiêu (2 hàng, giữa đáy màn hình) có bị đè lên cụm nút dock bên phải trên điện thoại hẹp không.
- Con số Thương/Q/W/E là QUY ƯỚC TẠM, chờ PTG duyệt.
- Chưa làm: dock/heSkill chưa hiện nút trực tiếp trong Võ đài (Võ đài dùng thanh nút riêng nhưng CÙNG phím và CÙNG tên chiêu). Nếu PTG muốn gộp hẳn một thanh nút: sửa `js/world/dock.js` (`dockButtons` thêm ngữ cảnh `duel`) + `ACT` trong `js/ui/dock.js`.

## Mục kế tiếp (theo lộ trình mới đã lưu): mục 2 — Vật phẩm tiệm Kim Hoàng (ngọc hồi máu 100 lá bồ đề, ngọc dịch chuyển 200, ván trượt 100; gậy như ý 400 lá bồ đoàn ở điện máy; mặc định cây thương; túi đồ chọn vũ khí cầm). Chờ PTG nói "tiếp tục".
