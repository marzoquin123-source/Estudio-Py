import a from './ejercicios_01_05.txt?raw'
import b from './ejercicios_06_10.txt?raw'
import c from './ejercicios_11_17.txt?raw'
import d from './ejercicios_18_20.txt?raw'
import { parseEjercicios, plantilla } from './parse.js'

export const NIVELES = [
  { n: 1, titulo: 'Tipos de datos', icono: '🔤' },
  { n: 2, titulo: 'Typecasting', icono: '🔁' },
  { n: 3, titulo: 'Operadores aritméticos', icono: '➕' },
  { n: 4, titulo: 'Relacionales y lógicos', icono: '⚖️' },
  { n: 5, titulo: 'Varios resultados', icono: '📦' },
  { n: 6, titulo: 'Limpiar cadenas', icono: '🧹' },
  { n: 7, titulo: 'Buscar en cadenas', icono: '🔎' },
  { n: 8, titulo: 'Reemplazar y validar', icono: '✅' },
  { n: 9, titulo: 'Conjuntos I', icono: '🧺' },
  { n: 10, titulo: 'Conjuntos II', icono: '🧮' },
  { n: 11, titulo: 'if / elif / else', icono: '🔀' },
  { n: 12, titulo: 'elif vs varios if', icono: '🚦' },
  { n: 13, titulo: 'Ciclo while I', icono: '🔄' },
  { n: 14, titulo: 'Ciclo while II', icono: '🌀' },
  { n: 15, titulo: 'for y range', icono: '🏃' },
  { n: 16, titulo: 'for con cadenas', icono: '🔡' },
  { n: 17, titulo: 'for con tuplas', icono: '🧵' },
  { n: 18, titulo: 'Parcial I', icono: '📝' },
  { n: 19, titulo: 'Parcial II', icono: '📚' },
  { n: 20, titulo: 'Parcial final', icono: '🏆' },
]

export const EJERCICIOS = [a, b, c, d].flatMap(parseEjercicios).map((e) => ({
  ...e,
  nivel: Number(e.id.split('-')[0]),
  indice: Number(e.id.split('-')[1]),
  inicial: plantilla(e),
}))

export const POR_ID = Object.fromEntries(EJERCICIOS.map((e) => [e.id, e]))
export const idsDeNivel = (n) => [1, 2, 3].map((i) => `${n}-${i}`)
