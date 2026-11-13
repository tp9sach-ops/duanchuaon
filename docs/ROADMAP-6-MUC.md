# Lộ trình 6 mục (yêu cầu 2026-11-13) — làm từng bước, xong bước nào đẩy GitHub bước đó

1. **Sửa HUD điện thoại trong khung web** — nút không bị che, dễ thao tác. ✅ Phiên 130 (css/mobilefix.css, js/ui/viewport*.js, sw v137). Chờ người dùng thử trên máy thật.
2. Giao lưu võ thuật: gửi lời mời → đối phương chấp nhận → vào map võ đài (khu luyện tập sân chùa), 2 bên dùng kỹ năng, hết máu là thua, thắng/thua không ảnh hưởng gì; có thể gọi boss nếu có; kết quả phụ thuộc cách chơi, di chuyển, tung kỹ năng chính xác và hợp lý.
3. Mở rộng toàn map: sát vách núi, rừng cây đều có quái; càng sâu xa càng nguy hiểm (cấp cao, máu trâu, sát thương lớn).
4. Sen không ảnh hưởng sức mạnh; sức mạnh đến từ kinh nghiệm/cấp độ, kỹ năng, cách cộng chiêu, đồ, vật phẩm.
5. Phó bản: đến địa điểm → gặp NPC → chọn phó bản → vào khu riêng (không nằm trong map chính) toàn quái và thử thách; quái thu phục xong hồi sinh mạnh hơn và to hơn; sau 9 lượt hồi sinh xuất hiện boss chính (to, mạnh hơn), thu phục hoàn tất rơi nhiều vật phẩm; phó bản đã chinh phục sẽ mạnh hơn ở lần quay lại.
6. Boss chính phó bản → mảnh ghép yêu quái trong túi hồ lô; đủ 3 mảnh thì ghép thành linh thú (gọi ra, cưỡi, chiến đấu); kỹ năng boss tương tác với người chơi (hồi máu, hồi chiêu, tạo giáp) và với quái khác (trói chân, làm chậm, đóng băng, hất tung).

## Bước 1 — chi tiết đã làm (Phiên 130)
- `css/mobilefix.css` (tự chèn bởi `initViewport`): ẩn hàng chương cũ `.hero-foot` khi `body.world-mode`; thông báo `.hm-toast` chuyển lên trên joystick (điện thoại dọc); nhãn nút tròn nhỏ `.dk-b.sz-small` xuống dòng; trong khung thì `.st-wrap` lùi vào 40px (tránh nút ngôi nhà của trang cha); `html[data-frame-x=true]` thu `.hud/.enter` theo `--vv-left/--vvw`.
- `js/ui/viewportLogic.js`: `frameClip(innerH, rect, innerW)` hỗ trợ left/right; `viewportState` ghi thêm `--vv-left` và `data-frame-x`.
- `js/ui/viewport.js`: gửi left/right từ IntersectionObserver / postMessage; chèn mobilefix.css.
- `tests/viewport.test.mjs`: thêm 2 test cắt ngang (9/9 pass).
