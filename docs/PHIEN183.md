# PHIÊN 183 — Bàn giao (hiệu ứng chiêu 3D: NỐI Băng/Nước + Kim/Sét vào game; kế hoạch chi tiết Mục 4–7)

> Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh `main`). Gp nói tiếng Việt: trả lời NGẮN GỌN, DỄ HIỂU, làm TỪNG MỤC, xong đẩy GitHub, báo, chờ "tiếp tục". Đọc `PROMPT.md` → `HANDOFF.md` (đầu file) → `docs/KE_HOACH_HIEU_UNG_3D.md` → file này.

## Quy tắc làm việc (chép nguyên văn)
"For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff."

## Yêu cầu của Gp (2026-11-15)
Hiệu ứng chiêu hiện chỉ là "ô vuông màu", không giống thật. Muốn 3D, mượt, như thật (lửa như lửa thật: màu, độ lan tỏa; băng như băng thật…). Lập kế hoạch mô tả chi tiết rồi làm từng mục, bắt đầu từ 1; việc nào đã làm thì bỏ qua; xong đẩy GitHub rồi báo.

## Phát hiện quan trọng (mã thật ≠ tài liệu)
- Kế hoạch đã có từ Phiên 177 (`docs/KE_HOACH_HIEU_UNG_3D.md`). Mục 1 Lửa nối đúng. **Mục 2 Băng/Nước (Phiên 180) và Mục 3 Kim/Sét (Phiên 181) có logic + file vẽ + test nhưng `js/scene/chieuFx.js` KHÔNG gọi `taoBang`/`taoKim`** → trong game vẫn chỉ thấy hạt + quầng ("chấm màu"). Tài liệu cũ ghi "đã nối" là sai.

## Đã làm
| File | Thay đổi |
|---|---|
| `js/scene/chieuFx.js` | import `taoBang`, `taoKim`; lớp 2 "thân" chọn bộ theo Hệ: `hoa` → `taoLua`; `thuy` + loai `bang`/`nuoc` → `taoBang({loai})`; `kim` + loai `kim` → `taoKim`; Mộc/Thổ chưa có → bỏ qua. Lỗi vẽ bị nuốt (try/catch), game vẫn chạy. |
| `tests/kim.test.mjs` | Thêm test cuối: `chieuFx.js` phải import + gọi `taoLua`, `taoBang`, `taoKim` và có điều kiện Hệ thủy/kim (chống quên nối lần nữa). |
| `docs/KE_HOACH_HIEU_UNG_3D.md` | Đính chính trạng thái Mục 2–3; viết chi tiết Mục 4 (Mộc), 5 (Thổ), 6, 7. |
| `sw.js` | `VERSION` `dgt-v172` → `dgt-v173`. |

Kết quả: **18/30 chiêu có lớp thân thật** (lửa 6, băng/nước 6, kim/sét 6). Còn 12 chiêu: Mộc 6, Thổ 6.

## Đã kiểm
- `npm test` **1248/1248 đạt** (Node 22) trước khi thêm test mới; `tests/kim.test.mjs` 8/8 sau khi thêm.
- Dựng thật bằng three.js 0.160.1 trong Node (không GPU): 60 tổ hợp (3 bậc máy × 5 kiểu bay × lửa/băng/nước/kim) dựng + cập nhật 6 mốc thời gian, 0 lỗi; `createChieuFx.cast` cả 30 chiêu × 3 bậc = 90 lần, 0 lỗi.
- Sau khi đẩy: tải lại `chieuFx.js`, `sw.js`, `tests/kim.test.mjs` từ GitHub, so từng byte với bản đã test: KHỚP.
- **CHƯA nhìn bằng mắt** (không có WebGL ở môi trường AI): cỡ, độ sáng, độ lan tỏa là số TẠM. Gp thử trong Luyện chiêu rồi báo "to/nhỏ, sáng/tối, dày/thưa".

## Việc kế (làm khi Gp nói "tiếp tục")
**Mục 4 — Mộc** (lá 3D xoay lật, dây leo mọc, hoa nở, bào tử, sương xanh): xem mô tả + số vật thể trong `docs/KE_HOACH_HIEU_UNG_3D.md`. Quy trình: `js/world/moc.js` + `tests/moc.test.mjs` → `js/scene/fxMoc.js` (`taoMoc`) → nối ở `chieuFx.js` (`p.he === 'moc'`) → thêm vào test nối dây → nâng `sw.js` → `docs/PHIEN184.md` → đẩy GitHub → báo Gp. Sau đó Mục 5 Thổ.

## Chưa cập nhật
`PROMPT.md` (mục 7) và `HANDOFF.md` quá lớn để sửa qua API; phiên sau nếu có quyền git thì thêm dòng "Phiên 183" trỏ tới file này.
