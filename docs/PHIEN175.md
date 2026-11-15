# PHIÊN 175 — Bàn giao (prompt "chiêu thức 3D chuyên nghiệp": mục 9, phần 1 = mục 11 camera)

> Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh `main`). Gp nói tiếng Việt: trả lời NGẮN GỌN, DỄ HIỂU, làm TỪNG MỤC, xong đẩy GitHub, báo, chờ "tiếp tục". Đọc thêm `docs/PHIEN174.md` (hiện trạng 11 mục nộp).

## Quy tắc làm việc (chép nguyên văn)
"For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff."

## Mục 9 chia 3 phần
- **Phần 1 (XONG phiên này) = mục 11 camera**: `js/world/camFeel.js` (logic thuần) + nối `js/world/world.js` + nối `onShake`/`onHitStop` của `chieuFx` và `chieuTrungFx` ở `js/ui/luyenChieu.js`.
- Phần 2 (CHƯA) = mục 10A: Khinh Thân cấp 8 bay lướt (nhảy lần 2 trên không → lướt, xung đẩy yếu dần, hạ cánh đệm 100–150 ms), kiến trúc đứng lên được (hàm độ cao mặt đất tại (x,z) kể cả mái), camera không xuyên mái. Hiện `js/world/skills.js` chỉ có nhảy thẳng đứng (bậc 1–8, `createJump`).
- Phần 3 (CHƯA) = mục 10: nút/cử chỉ/bộ đệm lệnh 150 ms/hỗ trợ nhắm/bố cục phím máy tính.

## Phần 1 — đã làm gì
- `camFeel.js`: `createCamFeel({tuyChon, giamHeThong})` → `rung(cuong)` (biên độ nhỏ, 34 Hz, tắt dần mũ τ=0,18 s, trần 0,12 m), `khung(giay)` (kẹp 40–120 ms; chỉ làm chậm tốc độ còn 6%, KHÔNG đóng băng thế giới), `chieu('chieu4'|'tuyetHoc')` (chiêu 4: FOV +6,5% trong 0,2 s; tuyệt học: +9% FOV, chậm 0,35 s về 35% tốc độ rồi trả về 0,5 s; chiêu thường không đổi camera), `step(dt)` → `{dx,dy,fov,tocDo,dung}`. Công tắc: `rung`, `dung`, `giamChuyenDong` (tắt hết; cũng tự bật theo `prefers-reduced-motion`). `fovNhay` (+3–5% khi nhảy lên), `kBamDoc` (trên không camera bám dọc trễ ~0,2 s).
- `world.js`: `LGT.camFeel = { rung, khung, chieu, set(opts), tuyChon, tocDo }` (lưu `localStorage['lgt.camfeel']`); camera cộng độ rung, dùng `camera.zoom` cho FOV (không đụng chỉnh FOV màn dọc ở scene/index.js); `avatar.update(dt * tocDo)` để khựng chỉ làm chậm nhân vật.
- `luyenChieu.js`: `onShake`/`onHitStop` của hai bộ hiệu ứng chiêu gọi `LGT.camFeel`.
- `sw.js` = `dgt-v167`; `package.json` thêm `tests/camfeel.test.mjs` (8 test). Chạy riêng 43 test liên quan (camfeel, camclip, skills, worldsim, chieufx, chieutrung): đạt 0 lỗi. CHƯA chạy toàn bộ `npm test` (mất ~3,5 phút).

## Chưa làm / cố ý để lại
- CHƯA nhìn bằng mắt: cỡ rung, độ đẩy gần, độ trễ camera khi nhảy là số TẠM (hằng số `CAM` trong `camFeel.js`) — Gp vào Luyện chiêu thử chiêu rồi báo để chỉnh.
- CHƯA có giao diện công tắc "giảm chuyển động / tắt rung / tắt khựng" trong Cài đặt: hiện chỉnh bằng `LGT.camFeel.set({rung:false})` trong console. Việc kế: thêm công tắc vào menu cài đặt.
- CHƯA gọi `camFeel.chieu('chieu4'|'tuyetHoc')` từ nơi tung chiêu (cần biết chiêu nào là chiêu 4/tuyệt học: lấy từ `chieuNguHanh.js`). CHƯA có camera theo vai khóa mục tiêu (hai nhân vật trong khung), CHƯA có "đóng khung chậm" riêng chỉ cho người ra chiêu trong PvP.
- Mục 8 (file JSON số liệu), 7 (clip), 10 (12 combo + 5 khắc chế), 11 (báo cáo cân bằng) trong danh sách nộp: chưa làm (xem PHIEN174).
- Ngưỡng báo trước 0,4/0,8 s và giọng hô nhân vật: còn treo từ Phiên 167/173.

## Prompt bàn giao (dán vào phiên mới)
Bạn tiếp tục dự án Diệu Giang Tự (https://github.com/tp9sach-ops/duanchuaon, nhánh main). Quy tắc: For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff. Đọc docs/PHIEN175.md và 174. Khi Gp nói "tiếp tục": làm mục 9 phần 2 (10A Khinh Thân cấp 8 + kiến trúc đứng lên được), rồi phần 3 (mục 10 nút/cử chỉ). Xong thì chạy test, viết docs/PHIEN176.md, đẩy main, báo Gp và chờ "tiếp tục".
