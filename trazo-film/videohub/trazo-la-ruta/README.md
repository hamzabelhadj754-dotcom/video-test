# TRAZO · La Ruta (película para VideoHub)

Presentación final RA3 · Departamento de Ventas · 96,4 s · 1920×1080 · 60 fps.
La película entera se dibuja en un solo lienzo desde el código (`film.js`), sin render previo.

| Archivo | Qué es |
|---|---|
| `index.html` | la página: un lienzo `#c` de 1920×1080 + `film.js` |
| `film.js` | `window.renderOut(t)`, `window.READY`, `window.VH_SCENES` (9 escenas); cámara, mapa, línea de metro, animaciones y desenfoque de movimiento |
| `layout.js` | posiciones exactas de cada palabra, cartel e icono (generado por `tools/vh_compile.js`) |
| `render.js` | el renderizador por trozos de VideoHub (plantilla oficial), FPS 60, trozos de 2 s, `ONLY=` para re-renders parciales |
| `audio/mix.wav` | voz + música + efectos, mezcla a −14 LUFS |
| `fonts/` | Inter Tight |
| `.videohub/project.json` | título, duración (`DUR` 96,4) y página en vivo |

## Cómo abrirlo en VideoHub
1. Instala VideoHub en tu ordenador (`TensaikunYT/videohub`, ejecuta `SETUP.cmd` en Windows o `setup.sh` en Mac/Linux).
2. Copia esta carpeta `trazo-la-ruta` dentro de la carpeta de películas de VideoHub (`Documentos\VideoHub\films\`).
3. Abre VideoHub: la película aparece en *Projects*. Ábrela → **Live preview** (se reproduce desde el código, sin renderizar).
4. Mira la película, haz clic en cualquier fotograma (o dibuja encima) para dejar una nota, y pulsa **Send to your agent**. Pega el mensaje en el chat con Claude.
5. Claude corrige las notas en el código; la vista previa se recarga sola. Solo se renderiza cuando tú lo pides (completo, o parcial: solo los trozos cambiados).
