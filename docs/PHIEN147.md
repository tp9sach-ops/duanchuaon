# Phiên 147 — Mục 1 (danh sách 14/11, bản 4 mục): Tự động đánh khi hết máu → về cổng chùa, tự quay lại đánh tiếp

Quy tắc ptg (chép nguyên văn): For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff.

## Yêu cầu ptg (danh sách 4 mục MỚI ngày 14/11, làm tuần tự, xong mục nào đẩy GitHub rồi báo, chờ "tiếp tục")
Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh main). Chỉ xem chỗ cần sửa, không đọc hết repo. Cập nhật không được gây lỗi.
1. Tự động đánh: hết máu vẫn tự động đánh, không dừng; hết máu thì về cổng chùa. → XONG (phiên này, xem dưới).
2. Bồ đoàn Hỏa: ngồi vào không được (cấp 10 cho gia nhập phái là được); Tu Vi không biết hiển thị ở đâu; khi chuyển tab web khác mọi hoạt động trong game KHÔNG đứng (nhân vật vẫn đánh, vẫn đi, vẫn làm việc đang làm). → CHƯA LÀM (Phiên 143 báo xong nhưng ptg báo chưa được: phải KIỂM LẠI thật).
3. Phó bản: đi đến địa điểm gặp NPC → chọn vào phó bản (khu rừng/kiến trúc toàn quái và thử thách), hiển thị riêng, KHÔNG nằm trong map chính. Quái theo cấp độ; thu phục xong quái hồi sinh mạnh hơn + to hơn + trâu hơn + sát thương cao hơn theo từng lượt; sau 9 lượt hồi sinh thì xuất hiện boss chính to và mạnh hơn; thu phục boss → rơi nhiều vật phẩm. Trở về map chính, phó bản đã chinh phục sẽ mạnh hơn khi quay lại lần sau. → CHƯA LÀM (tiếp từ bước 4d trong docs/PHIEN140.md; xem docs/PHIEN139.md, docs/PHIEN140.md, js/world/zoneDungeon.js, js/world/dungeon.js).
4. Linh thú từ mảnh ghép: thu phục boss chính phó bản → có "mảnh ghép yêu quái đó" trong Túi hồ lô; thu phục 3 lần = 3 mảnh; bấm chức năng "ghép" → boss thành linh thú trong túi hồ lô; gọi ra, cưỡi, dùng chiến đấu. Kỹ năng boss tương tác với người chơi (hồi máu cho người chơi, hồi chiêu cho người chơi, tạo giáp, ...) và với quái khác (trói chân, làm chậm, đóng băng, hất tung). → CHƯA LÀM.
(Mục "Túi hồ lô" của danh sách 5 mục cũ đã xong ở Phiên 146, docs/PHIEN146.md.)

## Mục 1 — đã làm (commit 20454fb trên main, CHỈ file js/ui/farmCombat.js)
- Hiện trạng trước đó (Phiên 145): hết máu khi tự động bật thì hồi sức TẠI CHỖ. Đây không đúng ý ptg: ptg muốn hết máu thì VỀ CỔNG CHÙA nhưng tự động không dừng.
- Hành vi mới khi Tự Động Hàng Yêu đang BẬT và Sinh Lực về 0 (hàm `defeat()`):
  1. Quái đang giận được làm nguội (`calm`).
  2. Ghi nhớ vị trí đang đánh vào biến `back = { x, z, at }` (at = now + `AUTO_BACK_MS` = 3000 ms).
  3. `LGT.world.teleport(RESPAWN.x, RESPAWN.z)` đưa về cổng chùa, `vit.revive()` (đầy máu + vài giây bất tử).
  4. Tự động KHÔNG bị tắt (không gọi `toggleAuto`).
  5. Trong `tick()` (chạy qua bgTick, nên cả khi chuyển tab): đến hạn `back.at` mà tự động vẫn bật và không ở trong nhà → `LGT.world.teleport(back.x, back.z)`; autoStep của farm.js thấy quái trong 15 m thì lao vào đánh tiếp. Nếu ptg tắt tự động trong lúc chờ thì ở lại cổng chùa.
  6. Toast tối đa 1 lần / 15 giây.
- Không đổi: Ngọc dịch chuyển (`LGT.items.tryRevive()`) vẫn hồi sinh tại chỗ; đánh tay (auto tắt) vẫn về cửa chùa; điều kiện tự dừng khác (tắt, mở bảng, vào nhà, đổi chế độ, 60 phút/ngày, có yêu quái hằng tháng) giữ nguyên.

## Quyết định tôi TỰ đặt — ptg duyệt/chỉnh
1. Nghỉ ở cổng chùa 3 giây rồi quay lại đúng chỗ cũ bằng dịch chuyển tức thời (không đi bộ). Nếu ptg muốn nhân vật CHẠY bộ từ cổng chùa tới bãi quái thì cần đường đi (dash dài/pathing), chưa làm.
2. Không giới hạn số lần về cổng chùa khi auto.

## CHƯA kiểm / còn thiếu
- Chưa chạy `npm test` và chưa thử trên trình duyệt thật (phiên này chỉ sửa qua GitHub). Cần ptg thử: bật tự động, để quái đánh tới hết máu, xem có về cổng chùa rồi tự quay lại đánh không.
- Chưa đọc code `LGT.world.teleport` (không tìm được bằng search code); đang dùng đúng chữ ký `teleport(x, z)` như `defeat()` cũ đã dùng. Nếu teleport có hiệu ứng mờ/đổi chế độ làm `autoStep` dừng (`LGT.world.mode !== 'free'`), cần xem lại trong js/world/world.js.
- Nếu bãi quái quá xa cổng chùa và `FARM_CFG.nearMargin` khiến vùng quái không được sinh khi ở cổng chùa thì không sao: khi quay lại, farm.js hồi sinh bù.
- Dòng nhật ký Phiên 145/146/147 trong PROMPT.md mục 7 chưa thêm (file ~74 KB).

## Việc kế
Mục 2: kiểm lại bồ đoàn Hỏa / Tu Vi / chuyển tab không đứng (js/ui/khaiNgo.js, js/ui/heSkill.js, js/world/seats.js hoặc heSeats.js, hud #tuvi-chip, js/main.js, js/bgTick.js, js/tickWorker.js, docs/PHIEN143.md). Rồi mục 3, mục 4.

## Prompt khởi động phiên mới
> Đọc docs/PHIEN147.md, docs/PHIEN146.md, docs/PHIEN143.md. Chỉ xem chỗ cần sửa. Mục 1 xong (về cổng chùa, tự quay lại đánh). Làm mục 2 (kiểm lại bồ đoàn Hỏa + Tu Vi + chuyển tab không đứng), từng bước nhỏ, đẩy GitHub rồi báo; cuối phiên viết docs/PHIEN148.md kèm prompt và chép nguyên văn quy tắc ptg ở đầu file này.
