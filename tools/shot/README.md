# Chụp cảnh 3D thật bằng Chromium không đầu (Phiên 14e)

Máy AI không có npm nhưng GitHub thì tải được, nên lấy three.js r160 bằng git thưa (sparse):

    git clone --depth 1 --branch r160 --filter=blob:none --sparse https://github.com/mrdoob/three.js.git t
    cd t && git sparse-checkout set build examples/jsm

Chạy (mỗi lệnh dưới ~100 giây vì WebGL phần mềm chậm; dùng `?shadow=1024`, cỡ 960×540):

    export THREE_DIR=$PWD/t REPO=/đường/dẫn/repo
    VW=960 VH=540 WAIT=9000 python3 tools/shot/shot.py ra.png "<JS chạy sau khi tải>"

`srv.py` phục vụ repo và thay đường dẫn three trên jsdelivr bằng `/__three/` (không cần mạng). `shot.py` chặn mọi mạng ngoài, đặt tên người chơi sẵn, mở `?debug=1`
(móc `LGT.dbg = {scene, camera, renderer}` và `LGT.freeCam = true` để tự đặt camera). JS mẫu vào chùa: `document.querySelector('.hud-btn.gold.big').click()`;
dịch chuyển `LGT.world.teleport(x,z)`; đi tới `LGT.world.goTo('npc-truru')`.

## Kiểm thử tài khoản bằng trình duyệt thật (Phiên 53)

`e2e-account.cjs` (máy A tạo → máy B đăng nhập → máy C tạo trùng bị chặn → máy D nhân vật cũ đặt mật khẩu; 16 kiểm tra) và `e2e-account-mobile.cjs` (điện thoại 390×780 và 360×640; 4 kiểm tra).
Chúng chạy game thật trong Chromium, chặn mạng ngoài và thay `script.google.com` bằng CHÍNH `gas/Accounts.gs` chạy trong `vm` (không đụng dữ liệu GAS thật). Cần `playwright` (Node) và three.js r160 như trên:

    export THREE_DIR=$PWD/t OUT=/thư/mục/ghi/ảnh   # REPO mặc định là thư mục gốc repo
    node tools/shot/e2e-account.cjs          # ~8–10 phút (WebGL phần mềm); xuất new-desktop.png, login-error.png, duplicate.png
    node tools/shot/e2e-account-mobile.cjs   # ~3 phút

Lưu ý: tắt Service Worker (`serviceWorkers:'block'`, đã đặt sẵn) vì Playwright không chặn được yêu cầu từ SW nên sau khi tải lại trang three.js sẽ không bao giờ tải xong.

## Kiểm Võ đài giao lưu bằng trình duyệt thật (Phiên 140)

`e2e-vodai.cjs` giả một lời mời giao lưu (móc hàm xử lý gói tin, không cần hai máy), bấm Chấp nhận, vào Võ đài rồi kiểm 4 nút đánh nằm trong màn hình, bấm trúng được, không chồng nhau; cụm nút chính không có nút đánh yêu quái. Bắt đúng lỗi trùng class `cd` (Phiên 140).

    export THREE_DIR=$PWD/t OUT=/thư/mục/ghi/ảnh   # CHROME=/usr/bin/google-chrome nếu không có Chromium của playwright
    VW=390 VH=780 node tools/shot/e2e-vodai.cjs      # ~2 phút; xuất vodai-390.png
