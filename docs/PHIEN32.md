# PHIÊN 32 — Phiên 3 master prompt, BƯỚC 1–2/4: logic cốt truyện + chú tiểu + hộp thoại/mục tiêu (BÀN GIAO)

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Nền:** repo `tp9sach-ops/loinhuan.github.io` `main` @ `8887ec8` ("Add files via upload", 2026-11-06 16:28). Yêu cầu của ptg: đọc kỹ repo rồi làm tiếp; việc kế đã chốt ở cuối Phiên 31: Phiên 3 master prompt (chú tiểu, trụ trì, tưới cây bồ đề, thiền 3 phút, mở Khinh thân bậc 1), LÀM TỪNG BƯỚC, xong báo rồi chờ ptg đồng ý.

## Kiểm tra đầu phiên (mã thật là căn cứ)
- `npm test` trước khi sửa: **437/437 đạt** (Node 22). HANDOFF cuối Phiên 31 ghi 452 → SAI LỆCH 15, chưa rõ nguyên nhân (có thể đếm nhầm). Số đúng nay: **447/447** (437 + 10 test mới).
- `PHIEN31.md` ở GỐC repo là bản CŨ (nói 429 test, "chưa làm lồng đèn") — lỗi thời; bản đúng ở `docs/PHIEN31.md` + khối Phiên 26–31 trong HANDOFF.md. `phien26.patch` ở gốc đã áp dụng, xóa được (chưa xóa vì ptg chưa bảo).
- Mã đã có sẵn (đừng làm lại): `js/world/lantern.js`, `fireflies.js`, `shelter.js`, `daycycle.js`, `season.js`, `weather.js`, `bridge.js`; `js/ui/soundLogic.js`, `viewportLogic.js`.

## Đã làm (BƯỚC 1)
1. **`js/world/story.js` (mới, logic thuần)**: máy trạng thái `meet → abbot → water1 → meditate → water2 → done`.
   - `apply(story, ev, now)` với ev = `{type:'talk', id}` | `{type:'water', near, now}` | `{type:'meditate', dt}` → `{story, changed, gain:{xp,sen}, notes, grew, unlocked:'khinhthan1'|null, stepFrom, stepTo}`.
   - `dialogueFor(story, npcId)` → `{pages[], ev|null}` cho `chutieu` và `truru` (đủ lời cho MỌI bước; chỉ đúng lượt mới có `ev`); NPC khác trả `null`.
   - `objective(story)` (mục tiêu hiển thị), `canWater(story, near, now)`, `nearTree(pos)`, `treeScale(story)`, `loadStory(raw)` (dọn dữ liệu hỏng/sửa trái phép).
   - Hằng số: `BODHI={x:-34,z:-16,s:1.2}` (cây lớn nhất, gần chánh điện; KHỚP `buildBodhi(-34,-16,1.2)` ở `js/scene/index.js` — test kiểm), `WATER_SPOT={x:-30.6,z:-16}`, `WATER_RANGE=4.5`, `WATER_COOLDOWN_MS=3500`, `WATER2_N=3`, `MEDITATE_SECONDS=180`, `TREE_SCALE=[0.86,0.96,1.06]`.
   - Thưởng (TẠM, chờ ptg duyệt): gặp chú tiểu 5 điểm; trụ trì 5 điểm + nhận bình; tưới lần 1 → 10 điểm + 1 sen; thiền xong → 30 điểm + 3 sen; hoàn thành → 60 điểm + 5 sen (tổng 110 điểm, 9 sen).
   - Chống lỗi thường gặp: hồi chiêu tưới (cả khi chỉnh đồng hồ lùi), mỗi lần cộng giờ thiền tối đa 2 giây, dữ liệu lưu bị sửa (kỹ năng chỉ có khi `step==='done'`, `med` bị kẹp trần…). **Chưa có máy chủ → KHÔNG chống được người cố ý sửa localStorage**; ghi rõ cho ptg.
2. **NPC "Chú tiểu Minh" (`id:'chutieu'`)** trong `js/world/npc.js` (đặt SAU `cusi` để không đổi chỉ số `NPCS[0..2]` mà test dùng): đứng ngoài cổng chùa `(-4.5, 44.5)`, điểm đứng `(-4.5, 47.5)`, `scale 0.85`, áo nâu, đầu trọc, nhìn về +z (hướng người chơi vào). Có 5 lời thường + quà 1 hạt sen/ngày như NPC khác (cơ chế cũ). Test cũ `tests/npc.test.mjs` vẫn đạt (đã kiểm: điểm đứng trống, đi tới được từ chỗ xuất hiện).
3. **`tests/story.test.mjs` (10 test)**, thêm vào `package.json`. `sw.js` VERSION `dgt-v28`.

## CHƯA làm — NỐI CHƯA XONG nên trong game HIỆN CHƯA thấy cốt truyện (đừng báo là xong)
Hiện trong game: chú tiểu đứng ở cổng, bấm vào thì nói lời thường (cơ chế cũ). **Chưa có**: hội thoại cốt truyện, bình tưới, nút tưới, thiền đếm giờ, cây lớn lên, mở kỹ năng. Mọi thứ trên mới có LOGIC + TEST, chưa có giao diện/3D, chưa xem trình duyệt thật.

## Việc kế (làm TỪNG BƯỚC, xong báo rồi chờ ptg đồng ý)
- **Bước 2 — Hội thoại + bảng mục tiêu:** `js/ui/story.js` (mới). Lưu `localStorage['lgt.story']` qua `loadStory`/`JSON.stringify`. Nối vào `LGT.onNpc` (`js/ui/npc.js`): nếu `dialogueFor(story, id)` khác null và là chú tiểu/trụ trì → mở hộp thoại nhiều trang (nút "Tiếp", Esc/chạm để qua; hết trang thì `apply(ev)`), ngược lại dùng lời thường. Khi `apply` trả `gain` → `addMerit(gain.sen)` + toast `notes`. Hiện mục tiêu ở góc phải (`objective(story)`). Điểm đứng của trụ trì là `stand:{x:2.0,z:-37.6}` (trong chánh điện).
- **Bước 3 — Bình tưới + tưới cây + cây lớn:** model bình tưới cầm tay (avatar, xem `js/world/avatar.js` có `setState`), nút "Tưới cây" chỉ hiện khi `step∈{water1,water2}` và `nearTree(pos)`; tới `WATER_SPOT` bằng `LGT.world.walkTo`. Hoạt ảnh tưới ~1,5 giây rồi `apply({type:'water', near:true})`; hiển thị hồi chiêu. Cây: cần GIỮ THAM CHIẾU nhóm `buildBodhi(-34,-16,1.2)` trong `js/scene/index.js` (dòng ~97: ba cây tạo trong một lệnh `scene.add(shade(...))`), tách cây thứ ba ra biến, `scale = 1.2 * treeScale(story)` làm mượt; hiệu ứng sáng + âm thanh nhận thưởng khi `grew`. Cẩn thận `js/scene/wind.js` (cây lung lay có thể giữ tham chiếu/scale riêng) và vật cản `CIRCLES` (bán kính cây 1,1 — không đổi theo scale cho đơn giản).
- **Bước 4 — Thiền 3 phút:** mỗi khung hình khi `LGT.world.mode==='meditate'` (chỉ ngồi bồ đoàn trong chánh điện, đã có sẵn) gọi `apply({type:'meditate', dt})` với dt thật (đã giới hạn 2 s); hiển thị bộ đếm 3:00 (đếm theo `objective(story).cur/need`); rời bồ đoàn thì DỪNG (không mất tiến độ, đã lưu). Đủ → cây lớn + thông báo.
- Sau đó: mở **Khinh thân bậc 1** (`story.skills.khinhthan===1`) → Phiên 4 (nút kỹ năng bên phải, 8 bậc, nhảy nhiều tầng, hồi chiêu). Thêm vào `js/world/quests.js` hay giữ riêng: NÊN giữ riêng `story.js` để không phá 437 test cũ.
- Việc ptg đang chờ: thử responsive trên máy thật; rà các bảng dài (tử vi, bát tự) trên điện thoại.

