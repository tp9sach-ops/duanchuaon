# PHIÊN 196 — Mục 3: KHINH CÔNG = BAY LƯỚT (bấm lướt, bay từ từ, hạ nhẹ, camera đi theo)

> Repo `main`. ptg: trả lời NGẮN GỌN, làm TỪNG MỤC, xong đẩy GitHub rồi báo, chờ "tiếp tục".
> Quy tắc bàn giao (chép nguyên văn): "For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff."

## Đã có từ trước (bỏ qua)
Mục 1 (biểu tượng chiêu kiểu Liên Quân, Phiên 194–195, `docs/PHIEN195.md`) và mục 2 (nút chiêu khu luyện tập, `docs/PHIEN195_MUC2.md`) đã xong và đã nằm trên `main` (commit `f7a29fb`). Phiên 190–191: chiêu + Đánh thường dùng được khi không có quái. Phiên 139/151: nhảy tới trước + lướt né ngắn (giữ nguyên).

## Hiện trạng trước phiên này (vì sao "chưa giống mô tả")
Nhảy lần 2 trên không chỉ xếp hàng một cú lướt ngắn 0,26 giây SAU KHI chạm đất (`glideQ` → `W.dash`); trên không không bay gì cả, rơi tự do, camera đứng yên. Tài liệu Phiên 175 mục 10A mô tả: "nhảy lần 2 trên không → lướt, xung đẩy yếu dần, hạ cánh đệm 100–150 ms, camera đi theo".

## Phiên này
Đang TRÊN KHÔNG bấm Nhảy (nút Nhảy trên điện thoại / Space) → BAY LƯỚT:
- Xung đẩy đầu theo hướng nhìn (cần/phím bẻ hướng được, tối đa 2,4 rad/s), YẾU DẦN về mức lướt duy trì: `v = cruise + (v0 − cruise)·e^(−t/0,5)`.
- RƠI CHẬM (kẹp `fall` m/s, không rơi tự do): đang lên thì lên nốt tới đỉnh (trọng lực nhẹ hơn 20%) rồi hạ từ từ.
- HẠ CÁNH ĐỆM ≈ 0,13 s: sát đất vận tốc rơi giảm còn 30%, tốc độ ngang phanh còn 45%, thân đứng thẳng lại.
- CAMERA ĐI THEO: tự xoay ra sau lưng theo hướng bay (mượt, `camK` 2,4/s); người chơi tự kéo camera thì nhường 0,9 s; mở góc nhìn +3,5% khi bay (tắt khi bật "giảm chuyển động").
- Tư thế `glide`: hai tay giang ngang như cánh, chân duỗi theo gió, thân chúi 0,38 rad.
- Bất tử 0,45 s đầu (như lướt né Phiên 139), hồi chiêu lướt 1,2 s; KHÔNG tự lướt né thêm khi chạm đất.
- Bay qua `walkStep` → trượt dọc tường, không xuyên vật cản. Trong nhà không bay (như lướt cũ).
- Vừa chạm đất (≤ 0,6 s) bấm Nhảy vẫn lướt né ngắn như Phiên 139 (giữ nguyên).

Số liệu mô phỏng (bấm lần 2 sau 0,25 s): bậc 1 bay 1,2 s / 4,5 m; bậc 3 2,5 s / 8,4 m; bậc 5 3,2 s / 11 m; bậc 8 3,6 s / 14 m; đệm 117–133 ms.

### File (thêm / sửa)
| File | Việc |
|---|---|
| `js/world/glide.js` (MỚI) | Logic thuần: `FLY_CFG` (mọi con số TẠM, `tam: true`), `fallSpeed`, `cushionH`, `flyVy`, `flySpeed`, `flyBrake`, `steerDir`, `yawBehind`, `followYaw` |
| `js/world/skills.js` | `createJump().glide(fall)` + `gliding`/`fall`; `flyPlan(lv, indoor)`; `nextAction` KHÔNG đổi (trên không vẫn trả `'glide'`) |
| `js/ui/skill.js` | `doJump`: `act === 'glide'` + `jump.air` → `startFlight` (dùng `W.fly`); tốc độ đi không tính khi đang bay; `LGT.skill.gliding` |
| `js/world/world.js` | `fly(fn)` + nhánh `if (flyFn)` trong `update`; camera `followYaw` + `camDragAt` + `flyFov`; `LGT.world.fly`, `.flying` |
| `js/world/avatarLogic.js`, `js/world/chibiRig.js` | Tư thế/`armTarget` cho trạng thái `glide` (hai tay giang). `glide` KHÔNG vào `STATES` |
| `js/net/room.js` | Máy mình gửi `'idle'` thay cho `'glide'` (luật Firebase chỉ nhận 6 trạng thái; người khác thấy đứng thẳng, KHÔNG cần ptg sửa luật Firebase) |
| `tests/glide.test.mjs` (MỚI, đã vào `npm test`) | 10 test: kế hoạch bay, xung yếu dần, rơi chậm, hạ cánh đệm 100–150 ms, `createJump.glide`, dt lạ, `steerDir`, camera sau lưng (kiểm với `camPose` thật), tư thế, nối dây |
| `tests/dock.test.mjs` | Sửa test LỖI SẴN từ Phiên 191 (regex cũ của `da`/`thuong` ở `dock.js`; code đã gọi `LGT.luyenChieu.basic` ở khu luyện) — trước đây `npm test` đỏ, có thể chặn workflow deploy Pages |
| `sw.js` | `dgt-v184` |

## Kiểm thử
`npm test`: xem số ở câu trả lời cuối (đã chạy toàn bộ). CHƯA nhìn bằng mắt / CHƯA thử điện thoại thật (môi trường AI không có WebGL, màn cảm ứng): cảm giác tay, độ xa/lâu, tốc độ camera xoay, tư thế dang tay là số/hình TẠM.

## ptg kiểm (tải lại cứng để nhận `dgt-v184`)
Mở Khinh thân (bậc ≥ 1) → nhảy rồi bấm Nhảy lần nữa khi còn trên không: nhân vật bay lướt theo hướng đang quay mặt, camera xoay theo sau lưng, rơi chậm, chạm đất nhẹ. Báo: bay xa/lâu chưa vừa (nói "xa hơn / gần hơn / lâu hơn"), camera xoay nhanh/chậm, tư thế dang tay xấu hay đẹp, có kẹt tường không. Chỉnh bằng `FLY_CFG` trong `js/world/glide.js` (v0Base/v0PerBac, cruise*, fallTime, camK, tilt).

## Câu hỏi còn treo (ptg trả lời khi tiện)
Phiên 175 ghi "Khinh thân cấp 8 bay lướt". Hiện BAY LƯỚT mở từ bậc 1 (bậc cao bay xa/lâu hơn). Nếu muốn chỉ từ bậc cao (ví dụ ≥ 5 hoặc chỉ bậc 8) thì nói số bậc — sửa 1 dòng trong `flyPlan` (`skills.js`).

## Việc kế (theo danh sách ptg, làm khi ptg bảo "tiếp tục")
4. Đánh thường lao tới mục tiêu trong tầm ngắn → bấm tiếp ra combo 3 đòn (3 hoạt ảnh khác nhau; đòn 3 sát thương LAN; quái dính lan thì đánh trả). 5. Chiêu phái: nhấn nút chiêu rồi LƯỚT ngón tay → chiêu định hướng bay theo hướng lướt (có vòng/vạch ngắm). 6. Không có quái vẫn dùng chiêu + Đánh thường nhưng không gây sát thương (phần lớn đã xong từ Phiên 190 — khi làm mục 4–5 phải giữ).
