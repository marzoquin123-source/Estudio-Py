# PyCamino

Práctica de Python estilo Duolingo: 20 niveles × 3 ejercicios, Python real en el navegador (Pyodide en un Web Worker), progreso en `localStorage`.

```bash
npm install
npm run dev        # desarrollo
npm run build      # producción -> dist/
npm run verify     # comprueba las 60 soluciones de referencia con Pyodide real
```

- Ejercicios: `src/data/ejercicios_*.txt` (formato de texto simple, ver `src/data/parse.js`).
- Soluciones de referencia: `tools/sol/soluciones.txt` — **no** se incluyen en el build (solo las usa `npm run verify`).
- Arnés de pruebas: `public/harness.py` (lo usan la página y el script de verificación).
- Pyodide se descarga del CDN de jsDelivr la primera vez (hace falta internet); el navegador lo guarda en caché.

Deploy en Vercel: importar el repositorio; Vercel detecta Vite solo (Build: `npm run build`, Output: `dist`). No requiere variables de entorno.
