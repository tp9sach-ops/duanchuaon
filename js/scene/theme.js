// Giao diện cảnh: ban ngày (mặc định, như ảnh mẫu) hay ban đêm (thêm ?dem=1 vào địa chỉ trang).
export const DAY = typeof location === 'undefined' ? true : new URLSearchParams(location.search).get('dem') !== '1';
