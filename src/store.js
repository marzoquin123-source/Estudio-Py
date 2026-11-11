import { useSyncExternalStore } from 'react'
import { idsDeNivel, NIVELES } from './data/levels.js'

const KEY = 'pycamino:v1'
const XP_POR_PISTAS = [10, 7, 5, 3]

const vacio = () => ({ xp: 0, racha: { n: 0, ultimo: null }, resueltos: {}, codigo: {}, pistas: {}, vistas: {}, libre: false })

function cargar() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return vacio()
    const d = JSON.parse(raw)
    const base = vacio()
    return {
      xp: Number(d.xp) || 0,
      racha: { ...base.racha, ...(d.racha || {}) },
      resueltos: d.resueltos || {},
      codigo: d.codigo || {},
      pistas: d.pistas || {},
      vistas: d.vistas || {},
      libre: !!d.libre,
    }
  } catch {
    return vacio()
  }
}

let estado = cargar()
const subs = new Set()
let timer = null

function persistir() {
  clearTimeout(timer)
  timer = null
  try {
    localStorage.setItem(KEY, JSON.stringify(estado))
  } catch {
    /* sin almacenamiento: la app sigue funcionando en memoria */
  }
}
function emitir() {
  persistir()
  subs.forEach((f) => f())
}
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => timer && persistir())
  document.addEventListener('visibilitychange', () => timer && persistir())
}

export const leerEstado = () => estado

export const useEstado = () =>
  useSyncExternalStore(
    (f) => {
      subs.add(f)
      return () => subs.delete(f)
    },
    () => estado,
  )

const fecha = (d) =>
  d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
export const hoy = () => fecha(new Date())
const ayer = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return fecha(d)
}

/** Racha que se muestra: si pasó más de un día sin practicar, vuelve a 0. */
export const rachaVisible = (e) => (e.racha.ultimo === hoy() || e.racha.ultimo === ayer() ? e.racha.n : 0)
export const practicoHoy = (e) => e.racha.ultimo === hoy()

export const xpPorPistas = (pistas) => XP_POR_PISTAS[Math.min(pistas, XP_POR_PISTAS.length - 1)]

export const nivelCompleto = (e, n) => idsDeNivel(n).every((id) => e.resueltos[id])
export const nivelDesbloqueado = (e, n) => e.libre || n === 1 || nivelCompleto(e, n - 1)
export const resueltosDeNivel = (e, n) => idsDeNivel(n).filter((id) => e.resueltos[id]).length
export const nivelActual = (e) => {
  for (const { n } of NIVELES) if (!nivelCompleto(e, n)) return n
  return NIVELES.length
}

/** Guarda el código sin avisar a los componentes (el editor ya lo tiene). */
export function guardarCodigo(id, codigo) {
  estado.codigo[id] = codigo
  clearTimeout(timer)
  timer = setTimeout(persistir, 300)
}

export function borrarCodigo(id) {
  const { [id]: _, ...resto } = estado.codigo
  estado = { ...estado, codigo: resto }
  emitir()
}

export function revelarPista(id, total) {
  const n = Math.min((estado.pistas[id] || 0) + 1, total)
  estado = { ...estado, pistas: { ...estado.pistas, [id]: n } }
  emitir()
}

/** El estudiante pidió ver la solución: ese ejercicio ya no da XP. */
export function verSolucion(id) {
  estado = { ...estado, vistas: { ...estado.vistas, [id]: true } }
  emitir()
}

/** Marca resuelto. Devuelve los XP ganados (0 si ya estaba resuelto). */
export function marcarResuelto(id) {
  if (estado.resueltos[id]) return 0
  const pistas = estado.pistas[id] || 0
  const xp = estado.vistas[id] ? 0 : xpPorPistas(pistas)
  const h = hoy()
  let racha = estado.racha
  if (racha.ultimo !== h) racha = { n: racha.ultimo === ayer() ? racha.n + 1 : 1, ultimo: h }
  estado = {
    ...estado,
    xp: estado.xp + xp,
    racha,
    resueltos: { ...estado.resueltos, [id]: { xp, pistas } },
  }
  emitir()
  return xp
}

export function ponerLibre(v) {
  estado = { ...estado, libre: !!v }
  emitir()
}

export function borrarTodo() {
  estado = { ...vacio(), libre: estado.libre }
  emitir()
}
