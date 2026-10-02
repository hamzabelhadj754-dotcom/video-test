# Missing assets

`./assets` was empty when the project was built. Each missing item has a placeholder, so the ad renders end to end. Drop the real files in with the names below and run `./build.sh`. The renderer picks them up automatically, with no code changes.

| Needed | Expected path | Placeholder used now | Notes |
|---|---|---|---|
| **OBELCHA logo** (vector) | `assets/logo.svg` (or `logo.png`, transparent) | Typographic wordmark "OBELCHA" set in Cormorant Garamond 600, tracking +0.24 em, off-white. | **Not a final logo.** The placeholder only marks where the lockup goes. When the file exists it replaces the wordmark in the end card; the gold underline and sheen are kept. A light/off-white version works best on #0B0B0B. |
| **Hero product photo**, transparent background | `assets/product.png` (≥ 2000 px tall, front-facing, upright) | Procedural glass dropper bottle drawn in canvas: gold serum, gold collar, black bulb, "OBELCHA" printed on the glass. | With a real photo the renderer swaps it in, keeps the light sweeps (clipped to the photo's alpha), the reflection and the halo, but the photo stays upright and static: the 3D label-wrap rotation only exists on the procedural bottle. Providing 24–36 turntable frames would enable a true rotation (small renderer change). |
| **Product name & claims** | `timeline.json → copy` | "Sérum Purificante". Benefits: "Ayuda a limpiar los poros", "Aspecto más luminoso", "Ligero, no graso". | The brief left `[PRODUCT NAME]`, `[BENEFIT 1-3]` and `[OFFER]` open. Have regulatory/legal confirm the final copy against the product's cosmetic safety report (Reg. (EC) 1223/2009 and Reg. (EU) 655/2013 claim criteria). |
| **Offer** | `copy.*.offer` | "Envío a toda España" (from the brief's example) | Change in one place; it flows to every format and SRT. |
| **Brand fonts** | `fonts/` + `fonts/fonts.css` | Cormorant Garamond (serif) + Jost (sans), SIL OFL via Google Fonts | Update `FONTS` in `src/ad.js` with the family names. |
| **Music** | `assets/music.mp3` | Synthesized ambient pad (D → Bm9 → Dmaj9 → Gmaj7 → Dmaj9) | Licensed track, ≥ 20 s. It is normalized to −18 LUFS, ducked −6 dB under the VO and faded out from 19.0 s. |
| **Professional VO** (optional) | replace `audio/vo_cache/*` or set `vo.voice` | Local neural TTS: Kokoro `ef_dora` (Spanish) via sherpa-onnx | Good enough for testing and social; a native Castilian voice actor would raise the premium feel. Script and timings are in `timeline.json → vo.lines`. |
