#!/usr/bin/env python3
"""Tạo KHO ÂM THANH chiêu thức (prompt chiêu thức 3D mục 5, mục 14 điểm 5) bằng tổng hợp thuần mã: không dùng mẫu thu sẵn của ai → không có bản quyền bên thứ ba.
   18 tiếng: mỗi Hệ có GỒNG (tăng dần cao độ/độ ồn, báo hiệu) + PHÁT (đỉnh nhọn 0–80 ms) + DƯ ÂM (0,5–1,5 s) = 15; cộng 3 tiếng TRÚNG theo chất liệu kẻ địch (da thịt, kim loại, đá).
   Chạy:  python3 tools/make-chieu-am.py        (cần ffmpeg + numpy; kết quả cố định, seed 9)
   Ra: assets/sfx/chieu/*.m4a (mono 44,1 kHz AAC 64 kbps, mỗi file ≤ 100 KB) và js/data/chieuAmKho.js (bảng tên file, độ dài, nguồn, giấy phép — TẠO TỰ ĐỘNG, đừng sửa tay).
   Các số (tần số, độ tắt) là TẠM, chờ nghe bằng tai rồi chỉnh ở đây và chạy lại."""
import os, subprocess, json, numpy as np

SR = 44100
rng = np.random.default_rng(9)
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'assets', 'sfx', 'chieu')
os.makedirs(OUT, exist_ok=True)

T = lambda d: np.arange(int(d * SR)) / SR
noise = lambda n: rng.standard_normal(n)
dec = lambda t, tau: np.exp(-t / tau)
ramp = lambda t, a, b: np.clip((t - a) / (b - a), 0, 1)


def lp(x, fc):
    """Lọc thông thấp một cực, cutoff fc (Hz) là số hoặc mảng theo thời gian."""
    fc = np.broadcast_to(np.asarray(fc, dtype=float), x.shape)
    a = 1 - np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x); s = 0.0
    for i in range(len(x)):
        s += a[i] * (x[i] - s); y[i] = s
    return y


def bp(x, lo, hi):
    return lp(x, hi) - lp(x, lo)


def hp(x, fc):
    return x - lp(x, fc)


def chirp(f):
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def partials(t, base, ratios, taus, amps=None):
    out = np.zeros_like(t)
    for i, r in enumerate(ratios):
        out += (amps[i] if amps else 1 / (1 + i)) * np.sin(2 * np.pi * base * r * t) * dec(t, taus[i] if hasattr(taus, '__len__') else taus / (1 + 0.6 * i))
    return out


def crackles(n, density, tau=0.004):
    """Lách tách: xung ngẫu nhiên, density = mảng xác suất mỗi mẫu."""
    p = np.broadcast_to(np.asarray(density, dtype=float), (n,))
    hit = (rng.random(n) < p) * rng.uniform(0.3, 1, n)
    k = np.exp(-np.arange(int(tau * SR * 6)) / (tau * SR))
    return np.convolve(hit, k)[:n] * noise(n)


def fit(x, peak=0.5):
    n = len(x); f = int(0.004 * SR)
    x = x.copy(); x[:f] *= np.linspace(0, 1, f); x[-f * 4:] *= np.linspace(1, 0, f * 4)
    return x / max(1e-9, np.abs(x).max()) * peak


# ---------------- GỒNG: tăng dần cao độ hoặc độ ồn ----------------
def kim_gong():
    t = T(1.0); f = 600 + 400 * t ** 2
    s = sum(a * np.sin(r * 2 * np.pi * np.cumsum(f) / SR) for r, a in [(1, 1), (2.76, 0.5), (5.4, 0.25)])
    return s * (t / 1.0) ** 1.5 * (0.8 + 0.2 * np.sin(2 * np.pi * 9 * t)) + 0.08 * hp(noise(len(t)), 5000) * ramp(t, 0.3, 1)

def moc_gong():
    t = T(0.9); n = len(t)
    leaf = bp(noise(n), 1200 + 600 * t, 1800 + 2200 * t) * (0.2 + 0.8 * ramp(t, 0, 0.9)) * 3
    creak = np.sin(2 * np.pi * np.cumsum(170 + 70 * t) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 14 * t)) * 0.4 * ramp(t, 0.1, 0.9)
    return leaf + creak

def thuy_gong():
    t = T(1.0); n = len(t); out = 0.5 * lp(noise(n), 500 + 900 * t) * ramp(t, 0, 1) ** 2
    for _ in range(16):
        p0 = 0.05 + 0.85 * rng.random() ** 0.6; f0 = rng.uniform(380, 800); tt = np.clip(t - p0, 0, None)
        out += 0.6 * (t >= p0) * np.sin(2 * np.pi * np.cumsum(f0 * (1 + 2.2 * tt)) / SR) * dec(tt, 0.05) * (0.4 + p0)
    return out

