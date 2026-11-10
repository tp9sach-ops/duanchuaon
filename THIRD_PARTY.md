# Nguồn bên thứ ba

## Ô Long Viện (MIT)

- Nguồn: https://github.com/hoangminhon/olongvien
- Tác giả: Kent Juno. Giấy phép MIT.
- Phần được dùng trong dự án này:
  - `js/engines/iching.js` — 64 quẻ Kinh Dịch (tên, hào, mức cát/hung, luận giải, luận theo 4 chủ đề). Chỉnh: bỏ phần nhận lệnh từ bình luận TikTok, thêm tham số `rng` để kiểm thử.
  - `js/engines/xam36.js` — 36 thẻ xăm (bài thơ bốn câu, luận giải, lời khuyên, luận theo 4 chủ đề). Chỉnh tương tự, bỏ chữ Hán `glyph`.
- Nội dung chữ do tác giả đó tự biên soạn cho mục đích giải trí; không phải bản dịch kinh sách.
- Không lấy: số tài khoản ủng hộ trong README, bộ công cụ LIVE TikTok, hình ảnh và nhạc trong `assets/` (xem `PROMPT.md` mục 10 về điều kiện dùng).

### Văn bản giấy phép MIT của dự án gốc

MIT License

Copyright (c) 2026 Kent Juno

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Mô hình cây GLB (`assets/models/trees/`) — NGUỒN VÀ GIẤY PHÉP CHƯA RÕ

- 6 file `gn, real, oak, maple, lowpoly, pine` là bản đã tối ưu (bằng `tools/optimize-glb.mjs`) từ 7 file ptg gửi ngày 2026-11-04 (`tree_gn`, `realistic_tree`, `oak_tree`, `maple_tree`, `tree_low_poly_lowpoly`, `pine_tree`; tên gốc có hậu tố "-tối_đa-compressed").
- **Tác giả / link nguồn / giấy phép: CHƯA BIẾT** (cấu trúc node kiểu Sketchfab, thường là CC-BY nên cần ghi công). ptg cần gửi link từng mô hình để ghi vào đây trước khi công bố rộng. Chưa dùng: `tree_house`, `tree_animate`.

## Âm thanh thiên nhiên (`assets/audio/ech-nhai.mp3`, `chim-ngay.mp3`, `de-dem.mp3`) — GIẤY PHÉP CHƯA XÁC NHẬN

- Do ptg gửi ngày 2026-11-06, đã xử lý bằng `tools/make-nature-audio.py` (mono, lọc tiếng ù, chỉnh cùng mức, nối vòng lặp). Tên file gốc: `dragon-studio-frogs-croaking-329854.mp3` (ếch nhái), `audiopapkin-beautiful-birdsong-3-301866.mp3` (chim, dùng đoạn 20–80 s), `loswin23-birds-and-crickets-2-627567.mp3` (chim và dế).
- Tên file giống kiểu đặt tên của kho âm thanh miễn phí (có thể là Pixabay) nhưng **đây chỉ là suy đoán**: ptg cần gửi link nguồn từng file để ghi tác giả và giấy phép vào đây trước khi công bố rộng.

## Mô hình nhà GLB (`assets/models/houses/`) — mỗi cấp nhà một mô hình

- `nha-0-go.glb` (cấp 0 "Nhà trống thô sơ"): "Autumn House" của Zhenya (https://sketchfab.com/evgeniya93svg), CC-BY-4.0, https://sketchfab.com/3d-models/autumn-house-52772448c62348e0a4951b51758d5587 . Đã sửa: bỏ nền tròn, xe và cây rời, giữ thân nhà + dây leo + lá thu, thu nhỏ ảnh về 512 px, xoay mặt trước về +z, thu về rộng 6 m.
- `nha-1-lau.glb` (cấp 1 "Nhà lầu"): "VIANNEY HOUSE 2" của fantecboisseau (https://sketchfab.com/fantecboisseau), CC-BY-4.0, https://sketchfab.com/3d-models/vianney-house-2-b45403bf4f7849aebb61f7623c00b714 . Đã sửa: bỏ bệ nền và gara, bỏ ~47.000 tam giác rác, thu nhỏ ảnh về 512 px, thêm mặt kính trước, cửa chính, bậc thềm.
- `nha-2-hoa-vien.glb` (cấp 2 "Nhà hoa viên"): mô hình "villa_with_garden" ptg gửi ngày 2026-11-10. Đã sửa: chỉ lấy phần nhà + hồ, bỏ rừng thông và dòng suối, giảm từ ~590.000 xuống ~17.000 tam giác, ảnh texture được tô thành màu đỉnh.
- `nha-3-villa.glb` (cấp 3 "Villa hồ bơi"): mô hình "modern_luxury_villa_house_building_with_pool" ptg gửi ngày 2026-11-10. Đã sửa: bỏ tường rào và nền khu đất, giảm từ ~133.000 xuống ~2.000 tam giác, tô lại màu theo bảng màu riêng.
- **Tác giả / link nguồn / giấy phép của 2 mô hình villa (cấp 2 và 3): CHƯA BIẾT.** ptg cần gửi link Sketchfab từng mô hình để ghi tác giả và giấy phép vào đây trước khi công bố rộng.
