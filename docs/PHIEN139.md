# Phiên 139 — Mục 1 hoàn tất: bỏ nốt trần Tu Vi 150 (kinh nghiệm không còn trần ở mọi hệ)

Quy tắc ptg (chép nguyên văn): For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff.

## Trạng thái 5 mục (ptg giao 13/11)
1. ✅ Kinh nghiệm không giới hạn trần — XONG (Phiên 138 bỏ trần cấp công hạnh + trần Tu Vi/ngày; Phiên 139 bỏ nốt trần Tu Vi 150).
2. ✅ Map mở rộng, quái càng sâu càng mạnh — đã có từ Phiên 131–132 (`docs/PHIEN132.md`).
3. ✅ Hạt sen không ảnh hưởng sức mạnh — đã có từ Phiên 133 (`docs/PHIEN133.md`).
4. 🔶 Phó bản — đang làm theo bước: 4a ✅ lõi logic (Phiên 139); 4b ✅ zone + cảnh 3D riêng (chưa nhìn bằng mắt); 4c ✅ NPC + bảng chọn phó bản (chưa nhìn bằng mắt); 4d ⏳ nối `LGT.addXp`/`settleKill`, lưu `lgt.dungeon`, hiển thị lượt/boss.
5. ⏳ Mảnh ghép boss → linh thú trong hồ lô.

## Đã làm ở Phiên 139
- `js/data/stats.js`: `tuViMax: Infinity` (trước 150); thêm `tuViKyThuat: 5000` = chặn kỹ thuật cho bảng EXP/chỉ số (EXP lưu tối đa 1e9 ≈ Tu Vi ~1100 nên chưa bao giờ chạm).
- `js/world/stats.js`: `clampTuVi` chỉ kẹp dưới 1 và trên 5000 kỹ thuật; `expToNext` luôn > 0; `CUM`/`levelFromExp`/`expRemaining`/`progressOf` dùng `tuViKyThuat`. Công/Thủ/Sinh Lực vẫn tuyến tính (10+3(n−1), 5+2(n−1), 120+25(n−1)) nên cấp > 150 mạnh thêm.
- Tests sửa: `tests/stats.test.mjs`, `tests/nguontuvi.test.mjs` (mọi chỗ giả định cấp 150 là tối đa). `npm test`: 1059/1059 xanh (chạy thật trong phiên này).

## Mục 4a (Phiên 139): lõi phó bản
- `js/data/dungeons.js` (số liệu TẠM): 9 lượt; 4 phó bản `rungmoc` (Rừng Cổ Mộc, boss Lão Mộc Tinh), `hangkim` (Hang Sơn Cước), `hothuy` (Động Thủy Mẫu), `thaptho` (Mê Cung Bảo Tháp); mỗi cái 2 loại quái (thường + tinh anh) và boss lấy từ `MONSTERS`. Mỗi lượt sau: Oán Khí ×(1+0,35·(lượt−1)), Công ×(1+0,2·…), kích thước ×(1+0,06·…); mỗi lần đã chinh phục: +40% Oán Khí, +25% Công, +5% kích thước cho cả khu; boss chính ×1,5 Oán Khí, ×1,25 Công, ×1,7 kích thước thêm. Tinh anh ở lượt 3/6/9. Quà: hạt sen = drop boss × (1 + 0,5 × số lần đã chinh phục), 1 mảnh yêu quái (`manh` = id boss, dùng cho mục 5), 3 lần tung vật phẩm theo bảng `vatPham` (id vật phẩm là TÊN TẠM, chưa có trong túi đồ — bước 4d phải nối hoặc đổi sang vật phẩm thật).
- `js/world/dungeon.js`: `loadDungeon`, `enter`, `onKill`, `leave`, `waveMobs`, `mobStats`, `rewardFor`, `clearFactor`, `waveFactor`. Trạng thái `{ v, clears, run }` (chưa lưu vào `LGT`). `tests/dungeon.test.mjs` (11 test) có trong `npm test`.

## Mục 4b (Phiên 139): zone + cảnh phó bản
- `js/world/zoneDungeon.js` (logic thuần): mỗi phó bản một zone `pb-<id>` (loại `QUAI`), ô 40×40 m tâm x = 700 + 60 × thứ tự, z = 0 (xa hub/Vườn thử/Võ đài), sàn tròn bán kính 16 m. `playerSpawn(id)` (phía nam), `mobSpot(id, i, n)` (cung phía bắc, dùng để đặt quái bước 4d), cổng `roi-pho-ban` ở rìa nam → về chùa (điểm `tu-pho-ban` ở hub = lối về Võ đài (18,8), bước 4c đổi sang chỗ NPC). Cờ zone: `viaNpc` (hub KHÔNG có cổng vào; `validate()` bỏ qua kiểm tra "tới được từ hub") và `temp` (`restore` luôn đưa về chùa, không lưu làm zone cuối). Sửa nhỏ `js/world/zones.js` cho hai cờ này; đăng ký trong `js/world/zoneRuntime.js` (`registerDungeonZones`).
- `js/scene/dungeon.js`: cảnh theo chủ đề (rừng: cây nón; hang: đá; hồ: cột xanh; tháp: trụ đất) + cổng rời dùng `buildGate` của `js/scene/voDai.js`. `js/ui/dungeonZones.js` (gắn trong `js/main.js`): đặt `LGT.dungeonZones = { enter(id), leave(), inside }`. `enter` chỉ vào được từ chùa khi đang rảnh; **bước 4c (NPC) chỉ cần gọi `LGT.dungeonZones.enter('rungmoc')`** …
- CHƯA nhìn bằng mắt (không WebGL). `tests/zonedungeon.test.mjs` (5 test) có trong `npm test`. Thiếu còn lại ở 4d: không có quái trong zone (chưa gọi `dungeon.enter/onKill`), rời bằng cổng chưa gọi `leave()` của logic (xóa lượt đang chạy), chưa lưu `lgt.dungeon`.

## Mục 4c (Phiên 139): người dẫn + bảng chọn phó bản
- 4 NPC mới `DUNGEON_NPCS` trong `js/world/npc.js` (cũng nằm trong `NPCS`, nên dùng chung cảnh/click/va chạm): `pbmoc` Lão tiều phu (-55,77), `pbkim` Thợ mỏ già (50,120), `pbthuy` Ngư ông (-55,105), `pbtho` Sư thầy giữ tháp (60,56); đứng ở lối vào bốn khu rừng sâu; chỗ đã dò bằng `tests/npc.test.mjs` (va chạm + tới được từ cổng chùa). `DUNGEONS[id].npcId` trỏ về NPC.
- Bấm NPC → `js/ui/npc.js` gọi `LGT.dungeonPanel.open(dungeonId)` (như Thầy Tri khách/Bác Tư). Mỗi NPC chỉ mở phó bản CỦA MÌNH (ý ptg: "gặp NPC → chọn phó bản" — nếu muốn một NPC liệt kê cả 4 phó bản thì sửa `paint()` trong `js/ui/dungeonPanel.js`).
- `js/ui/dungeonPanel.js`: bảng hiện cấp quái, số lượt, boss, số lần đã chinh phục, độ mạnh hiện tại (máu/công/kích thước), hạt sen khi hạ boss, mảnh yêu quái; nút "Vào phó bản" → `enter(state,id)` (logic) rồi `LGT.dungeonZones.enter(id)` (zone 4b); nếu zone không vào được thì KHÔNG lưu trạng thái. Trạng thái ở `localStorage` khóa `lgt.dungeon`, đặt `LGT.dungeonState = { get(), set(s) }` cho bước 4d. Tải lại trang giữa phó bản → lượt đang chạy bị xóa (không tính chinh phục) vì zone tạm đưa về chùa.
- `describe(state, id)` mới trong `js/world/dungeon.js` (cấp quái, hệ số, thưởng) — có test trong `tests/dungeon.test.mjs`.
- LƯU Ý: vào phó bản hiện đưa tới KHU TRỐNG (quái là việc của 4d) — ra bằng cổng phía nam. Chưa nhìn bằng mắt.