def tho_gong():
    t = T(1.0); n = len(t)
    return 2 * lp(noise(n), 140 + 200 * t) * (0.2 + 0.8 * ramp(t, 0, 1)) + np.sin(2 * np.pi * np.cumsum(55 + 22 * t) / SR) * (0.3 + 0.7 * ramp(t, 0, 1)) * (0.8 + 0.2 * np.sin(2 * np.pi * 6 * t))

def hoa_gong():
    t = T(1.0); n = len(t); sweep = 300 + 2500 * ramp(t, 0, 1) ** 1.5
    return 2.5 * bp(noise(n), sweep * 0.6, sweep * 1.4) * (0.1 + 0.9 * ramp(t, 0, 1) ** 1.5) + crackles(n, 0.0004 + 0.003 * ramp(t, 0.2, 1)) * 0.5

# ---------------- PHÁT: đỉnh nhọn ở 0–80 ms ----------------
def kim_phat():
    t = T(0.7); n = len(t)
    return partials(t, 880, [1, 2.76, 5.4, 8.93], [0.22, 0.14, 0.09, 0.05], [1, 0.7, 0.5, 0.35]) + 1.2 * hp(noise(n), 3000) * dec(t, 0.03)

def moc_phat():
    t = T(0.6); n = len(t); f = 4200 - 3400 * ramp(t, 0, 0.5)
    return 3 * bp(noise(n), f * 0.5, f) * dec(t, 0.16) * ramp(t, 0, 0.008) + 0.5 * chirp(1200 - 700 * ramp(t, 0, 0.4)) * dec(t, 0.12)

def thuy_phat():
    t = T(0.7); n = len(t)
    splash = lp(noise(n), 5000 * dec(t, 0.12) + 500) * dec(t, 0.1) * 2
    drop = chirp(1800 * dec(t, 0.15) + 280) * dec(t, 0.14) * 0.6
    crystal = sum(a * np.sin(2 * np.pi * f * t) * dec(t, 0.07) for f, a in [(3200, 0.3), (4100, 0.22), (5300, 0.15)])
    return splash + drop + crystal

def tho_phat():
    t = T(0.8); n = len(t)
    return 1.5 * chirp(38 + 62 * dec(t, 0.08)) * dec(t, 0.3) + 2 * lp(noise(n), 500) * dec(t, 0.08) + 0.6 * hp(noise(n), 2000) * dec(t, 0.004)

def hoa_phat():
    t = T(0.8); n = len(t); f = 5000 * dec(t, 0.2) + 500
    burst = 2.5 * lp(noise(n), f) * dec(t, 0.2) * ramp(t, 0, 0.006)
    eagle = 0.45 * chirp(2000 + 1400 * ramp(t, 0.05, 0.4) + 60 * np.sin(2 * np.pi * 25 * t)) * np.exp(-((t - 0.22) / 0.13) ** 2) * ramp(t, 0.05, 0.1)
    return burst + eagle + crackles(n, 0.0025 * dec(t, 0.4)) * 0.6

# ---------------- DƯ ÂM: ngân, vang, tan 0,5–1,5 s ----------------
def kim_duam():
    t = T(1.4)
    return (partials(t, 880, [1, 2.0, 2.76, 5.4], [0.55, 0.3, 0.3, 0.12], [1, 0.4, 0.5, 0.2]) + 0.8 * partials(t, 884, [1, 2.76], [0.5, 0.28], [1, 0.4])) * 0.6

def moc_duam():
    t = T(0.9); n = len(t); flutter = np.abs(lp(noise(n), 18)); flutter /= flutter.max()
    return 3 * bp(noise(n), 1800, 4200) * (0.25 + 0.75 * flutter) * dec(t, 0.35) * ramp(t, 0, 0.02)

def thuy_duam():
    t = T(1.1); n = len(t); out = 0.5 * bp(noise(n), 1200, 3200) * dec(t, 0.3) * 0.4
    for i in range(5):
        p0 = 0.08 * i; tt = np.clip(t - p0, 0, None); f0 = rng.uniform(300, 520)
        out += 0.5 * (t >= p0) * np.sin(2 * np.pi * np.cumsum(f0 * (1 - 0.2 * tt)) / SR) * dec(tt, 0.28) * (1 + 0.5 * np.sin(2 * np.pi * 5 * tt))
    return out

def tho_duam():
    t = T(1.3); n = len(t); out = 2.5 * lp(noise(n), 130) * dec(t, 0.5) + 0.8 * np.sin(2 * np.pi * 45 * t) * dec(t, 0.6)
    for p0 in (0.12, 0.35, 0.55, 0.8):   # đá lăn
        tt = np.clip(t - p0, 0, None); out += 0.9 * (t >= p0) * bp(noise(n), 200, 900) * dec(tt, 0.05) * rng.uniform(0.4, 1)
    return out