## BƯỚC 2 ĐÃ LÀM (cùng phiên 32, sau Bước 1)
- `js/ui/story.js` (mới, `initStory(hud,{toast,addMerit})`, gọi trong `js/ui/hudMenu.js` bọc try/catch): hộp thoại nhiều trang (nút "Tiếp ▸"/"Xong", Enter/Space/chạm để qua trang, Esc đóng không áp sự kiện) + thẻ mục tiêu (bấm để mở rộng mô tả; hiện tiến độ `cur/need`, thiền hiện `m:ss`). Lưu `localStorage['lgt.story']`. Mọi chữ qua `textContent`.
- API cho Bước 3–4: `window.LGT.story = { state, apply(ev), talk(id), close }` và `LGT.storyTalk(id)`. Gọi `LGT.story.apply({type:'water', near:true})` / `{type:'meditate', dt}` — hàm tự cộng hạt sen (`addMerit`), điểm (`LGT.addXp`), toast `notes`, vẽ lại thẻ mục tiêu, lưu.
- `js/ui/npc.js`: khi bấm NPC, nếu `LGT.storyTalk(id)` trả true (chú tiểu/trụ trì khi chương chưa xong) thì mở hộp thoại thay cho lời thường; quà hạt sen mỗi ngày và nhiệm vụ "hỏi thăm" vẫn tính như cũ. Xong chương (`step==='done'`) thì quay lại lời thường.
- `js/ui/quest.js`: thêm `LGT.addXp(n)` (cộng điểm công hạnh ngoài nhiệm vụ, tự thưởng sen khi lên cấp, kẹp 0–500/lần).
- `css/story.css` (mới, nạp sau `quest.css` trong `index.html`): thẻ mục tiêu nằm CỘT TRÁI dưới đồng hồ (top 268px; chỗ khác trên điện thoại đã chật), hộp thoại nằm trên thanh menu dưới; chế độ ngang thấp (`data-short`) đưa thẻ lên giữa trên.
- `tests/smoke.mjs` thêm 3 file mới; `sw.js` `dgt-v29`.
- **ĐÃ KIỂM bằng Chromium (SwiftShader, three từ node_modules, chặn mạng ngoài):** desktop 1280×720 và điện thoại 390×844. Luồng thật: bấm chú tiểu → hộp thoại 4 trang → Enter qua hết → bước `abbot` + thẻ "Gặp thầy Trụ trì" + lưu localStorage → bấm trụ trì → `water1`, `can=true`, thẻ "Tưới cây bồ đề 0/1 lần", +hạt sen/điểm hiện đúng. Ảnh nằm ngoài repo (không đẩy). Cách chụp: xem HANDOFF mục 11 (kịch bản mẫu: tạo thư mục riêng, `npm i three@0.160.1 playwright-core @sparticuz/chromium`, server `python3 -m http.server`, `LGT.onNpc('npc-chutieu')` bằng `page.evaluate`).
- **Chưa kiểm:** màn hình ngang thấp (`data-short`) và Z Fold; cảm ứng thật; bấm vào chú tiểu bằng chuột/ngón tay trong cảnh (mới gọi thẳng `LGT.onNpc`); đọc chữ thoại khi `Mưa lớn`. Nút mục tiêu mở rộng trên điện thoại chồng nhẹ lên nút +/− (chỉ khi đang mở rộng).

## VIỆC KẾ SAU BƯỚC 2
Bước 3 (bình tưới + nút Tưới cây + cây lớn lên) và Bước 4 (thiền 3 phút) như mô tả ở trên; dùng `LGT.story.apply`. Phần "Bước 2" trong danh sách Việc kế phía trên đã XONG.

## File thay đổi
`js/world/story.js` (mới), `js/world/npc.js`, `tests/story.test.mjs` (mới), `js/ui/story.js` (mới), `css/story.css` (mới), `js/ui/npc.js`, `js/ui/quest.js`, `js/ui/hudMenu.js`, `index.html`, `tests/smoke.mjs`, `package.json`, `sw.js`, `docs/PHIEN32.md` (mới), `HANDOFF.md`, `PROMPT.md`.

## Giới hạn / chưa kiểm
Chưa mở trình duyệt; chưa thấy chú tiểu bằng mắt (kích thước 0,85, vị trí gần cổng có thể che đường/đèn đường — `bodyBlocked` đã kiểm bằng test đi tới được nhưng chưa nhìn); lời thoại do dự án soạn (cần ptg đọc, đặc biệt tên "tiểu Minh" là TÊN TỰ ĐẶT); điểm thưởng tạm; dữ liệu cốt truyện chỉ ở máy người chơi.

---

# Phiên 32 — BƯỚC ÂM THANH THIÊN NHIÊN THEO VỊ TRÍ (phần mới, thêm sau Bước 1–2 ở trên)

**Nền:** repo `tp9sach-ops/loinhuan.github.io` `main` @ `925d023` ("Phiên 32 Bước 2: hộp thoại cốt truyện + thẻ mục tiêu"). ptg dán lại nhật ký Bước 3 (tư thế tưới + bình nước + nút "Đi tới cây / Tưới cây" + cây bồ đề lớn lên) nhưng **mã Bước 3 KHÔNG có trên `main`** (grep `pour`/`water` trong `js/world/*.js` chỉ ra `story.js`): sandbox đó đã mất, chưa đẩy. Phiên này KHÔNG làm lại Bước 3 (không có đủ mã trong tay); làm yêu cầu mới của ptg: âm thanh.

## Yêu cầu của ptg (nguyên ý)
Thay tiếng ếch, nhái, chim, dế… (đang tổng hợp bằng Web Audio) bằng 3 file ptg gửi; âm thanh NHỎ HƠN nhạc; chia theo KHU: tiếng phát ra từ đâu thì gần nghe to, xa nghe nhỏ, KHÔNG đều nhau khắp nơi.

