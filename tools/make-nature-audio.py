#!/usr/bin/env python3
"""Tạo 3 vòng lặp âm thanh thiên nhiên cho web từ file gốc ptg gửi (Phiên 32).
   Mỗi file: mono, lọc bỏ tiếng ù trầm, chỉnh về cùng mức RMS, nối đầu-đuôi bằng crossfade để lặp không nghe thấy chỗ nối, mã hóa mp3 32 kHz.
   Chạy:  python3 tools/make-nature-audio.py <thư mục chứa 3 mp3 gốc>      (cần ffmpeg + numpy)"""
import subprocess, sys, os, numpy as np
SR = 32000
SRC = sys.argv[1] if len(sys.argv) > 1 else '.'
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'audio')
# (file gốc, file ra, giây bắt đầu, độ dài, lọc thông cao Hz, crossfade giây)
JOBS = [
    ('dragon-studio-frogs-croaking-329854.mp3', 'ech-nhai.mp3', 0, 0, 120, 2.0),
    ('audiopapkin-beautiful-birdsong-3-301866.mp3', 'chim-ngay.mp3', 20, 60, 120, 2.5),
    ('loswin23-birds-and-crickets-2-627567.mp3', 'de-dem.mp3', 0, 0, 250, 2.0),   # file gốc có 37% năng lượng dưới 150 Hz (tiếng ù) nên lọc cao hơn
]
TARGET_RMS_DB = -23.0
for src, dst, ss, dur, hp, cf in JOBS:
    cmd = ['ffmpeg', '-v', 'error'] + (['-ss', str(ss)] if ss else []) + (['-t', str(dur)] if dur else []) + \
          ['-i', os.path.join(SRC, src), '-ac', '1', '-ar', str(SR), '-af', f'highpass=f={hp}', '-f', 'f32le', '-']
    x = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32).copy()
    x *= 10 ** (TARGET_RMS_DB / 20) / np.sqrt(np.mean(x ** 2))
    pk = np.abs(x).max()
    if pk > 0.89: x *= 0.89 / pk                                  # chừa biên, không méo
    c = int(cf * SR); n = len(x)
    t = np.linspace(0, np.pi / 2, c, dtype=np.float32)            # crossfade công suất đều
    y = x[:n - c].copy(); y[:c] = x[:c] * np.sin(t) + x[n - c:] * np.cos(t)
    pcm = (np.clip(y, -1, 1) * 32767).astype('<i2').tobytes()
    p = subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-codec:a', 'libmp3lame', '-b:a', '56k', os.path.join(OUT, dst)], input=pcm, capture_output=True)
    assert p.returncode == 0, p.stderr
    print(dst, f'{len(y)/SR:.1f}s', f'{os.path.getsize(os.path.join(OUT, dst))/1024:.0f} KB', f'rms {20*np.log10(np.sqrt(np.mean(y**2))):.1f} dB')
