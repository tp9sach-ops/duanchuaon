# Phiên 151 — Mục 2 (danh sách 8 mục 14/11): nhảy tới trước + tự lướt sau khi tiếp đất

Quy tắc ptg (chép nguyên văn): For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff.

Danh sách 8 mục và quy trình: xem docs/PHIEN150.md (mục 1 xong). Mục 2 xong code phiên này, CHỜ ptg thử máy thật. Mục 3–8 CHƯA LÀM.

## Mục 2
- Phát hiện: nhảy tới trước + lướt né đã có từ Phiên 139 (docs/PHIEN139.md: `leapPlan`, `glidePlan`, `nextAction` ở js/world/skills.js; nối ở js/ui/skill.js; bất tử 0,45 s qua `vitals.guard`). Nhưng lướt trước đây phải BẤM NHẢY LẦN HAI.
- Sửa (CHỈ js/ui/skill.js, hàm `doJump`): khi bật tới trước (`act === 'leap'`) và `W.dash` chạy được, nếu hết hồi chiêu lướt thì đặt `glideQ = true` → hết cú bật, vòng bọc `avatar.update` tự lướt thêm một đoạn theo hướng đi (3 + 0,2 × bậc mét, 0,26 s) + bất tử 0,45 s. Đứng yên bấm Nhảy vẫn nhảy tại chỗ, không lướt. Bấm Nhảy lần hai vẫn lướt thêm được như cũ.
- Số liệu TẠM ở LEAP_CFG / GLIDE_CFG (js/world/skills.js), chờ ptg chỉnh theo cảm giác.
- sw.js = dgt-v145. npm test các file liên quan (skills, monsterattack, classclash): 31/31 đạt; chưa chạy toàn bộ bộ test sau thay đổi này.
- Chưa thử trình duyệt thật. Lưu ý: trong lúc bật/lướt nút Thiết đầu công tạm không dùng được (cùng cơ chế world.dash).

## Cách ptg thử
Đang đi (WASD hoặc chạm) bấm Nhảy/Space: nhân vật bật tới trước, tiếp đất rồi tự lướt thêm một đoạn cùng hướng; thử ở chỗ có quái để xem có né được đòn không. Đứng yên bấm Nhảy: nhảy tại chỗ.

## Việc kế
Mục 3: vũ khí khi không chiến đấu thu gọn, nằm sau lưng có dây đeo, vẫn phát sáng (xem js/ui/staffMesh.js, js/world/avatar.js, js/ui/farmCombat.js, js/ui/dock.js). Làm từng bước nhỏ, npm test xanh, đẩy GitHub rồi báo; cuối phiên viết docs/PHIEN152.md.

## Lưu ý quy trình
Môi trường AI không git push được: dùng GitHub MCP create_or_update_file (cần blob sha: `git rev-parse HEAD:<file>` sau khi clone) / push_files. Sau khi đẩy, kiểm `git hash-object` khớp sha trả về.
