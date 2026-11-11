# Phiên 95 (nhánh nhà) — nhà cấp 4–5 (Tuscan, La Mã) + người chơi online trên bản đồ

> Lưu ý: đây là bản ghi của nhánh "nhà cấp 4–5 + bản đồ người chơi", đổi tên để KHÔNG đè docs/PHIEN95.md (chương 2 cốt truyện) trên repo.

## Đã làm
1. **Nhà cấp 4 "Biệt thự Tuscan" (1500 lá) và cấp 5 "Biệt thự La Mã" (2400 lá)** — giá là TẠM, ptg duyệt/đổi trong `HOUSE_LEVELS` (`js/world/land.js`). Mô hình GLB `nha-4-tuscan.glb`, `nha-5-la-ma.glb` (xem THIRD_PARTY.md: giấy phép chưa rõ).
   - Thân nhà `hw = hd = 5.4` (mô hình đã gồm sân vườn, chiếm gần hết lô 12×12); cửa giữa; **không có khối hồ bơi chặn riêng** (`poolRect` chỉ còn cho cấp 3). Phòng trong nhà: `ROOMS[4..5]` (`js/world/interior.js`).
   - Test sửa theo: `land`, `landpool`, `interior`, `tutorial`, `nextgoal`. Với cấp ≥ 4 luật "sân trước ≥ 4,5 m" nới còn 0,3 m và lề lô 0,5 m.
   - **Chưa xác minh bằng mắt trong trình duyệt:** hướng mặt trước của 2 mô hình (đặt theo quy ước +z = mặt trước, chưa biết cửa chính thật của mô hình nằm phía nào) và độ đẹp. Nếu ngược/xấu: chỉnh `rot` trong script (tools) hoặc xoay trong `HOUSE_GLB`.
2. **Bản đồ hiện người chơi đang online** (`js/world/minimap.js` `playerMarkers`, `js/ui/minimap.js`): chấm tím + tên (bản đồ lớn), đếm "Đang online", bấm chấm → "Dẫn tôi tới". Nguồn: `LGT.room.players()`. Người đang trong nhà (toạ độ phòng ngoài khung bản đồ) không hiện. Cập nhật ~0,9 s/lần. Có test mới trong `tests/minimap.test.mjs`.

## Test
`npm test`: 845 đạt, 4 hỏng — cả 4 đã hỏng sẵn từ `main` trước phiên này (không phải do phiên này): `312` (dock/journey trang), `318` (trang Sức mạnh · Yêu quái), `345` (landpool: kiểm chuỗi mã villa cũ trong scene/land.js), `tutorial: chủ đề mới ... con số của luật`. Cần phiên sau xử lý.

## Còn lại (ptg yêu cầu, chưa làm)
- **Phần CÁ**: dùng 3 file `fish.glb` (nhẹ), `shiny_fish.glb` (19 MB, 407k tam giác), `fish (1).glb` (32 MB, 1,19 triệu tam giác, bản quét, không texture — phải giảm mạnh) để hiển thị cá khi nhân vật câu được + hiệu ứng chúc mừng khi được loại cá MỚI/hiếm theo bậc. Tất cả CC-BY-4.0 (ghi công vào THIRD_PARTY.md). File liên quan: `js/world/fishing.js`, `js/scene/fishing.js`, `js/ui/fishing.js`, `js/scene/pondFish.js`, `js/ui/celebrate.js`, `js/world/celebrate.js`.
- Bản đồ: nếu cần lọc người theo zone/xóm hoặc hiện người trong nhà ở cửa nhà.

## Prompt bàn giao (dán cho phiên sau)
```
Đọc PROMPT.md, HANDOFF.md, docs/PHIEN95.md của repo tp9sach-ops/duanchuaon. Việc: (1) PHẦN CÁ — dùng 3 GLB cá ptg gửi
(fish.glb, shiny_fish.glb, fish (1).glb; tối ưu: giảm tam giác ≤ 5k/con, texture ≤ 256, ≤ 300 KB/file) hiển thị cá câu được,
thêm hiệu ứng chúc mừng khi nhận LOẠI CÁ MỚI, mạnh dần theo bậc hiếm (đọc js/world/fishing.js để biết bậc). (2) Sửa 4 test hỏng sẵn
(312, 318, 345, tutorial "chủ đề mới"). (3) Kiểm tra bằng mắt 2 nhà Tuscan/La Mã (hướng cửa, độ đẹp). Chỉ đọc file cần thiết, mỗi bước npm test,
đẩy GitHub, báo ptg, và cuối câu trả lời luôn đính kèm prompt bàn giao.
```