## Chỉnh nút Nhảy (ptg yêu cầu giữa phiên, 13/11): nhảy tới trước + lướt né chiêu
- Đang đi mà bấm Nhảy → cú nhảy bật tới trước (`leapPlan`: 2,2 + 0,3 × bậc mét, kéo dài đúng thời gian trên không, đi qua `world.dash` với `tilt:false`, dừng trước vật cản bằng `landing`). Đứng yên bấm Nhảy → nhảy tại chỗ như cũ.
- Bấm Nhảy tiếp lúc còn trên không hoặc trong 0,6 s sau khi chạm đất → LƯỚT (`glidePlan`: 3 + 0,2 × bậc mét, 0,26 s) và BẤT TỬ 0,45 s (`vitals.guard` trong `js/world/monsterAttack.js`, qua `LGT.farmCombat.vitals`); hồi chiêu lướt 1,2 s. Lướt chờ hết cú bật rồi mới chạy. Không áp dụng trong nhà (nhảy thường vẫn được).
- Logic thuần `nextAction` ở `js/world/skills.js` (test trong `tests/skills.test.mjs`, `tests/monsterattack.test.mjs`); nối giao diện ở `js/ui/skill.js`. Số liệu TẠM (`LEAP_CFG`, `GLIDE_CFG`).
- Lưu ý: trong lúc đang bật/lướt, nút Thiết đầu công tạm không dùng được (cùng cơ chế `world.dash`); dùng được lại sau khi hết bật (cửa sổ 1,6 s sau chạm đất vẫn còn). CHƯA thử trên trình duyệt thật (môi trường AI không có): ptg thử cảm giác tay rồi chỉnh số.
- Bất tử chỉ chặn đòn của quái bãi rừng (`farmCombat`); yêu quái hằng tháng không đánh người chơi nên không cần.

## Còn là trần (KHÔNG phải kinh nghiệm — giữ nguyên, hỏi ptg nếu muốn bỏ)
Trần hạt sen 100/ngày, 10 lần/ngày hạt sen phóng sinh, 5 lần/ngày/loại hoạt động chùa, 60 phút tự động hàng yêu/ngày, kẹp lưu EXP 1e9 (kỹ thuật), kẹp cấp 99 của máu/sát thương yêu quái hằng tháng.

## Việc kế: MỤC 4d — quái trong zone phó bản + thưởng + lưu (rồi mục 5: mảnh ghép boss → linh thú)
Ý ban đầu ở `docs/PHIEN138.md` (ý ptg + hướng làm: `js/world/dungeon.js` logic thuần + test → zone/cảnh 3D riêng → NPC + bảng chọn → nối `LGT.addXp`/`settleKill`; dùng cơ chế zone của Võ đài: `zones.js`, `zoneRuntime.js`, `zoneVoDai.js`, `js/scene/voDai.js`, `js/ui/zoneGate.js`).

## Prompt khởi động cho phiên mới (dán nguyên văn)
> Đọc `docs/PHIEN139.md`, `docs/PHIEN138.md`, `docs/PHIEN132.md`, `docs/PHIEN133.md`. Chỉ xem các chỗ cần sửa, không đọc hết repo. Mục 1–3 đã xong; kinh nghiệm không còn trần. Làm MỤC 4d (quái trong zone phó bản: dùng `waveMobs`/`onKill`/`mobSpot`, lưu qua `LGT.dungeonState`, gọi `leave` khi rời, thưởng + kinh nghiệm; lõi, zone 4b và NPC 4c đã xong), từng bước nhỏ, `npm test` phải xanh, đẩy GitHub rồi báo; cuối phiên viết `docs/PHIEN140.md` kèm prompt bàn giao và chép nguyên văn quy tắc bàn giao ở trên.
