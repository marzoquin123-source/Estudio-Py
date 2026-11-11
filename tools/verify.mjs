// Verifica los 60 ejercicios con Pyodide real y el MISMO harness.py que usa la página.
// Uso: npm run verify
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadPyodide } from 'pyodide'
import { parseEjercicios, plantilla } from '../src/data/parse.js'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const leer = (p) => fs.readFileSync(path.join(raiz, p), 'utf8')

const archivos = ['ejercicios_01_05', 'ejercicios_06_10', 'ejercicios_11_17', 'ejercicios_18_20']
const ejercicios = archivos.flatMap((f) => parseEjercicios(leer(`src/data/${f}.txt`)))

const soluciones = {}
for (const b of leer('tools/sol/soluciones.txt').replace(/\r/g, '').split(/^@ /m).slice(1)) {
  const i = b.indexOf('\n')
  soluciones[b.slice(0, i).trim()] = b.slice(i + 1).trim() + '\n'
}

const py = await loadPyodide()
py.runPython(leer('public/harness.py'))
py.runPython(leer('tools/lint.py'))
const ejecutar = py.globals.get('ejecutar_json')
const revisar = py.globals.get('revisar')

const errores = []
const falla = (id, msg) => errores.push(`[${id}] ${msg}`)

// Estructura: 20 niveles x 3 ejercicios, ids 1-1 ... 20-3
const esperados = []
for (let n = 1; n <= 20; n++) for (let e = 1; e <= 3; e++) esperados.push(`${n}-${e}`)
const ids = ejercicios.map((e) => e.id)
if (JSON.stringify(ids) !== JSON.stringify(esperados)) falla('estructura', `ids inesperados: ${ids.join(',')}`)
if (ejercicios.length !== 60) falla('estructura', `hay ${ejercicios.length} ejercicios, se esperaban 60`)
for (const id of Object.keys(soluciones)) if (!ids.includes(id)) falla(id, 'solución sin ejercicio')

let ok = 0
for (const ej of ejercicios) {
  const id = ej.id
  const sol = soluciones[id]
  if (!sol) { falla(id, 'falta la solución de referencia'); continue }

  // formato del ejercicio
  if (ej.tests.length < 3) falla(id, 'menos de 3 pruebas')
  if (!ej.tests.some((t) => t.oculta)) falla(id, 'ninguna prueba oculta')
  if (ej.pistas.length < 2 || ej.pistas.length > 3) falla(id, `pistas: ${ej.pistas.length} (deben ser 2 o 3)`)
  if (!ej.pistas.at(-1)?.codigo?.includes('___')) falla(id, 'la última pista debe tener código con espacios en blanco ___')
  if (!ej.salida || !ej.demo || !ej.desc.length) falla(id, 'falta desc/demo/salida')
  if (!sol.includes(`def ${ej.fn}(${ej.params}):`)) falla(id, 'la firma de la solución no coincide con el ejercicio')

  // la solución solo usa los temas permitidos (incluye la línea de demo)
  const programa = sol + '\n' + ej.demo + '\n'
  const problemas = revisar(programa).toJs()
  for (const p of problemas) falla(id, 'TEMA NO PERMITIDO: ' + p)

  // pasa todas sus pruebas
  const res = JSON.parse(ejecutar(programa, ej.fn, JSON.stringify(ej.tests)))
  if (res.fase !== 'pruebas') { falla(id, `fase ${res.fase}: ${JSON.stringify(res.error)}`); continue }
  const malas = res.pruebas.filter((p) => !p.ok)
  for (const m of malas) falla(id, `prueba fallida con (${m.args}): obtuvo ${m.obtenido}, esperado ${m.esperado} ${m.error ? JSON.stringify(m.error) : ''}`)

  // la salida impresa del demo coincide con la "Salida esperada" del enunciado
  if (res.salida.trim() !== ej.salida.trim()) falla(id, `salida del demo distinta.\n   real:     ${JSON.stringify(res.salida.trim())}\n   enunciado: ${JSON.stringify(ej.salida.trim())}`)

  // el código inicial (con pass) NO debe pasar
  const ini = JSON.parse(ejecutar(plantilla(ej), ej.fn, JSON.stringify(ej.tests)))
  if (ini.fase !== 'pruebas') falla(id, `la plantilla inicial no corre: ${JSON.stringify(ini.error)}`)
  else if (ini.pruebas.every((p) => p.ok)) falla(id, 'la plantilla inicial (pass) ya pasa las pruebas')

  if (!malas.length && res.salida.trim() === ej.salida.trim() && !problemas.length) ok++
}

console.log(`\nEjercicios revisados: ${ejercicios.length}`)
console.log(`Soluciones de referencia que pasan TODO (pruebas + salida + temas permitidos): ${ok}/${ejercicios.length}`)
if (errores.length) {
  console.log('\nPROBLEMAS:')
  for (const e of errores) console.log(' - ' + e)
  process.exit(1)
}
console.log('OK: los 60 ejercicios son resolubles y consistentes.')
