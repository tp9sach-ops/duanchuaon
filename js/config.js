// Cấu hình phía client. Sửa apiUrl sau khi deploy Google Apps Script (Web App URL, kết thúc bằng /exec).
// Để chuỗi rỗng thì trang vẫn chạy bình thường, chỉ tắt phần lưu dữ liệu và AI.
export const CONFIG = {
  apiUrl: 'https://script.google.com/macros/s/AKfycbzCemlxz2X7Kcd6LuCWnWe732lcfUCZn-kn2XUBlY7iHJemGrwc4WFij0bAhHcZLnTFcQ/exec',
  apiTimeoutMs: 15000,
  apiRetries: 1,
  // Đa người: thử lần lượt từ trên xuống; không vào được / đầy người / mất kết nối thì chuyển sang nơi kế. Dòng 'gas' là phương án cuối.
  // Thêm Firebase khác: chép thêm một khối { type: 'firebase', name: '...', firebaseConfig: {...} } lên trên dòng 'gas'.
  // (Khóa Firebase phía web là thông tin công khai; an toàn do luật trong firebase/database.rules.json.)
  firebaseSdkVersion: '11.0.2',
  rooms: [
    {
      type: 'firebase', name: 'Chùa 1',
      firebaseConfig: {
        apiKey: 'AIzaSyBsaYui0RykyjtA3gJXB8hB4J0IB8LZqcY',
        authDomain: 'chuaonline-1fe41.firebaseapp.com',
        databaseURL: 'https://chuaonline-1fe41-default-rtdb.asia-southeast1.firebasedatabase.app',
        projectId: 'chuaonline-1fe41',
        appId: '1:90102053435:web:97640a5bbb3ebb50d9fa1e',
      },
    },
    { type: 'gas', name: 'Dự phòng' },
  ],
};
