# Bảng màu + phác thảo hình 30 chiêu (prompt chiêu thức 3D, mục 4 và mục 14 điểm 2)

Tạo tự động bằng `node tools/chieuMau.mjs md` từ `js/data/chieuMau.js`. Bản vẽ vùng cảnh báo tô đúng màu: `docs/chieu-bang-mau.svg` (tạo bằng `node tools/chieuMau.mjs svg > docs/chieu-bang-mau.svg`). Màu là TẠM, chờ ptg nhìn bằng mắt rồi chỉnh một chỗ ở `chieuMau.js`.

Quy tắc: lõi sáng nhất, nền đậm nhất; tối đa 4 màu chủ + 1 màu bổ sung nhỏ (≤ 10% diện tích); ảnh đen trắng vẫn tách khối (độ sáng tăng dần nền < chủ < sáng < lõi).

## Bảng 4 màu mỗi Hệ + màu bổ sung

| Hệ | Nền tối | Màu chủ | Màu sáng | Lõi trắng ngà | Bổ sung | Độ sáng (nền / chủ / sáng / lõi) | Tương phản chủ÷nền |
| --- | --- | --- | --- | --- | --- | --- | ---: |
| Kim | `#2c303a` | `#aab3c4` | `#eef1f7` | `#fffdf2` | `#c98f3a` (vàng đồng ấm) | 0.03 / 0.45 / 0.88 / 0.98 | 6.3 |
| Mộc | `#14301c` | `#3da55a` | `#b8ec8a` | `#f7ffe6` | `#e68db0` (hồng sen nhạt) | 0.02 / 0.29 / 0.72 / 0.97 | 4.6 |
| Thủy | `#0e2a3f` | `#2b8fd6` | `#9ee3f7` | `#f3fcff` | `#f2e3a0` (vàng nhạt ánh trăng) | 0.02 / 0.25 / 0.69 / 0.96 | 4.2 |
| Hỏa | `#3b1a14` | `#e8541c` | `#ffc23a` | `#fff4d8` | `#6b4a85` (tím khói) | 0.02 / 0.24 / 0.60 / 0.91 | 4.3 |
| Thổ | `#3a2917` | `#b4833f` | `#ebd08f` | `#fff5d9` | `#5a9e4b` (xanh rêu tươi) | 0.03 / 0.26 / 0.65 / 0.92 | 4.1 |

Chú ý: bảng chi tiết phác thảo từng chiêu (3 hình dáng, dấu ✔ là hình được chọn) nằm trong `js/data/chieuMau.js` (`PHAC_THAO`); chạy `node tools/chieuMau.mjs md` để in đầy đủ ra file này.
