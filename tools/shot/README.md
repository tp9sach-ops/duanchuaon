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
