#!/usr/bin/env python3
"""Sinh ảnh cho Đại Phật khắc vách đá (Phiên 83).

Đầu vào : assets/buddha.webp (ảnh Phật trong chánh điện, RGBA 560x900, nền trong suốt).
Đầu ra  : assets/daiphat-da.webp  — màu đá (đã khử màu vàng, thêm vân đá, rêu, vệt nước), kênh alpha = hình vòm của tấm vách.
          assets/daiphat-cao.webp — bản đồ độ cao xám (sáng = nhô), dùng cho displacementMap + bumpMap.
Khung ảnh: 1024 x 1280 px = 16 m x 20 m (64 px/m); tượng cao 15 m, đáy tượng cách đáy tấm 1 m; vòm: chữ nhật cao 12 m + nửa tròn bán kính 8 m.
Chạy lại: python3 tools/make-daiphat-da.py   (cần numpy + Pillow). Hằng số hình học phải khớp js/scene/daiphat.js (PANEL).
"""
import os
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1024, 1280
PPM = 64.0                       # px / m
rng = np.random.default_rng(83)


def blur(a, r):
    im = Image.fromarray(np.uint8(np.clip(a, 0, 1) * 255))
    return np.asarray(im.filter(ImageFilter.GaussianBlur(r)), dtype=np.float32) / 255.0


def fbm(scales=(160, 80, 40, 20, 10, 5), weights=(1, .8, .6, .45, .3, .2)):
    out = np.zeros((H, W), np.float32)
    for s, w in zip(scales, weights):
        n = rng.random((H, W)).astype(np.float32)
        n = blur(n, s / 2.2)
        n = (n - n.min()) / max(1e-6, n.max() - n.min())
        out += n * w
    out /= sum(weights)
    return (out - out.min()) / (out.max() - out.min())


# ---- hình vòm (alpha của tấm vách)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
mx = (xx - W / 2) / PPM                  # m, 0 = giữa tấm
my = (H - yy) / PPM                      # m, 0 = đáy tấm
R = 8.0
arch_top = 12.0
inside = (np.abs(mx) <= R) & (my >= 0) & ((my <= arch_top) | ((mx ** 2 + (my - arch_top) ** 2) <= R * R))
# khoảng cách tới mép (m) để làm gờ viền
edge = np.where(inside, 1e3, 0).astype(np.float32)
d_side = R - np.abs(mx)
d_top = np.sqrt(np.maximum(R * R - 0, 0)) - np.sqrt(mx ** 2 + (my - arch_top) ** 2)
dist = np.where(my > arch_top, d_top, np.minimum(d_side, my + 1e3))
dist = np.where(inside, dist, 0).astype(np.float32)

