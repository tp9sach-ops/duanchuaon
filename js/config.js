// Cấu hình phía client. Sửa apiUrl sau khi deploy Google Apps Script (Web App URL, kết thúc bằng /exec).
// Để chuỗi rỗng thì trang vẫn chạy bình thường, chỉ tắt phần lưu dữ liệu và AI.
export const CONFIG = {
  apiUrl: 'https://script.google.com/macros/s/AKfycbzCemlxz2X7Kcd6LuCWnWe732lcfUCZn-kn2XUBlY7iHJemGrwc4WFij0bAhHcZLnTFcQ/exec',
  apiTimeoutMs: 15000,
  apiRetries: 1,
};
