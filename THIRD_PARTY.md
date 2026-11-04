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
