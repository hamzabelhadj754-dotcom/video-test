# TRAZO · Editorial (película para VideoHub)

Presentación final RA3 · Departamento de Ventas · 96,4 s · 1920×1080 · 60 fps.
Estilo editorial: papel claro → azul marino → negro con grano; serifa clásica + sans gruesa; fotos recortadas con disco de luz; tarjeta social 3D; paneles de cristal; hojas de naranjo valenciano.

| Archivo | Qué es |
|---|---|
| `index.html` + `film.js` | un lienzo 1920×1080; `window.renderOut(t)`, `window.READY`, `window.VH_SCENES` (14 escenas) |
| `render.js` | renderizador por trozos de VideoHub (FPS 60, trozos de 2 s, `ONLY=` parciales) |
| `audio/mix.wav` | voz + música + efectos, −14 LUFS |
| `assets/cut/` | recortes (rembg) de fotos de Unsplash; `assets/photos/` fotos de Unsplash |
| `fonts/` | Inter Tight, Cormorant Garamond (SIL OFL) |

Créditos de fotos (Licencia Unsplash): bici eléctrica — KINGBULL Bikes (logos retirados); repartidor en bici de carga — Peter Wilkinson (logos retirados);
estudiante — Oluwaseyi Akinlolu; ciclista — Wesley Mc Lachlan; Ciudad de las Artes y las Ciencias — Domenico Adornato.

Cómo abrirla: copia esta carpeta en `Documentos\VideoHub\films\` y ábrela en VideoHub → Live preview.
