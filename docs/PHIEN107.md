# PHIÊN 107 — GDD v2: G1.6a + G3.6 nối vào game (quái bãi rừng THẤY và ĐÁNH được, farm Tu Vi + hạt sen) — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → docs/PHIEN106.md → file này → docs/KE_HOACH_GDD_V2.md (mục G1, G2). Chỉ đọc file cần thiết.

## Yêu cầu của ptg (2026-11-11)
"Xem repo, chỉ xem chỗ cần thiết, cập nhật không lỗi. Tiếp tục theo GDD v2 để cập nhật skill, vật phẩm, cách chơi, kỹ năng chiến đấu, thêm quái cố định ở các bãi rừng để nhân vật farm tăng công đức."
→ Phiên này làm đúng mục ở bàn giao Phiên 106: **G1.6a** (nối quái cố định vào game). Skill / vật phẩm / Ngũ Hành là các mục sau (xem VIỆC KẾ), làm từng mục một.

## Đã làm
**Logic thuần (có test)**
- `js/data/monsters.js`: thêm `FARM_CFG` { `senCapNgay` 100, `nearMargin` 40, `maxVisible` 26 } (TẠM).
- `js/world/farm.js` + `tests/farm.test.mjs` (8 test): trạng thái farm `{ v, exp, st, sen {day,n}, kills }`; `loadFarm` (chịu dữ liệu hỏng, sang ngày mới giờ VN thì đếm hạt sen về 0), `settleKill` (EXP hàng yêu qua `nguonTuVi.award` + hạt sen bị CẮT theo trần ngày), `senLeft`, `tuViOf`.

**Nối vào game**
- `js/ui/farm.js` (`initFarm`, gọi ở `js/ui/hudMenu.js` ngay trước `initDock`): chỉ chạy ở hub, ngoài nhà, không bơi, không khi có yêu quái hằng tháng. Tạo bộ sinh quái (G3.6) khi người chơi cách vùng ≤ 40 m; đi xa rồi quay lại thì quái đã hồi sinh bù (tối đa 90 s). Tick 100 ms.
  - Hai vùng sát nhau (Bìa Rừng Thông x −117..−72, Đường Mòn x −66..−18) nên có thể cùng hiện: tối đa 24 con ≤ bể vẽ 26. Mỗi quái có `uid = "<vùng>:<id>"` (id chỉ duy nhất trong từng vùng).
  - Ném đá (tầm 18 m, bay theo `STONE.speed`) và Thương (tầm `SPEAR.range` + bán kính thân) dùng lại `stoneDamage` / `spearDamage` theo sức mạnh (`LGT.strength`). Hồi chiêu riêng (1,4 s / 0,7 s). Quái KHÔNG đánh trả.
  - Thu phục → `settleKill` → `LGT.addMerit(hạt sen)` + toast ("Thu phục … +N hạt sen +N Tu Vi"), "Tu Vi lên cấp N", và báo một lần/ngày khi chạm trần hạt sen. Lưu `localStorage['lgt.farm']`.
  - HUD `.fm-hud` (css/farm.css, cùng chỗ khung yêu quái, không bao giờ hiện cùng lúc): tên · cấp · Hệ · (Tinh anh), thanh Oán Khí (≤ 25% đổi xanh dương = sắp thu phục), dòng "Tu Vi n · EXP/need" và "Hạt sen hôm nay còn N".
- `js/scene/farm.js` (`buildFarm`, nối trong `js/scene/index.js`: `LGT.farmView`, `farmMon.update(t, LGT.farmView, camera)`): 4 mô hình khối (Dã Mèo Rừng, Rêu Tinh, Đạo Tặc Sơn Cước, Cướp Đường), thanh Oán Khí hướng về camera, vòng sáng dưới chân quái tinh anh theo Hệ, vòng chọn mục tiêu, đá bay. Ẩn quái xa camera > 70 m. MÔ HÌNH TẠM (khối), chờ GLB.
- Nút: dùng lại **Ném đá** và **Thương** ở cụm nút phải-dưới. `js/world/dock.js` thêm nhánh `farm` (hiện khi có quái trong ~19 m, KHÔNG ẩn Nhảy / Kỹ năng / Túi đồ); `js/ui/dock.js` truyền `farm` vào; `js/ui/yeuquai.js`: khi không có yêu quái hằng tháng thì `stone()` / `spear()` chuyển sang `LGT.farm`. Dòng `ACT.da` / `ACT.thuong` trong dock.js GIỮ NGUYÊN (test dock soi đúng chữ này).
- Sổ tay: chủ đề mới `hangyeu` ("Hàng yêu ở bãi rừng") trong `js/world/tutorial.js`; `tests/tutorial.test.mjs` cập nhật danh sách chủ đề.
- Ghi chú plan: `docs/KE_HOACH_GDD_V2.md` đã sửa cột Trạng thái G1.1–G1.4, G1.5 (một phần), G1.6 (một phần), G3.6. `sw.js` = `dgt-v108`.

