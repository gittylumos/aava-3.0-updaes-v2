# Critique log

## Round 1
| hook | read | motion | variety | brand | sync | min |
|  7   |  8   |   6    |    8    |   9   |  8   |  6  |

Worst three (most damaging first):
1. [u5.3–8, 16x9] The home screen arrives too early (outCubic front-loads it: 86% there by u6.6) and
   flies across "steps." / "tools." while they are still readable -> the drop at u8 has no landing and
   the headline is stepped on -> sceneHome: late-landing ease `E.bezier(.35,0,.2,1)` over u5.7–8 so it
   settles exactly on the drop; headline out moved to u5.2 so it has defocused before the pane crosses.
2. [u0–1] Frame 0 is one word on a near-empty ground -> weak hook -> "Ten" starts further in (u0 = 75%
   resolved) and the aurora field opens brighter (amt 1.45 -> 1 by u8) so the first frame has colour.
3. [u52–60] End card lockup reads small on the phone page (mark 168 px, tagline 64 px) and leaves the
   right 60% empty -> mark 204, wordmark 176, tagline 70; lockup baseline lowered to the optical centre.

Also: hit b45.3 (pane: review) 95 ms off an onset — tick buried under the snare; gain up.
Checks failed: none hard; longest gap without a new event u26–30 (gate lift hold, 1.9 s) is fine.
Verdict: ANOTHER ROUND

## Round 2
| hook | read | motion | variety | brand | sync | min |
|  8   |  8   |   7    |    8    |   9   |  9   |  7  |

Worst three:
1. [u28–30] The lifted review gate holds dead still for ~1 s before the press -> reads as a freeze ->
   slow 5% log push on the lifted card across u27–31 so the shot keeps breathing into the press.
2. [u32–38] Validator drift is 7% / 60 px: under the caption it looks parked -> 13% zoom, 150 px pan.
3. [u0] Frame 0 is still one word, but now on the brighter field with "steps." visibly resolving;
   accepted — the brief asked for a soft blur-in open.
Sync: 25/25 within 20 ms after the b45.3 gain fix. Checks: all pass (whip strip shows both screens;
only full flash: none; end card holds still u57–60, 1.9 s).
Verdict: ANOTHER ROUND

## Round 3
| hook | read | motion | variety | brand | sync | min |
|  8   |  8   |   8    |    8    |   9   |  9   |  8  |

Worst three (remaining, all minor):
1. [u4.5–6, phone] "Fifteen-plus context switches. Two to four hours." at 44 px is the smallest word on
   screen and only just survives the phone page -> 54 px (fixed this round).
2. [u44–52] The four-pane row is dense at phone size; it reads as "many screens", which is the point,
   but individual screens aren't legible. Accepted: the caption carries the shot.
3. [u0] Frame 0 is one resolved word plus a blurring one; a harder hook would fight the brief's
   "soft blur-in". Accepted.
Checks: all pass. Sync 25/25 within 20 ms, median 2.6 ms; mix -14.1 LUFS / -1.3 dBTP.
Verdict: READY