## Đã làm
- `assets/audio/ech-nhai.mp3` (58 s), `chim-ngay.mp3` (58 s), `de-dem.mp3` (37 s): mono 32 kHz 56 kbps, tổng ~1 MB. Tạo bằng `tools/make-nature-audio.py <thư mục 3 mp3 gốc>` (lọc thông cao, chỉnh RMS −23 dBFS, crossfade đầu–đuôi để lặp liền). Gốc: ếch = cả file; chim = đoạn 20–80 s của file 218 s; dế = file "birds and crickets" (có lẫn vài tiếng chim, lọc cao 250 Hz vì 37% năng lượng gốc là tiếng ù dưới 150 Hz).
- `js/ui/spatialLogic.js` (mới, THUẦN, có test): bảng `EMITTERS` (22 nguồn: ếch ở ao sen ×2, hồ cá, hồ thác; chim ở 3 cây bồ đề, 2 bụi tre, 2 hàng cây, vườn thiền, vườn tháp, rừng thông ×2, gốc đa, bãi thác; dế ở bãi cỏ trước Tam quan ×2, trà thất, hồ cá, vườn thiền, vườn tháp, vỉa hè đường làng ×2, rừng, đường thác), `rolloff` (≤ref to nhất, ~1/khoảng cách, về 0 ở max), `panOf` (trái/phải theo yaw camera), `lowpassHz` (xa thì đục), `kindGates` (chim = ngày, dế + ếch = đêm, chuyển từ từ lúc hoàng hôn/rạng đông, theo mùa, mưa làm chim im/dế thưa/ếch vẫn kêu, trong chánh điện ×0,5), `emitterStates` (mỗi loại giữ tối đa 3–4 nguồn to nhất).
- `js/ui.js`: bỏ `crickets`/`frog` tổng hợp và `VOL.insects/frogs`; thêm bộ máy `NAT` (tải + giải mã từng loại khi cần, lỗi tải thử lại sau 30 s; mỗi nguồn = file lặp bắt đầu ngẫu nhiên, tốc độ 0,96–1,04 → lọc cắt cao → StereoPanner → gain → `g.nature` → thanh "Hiệu ứng"); `updateMix` (4 lần/giây) gọi `natureUpdate(emitterStates(...))` với vị trí, yaw camera (`LGT.world.camera.yaw`), `LGT.night`, mùa, mưa, trong chánh điện; tắt âm thanh thì tắt hết nguồn. Ve (mùa hạ), gió, thác, mưa, sấm, chuông, mõ vẫn tổng hợp như cũ.
- `NATURE_VOL` ếch 0,25 · chim 0,22 · dế 0,2 (nhạc nền 0,55). Đo trong Chromium (OfflineAudioContext): ếch sát bờ ao ≈ −37 dB so với nhạc ≈ −27 dB; ếch cách ao 10 m −46 dB, 20 m −53, 40 m −64, 54 m tắt.
- `tests/spatial.test.mjs` (10 test), thêm vào `package.json` và `tests/smoke.mjs` (file bắt buộc). `npm test` 458/458 (Node 22). `sw.js` VERSION tăng 1. `THIRD_PARTY.md`: ghi nguồn 3 file, GIẤY PHÉP CHƯA XÁC NHẬN.
- Kiểm Chromium: 3 file giải mã đúng (mono, đúng độ dài), bước nhảy ở chỗ nối vòng lặp nhỏ (≤ 0,04 so với bước lớn nhất 0,27–0,43), mức giảm theo khoảng cách và trái/phải đúng công thức.

## CHƯA làm / rủi ro
- **Chưa NGHE bằng tai** và chưa chạy trọn trang (chưa vào cảnh 3D để đi dạo nghe gần/xa). ptg cần nghe: độ lớn (`NATURE_VOL` trong spatialLogic.js), chỗ nối vòng lặp, chim lẫn trong file dế vào ban đêm có lạ không.
- Vị trí 22 nguồn là ƯỚC LƯỢNG theo tọa độ cây/ao/vườn trong layout/landscape/outside/placements; chưa đối chiếu từng cây trong cảnh. Dời chỗ = sửa `EMITTERS`.
- `ambientMix` vẫn trả `insects` và `frogs` (cũ, có test) nhưng ui.js không còn dùng; có thể xóa cùng test ở phiên sau.
- Bộ nhớ: 3 buffer giải mã ≈ 27 MB (chỉ giải mã loại đang cần); chưa đo trên iPhone cũ.
- Chưa dừng AudioContext khi tab ẩn (hành vi cũ: chỉ nhạc nền tạm dừng).
- Bước 3 (tưới cây) còn phải LÀM LẠI từ mô tả: pose `water` trong `avatarLogic.js` (thêm `pour` vào P), bình tưới gắn tay phải trong `avatar.js` (`setProp('can')`, giọt nước), `pour(tx,tz,sec,onDone)` trong `world.js`, nút "Đi tới cây / Tưới cây", cây bồ đề lớn theo `story.tree`, KHÔNG thêm trạng thái mới vào danh sách mạng (để khỏi sửa luật Firebase). Đọc `js/world/story.js` (`STEPS`, `waterOk`...) và `tests/story.test.mjs` trước.
