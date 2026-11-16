# Phiên 204 — Mục 1 khinh công (bay lướt / đạp gió)

## Đã làm (bàn giao)
- **Lỗi "lúc ngã trước lúc ngã sau"**: nguyên nhân là thứ tự Euler mặc định 'XYZ' (chúi quanh trục thế giới). Đã đặt `group.rotation.order = 'YXZ'` ở `avatarChibi.js` + `avatar.js` → luôn ngã về PHÍA TRƯỚC theo hướng mặt. Chúi quanh HÔNG (`glide.pivotShift`, áp ở `world.js` khối fly) → chân kéo ra sau, không cắm đất. `FLY_CFG.tilt` 0,38 → 0,62.
- **Tư thế bay** (`avatarLogic.poseFor('glide')`, `chibiRig`): chân trái co gối (`kneeL`), chân phải duỗi ra sau (`legR`), tay trái chỉ tới trước, tay phải vuốt ra sau, đầu ngẩng. Thêm khóa pose `kneeL/kneeR`.
- **Mỗi lần bấm Nhảy trên không = một cú đạp gió**: lướt thêm ≈ 4 + 1×bậc (m) (`boostDist`, `boostVb`, `plan.vb`, `FLY_CFG.boostTau`). Hoạt ảnh chân phải đạp: `flyPose.kickPose` (act `dapgio`).
- **Vệt gió trắng**: `js/scene/windFx.js` (+ `windFxMath.js`): vệt sau lưng khi bay, vòng sóng + vệt dày khi đạp.
- **Âm thanh** (tổng hợp WebAudio, không cần file): `sfx.gust('bay'|'dap')`, `windStart/windSet/windStop` — vút khi bắt đầu lướt, xì-thịch khi đạp, gió nền theo tốc độ.
- Test: `tests/flypose.test.mjs` (đăng ký trong npm test), cập nhật `glide`/`charge`. npm test 1370/1370. sw → dgt-v199.

## CHƯA làm / cần ptg báo cụ thể
- "Đứng trên kiến trúc bị lún": KHÔNG đụng `standOn.js` (Phiên 202 đã sửa, phiên khác đang chỉnh). Cần biết vật nào + lún bao nhiêu để chỉnh `top`.
- Âm lượng/màu vệt/độ nghiêng là số tạm (FLY_CFG, WIND_SND, WIND_FX).
- Mục 2 (đánh thường lao tới + combo 3) chưa làm trong phiên này.
