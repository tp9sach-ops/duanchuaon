# Linh Quang (靈光)

Web tâm linh 3D dạng trang cuốn, bối cảnh chùa Việt trên núi về đêm.
Giao diện tĩnh trên GitHub Pages; Google Apps Script chỉ làm backend lưu dữ liệu và gọi AI.

**Bàn giao giữa các phiên: xem [HANDOFF.md](HANDOFF.md).**

## Chạy thử trên máy

```bash
python3 -m http.server 8080
# mở http://localhost:8080   (thêm ?mood=0.8 hoặc ?mood=-0.8 để thử đổi ánh sáng)
npm test                      # kiểm tra cú pháp, quy ước và engine lịch (17 test)
```

## Đưa lên GitHub Pages

1. Tạo repo, đẩy toàn bộ thư mục này lên nhánh `main`.
2. Settings → Pages → Source: **GitHub Actions**.
3. Mỗi lần push, workflow `.github/workflows/pages.yml` chạy test rồi deploy.

## Backend Google Apps Script (tùy chọn ở giai đoạn 1)

Dán `gas/Code.gs` vào một dự án Apps Script, chạy `setup()` một lần, deploy Web App
(Execute as: Me, Access: Anyone), rồi điền URL `/exec` vào `js/config.js`.

Nội dung trên trang mang tính tham khảo, giải trí và chiêm nghiệm văn hóa.
