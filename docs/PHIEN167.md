# PHIÊN 167 — Bàn giao (prompt "chiêu thức 3D chuyên nghiệp": mục 1 — dòng thời gian mili-giây 30 chiêu)

> Dán nguyên file này vào đầu phiên mới. Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh `main`). Người dùng (ptg) nói tiếng Việt, không rành kỹ thuật: trả lời NGẮN GỌN, DỄ HIỂU. Đọc thêm `docs/PHIEN163.md`, `PHIEN165.md`.

## Quy tắc làm việc (chép nguyên văn)
"For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff."
- Làm từng mục, xong chạy test, đẩy `main`, báo, chờ "tiếp tục". Việc đã làm thì bỏ qua. Chỉ đọc chỗ cần sửa. Không báo test đạt nếu chưa chạy. Khi sửa code: đưa đoạn "tìm" đầy đủ rồi code thay thế đầy đủ.

## Cách đánh số mục của prompt mới
Prompt "Prompt thiết kế chiêu thức 3D chuyên nghiệp – Diệu Giang Tự" (ptg gửi 14/11) có danh sách "Nộp theo thứ tự" ở mục 14. Phiên này coi đó là mục 1–11:
1. Thẻ chiêu đầy đủ kèm **dòng thời gian mili-giây** — **XONG phiên này** (chỉ phần dòng thời gian; thẻ chiêu đã có từ Phiên 157/158).
2. Bảng màu + phác thảo hình — chưa. (Màu theo Hệ đã có trong `js/data/chieuFx.js`, Phiên 165.)
3. Hoạt ảnh nhân vật (4 khung + clip) — **đã có phần mã** ở Phiên 159/163 (`chieuPose.js`, 3 khung gồng/phát/thu); thiếu khung "trúng" và "hồi", thiếu theo đà (áo/đai bay), chưa có clip.
4. VFX theo lớp + số hạt + bản giảm — **đã có phần mã** ở Phiên 165 (`chieuFx.js`, `chieuFxPlan.js`, `scene/chieuFx.js`); thiếu 6 lớp theo prompt (lõi sáng, ribbon trail, decal nền, tàn dư) và rung/khựng đòn chưa nối camera.
5. Kho âm thanh + giấy phép — chưa (mới dùng lại 15 file cũ).
6. Hoạt ảnh trúng đòn + trạng thái kẻ địch (mục 7 prompt) — chưa.
7. Clip 5 giây ở ba cảnh — cần mắt người, AI không làm được.
8. File JSON số liệu — chưa (hiện là file `.js` trong `js/data/`).
9. Điều khiển + camera (mục 10, 10A Khinh Thân cấp 8, mục 11) — chưa. Phiên 164 đã làm phím chung cho Võ đài.
10. 12 combo mẫu + 5 tình huống khắc chế — chưa.
11. Báo cáo cân bằng — chưa.
Phiên 165 (hiệu ứng) và 166 (đồng bộ vật phẩm đa người) là của các phiên chat khác chạy song song; mình không đụng.

## Mục 1 — làm gì
- `js/world/chieuTimeline.js` (logic thuần): `dongThoiGian(id)` → mốc mili-giây từ lúc bấm: bấm 0, gồng 0, cảnh báo hiện 0, hủy được đến hết gồng, phát, trúng (giữa khung phát + thời gian đạn bay nếu thẻ có `tam` và `tocDo`), hết hậu động, hết hồi chiêu; `cuaSoNeDen` = trúng + 150 ms. `kiemDocDuoc(id)` so thời gian báo trước với hai bộ ngưỡng. `bangDongThoiGian()`, `hangThoiGian(tl)`. KHÔNG có số mới: mọi mốc lấy từ thẻ chiêu, lịch tư thế và `combatSkills.js`.
- `tests/chieuthoigian.test.mjs` (7 test) — **chưa đăng ký vào `npm test` nếu dòng này còn nằm ngoài package.json: kiểm tra**.
- `tools/chieuThoiGian.mjs` in bảng ra `docs/CHIEU_THOI_GIAN.md` (30 chiêu).

## Điều cần ptg quyết (số trong mã giữ nguyên, chưa đổi)
Prompt mới đòi báo trước tối thiểu **0,4 s** (chiêu thường) và **0,8 s** (diện rộng); Bản 2 và mã hiện dùng **0,25 s / 0,5 s**. Theo ngưỡng mới có **9 chiêu gây hại không đạt**: Kim Cương Trảm (375 ms), Huyền Băng Chưởng (350), Thiết Kỵ Xung Trận (675), Vạn Hương Quy Tâm (600), Hỏa Long Xuất Hải (600), Hư Không Trận (700), Mê Vụ Lan Tỏa (600), Lạc Diệp Truy Phong (275), Dẫn Lực Địa Mạch (600). Tất cả đều đạt ngưỡng Bản 2. Hỏi ptg: giữ Bản 2, hay kéo dài gồng của 9 chiêu này cho đạt ngưỡng mới (sửa `gong` trong `js/data/chieuNguHanh.js`, `chieuHoa.js`, rồi chạy lại `node tools/chieuThoiGian.mjs > docs/CHIEU_THOI_GIAN.md`).

## Chưa làm / lưu ý
- **Chưa chạy `npm test` trên repo thật** (phiên này không có mạng để clone). 7 test mới chạy ở bản sao cục bộ: thẻ chiêu của Kim/Mộc/Thủy/Thổ khớp SHA `769c4e8` trên main, `combatSkills.js` khớp SHA `4ddc627`; thẻ 6 chiêu Hỏa chép từ Phiên 157 (chưa đối chiếu SHA). Phiên sau: clone, chạy `npm test`, tạo lại `docs/CHIEU_THOI_GIAN.md` bằng tool để chắc số khớp mã thật.
- `thuy_1` có `tam` nhưng không có `tocDo` nên không tính thời gian đạn bay (trúng = 350 ms). Nếu thêm `tocDo` thì mốc trúng tăng.
- Dòng "Đọc được" xếp chiêu vào nhóm diện rộng khi vòng bán kính ≥ 4 m hoặc đường rộng ≥ 20 m²; đây là quy ước của mình, prompt không nêu số.
- Chưa nối vào giao diện (bảng giữ-để-xem `js/ui/heSkill.js`/`chieuInfo.js` chưa hiện dòng thời gian).

## Việc tiếp theo
Mục 2 của danh sách trên, hoặc theo ptg: hỏi ptg nên làm mục nào trước (gợi ý: mục 6 phản ứng kẻ địch, vì mọi chiêu đều cần).

## Prompt bàn giao (dán vào phiên mới)
Bạn tiếp tục dự án Diệu Giang Tự (https://github.com/tp9sach-ops/duanchuaon, nhánh main). Quy tắc: For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff. Đọc docs/PHIEN167.md, clone repo, chạy `npm test`. Hỏi ptg quyết chuyện ngưỡng báo trước 0,4/0,8 s, rồi làm mục tiếp theo của prompt chiêu thức 3D. Xong thì chạy test, viết docs/PHIEN168.md, đẩy main, báo ptg và chờ "tiếp tục".
