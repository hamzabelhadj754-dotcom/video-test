# Screening notes

## v01 (review render, 30fps)
| Time | Issue | Severity | Fix |
|---|---|---|---|
| 0.0s | First frame too dark for a thumbnail | Major | Ignition starts lit, headline from frame 1 |
| 4–12s | Rep counter, meter, @yourbrand inside the TikTok/Reels bottom UI zone | Blocker | Readouts moved up to y 1110–1420, stronger bottom shade |
| 12.2–12.6s | Dead air after the white-out (dark muscles, no text) | Major | Compare headline and labels arrive 8 frames earlier |
| 16–18s | Strength caveat unreadable (21px) | Major | 27px |
| audio | True peak +0.3 dBFS | Blocker | Limiter |

## v02
- 1080x1920, 30fps, 20.00s, h264 High yuv420p bt709, -13.7 LUFS, true peak -1.8 dBFS.
- All type and readouts inside the platform-safe area (checked on safe_zones.png).
- Not yet rendered with sub-frame motion blur (4x pass takes ~100 min on this machine); planned for the final.
- Mix checked with meters only, not by ear.
