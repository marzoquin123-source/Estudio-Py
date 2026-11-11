// Web Worker: carga Pyodide una sola vez y ejecuta el código del estudiante.
// Si el código se cicla, la página principal termina este worker y crea otro.
const PYODIDE_VERSION = '0.26.4'
const BASE = 'https://cdn.jsdelivr.net/pyodide/v' + PYODIDE_VERSION + '/full/'

let pyodide = null
let ejecutarJson = null

async function iniciar() {
  try {
    importScripts(BASE + 'pyodide.js')
    pyodide = await self.loadPyodide({ indexURL: BASE })
    const resp = await fetch(new URL('harness.py', self.location.href))
    if (!resp.ok) throw new Error('No se pudo cargar harness.py')
    pyodide.runPython(await resp.text())
    ejecutarJson = pyodide.globals.get('ejecutar_json')
    self.postMessage({ tipo: 'listo' })
  } catch (e) {
    self.postMessage({ tipo: 'fallo', mensaje: String((e && e.message) || e) })
  }
}

self.onmessage = (ev) => {
  const m = ev.data
  if (m.tipo !== 'ejecutar' || !ejecutarJson) return
  self.postMessage({ tipo: 'inicio', id: m.id })
  try {
    const json = ejecutarJson(m.codigo, m.fn, m.pruebas)
    self.postMessage({ tipo: 'resultado', id: m.id, resultado: JSON.parse(json) })
  } catch (e) {
    self.postMessage({ tipo: 'fallo_ejecucion', id: m.id, mensaje: String((e && e.message) || e) })
  }
}

iniciar()
