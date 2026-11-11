// Se carga solo cuando el estudiante pide "Ver solución" (import dinámico = archivo aparte).
import raw from '../../tools/sol/soluciones.txt?raw'

const out = {}
for (const b of raw.replace(/\r/g, '').split(/^@ /m).slice(1)) {
  const i = b.indexOf('\n')
  out[b.slice(0, i).trim()] = b.slice(i + 1).trim()
}
export default out
