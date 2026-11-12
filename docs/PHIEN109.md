# PHIÊN 109 — Tiếng kỹ năng + cụm nút phải-dưới dễ dùng

Nền: `main` @ `f0e3009` (949 test đạt trước khi làm). Gp gửi 15 file âm thanh kỹ năng, yêu cầu chèn đúng hoạt động và chỉnh lại cách dùng skill ở cụm nút góc phải-dưới.

## 1. Tiếng kỹ năng (assets/sfx/, 15 file, tổng ~290 KB)
Mỗi file gốc đã cắt đuôi, chuẩn hóa độ lớn, mono 80 kbps. Logic thuần: `js/world/sfx.js` (CUES). Phát: `js/ui/sfx.js` (`LGT.sfx.play(cue)`), theo thanh "Hiệu ứng", có chống dồn tiếng, tối đa 8 tiếng cùng lúc, **thiếu file thì tự phát tiếng tổng hợp cũ**.

| Hoạt động (cue) | File dùng | File gốc |
|---|---|---|
| Nhảy (`nhay`) | swoosh | freesound_community-clean-fast-swooshaiff-14784 |
| Ném đá (`nem-da`), khiêng/ném vật–NPC–người (`nem`, `khieng`) | swoosh (đổi tốc độ) | như trên |
| Đá trúng (`da-trung`) | va-cham | dragon-studio-sword-clashhit-393837 |
| Thương (`thuong`) | thuong-1/2/3 ngẫu nhiên + dam-trung | sword-slice-393847, sword-slice-2-393845, violent-sword-slice-393848 + universfield-blade-piercing-body-352462 |
| Chém khí: vung / phóng / trúng | thuong-2/3, chem-khi, va-nang | hero-skill-attack-reveal-1-384975, armor-impact-from-sword-393843 |
| Thiết đầu công: lao / trúng | swoosh + thiet-dau; va-nang + va-cham | hero-skill-attack-reveal-9-388900 |
| Lên bậc Khinh thân (`len-bac`) | len-bac | hero-skill-attack-reveal-11-388902 |
| Tự động hàng yêu bật/tắt | rut-guom | sword-unsheathing-393851 |
| Yêu quái xuất hiện | rut-guom + tran-danh | sword-fight-393849 |
| Thu phục yêu quái | thu-phuc | hero-skill-attack-reveal-12-388906 |
| Hạ quái bãi rừng | ha-quai | hero-skill-attack-reveal-13-388903 |
| Mình bị đánh | bi-danh | sword-fight-2-393846 |
| Ném yêu quái | swoosh + va-nang | — |

Nối ở: `yeuquai.js`, `farm.js`, `skill.js`, `carry.js`, `npcThrow.js`, `throwPlayer.js`, `conKhi.js`, `thietDau.js` (đều trong `js/ui/`); `hudMenu.js` gọi `initSfx()` trước `initSkill`. `sound.js` xuất thêm `audioCtx`.

## 2. Cụm nút phải-dưới
Lỗi cũ: một cột dài, nút đầu cột đổi theo hoàn cảnh (quái tới → "Ném đá" chen xuống đáy, "Nhảy" nhảy lên cao → bấm nhầm); lời chỉ chỗ che nút bên cạnh.
Mới: lưới 3×3, **mỗi nút MỘT ô cố định** (`SLOT_OF` trong `js/world/dock.js`):
```
hàng 3 (nhỏ):  [Ván]       [Kỹ năng]    [Túi đồ]
hàng 2:        [Tự động]   [Thiết đầu]  [Nhảy]
hàng 1:        [Chém khí]  [Thương]     [HÀNH ĐỘNG CHÍNH: Ném đá / Bấm! / Thả cầu / Thu cá / Khiêng / Ném / Lặn]
```
- Hai nút tranh ô A: chiến đấu/câu cá thắng nhặt đồ (`A_PRIORITY`); nút thua vào ô trống.
- Hồi chiêu = vòng tối quay (`cooldownFrac`, biến CSS `--cd`).
- Lời chỉ chỗ + dòng trạng thái gộp MỘT bong bóng phía trên cụm; nút được chỉ nhấp nháy.
- Máy tính: phím **1=chính, 2=Thương, 3=Chém khí, 4=Thiết đầu công, 5=Tự động, B=Túi đồ, Space=Nhảy**; nhãn phím hiện trên nút; không chạy khi đang gõ chữ / mở bảng / hội thoại / sửa nhà; không lặp phím (tránh mua cầu liên tục).
- Thương, Chém khí, Thiết đầu công nhận `pointerdown` (nhạy khi đánh liên tục).
- Cột menu dọc đè lên → cụm tự co `.dk.small`.

## 3. File đổi
Mới: `js/world/sfx.js`, `js/ui/sfx.js`, `assets/sfx/*.mp3` (15), `tests/sfx.test.mjs`, `docs/PHIEN109.md`.
Sửa: `js/world/dock.js`, `js/ui/dock.js` (viết lại), `css/dock.css`, `js/ui/sound.js`, `js/ui/{yeuquai,farm,skill,carry,npcThrow,throwPlayer,conKhi,thietDau,hudMenu}.js`, `tests/dock.test.mjs` (2 dòng kiểm cấu trúc cũ cập nhật + 7 test mới), `package.json`, `sw.js` (`dgt-v109`), `PROMPT.md` (mục 7), `THIRD_PARTY.md`.

## 4. Kiểm
`npm test` đạt (số thật ghi ở cuối bản trả lời). Chạy `js/ui/dock.js` thật trong jsdom: nút vào đúng ô, Nhảy/Túi đồ không dời khi quái xuất hiện–biến mất, phím 1/2/5/B gọi đúng kỹ năng, chặn khi gõ chữ/mở bảng.
**CHƯA kiểm được:** nghe thật các tiếng (không có loa), nhìn bố cục trên điện thoại/Chromium thật (máy AI không có trình duyệt), độ lớn tương đối giữa các tiếng. Giấy phép 15 file: xem `THIRD_PARTY.md`.

## 5. Việc kế (chờ Gp "tiếp tục")
Xem trên điện thoại thật rồi chỉnh cỡ nút/vị trí; chỉnh độ lớn từng cue trong `CUES` (số `g`); G2.1 Ngũ Hành theo GDD v2.

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff
