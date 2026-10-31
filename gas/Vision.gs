/**
 * Giai đoạn 7 — Chỉ tay / Nhân tướng bằng AI nhìn ảnh (Anthropic Messages API).
 *
 * CẤU HÌNH (Apps Script → Project Settings → Script properties):
 *   ANTHROPIC_API_KEY = khóa của bạn   (BẮT BUỘC, không bao giờ để trong code hay ở client)
 *   VISION_MODEL      = claude-sonnet-5-5  (tùy chọn)
 *
 * Quy tắc riêng tư: ảnh chỉ đi qua hàm này để gọi API rồi bỏ; KHÔNG ghi vào Sheet, Drive hay Logs.
 * Chỉ phân tích ảnh của chính người dùng (client bắt tick đồng ý). Không suy đoán danh tính, sức khỏe, sắc tộc.
 */
var VISION_MAX_BASE64 = 1500000;   // ~1,1 MB ảnh sau khi client thu nhỏ

var VISION_PROMPTS_ = {
  hand: 'Đây là ảnh lòng bàn tay do chính người dùng chụp để giải trí và chiêm nghiệm văn hóa. ' +
        'Hãy mô tả những gì NHÌN THẤY RÕ: đường Sinh mệnh, Trí tuệ, Tâm đạo, Sự nghiệp, Hôn nhân (nếu thấy), các gò chính, hình dạng bàn tay (Hỏa/Thổ/Khí/Thủy). ' +
        'Nếu ảnh mờ hoặc không phải lòng bàn tay, đặt "chatLuongAnh" là "kem" và nói rõ. Không đưa kết luận về sức khỏe, bệnh tật hay tuổi thọ. Giọng khiêm tốn, mang tính tham khảo.',
  face: 'Đây là ảnh khuôn mặt do chính người dùng chụp để giải trí và chiêm nghiệm văn hóa (nhân tướng học). ' +
        'Chỉ nhận xét các nét hình thể nhìn thấy: Tam đình (thượng, trung, hạ), trán, lông mày, mắt, mũi, miệng, cằm theo cách nói của nhân tướng học. ' +
        'Không nhận diện người, không đoán tuổi, sắc tộc, giới tính, bệnh tật hay tính cách cố định. Nếu ảnh không có khuôn mặt hoặc quá mờ, đặt "chatLuongAnh" là "kem". Giọng khiêm tốn, mang tính tham khảo.'
};

var VISION_SCHEMA_ = ' Chỉ trả về MỘT đối tượng JSON, không kèm chữ nào khác, đúng dạng: ' +
  '{"chatLuongAnh":"tot|vua|kem","tongQuan":"1-2 câu","muc":[{"ten":"tên đường/bộ phận","quanSat":"điều nhìn thấy","y":"ý nghĩa truyền thống, 1-2 câu"}],"loiKhuyen":["tối đa 3 câu"],"luuY":"1 câu nhắc đây chỉ để tham khảo"}';

function analyzeImage_(req, kind) {
  var key = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!key) return { ok: false, error: 'vision_not_configured' };
  var b64 = String(req.image || '');
  if (!b64) return { ok: false, error: 'no_image' };
  if (b64.length > VISION_MAX_BASE64) return { ok: false, error: 'image_too_large' };
  if (req.consent !== true) return { ok: false, error: 'consent_required' };
  var model = PropertiesService.getScriptProperties().getProperty('VISION_MODEL') || 'claude-sonnet-5-5';
  var body = {
    model: model, max_tokens: 1200,
    messages: [{ role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } },
      { type: 'text', text: VISION_PROMPTS_[kind] + VISION_SCHEMA_ }
    ] }]
  };
  var res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' }, payload: JSON.stringify(body)
  });
  var code = res.getResponseCode();
  if (code !== 200) return { ok: false, error: 'vision_http_' + code };   // không ghi thân phản hồi để tránh lộ nội dung
  var text = '';
  try { text = JSON.parse(res.getContentText()).content[0].text; } catch (e) { return { ok: false, error: 'vision_bad_response' }; }
  var m = text.match(/\{[\s\S]*\}/);
  if (!m) return { ok: false, error: 'vision_bad_json' };
  try { return { ok: true, kind: kind, result: JSON.parse(m[0]) }; } catch (e2) { return { ok: false, error: 'vision_bad_json' }; }
}
