# AAVA 3.0 pitch — voice-over script

Read: clean, warm, confident product-pitch narrator; unhurried (~2.6 words/s), no hype voice.
64 s at 120 bpm (1 beat = 0.5 s). The authoritative line list and slots are `LINES` in `audio/vo.py`; this table is the reading copy. Each line is placed so its first word lands on the beat in the
**slot** column; the slot end is the latest the line may run to. ~130 words total. Placed timings per line are written to `vo.json` by `audio/vo.py`.

Every claim is the product's own (docs/Product-Context.md §1–2, docs/UX-Principles.md).

| # | slot (beats → s) | line | on screen |
|---|------------------|------|-----------|
| 1 | u0–10.5 (0–5.25) | One small feature takes ten steps, eight tools, and hours of coordination. | "One small feature." → "Ten steps. Eight tools." + "Fifteen-plus context switches. Two to four hours." |
| 2 | u10.75–16.75 (5.4–8.4) | Most of it isn't judgment. It's busywork. | "Most of it is busywork." |
| 3 | u17–27.75 (8.5–13.9), read at 1.06× | Meet AAVA 3.0: an agentic assistant that starts the work before you do. | mark + "AAVA 3.0" on the drop; "An agentic assistant that starts the work before you do." |
| 4 | u28–39 (14–19.5) | It picks up your tickets and pulls context from the tools you already use. | home screen lands; "Work finds you." |
| 5 | u41–50 (20.5–25) | By the time you look, the work is built, tested, and ready for review. | the run zooms out to the live preview; "Ready before you are." |
| 5b | u50.75–59.75 (25.4–29.9) | Every step is on the record: what it read, what it built, what it checked. | run-progress dock lifts; rows light on read / built / checked; "Every step, on the record." |
| 5c | u60.25–80.5 (30.1–40.3) | On the right, the canvas holds the work itself. The live preview. The code. A terminal. Every change. And the whole run, mapped step by step. | canvas lifts out; tabs switch on each word: Overview → Browser → Code → Terminal → Changes → Execution activity; "The canvas." + lit list |
| 6 | u84–95.5 (42–47.75) | And when a decision is yours, it stops and asks. Never earlier. Never later. | validator gate; "It stops where you decide."; Approve press on "never later" |
| 7 | u101–108.5 (50.5–54.25) | Ten steps become a few. All in one place. | four real screens; "One place." |
| 8 | u113–121 (56.5–60.5) | AAVA does the heavy lifting. You make the decisions. | end card lockup + the same line as super; holds to 64 s |

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
