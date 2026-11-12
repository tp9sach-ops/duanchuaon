# Phiên 127 — Bỏ ném đá (→ Đánh thường cận chiến), Tự động LAO vào quái, quái trâu hơn

## Quy tắc người dùng (chép nguyên văn)
For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff.

## Yêu cầu ptg (12/11, tiếp Phiên 126)
Đọc lại repo, chỉ xem chỗ cần sửa; làm tiếp từng bước. Danh sách gốc: tư thế đi/đứng/đánh/skill như clip; côn bỏ mũi nhọn cầm giữa múa theo combo; BỎ NÉM ĐÁ → đánh thường; chiêu còn lại theo HỆ PHÁI; PC điều khiển A D W S; thanh máu + mana trên đầu; TỰ ĐỘNG đánh: lao vào quái trong bán kính, quái trâu hơn + sát thương cao hơn; hồ lô ở eo, quái bay vào hồ lô; đẩy GitHub.

## Đã làm ở Phiên 127
| Mục | Việc | File |
|---|---|---|
| 1 | A D W S: ĐÃ CÓ SẴN (KEYMAP `KeyW/A/S/D` + mũi tên trong `js/world/world.js`, Shift = chạy). Không sửa. | — |
| 2 | **Bỏ ném đá thật sự**: nút `da` (giữ id để khỏi vỡ test) nay là **“Đánh thường”**: cận chiến, tầm 3,6 m = tầm Thương, trúng NGAY (không còn đá bay), hồi chiêu 0,55 s (bấm liên tục ra chuỗi múa côn). Sát thương vẫn `stoneDamage` (nhẹ hơn Thương). Áp cho cả quái bãi rừng (`js/ui/farm.js`) và yêu quái hằng tháng (`js/ui/yeuquai.js`). Quái bãi rừng vẫn được NHẮM/hiện thanh Oán Khí trong tầm nhìn 18 m (`SIGHT`). | `js/world/yeuquai.js` (STONE), `js/ui/farm.js`, `js/ui/yeuquai.js`, `js/world/dock.js` (chữ nút + gợi ý), `js/world/tutorial.js` |
| 3a | **Tự động LAO vào quái**: `nextAction` trả thêm `'rush'` (quái trong 15 m nhưng xa hơn tầm đâm); `rushTarget(from, mon, {body, stand, isBlocked})` (thuần, có test) chọn điểm đứng cách tâm quái `body + 2,2 m`, đi từng 0,5 m, gặp `blocked()` (layout.js) thì dừng trước vật cản. `js/ui/farm.js` `rush()` gọi `LGT.world.dash(to, dur, { tilt:false })` (tốc độ ~9 m/s, 0,25–1,4 s). `world.dash` có tham số mới `opts.tilt` (false = chạy tới, KHÔNG chúi đầu như Thiết đầu công; hoạt ảnh `walk` tốc độ 6,5). Tới nơi thì tự Thương/Đánh thường như cũ. | `js/world/autoHunt.js`, `js/ui/farm.js`, `js/world/world.js` |
| 3b | **Quái trâu hơn, sát thương cao hơn (SỐ TẠM)**: Oán Khí `50 + 25×cấp` (trước 30 + 12×cấp), boss ×5 (trước ×8) → Dã Mèo cấp 3 = 125 (trước 66), Rêu Tinh 900 (trước 450), Lão Mộc Tinh 2750, Thủy Mẫu 5875. Sát thương lên người: hệ số thường 0,9 / tinh anh 1,35 (trước 0,6 / 0,9) ≈ ×1,5; chiêu Giậm Đất boss 1,8 (trước 1,2); nhịp đánh 2,0 s / 2,3 s (trước 2,4 / 2,8). Trần 35% Sinh Lực/đòn giữ nguyên. | `js/data/monsters.js`, `js/data/monsterAI.js` |
| — | Test cập nhật: `autohunt`, `farmui`, `dock`, `spawn`, `monsterattack`, `tutorial`; `combo` nới ngưỡng arm cho riêng `khi` (đoạn bổ xuống nhanh có chủ đích — lỗi test có từ Phiên 126). `sw.js` = `dgt-v119`. | tests/* |

## Kiểm chứng
Xem số `npm test` ở cuối file (cập nhật khi chạy xong). CHƯA chơi thử trên trình duyệt/điện thoại: cần ptg thử (1) bấm “Đánh thường” sát quái và đứng xa, (2) bật “Tự động” đứng cách quái ~10 m xem nhân vật có chạy tới và múa côn không, có xuyên cây/tường không, (3) độ trâu/đau của quái có hợp lý không.

## CHƯA LÀM (thứ tự đề xuất, mỗi phiên một mục)
1. **Chiêu theo HỆ PHÁI** (5 hệ Kim/Mộc/Thủy/Hỏa/Thổ trong `js/world/elements.js`, người chơi có `LGT.he`): mỗi hệ một bộ chiêu (tư thế + vệt màu + tên). ĐỀ XUẤT mặc định nếu ptg không nêu khác: 5 hệ phái = 5 Hệ ngũ hành; Đánh thường dùng chuỗi múa côn chung, còn skill (Chém khí…) đổi theo hệ. Cần thêm bảng `KINDS/CHAIN/SLASH` theo hệ trong `combo.js`, `avatar.swing(he)`.
2. **Chân khí (mana) thật**: tiêu hao khi dùng skill, hồi theo thời gian, hết thì chặn skill (hiện bộ đếm TẠM trong `js/ui/combatPose.js`, chưa chặn).
3. Quái thu nhỏ BAY vào hồ lô (hiện biến mất rồi mới có đốm hồn); boss `LGT.yq` chưa có hồn bay.
4. Quái hất lùi, số sát thương bay, hit-stop, vệt chong chóng của đòn múa; xem nhân vật trên điện thoại thật.
5. 4 test đỏ có sẵn từ trước và GDD v2.

## Prompt khởi động cho phiên sau (dán nguyên)
> Đọc PROMPT.md → HANDOFF.md (đầu file) → docs/PHIEN127.md và docs/PHIEN126.md. Repo `tp9sach-ops/duanchuaon`, nhánh `main`. Phiên 127 đã bỏ ném đá (nút `da` = Đánh thường cận chiến), Tự động lao vào quái (`rushTarget` + `world.dash(..., {tilt:false})`), quái trâu hơn. Hỏi ptg kết quả chơi thử rồi làm VIỆC KẾ 1 (chiêu theo hệ phái, mặc định 5 Hệ ngũ hành). Chỉ đọc file cần sửa, KHÔNG đọc hết repo; TRƯỚC KHI SỬA một file tải bản mới nhất từ `main` (nhiều phiên chạy song song). Làm một mục, `npm test`, đẩy GitHub (không đẩy được thì gửi zip), cập nhật HANDOFF.md + docs/PHIEN128.md, gửi bàn giao, rồi CHỜ ptg nói “tiếp tục”.