def hoa_duam():
    t = T(1.0); n = len(t)
    return crackles(n, 0.003 * dec(t, 0.35)) * 1.4 + 1.2 * lp(noise(n), 2500) * dec(t, 0.3) * 0.3

# ---------------- TRÚNG: theo chất liệu kẻ địch ----------------
def trung_dathit():
    t = T(0.3); n = len(t)
    return 1.2 * chirp(60 + 80 * dec(t, 0.04)) * dec(t, 0.08) + 1.5 * lp(noise(n), 900) * dec(t, 0.05)

def trung_kimloai():
    t = T(0.5); n = len(t)
    return partials(t, 600, [1, 2.4, 4.1, 6.3], [0.2, 0.13, 0.08, 0.05], [1, 0.8, 0.6, 0.4]) + 0.8 * hp(noise(n), 2500) * dec(t, 0.01)

def trung_da():
    t = T(0.4); n = len(t)
    return 2 * bp(noise(n), 600, 3200) * dec(t, 0.04) + chirp(110 + 110 * dec(t, 0.05)) * dec(t, 0.1) + 0.8 * bp(noise(n), 1500, 4000) * np.where((t > 0.07) & (t < 0.09) | (t > 0.13) & (t < 0.14), 1, 0) * dec(t, 0.15)


HE = {'kim': 'Kim', 'moc': 'Mộc', 'thuy': 'Thủy', 'tho': 'Thổ', 'hoa': 'Hỏa'}
FILES = []   # (id, hàm, loại, hệ|None, mô tả)
for he, ten in HE.items():
    FILES += [(f'{he}-gong', globals()[f'{he}_gong'], 'gong', he, f'{ten}: gồng, tăng dần cao độ/độ ồn để báo hiệu'),
              (f'{he}-phat', globals()[f'{he}_phat'], 'phat', he, f'{ten}: phát, bùng nổ có đỉnh nhọn 0–80 ms'),
              (f'{he}-duam', globals()[f'{he}_duam'], 'duam', he, f'{ten}: dư âm ngân, vang, tan dần')]
FILES += [('trung-dathit', trung_dathit, 'trung', None, 'Trúng da thịt (người, quái mềm)'),
          ('trung-kimloai', trung_kimloai, 'trung', None, 'Trúng kim loại (giáp, mộc nhân bọc sắt)'),
          ('trung-da', trung_da, 'trung', None, 'Trúng đá (quái đá, tượng, mộc nhân đá)')]

kho = {}
for id_, fn, loai, he, mota in FILES:
    x = fit(fn())
    pcm = (np.clip(x, -1, 1) * 32767).astype('<i2').tobytes()
    path = os.path.join(OUT, id_ + '.m4a')
    p = subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart', path], input=pcm, capture_output=True)
    assert p.returncode == 0, p.stderr
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path], capture_output=True, text=True, check=True).stdout)
    kho[id_] = {'file': f'assets/sfx/chieu/{id_}.m4a', 'giay': round(dur, 2), 'kb': round(os.path.getsize(path) / 1024, 1), 'loai': loai, 'he': he, 'mota': mota,
                'nguon': 'Tổng hợp bằng mã tools/make-chieu-am.py (numpy), không dùng mẫu thu sẵn', 'giayPhep': 'Tự tạo trong dự án, không có bản quyền bên thứ ba'}
    print(f'{id_:14s} {dur:4.2f}s {kho[id_]["kb"]:5.1f} KB')

js = ('// KHO ÂM THANH chiêu thức — TẠO TỰ ĐỘNG bởi tools/make-chieu-am.py (đừng sửa tay; sửa số trong tool rồi chạy lại). Luật dùng: js/world/chieuAm.js, test: tests/chieuam.test.mjs.\n'
      '// giay = độ dài đo bằng ffprobe; nguon/giayPhep = yêu cầu nộp kèm mỗi tiếng (prompt chiêu thức 3D mục 5).\n'
      'const deepFreeze = (o) => { if (o && typeof o === \'object\' && !Object.isFrozen(o)) { Object.freeze(o); for (const k of Object.keys(o)) deepFreeze(o[k]); } return o; };\n'
      'export const KHO_AM = deepFreeze(' + json.dumps(kho, ensure_ascii=False, indent=1) + ');\n')
open(os.path.join(ROOT, 'js', 'data', 'chieuAmKho.js'), 'w', encoding='utf8').write(js)
print('tổng', round(sum(v['kb'] for v in kho.values()), 1), 'KB,', len(kho), 'tiếng')
