// GLTFLoader giả cho mô phỏng: không nạp được gì (chibiReady() giữ false → nhân vật dựng bằng khối).
export class GLTFLoader { load(url, ok, prog, err) { if (err) err(new Error('stub')); } parse() {} }
