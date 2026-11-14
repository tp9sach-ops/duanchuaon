# Dòng thời gian 30 chiêu (mili-giây, mốc 0 = lúc bấm nút)

Tạo tự động bằng `node tools/chieuThoiGian.mjs` từ thẻ chiêu (gồng, hậu động, tầm/tốc độ đạn), lịch tư thế (thời lượng khung phát) và `combatSkills.js` (hồi chiêu). Sửa số ở các file đó rồi chạy lại, không sửa tay file này.

Cảnh báo (vùng viền + hoa văn) hiện ngay từ mốc 0. Hủy gồng bằng di chuyển được đến hết gồng (mất 30% hồi chiêu). Cửa sổ né khoan dung 150 ms sau mốc "Trúng". "Đọc được" = thời gian từ lúc cảnh báo hiện tới lúc sát thương tính, so với ngưỡng Bản 2 (0,25 / 0,5 / 1,5 s) và ngưỡng prompt 3D (0,4 / 0,8 / 1,5 s); chiêu buff/có lợi không áp ngưỡng.

| Chiêu | Hệ | Gồng → Phát | Trúng | Hết hậu động | Hết hồi chiêu | Đọc được (Bản 2 / prompt 3D) |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Chiêu 1 · Kim Cương Trảm (`kim_1`) | Kim | 300 | 375 | 750 | 6000 | 375 ms: đạt / KHÔNG |
| Chiêu 1 · U Minh Linh Tiễn (`moc_1`) | Mộc | 250 | 986 | 700 | 5000 | 986 ms: đạt / đạt |
| Chiêu 1 · Huyền Băng Chưởng (`thuy_1`) | Thủy | 250 | 350 | 700 | 6000 | 350 ms: đạt / KHÔNG |
| Chiêu 1 · Liệt Hỏa Chưởng (`hoa_1`) | Hỏa | 250 | 794 | 700 | 7000 | 794 ms: đạt / đạt |
| Chiêu 1 · Địa Sách Chưởng (`tho_1`) | Thổ | 350 | 450 | 850 | 6000 | 450 ms: đạt / đạt |
| Chiêu 2 · Hộ Thân Cương Khí (`kim_2`) | Kim | 300 | 400 | 750 | 20000 | không áp (buff/có lợi) |
| Chiêu 2 · Ẩn Thân Thuật (`moc_2`) | Mộc | 200 | 300 | 650 | 12000 | không áp (buff/có lợi) |
| Chiêu 2 · Cam Lộ Hộ Thể (`thuy_2`) | Thủy | 300 | 400 | 750 | 25000 | không áp (buff/có lợi) |
| Chiêu 2 · Cuồng Long Phẫn Nộ (`hoa_2`) | Hỏa | 500 | 600 | 950 | 18000 | không áp (buff/có lợi) |
| Chiêu 2 · Đại Địa Chi Khiên (`tho_2`) | Thổ | 300 | 400 | 750 | 20000 | không áp (buff/có lợi) |
| Chiêu 3 · Thiết Kỵ Xung Trận (`kim_3`) | Kim | 500 | 675 | 1650 | 15000 | 675 ms: đạt / KHÔNG |
| Chiêu 3 · Vạn Hương Quy Tâm (`moc_3`) | Mộc | 500 | 600 | 1100 | 20000 | 600 ms: đạt / KHÔNG |
| Chiêu 3 · Băng Phong Thiên Lý (`thuy_3`) | Thủy | 1000 | 1100 | 1700 | 22000 | 1100 ms: đạt / đạt |
| Chiêu 3 · Hỏa Long Xuất Hải (`hoa_3`) | Hỏa | 500 | 600 | 1200 | 25000 | 600 ms: đạt / KHÔNG |
| Chiêu 3 · Hư Không Trận (`tho_3`) | Thổ | 600 | 700 | 1200 | 24000 | 700 ms: đạt / KHÔNG |
| Chiêu 4 · Bất Hoại Kim Thân (`kim_kimcang_4`) | Kim | 200 | 300 | 700 | 30000 | không áp (buff/có lợi) |
| Chiêu 4 · Phá Trận Trảm (`kim_thietky_4`) | Kim | 450 | 550 | 1050 | 14000 | 550 ms: đạt / đạt |
| Chiêu 4 · Mê Vụ Lan Tỏa (`moc_uminh_4`) | Mộc | 500 | 600 | 1000 | 16000 | 600 ms: đạt / KHÔNG |
| Chiêu 4 · Lạc Diệp Truy Phong (`moc_anthan_4`) | Mộc | 200 | 275 | 750 | 15000 | 275 ms: đạt / KHÔNG |
| Chiêu 4 · Thanh Tâm Chú (`thuy_camlo_4`) | Thủy | 500 | 600 | 1000 | 24000 | không áp (buff/có lợi) |
| Chiêu 4 · Hàn Băng Tỏa (`thuy_huyenbang_4`) | Thủy | 400 | 917 | 900 | 14000 | 917 ms: đạt / đạt |
| Chiêu 4 · Bạo Liệt Hỏa Vũ (`hoa_liethoa_4`) | Hỏa | 800 | 900 | 1500 | 20000 | 900 ms: đạt / đạt |
| Chiêu 4 · Long Tức Trảm (`hoa_hoalong_4`) | Hỏa | 2000 | 2200 | 2900 | 18000 | 2200 ms: đạt / đạt |
| Chiêu 4 · Thạch Giáp Trấn Phái (`tho_daidia_4`) | Thổ | 500 | 600 | 1000 | 28000 | không áp (buff/có lợi) |
| Chiêu 4 · Dẫn Lực Địa Mạch (`tho_hukhong_4`) | Thổ | 500 | 600 | 1000 | 22000 | 600 ms: đạt / KHÔNG |
| Tuyệt học · Kim Cang Phục Ma (`kim_tuyet`) | Kim | 1500 | 1700 | 2500 | 60000 | 1700 ms: đạt / đạt |
| Tuyệt học · Vạn Diệp Quy Tâm (`moc_tuyet`) | Mộc | 1500 | 1700 | 2500 | 60000 | 1700 ms: đạt / đạt |
| Tuyệt học · Cam Lộ Triều Âm (`thuy_tuyet`) | Thủy | 1800 | 2000 | 2800 | 60000 | không áp (buff/có lợi) |
| Tuyệt học · Liên Hoa Hỏa Thế (`hoa_tuyet`) | Hỏa | 1800 | 2000 | 2800 | 60000 | 2000 ms: đạt / đạt |
| Tuyệt học · Thái Sơn Áp Đỉnh (`tho_tuyet`) | Thổ | 1800 | 1950 | 2900 | 60000 | 1950 ms: đạt / đạt |
