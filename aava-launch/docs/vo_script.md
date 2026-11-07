# AAVA 3.0 pitch — voice-over script

Read: clean, warm, confident product-pitch narrator; unhurried (~2.6 words/s), no hype voice.
48 s at 120 bpm (1 beat = 0.5 s). Each line is placed so its first word lands on the beat in the
**slot** column; the slot end is the latest the line may run to. 92 words total. Placed timings per line are written to `vo.json` by `audio/vo.py`.

Every claim is the product's own (docs/Product-Context.md §1–2, docs/UX-Principles.md).

| # | slot (beats → s) | line | on screen |
|---|------------------|------|-----------|
| 1 | u0–10.5 (0–5.25) | One small feature takes ten steps, eight tools, and hours of coordination. | "One small feature." → "Ten steps. Eight tools." + "Fifteen-plus context switches. Two to four hours." |
| 2 | u10.75–16.75 (5.4–8.4) | Most of it isn't judgment. It's busywork. | "Most of it is busywork." |
| 3 | u17–27.75 (8.5–13.9), read at 1.06× | Meet AAVA 3.0: an agentic assistant that starts the work before you do. | mark + "AAVA 3.0" on the drop; "An agentic assistant that starts the work before you do." |
| 4 | u28–39 (14–19.5) | It picks up your tickets and pulls context from the tools you already use. | home screen lands; "Work finds you." |
| 5 | u41–52 (20.5–26) | By the time you look, the work is built, tested, and ready for review. | the run: live preview, review gate lifts, "Ready before you are." |
| 6 | u55–66 (27.5–33) | And when a decision is yours, it stops and asks. Never earlier. Never later. | validator gate; "It stops where you decide."; Approve press on "never later" |
| 7 | u70–77 (35–38.5) | Ten steps become a few. All in one place. | four real screens; "One place." |
| 8 | u81–88 (40.5–44) | AAVA does the heavy lifting. You make the decisions. | end card lockup + the same line as super; holds to 48 s |

**Pronunciation:** "AAVA" is said as one word, "AH-vah" (not spelled out); "3.0" as "three point oh".
Change this note if the product is said differently. TTS engines need it written phonetically
("Aava three point oh").

## How the read is made
Kokoro-82M (open-weight, Apache-2.0) run offline through `kokoro-onnx`, voice `am_michael` (warm US
male). `audio/vo.py` synthesizes each line, trims it at its own silence, applies a light high-pass and
soft compression, and places its first syllable on the slot's beat -> `audio/vo.wav` + `vo.json`.

    uv venv .venv && uv pip install --python .venv/bin/python kokoro-onnx soundfile numpy
    # model files: github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
    .venv/bin/python aava-launch/audio/vo.py kokoro-v1.0.onnx voices-v1.0.bin --voice am_michael

To swap in a human recording later: replace `audio/vo.wav` with the placed read (same slots) and
re-run the motion-reel `mix.mjs`.