# ---- Phật: đặt vào khung (cao 15 m, đáy cách đáy tấm 1 m)
src = Image.open(os.path.join(ROOT, 'assets', 'buddha.webp')).convert('RGBA')
fig_h_px = int(15.0 * PPM)
fig_w_px = int(round(src.width * fig_h_px / src.height))
src = src.resize((fig_w_px, fig_h_px), Image.LANCZOS)
canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
canvas.alpha_composite(src, ((W - fig_w_px) // 2, H - int(1.0 * PPM) - fig_h_px))
fig = np.asarray(canvas, dtype=np.float32) / 255.0
a_fig = fig[..., 3]
lum = (0.299 * fig[..., 0] + 0.587 * fig[..., 1] + 0.114 * fig[..., 2])
lum = np.where(a_fig > 0.05, lum, 0)
# chuẩn hoá độ sáng chi tiết (chỉ trong hình)
m = a_fig > 0.5
lo, hi = np.percentile(lum[m], [3, 97])
detail = np.clip((lum - lo) / (hi - lo), 0, 1) * (a_fig > 0.05)

# ---- bản đồ độ cao: mặt vách phẳng 0.30; gờ viền nhô; tượng nhô 0.30 -> 0.95 theo chi tiết; hơi mềm hoá mép tượng
rock = fbm()
base = 0.30 + 0.05 * (rock - 0.5)
rim = np.clip(1 - np.abs(dist - 0.55) / 0.45, 0, 1) * 0.22          # gờ nhô quanh viền, rộng ~0.5 m
a_soft = blur(a_fig, 1.6)
relief = a_soft * (0.30 + 0.28 * blur(detail, 0.8) + 0.12 * detail)   # thân nhô + chi tiết chạm
height = base + rim + relief
# vết đục thô quanh tượng (đá bị đẽo): nhiễu nhỏ trong vùng nền
chisel = fbm((20, 10, 5, 3), (1, .8, .6, .4)) - 0.5
height += chisel * 0.045 * (1 - a_soft)
height = np.where(inside, height, 0)
height = np.clip(height, 0, 1)

# ---- màu đá: xám ấm, biến thiên theo nhiễu; tượng tối/sáng theo chi tiết (nhấn khe sâu)
tone = fbm((200, 100, 50, 25, 12, 6), (1, .9, .7, .5, .35, .25))
stone_lo = np.array([0.50, 0.47, 0.42], np.float32)
stone_hi = np.array([0.83, 0.79, 0.71], np.float32)
col = stone_lo + (stone_hi - stone_lo) * tone[..., None]
# khe sâu (ảnh gốc tối) -> đá tối hơn; chỗ nhô sáng -> đá sáng hơn
ao = 0.62 + 0.62 * blur(detail, 0.6)[..., None]
col = np.where((a_soft > 0.1)[..., None], col * (0.55 + 0.6 * (a_soft[..., None] * ao)), col)
# vệt nước chảy dọc (dải sẫm mảnh, mạnh ở phần trên)
streak = blur(np.tile(rng.random((1, W)).astype(np.float32), (H, 1)), 3.0)
streak = (streak - streak.min()) / (streak.max() - streak.min())
streak = np.clip((streak - 0.55) * 3, 0, 1) * blur(fbm((120, 60), (1, .6)), 12) * (0.4 + 0.6 * (1 - my / 20.0 ).clip(0, 1))
col *= (1 - 0.13 * streak[..., None])
# hạt đá mịn + vết nứt/đốm lớn cho nền bớt phẳng
grain = fbm((3, 2), (1, .8)) - 0.5
col *= (1 + 0.16 * grain[..., None])
crack = np.clip(1 - np.abs(fbm((90, 45, 22), (1, .7, .5)) - 0.5) * 22, 0, 1) ** 2
col *= (1 - 0.12 * crack[..., None] * (1 - a_soft[..., None]))
# rêu xanh xám ở chân tấm và rải rác trong khe
mossmask = np.clip((1.6 - my) / 1.6, 0, 1) * fbm((40, 20, 10), (1, .7, .5)) + 0.22 * np.clip(fbm((30, 15, 7), (1, .8, .6)) - 0.62, 0, 1) * (1 - a_soft)
mossmask = np.clip(mossmask * 1.3, 0, 1)
moss_col = np.array([0.33, 0.40, 0.26], np.float32)
col = col * (1 - 0.55 * mossmask[..., None]) + moss_col * 0.55 * mossmask[..., None]
# gờ viền sáng hơn một chút (mặt đá được mài)
col += rim[..., None] * 0.35
col = np.clip(col, 0, 1)

alpha = np.where(inside, 1.0, 0.0).astype(np.float32)
# alpha cho phép mép vòm hơi lởm chởm (đá đẽo): dịch mép bằng nhiễu
jag = (fbm((12, 6, 3), (1, .8, .6)) - 0.5) * 0.10
alpha = np.where(inside & (dist > 0.04 + jag * 3), 1.0, 0.0).astype(np.float32)

rgba = np.dstack([col, alpha])
Image.fromarray(np.uint8(np.clip(rgba, 0, 1) * 255), 'RGBA').save(os.path.join(ROOT, 'assets', 'daiphat-da.webp'), quality=88, method=6)
Image.fromarray(np.uint8(np.clip(height, 0, 1) * 255), 'L').save(os.path.join(ROOT, 'assets', 'daiphat-cao.webp'), quality=92, method=6)
print('OK', W, H)