## Kiểm tra (nói thật)
- `npm test` đầy đủ trên repo thật: 930/930 xanh (đầu phiên là 915). Test mới: `tests/farm.test.mjs`, `tests/farmui.test.mjs` (chạy `js/ui/farm.js` với DOM giả: quái xuất hiện, ném đá, thương, thu phục, thưởng, lưu, hồi sinh sau 60 s, dừng khi vào nhà / có boss), thêm 1 test trong `tests/dock.test.mjs`.
- `js/scene/farm.js` đã chạy thử với three.js thật trong Node (24 quái, 5 vòng cập nhật, không lỗi; ~317 mesh khi đủ 26 ô). CHƯA nhìn bằng mắt trên trình duyệt, CHƯA chụp ảnh desktop/điện thoại, CHƯA đo FPS trên điện thoại: **phiên sau hoặc ptg phải chơi thử** (xem "Gp phải làm").
- KHÔNG chạy được WebGL trong môi trường làm việc nên không có ảnh chụp.

## Gp phải làm
1. Chờ GitHub Pages triển khai rồi vào game, đi ra Bìa Rừng Thông (phía tây chùa) và Đường Mòn. Kiểm: thấy quái, thấy 2 nút Ném đá / Thương, thanh Oán Khí giảm, có toast Tu Vi + hạt sen. Gửi ảnh chụp điện thoại nếu nút chồng nhau hoặc quái lơ lửng/đứng sai chỗ (mặt đất ngoài làng có thể không phẳng y = 0).
2. Nếu bị giật trên điện thoại: nói rõ máy gì (mình sẽ gộp mô hình/giảm `maxVisible`).

## Giả định cần ptg duyệt (đều TẠM)
1. **Trần hạt sen từ hàng yêu = 100/ngày** (= 10 lá bồ đề/ngày; 10 ngày đủ một lô đất 100 lá). Vượt trần vẫn có Tu Vi. Lý do: mọi nguồn hạt sen khác (`merit.js`) đều có trần ngày; không trần thì cày rừng ~vài trăm sen/giờ phá kinh tế. ptg có thể đổi số `FARM_CFG.senCapNgay`.
2. "Công đức" ở đây = Hạt Sen (đúng quy ước `merit.js`). **Điểm Công Đức riêng** (GDD mục 13, không tiêu, dùng xếp hạng) vẫn chưa làm (G3.4).
3. Quái không đánh trả → chưa có thanh Sinh Lực người chơi (G1.6 còn thiếu phần này).
4. Sát thương dùng công thức CŨ theo sức mạnh (`stoneDamage`, `spearDamage`), chưa dùng `damageOf` (Công theo Tu Vi) vì chưa có Hệ người chơi (G2.4). Tu Vi mới chỉ là con số + EXP, CHƯA làm tăng Công/Thủ trong đánh quái.
5. Hồi sinh bù khi quay lại tối đa 90 s; quái chỉ chạy khi người chơi cách vùng ≤ 40 m.
6. Mọi con số quái / Oán Khí / hạt sen rơi giữ nguyên từ Phiên 106 (vẫn TẠM).
7. Chưa nối "Chém khí" (`conKhi`) cho quái bãi rừng: nó chỉ nhắm yêu quái hằng tháng (`LGT.yq.ramHit`).

## VIỆC KẾ (một mục, chờ "tiếp tục")
Gp muốn hệ thống skill / vật phẩm / kỹ năng chiến đấu. Thứ tự đề xuất (từng mục nhỏ, có test):
- **G2.1** Ngũ Hành logic thuần (`js/world/elements.js`, test bảng khắc/sinh 5×5) → **G2.2** dữ liệu 15 skill gốc → **G2.3** bộ máy hồi chiêu + Tâm Ấn → G2.4 Lễ Khai Ngộ chọn Hệ → G2.5 thanh skill (phải xem ảnh chụp giao diện trước).
- Xen kẽ khi ptg muốn: G1.5 lưu Tu Vi lên GAS đúng nhịp; nút "Chém khí" cho quái bãi rừng; thanh Sinh Lực + quái đánh trả; vật phẩm rơi (nguyên liệu) ở bãi rừng — GDD v2 mục vật phẩm cần đọc trước.
- Nên hỏi ptg: làm G2.1 hay sửa theo phản hồi chơi thử (vị trí quái, nút, độ mượt) trước?

## Nợ còn lại
- Câu hỏi treo cho ptg: G0.2, G0.4, câu 11–16 (docs/GDD_v2_DOICHIEU.md).
- `HANDOFF.md` đầu file chỉ nói tới Phiên 99 (các phiên 100–107 nằm trong `docs/PHIENxxx.md`); đã thêm dòng trỏ tới file này.

## Prompt khởi động cho phiên sau (dán nguyên)
> Đọc PROMPT.md → docs/PHIEN106.md → docs/PHIEN107.md → docs/KE_HOACH_GDD_V2.md. Repo `tp9sach-ops/duanchuaon`. G0.1, G0.3, G0.5, G1.1–G1.4, G3.6 và G1.6a (quái bãi rừng ném đá/thương, thưởng Tu Vi + hạt sen, trần 100 sen/ngày) đã XONG; chạy `npm test` trước, sửa test đỏ nếu có. Làm MỘT mục theo lời ptg (mặc định G2.1: Ngũ Hành logic thuần + test), gửi bàn giao docs/PHIEN108.md, rồi CHỜ ptg nói "tiếp tục". Chỉ đọc những file cần thiết. Nếu ptg báo lỗi khi chơi thử quái bãi rừng thì sửa lỗi đó trước (xem `js/ui/farm.js`, `js/scene/farm.js`).
