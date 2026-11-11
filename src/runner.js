// Administra el Web Worker con Pyodide: carga una sola vez, ejecuta con límite de tiempo
// y, si el código se cicla, mata el worker y levanta otro.
import { useSyncExternalStore } from 'react'

export const LIMITE_MS = 5000

let worker = null
let estado = 'cargando' // cargando | listo | reiniciando | error
let detalleError = ''
let pendiente = null // { id, resolve, timer }
let siguienteId = 1
const subs = new Set()
let snapshot = { estado, detalleError }

function cambiar(nuevo, detalle = '') {
  estado = nuevo
  detalleError = detalle
  snapshot = { estado, detalleError }
  subs.forEach((f) => f())
}

function crear(reinicio = false) {
  cambiar(reinicio ? 'reiniciando' : 'cargando')
  const w = new Worker(import.meta.env.BASE_URL + 'pyodide-worker.js')
  worker = w
  w.onmessage = (ev) => {
    if (w !== worker) return
    const m = ev.data
    if (m.tipo === 'listo') cambiar('listo')
    else if (m.tipo === 'fallo') cambiar('error', m.mensaje)
    else if (m.tipo === 'inicio' && pendiente && pendiente.id === m.id) {
      pendiente.timer = setTimeout(() => {
        const p = pendiente
        pendiente = null
        w.terminate()
        crear(true)
        p.resolve({ tipo: 'timeout' })
      }, LIMITE_MS)
    } else if ((m.tipo === 'resultado' || m.tipo === 'fallo_ejecucion') && pendiente && pendiente.id === m.id) {
      const p = pendiente
      pendiente = null
      clearTimeout(p.timer)
      p.resolve(m.tipo === 'resultado' ? { tipo: 'ok', res: m.resultado } : { tipo: 'fallo', mensaje: m.mensaje })
    }
  }
  w.onerror = (e) => {
    if (w === worker) cambiar('error', e.message || 'No se pudo iniciar el intérprete de Python.')
  }
}

export function iniciar() {
  if (!worker) crear()
}

export function reintentar() {
  if (worker) worker.terminate()
  worker = null
  crear()
}

export function ejecutar(codigo, fn, tests) {
  return new Promise((resolve) => {
    if (estado !== 'listo' || pendiente) {
      resolve({ tipo: 'fallo', mensaje: 'Python todavía no está listo.' })
      return
    }
    const id = siguienteId++
    pendiente = { id, resolve, timer: null }
    worker.postMessage({ tipo: 'ejecutar', id, codigo, fn, pruebas: JSON.stringify(tests) })
  })
}

export const useRunner = () =>
  useSyncExternalStore(
    (f) => {
      subs.add(f)
      return () => subs.delete(f)
    },
    () => snapshot,
  )
