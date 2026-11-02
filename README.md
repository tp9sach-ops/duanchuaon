# Diệu Giang Tự

Web tâm linh 3D dạng trang cuốn, bối cảnh chùa Việt trên núi về đêm.
Giao diện tĩnh trên GitHub Pages; Google Apps Script chỉ làm backend lưu dữ liệu và gọi AI.

**Prompt riêng của dự án: [PROMPT.md](PROMPT.md). Bàn giao giữa các phiên: [HANDOFF.md](HANDOFF.md).** Mọi phiên làm việc đọc `PROMPT.md` trước, rồi `HANDOFF.md`.

## Chạy thử trên máy

```bash
python3 -m http.server 8080
# mở http://localhost:8080   (thêm ?mood=0.8 hoặc ?mood=-0.8 để thử đổi ánh sáng)
npm test                      # kiểm tra cú pháp, quy ước và các engine (hơn 110 test)
```

## Đưa lên GitHub Pages

1. Tạo repo, đẩy toàn bộ thư mục này lên nhánh `main`.
2. Settings → Pages → Source: **GitHub Actions**.
3. Mỗi lần push, workflow `.github/workflows/pages.yml` chạy test rồi deploy.

## Backend Google Apps Script (tùy chọn ở giai đoạn 1)

Dán `gas/Code.gs` vào một dự án Apps Script, chạy `setup()` một lần, deploy Web App
(Execute as: Me, Access: Anyone), rồi điền URL `/exec` vào `js/config.js`.

## Bật AI chỉ tay / nhân tướng (tùy chọn)

1. Apps Script → thêm file `Vision.gs` (nội dung trong `gas/Vision.gs`) và cập nhật `Code.gs`.
2. Project Settings → Script properties → thêm `ANTHROPIC_API_KEY` (khóa của bạn; không bao giờ đưa vào repo).
3. Deploy → Manage deployments → Edit → New version.
4. Dán URL `/exec` vào `js/config.js` (`apiUrl`), đẩy lên GitHub. Khi chưa cấu hình, trang chỉ tắt phần AI.

## Cài như ứng dụng (PWA)

Trang có `manifest.webmanifest` và `sw.js`. Mở trên điện thoại → menu trình duyệt → "Thêm vào màn hình chính".
Muốn buộc mọi người tải bản mới, đổi `VERSION` trong `sw.js`.

Nội dung trên trang mang tính tham khảo, giải trí và chiêm nghiệm văn hóa.
