// Phiên 138 (mục 1): kinh nghiệm CẤP ĐỘ (công hạnh — thanh "Cấp" ở thẻ nhân vật, cộng bằng LGT.addXp) khi phóng sinh. LOGIC THUẦN (không DOM), có test: tests/xpthuong.test.mjs.
// Kinh nghiệm khi thu phục quái nằm ở killXp (js/world/farm.js); yêu quái hằng tháng: rewardFor (js/world/yeuquai.js). Mọi con số là QUY ƯỚC TẠM, chờ ptg duyệt.
import { speciesById } from './fishing.js';

/** Kinh nghiệm mỗi lần phóng sinh: cơ bản + thêm nếu loài hiếm + thêm nếu cỡ lớn (2..5). */
export const RELEASE_XP = Object.freeze({ base: 2, hiem: 2, lon: 1 });

/**
 * Kinh nghiệm cấp độ cho MỘT lần phóng sinh con `fish` ({ sp, lon }). Mỗi lần thả đều có, KỂ CẢ khi hôm nay đã hết trần hạt sen (trần đó chỉ áp cho hạt sen).
 * Loài lạ / đầu vào hỏng → 0.
 */
export function releaseXp(fish) {
  const sp = fish && speciesById(fish.sp); if (!sp) return 0;
  return RELEASE_XP.base + (sp.hiem ? RELEASE_XP.hiem : 0) + (fish.lon === true ? RELEASE_XP.lon : 0);
}
