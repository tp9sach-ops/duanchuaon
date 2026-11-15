# PHIÊN 180 — Bàn giao (kế hoạch hiệu ứng 3D như thật: mục 2 BĂNG THẬT + NƯỚC THẬT, Hệ thủy xong)

> Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh `main`). Gp nói tiếng Việt: trả lời NGẮN GỌN, DỄ HIỂU, làm TỪNG MỤC, xong đẩy GitHub, báo, chờ "tiếp tục". Đọc `docs/KE_HOACH_HIEU_UNG_3D.md` (kế hoạch 7 mục), `docs/PHIEN177.md` (mục 1 lửa) và file này.

## Quy tắc làm việc (chép nguyên văn)
"For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff."

## Yêu cầu của Gp
Hiệu ứng kỹ năng toàn "ô vuông màu", chán, không giống thật. Muốn 3D, mượt, như thật, hoành tráng (lửa như lửa thật, băng như băng thật…). Lập kế hoạch chi tiết, làm TỪNG MỤC, xong đẩy GitHub rồi báo. Việc đã làm rồi thì bỏ qua (mục 1 lửa đã xong ở Phiên 177 nên phiên này làm thẳng mục 2).

## Đã làm phiên này (mục 2 — băng thật + nước, Hệ thủy)
- `js/world/bang.js` (logic thuần): `lapBang` (số vật thể theo bậc máy), `tinhTheBang` (mọc nhanh có vọt nhẹ → đứng → vỡ), `viTriBang` (tia: gai mọc dọc đường đi, trễ theo vị trí; no: tỏa quanh tâm, gần tâm to), `manhBang` (mảnh vỡ bay + rơi), `suongBang`, `nenBang` (mặt đất đóng băng loang), nước: `songNuoc` (sóng vành), `cotNuoc`, `xoayNuoc`, `giotNuoc`, `botNuoc`; `dungBang/dungNuoc(he, loai)`.
- `js/scene/fxBang.js` (vẽ): `taoBang({tier,mode,loai,co,reach,R2,zD,tNen})` → `{group, update(t, after, than, gong, pz)}`. Băng = LatheGeometry sáu cạnh (MeshStandard trong mờ + lõi cộng sáng + viền EdgesGeometry), mảnh vỡ = InstancedMesh bát diện, nền = kết cấu canvas nhánh tinh thể. Nước = LatheGeometry sóng cuộn, ống xoắn ốc TubeGeometry, cột nước CylinderGeometry hở, giọt = InstancedMesh cầu kéo dài theo vận tốc, kết cấu dòng chảy canvas (cuộn bằng offset dùng chung theo đồng hồ). KHÔNG đèn động.
- `js/scene/chieuFx.js`: nối băng/nước vào lớp 2 "thân" cho chiêu Hệ thủy (import, tạo sau lửa, gọi `bang.update` mỗi khung). Các lớp cũ giữ nguyên (lõi, quầng, hạt, vệt, decal, tàn dư).
- `tests/bang.test.mjs` (9 test) thêm vào `npm test`; `sw.js` = `dgt-v171`.
- Đã chạy: bang/lua/chieufx/chieulop/chieutrung/chieupose/chieuam/chieuhoa/luyenchieu đạt 0 lỗi. Chạy thử với three.js thật (không WebGL): 6 chiêu thủy × 3 bậc máy chạy hết vòng đời, giải phóng sạch (0 vật thể còn lại), không NaN. CHƯA chạy toàn bộ `npm test` (~3,5 phút). CHƯA nhìn bằng mắt.

## Chưa làm / cần Gp xem
- Cỡ tinh thể (`cao` 0,9–2,4 m × hệ số cỡ), độ sáng/độ trong, độ cao cột nước (`1,6 + co×7` m), số giọt, độ dày sương là số TẠM: Gp vào Luyện chiêu thử 6 chiêu thủy (thuy_1, thuy_3, huyền băng = băng; thuy_2, cam lồ, tuyết = nước) rồi báo "to/nhỏ/sáng/tối/trong quá".
- Hạt chấm cũ của chiêu thủy (lớp 4) vẫn còn cùng băng/nước mới; nếu thấy dư chấm thì giảm ở mục 7.
- Vật liệu băng dùng MeshStandard không có envMap nên bóng loáng chỉ nhờ phát sáng nhẹ; nếu cảnh quá tối/quá sáng báo để chỉnh `emissiveIntensity`.
- Mục 3–7 trong kế hoạch: CHƯA làm. Việc kế: **Mục 3 — KIM LOẠI / SÉT (Hệ kim, 6 chiêu)**.
- Còn treo từ trước (PHIEN175): mục 10A Khinh Thân cấp 8, mục 10 nút/cử chỉ, công tắc giảm chuyển động.

## Prompt bàn giao (dán vào phiên mới)
Bạn tiếp tục dự án Diệu Giang Tự (https://github.com/tp9sach-ops/duanchuaon, nhánh main). Quy tắc: For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff. Đọc docs/PHIEN180.md, docs/PHIEN177.md, docs/KE_HOACH_HIEU_UNG_3D.md. Khi Gp nói "tiếp tục": làm Mục 3 (kim loại / sét, Hệ kim, 6 chiêu) theo kế hoạch: logic thuần js/world/kim.js + test, vẽ js/scene/fxKim.js (vệt chém lưỡi liềm, tia lóe, mảnh kim loại xoay, tia sét zích zắc), nối js/scene/chieuFx.js (p.he === 'kim'), chạy test, nâng sw.js, viết docs/PHIEN181.md, đẩy main, báo Gp, chờ "tiếp tục".
