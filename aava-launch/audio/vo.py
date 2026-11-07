"""Pitch voice-over: synthesize each script line, then place it on its beat slot. -> audio/vo.wav

    <venv with kokoro-onnx>/python aava-launch/audio/vo.py <kokoro-v1.0.onnx> <voices-v1.0.bin> [--voice am_michael]

Kokoro-82M (Apache-2.0), run offline through kokoro-onnx. Lines and slots mirror docs/vo_script.md;
the TTS text spells AAVA phonetically ("Aava", said AH-vah) and "3.0" as "three point oh".
Each take is trimmed at its own silence (-45 dB), lightly cleaned (80 Hz high-pass, soft
compression) and placed so its first syllable lands on the slot's beat. Writes:
  audio/vo.wav          48 kHz mono, peak -3 dBFS (mix.mjs ducks the music under it and masters)
  audio/vo_takes/*.wav  the raw takes (not committed)
  vo.json               placed lines: start/end seconds + beats, for the film's supers
"""

import argparse
import json
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

FILM = Path(__file__).resolve().parent.parent
SR_OUT = 48000

# (slot start beat, slot end beat, text spoken, text on paper[, speed])
LINES = [
    (0.0, 10.5, "One small feature takes ten steps, eight tools, and hours of coordination.", None),
    (10.75, 16.75, "Most of it isn't judgment. It's busywork.", None),
    (17.0, 27.75, "Meet Aava three point oh: an agentic assistant that starts the work before you do.",
     "Meet AAVA 3.0: an agentic assistant that starts the work before you do.", 1.06),
    (28.0, 39.0, "It picks up your tickets, and pulls context from the tools you already use.", None),
    (41.0, 52.0, "By the time you look, the work is built, tested, and ready for review.", None),
    (55.0, 66.0, "And when a decision is yours, it stops, and asks. Never earlier. Never later.", None),
    (70.0, 77.0, "Ten steps become a few. All in one place.", None),
    (81.0, 88.0, "Aava does the heavy lifting. You make the decisions.",
     "AAVA does the heavy lifting. You make the decisions."),
]


def trim(x, sr, db=-45.0, pad=0.02):
    env = np.convolve(np.abs(x), np.ones(int(0.01 * sr)) / int(0.01 * sr), mode="same")
    on = np.where(env > 10 ** (db / 20) * np.abs(x).max())[0]
    a, b = max(0, on[0] - int(pad * sr)), min(len(x), on[-1] + int(pad * sr))
    return x[a:b]


def clean(x, sr):
    # one-pole high-pass at 80 Hz, then a gentle soft-knee compressor on a 10 ms envelope
    a = np.exp(-2 * np.pi * 80 / sr)
    y = np.empty_like(x); prev_x = prev_y = 0.0
    for i, v in enumerate(x):
        prev_y = a * (prev_y + v - prev_x); prev_x = v; y[i] = prev_y
    env = np.sqrt(np.convolve(y ** 2, np.ones(int(0.01 * sr)) / int(0.01 * sr), mode="same")) + 1e-9
    thr = 0.25 * env.max()
    gain = np.where(env > thr, (thr + (env - thr) / 2.5) / env, 1.0)
    return y * gain


def resample(x, sr_in, sr_out):
    n = int(round(len(x) * sr_out / sr_in))
    return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("model"); ap.add_argument("voices")
    ap.add_argument("--voice", default="am_michael")
    ap.add_argument("--speed", type=float, default=1.0)
    a = ap.parse_args()
    grid = json.loads((FILM / "beats.json").read_text())
    dur = float(json.loads((FILM / "film.json").read_text())["duration"])
    T = lambda u: grid["offset"] + u * grid["period"]
    tts = Kokoro(a.model, a.voices)
    takes = FILM / "audio" / "vo_takes"; takes.mkdir(exist_ok=True)
    out = np.zeros(int(dur * SR_OUT) + SR_OUT)
    placed, prev_end = [], 0.0
    for i, (u0, u1, said, shown, *sp) in enumerate(LINES):
        x, sr = tts.create(said, voice=a.voice, speed=a.speed * (sp[0] if sp else 1.0), lang="en-us")
        x = np.asarray(x, dtype=np.float64)
        sf.write(takes / f"{i + 1:02d}.wav", x, sr)
        x = resample(clean(trim(x, sr), sr), sr, SR_OUT)
        t0 = T(u0); t1 = t0 + len(x) / SR_OUT
        s = int(t0 * SR_OUT); out[s:s + len(x)] += x
        over = t1 - T(u1)
        print(f"{i + 1}  u{u0:>5}  {t0:6.2f}-{t1:6.2f}s  ({len(x) / SR_OUT:4.2f}s, slot ends {T(u1):6.2f}s"
              f"{', OVER by %.2fs' % over if over > 0 else ''}{', OVERLAPS previous' if t0 < prev_end else ''})  {said}")
        placed.append({"line": i + 1, "text": shown or said, "start": round(t0, 3), "end": round(t1, 3),
                       "u0": u0, "u_end": round((t1 - grid["offset"]) / grid["period"], 2)})
        prev_end = t1
    out = out[: int(dur * SR_OUT)]
    out *= 10 ** (-3 / 20) / (np.abs(out).max() + 1e-9)
    sf.write(FILM / "audio" / "vo.wav", out.astype(np.float32), SR_OUT)
    (FILM / "vo.json").write_text(json.dumps({"voice": f"kokoro-82M {a.voice} x{a.speed}", "lines": placed}, indent=1) + "\n")
    print(f"-> {FILM.name}/audio/vo.wav, {FILM.name}/vo.json")


if __name__ == "__main__":
    main()
