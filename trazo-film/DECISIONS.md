# TRAZO — Práctica Final RA3 · Departamento de Ventas (motion film)

## Brief
- 90 s, 16:9, 1920x1080 @ 30 fps, MP4. Standalone film (plays alone, no live voice): text must be readable on its own.
- Solo project. On-screen language: Spanish. Audience: teacher + class, classroom projector.
- Concept: **"La Línea"** — one continuous orange line (one sale moving through the department) draws every element: logo → 4 functions/table → SMART growth chart → supervision cycle → org chart → end card.

## The company (fictional)
- **TRAZO · Movilidad eléctrica** — empresa **comercial** (compra a fabricantes y vende), Valencia.
- Productos: bicicletas eléctricas urbanas, patinetes eléctricos, accesorios y plan de mantenimiento **TRAZO Care**.
- Público objetivo: (1) particulares 18–40 años, estudiantes y trabajadores que se mueven por la ciudad; (2) empresas con flotas de reparto (B2B).

## Fase 2 · Funciones (tabla resumen)
| Función | Acciones concretas |
|---|---|
| Captación | Pruebas gratis en campus · campañas en Instagram y TikTok · acuerdos con empresas de reparto |
| Fidelización | Plan TRAZO Care · revisión gratis a los 6 meses · app con puntos |
| Análisis de mercado | Encuestas post-venta · estudio de la competencia · ventas por zona en el CRM |
| Gestión administrativa | Pedidos y facturas en el CRM · financiación · garantías y devoluciones |

## Fase 3 · Objetivos SMART
1. Aumentar las ventas online un **20 %** antes del **31/12/2027**.
2. Conseguir **15** nuevos clientes empresa en Valencia antes del **30/06/2027**.
3. Alcanzar una satisfacción de **4,6 / 5** en las encuestas post-venta durante **2027**.

## Fase 4 · Supervisión
- Reunión semanal de 15 min · panel de KPIs en el CRM en tiempo real · reunión individual mensual · informe trimestral.
- Motivación: comisión del 3 % + bonus trimestral al superar objetivos · "Vendedor del mes" con día libre · formación continua.

## Fase 5 · Factores y estructura
- Internos: empresa pequeña (12 personas) · producto técnico que necesita demostración.
- Externos: Valencia, ciudad llana con carril bici · dos tipos de cliente (particular y empresa).
- Estructura: **mixta (por cliente + canal)**.
- Organigrama: Dirección Comercial → Ventas Particulares (Tienda Ruzafa · Venta online) / Ventas Empresas (Cuentas clave flotas) / Administración y Análisis.

## Design system
- Palette: ink `#0C0D0F` (bg) · ink-2 `#16181B` · paper `#F2EFE8` · mute `#8C8B85` · signal `#FF5A1F` (the line, used rarely).
- Type: Bricolage Grotesque Variable (display, tight -3% tracking) · Inter Variable (labels/body, tabular numbers).
- Motion: expo-out in `cubic-bezier(0.16,1,0.3,1)`, quint-in out `cubic-bezier(0.64,0,0.78,0)`, camera in-out `cubic-bezier(0.65,0,0.35,1)`. Camera always drifting.
- Transitions: object-led (the line), match cuts, hard cut on beat.
- Finish: grain ~5 %, vignette, city-grid depth layer.

## Versions
- (none yet)

## v2 direction (after user reference: editorial layered reel)
- User feedback: v1 frames "too basic". Reference = layered editorial reel (3D cards, defocused foreground, serif+grotesk mix, barcode/date/side credits, corner brackets, dashed boxes, cursor, glass panels with comments, light→dark switch, film dust).
- No Higgsfield / no AI image generation (user request). Everything code-built.
- Added: Instrument Serif italic (accent voice), line-art e-bike (KIT.bike), 3D social post card, glass review panel, TRAZO Care loyalty card, 3D-tilted org chart, side credits, barcode, dust layer.
- Opening is light (paper #EEEAE1) → film switches to dark at chapter 02.

## v3 direction: real 3D product hero (user: "más y más profesional")
- three.js e-bike built from primitives (src/bike3d.js): graphite clearcoat frame, orange battery + motor ring, studio env lighting, VSM soft shadows, AgX tone mapping, orange rim light.
- Hero: giant "TRAZO." behind the bike (type passes behind product), technical callouts anchored to projected 3D points (motor 250 W, batería 80 km, 25 km/h).
- Motion: bike rolls in with wheels rotating by distance (expo-out), letters rise from mask with blur→sharp, callout dots pop, lines draw, labels slide from masks, word-by-word paragraph, rim light sweep, camera push + drift.
- Pipeline: src/film.html exposes window.seek(t) (GSAP paused timeline + three render). tools/render.js renders 60 fps → tmix 2 → 30 fps (motion blur), H.264 CRF 16 BT.709. tools/render-par.sh splits into 4 parallel chunks.
- Sound: tools/sound.py synthesizes original SFX + music bed from a cue JSON (no licensed audio needed). Target -14 LUFS, TP ≤ -1 dB.

## Storyboard v3 (90 s)
| Time | Scene | Content | Transition out |
|---|---|---|---|
| 0–8 | Hero | 3D bike + TRAZO. + callouts | push into battery → orange color field |
| 8–17 | Público objetivo | particulares 18–40 / empresas con flotas | line-led |
| 17–21 | Funciones intro | "Cuatro funciones. Una venta." | typographic |
| 21–27 | Captación | 3D social post | card flip |
| 27–33 | Fidelización | glass reviews + TRAZO Care card | card slides |
| 33–38 | Análisis de mercado | dashboard: ventas por zona, encuestas | chart line continues |
| 38–43 | Gestión administrativa | pedido → factura → financiación | rows collapse |
| 43–48 | Tabla resumen | 4 x 3 table builds | line becomes chart |
| 48–60 | Objetivos SMART | growth curve, counters | hard cut on beat |
| 60–70 | Supervisión + motivación | weekly cadence + KPI panel + 3 measures | match cut |
| 70–78 | Factores | internos / externos, Valencia | line branches |
| 78–86 | Organigrama | 3D tree grows | camera pulls back |
| 86–90 | End card | bike + TRAZO. + gracias | boom |

## v03 La Ruta motion rules (film6.html)
- Camera = holds (slow dolly + drift, never static) joined by van Wijk–Nuij smooth-zoom moves (rho 1.35), eased tz-cam.
- Rider arrivals synced to camera hold starts; arrival ring instead of constant pulse.
- Map painted on a 2x supersampled canvas; stroke/radius widths screen-consistent: w*0.8*(S/0.8)^0.25.
- Two curves only: tz-out entrances, tz-in exits (0.45 s); no overshoot. Every station leaves when the camera leaves.
- Board: mask reveal, 12 Hz flaps settling left to right. Render: 60 fps, sub=2 (motion blur).
- Sound: camera whooshes generated from window.MOVES (audio/shots.json).
