# Playbook OBELCHA: videos de skincare con motion graphics

## Herramientas disponibles (sin instalar nada extra)
- HyperFrames (HTML + GSAP): ya instalado y fijado en el proyecto.
- Registro de HyperFrames (~450 bloques): `npx hyperframes catalog` y `npx hyperframes add <bloque>`.
  Útiles para skincare: `editorial-flash-overlay` (flash de cámara), `cinematic-zoom`,
  `flash-through-white`, `cross-warp-morph` (transiciones), `data-chart`, `camera-dolly-zoom`.
- `motion-blur` (componente) o la opción de render `motionBlur`: sólo para golpes rápidos
  (slam, whip, hard cut), de 1 a 3 por video. Nunca sobre texto que se tiene que leer.
- Guías internas: skill `hyperframes-animation` (reglas, blueprints, transiciones).

## Reglas de motion (de las guías de HyperFrames)
1. Easing siempre: power3/expo para entradas, sin rebotes baratos. Lineal se ve robótico.
2. Texto: la palabra entra desenfocada y aterriza nítida justo al decirla; el desenfoque va en la entrada, no en la lectura.
3. Una idea por pantalla. Cada beat entra, se mantiene y sale antes del siguiente (blueprint `kinetic-type-beats`).
4. Mezcla de escalas: palabras pequeñas + una palabra clave enorme en rojo.
5. Cámara: empuje lento + pequeño "kick" en cada corte. Nada de zoom-out que revele todo.
6. Estado inicial oculto con `gsap.set` desde el principio (evita la doble intro).
7. Máximo 3 colores (papel, tinta, rojo). Chrome editorial discreto (barcode, contador).

## Estructura de video corto (7-25 s)
- 0-3 s: gancho con un dato o problema concreto ("Tienes diez productos y tu piel sigue igual").
- Cuerpo: 1 mito + 3 pasos como máximo, cada uno con su visual.
- Cierre: llamada a guardar + seguir (logo + botón).
- Diseñar para guardados y compartidos.
- Evitar promesas médicas ("cura", "elimina"): usar "ayuda", "mejora".

## Ideas de gancho (probar con las analíticas propias)
- Mito: "El sérum caro no es lo que te falta."
- Número: "Tres pasos. Eso es todo."
- Error: "Estás usando mal tu protector solar."
- Orden: "El orden de tu rutina importa."
- Menos es más: "Quita cinco productos de tu baño."

## Audio
- La voz manda: voz ~-19 dB, música ~-29 dB, SFX por debajo de la voz.
- Whoosh suave (0.3), impactos moderados; sidechain de música y SFX bajo la voz.
- Normalizar a -14 LUFS.

## Nota sobre fuentes
La búsqueda web trajo sólo blogs de marketing (opinión, sin datos de rendimiento); las
páginas externas no se pudieron abrir desde este entorno. Los libros de motion/animación
no se pueden descargar aquí (derechos de autor); referencias recomendadas para leer:
"The Illusion of Life" (Thomas & Johnston) y "Design for Motion" (Austin Shaw).
