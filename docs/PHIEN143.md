# Phiên 143 — Mục 1 (danh sách 13/11 lần 2): ngồi bồ đoàn Hỏa, gia nhập phái cấp 10, hiển thị Tu Vi, game chạy khi chuyển tab

Quy tắc ptg (chép nguyên văn): For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff.

## Yêu cầu ptg (3 mục, làm tuần tự, xong mục nào đẩy GitHub rồi báo)
1. Ngồi bồ đoàn Hỏa không được → cấp 10 là gia nhập phái được; Tu Vi hiển thị ở đâu; chuyển tab khác game vẫn chạy (nhân vật vẫn đánh, đi, làm việc đang làm).
2. Phó bản (NPC → vào khu riêng toàn quái; quái hồi sinh mạnh/to hơn mỗi lượt; 9 lượt → boss chính; rơi nhiều vật phẩm; phó bản đã chinh phục mạnh hơn lần sau).
3. Mảnh ghép boss → hồ lô → ghép (3 mảnh) → linh thú; gọi ra, cưỡi, kỹ năng boss tương tác (hồi máu, hồi chiêu, giáp cho người chơi; trói, chậm, đóng băng, hất tung lên quái).

## Mục 1 — nguyên nhân và cách sửa
- `initKhaiNgo` (js/ui/khaiNgo.js) và `initHeSkill` (js/ui/heSkill.js) viết ở Phiên 141 nhưng KHÔNG được gọi → nay nối trong `js/main.js` sau initHud (heSkill trước khaiNgo).
- khaiNgo dùng cấp hiệu dụng `LGT.capHieuDung()` (max Tu Vi, cấp công hạnh) thay vì chỉ `LGT.farm.tuvi`; phát `LGT.act('khaingo')` khi chọn Hệ.
- `js/ui/farm.js`: thêm `LGT.farm.skillReady()`, `skillHit(heSo)` (có K_hệ), `tuviInfo`.
- HUD: chip Tu Vi trên thẻ nhân vật (`js/ui/hud.js`, #tuvi-chip).
- Chạy nền: `js/bgTick.js` + `js/tickWorker.js` (Web Worker 100 ms, rơi về setInterval có unref). `farm.js`, `farmCombat.js` và `js/main.js` (world.update khi `document.hidden`) đăng ký vào bgTick; Tự động hàng yêu không còn dừng khi tab ẩn.
- `sw.js` = dgt-v143. Test mới `tests/bgtick.test.mjs`; `npm test` 1092/1092.

## CHƯA kiểm / còn thiếu
- Chưa thử bằng trình duyệt thật (tab ẩn thật, Safari/iOS có thể đóng băng Worker).
- Vòng lặp khác chưa chuyển sang bgTick (vd `js/ui/yeuquai.js` setInterval 50 ms, khaiNgo/heSkill paint).
- Chỉ phần logic chạy khi tab ẩn, không vẽ 3D.

## Việc kế: MỤC 2 từ bước 4d (4a, 4b, 4c đã xong, xem docs/PHIEN140.md): quái thật trong zone phó bản, nối dungeon.enter/onKill/leave, lưu `lgt.dungeon`, hiển thị lượt/boss, rơi vật phẩm. Rồi mục 3.

## Prompt khởi động phiên mới
> Đọc docs/PHIEN143.md và docs/PHIEN140.md. Chỉ xem chỗ cần sửa. Mục 1 xong. Làm mục 2 từ bước 4d, từng bước nhỏ, npm test xanh, đẩy GitHub rồi báo; cuối phiên viết docs/PHIEN144.md kèm prompt và chép nguyên văn quy tắc ptg ở đầu file này.
