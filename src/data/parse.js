// Lee el formato de texto de los ejercicios y arma el código inicial.
// Se usa tanto en la app como en tools/verify.mjs.

const CLAVES = ['desc', 'demo', 'salida', 'test', 'pista', 'codigo']

export function parseEjercicios(raw) {
  const bloques = raw.replace(/\r/g, '').split(/^@ /m).slice(1)
  return bloques.map((bloque) => {
    const lineas = bloque.split('\n')
    const [id, fn, params] = lineas[0].split('|').map((s) => s.trim())
    const ej = { id, fn, params: params || '', desc: [], demo: [], salida: [], tests: [], pistas: [] }
    let actual = null
    for (const linea of lineas.slice(1)) {
      const m = linea.match(/^(desc|demo|salida|test|pista|codigo):\s?(.*)$/)
      if (m && CLAVES.includes(m[1])) {
        actual = m[1]
        const resto = m[2]
        if (actual === 'test') {
          const i = resto.lastIndexOf(' => ')
          if (i < 0) throw new Error(`Prueba mal escrita en ${id}: ${resto}`)
          ej.tests.push({ args: resto.slice(0, i).trim(), esperado: resto.slice(i + 4).trim() })
        } else if (actual === 'pista') {
          ej.pistas.push({ texto: resto.trim(), codigo: '' })
        } else if (actual !== 'codigo' && resto) {
          ej[actual].push(resto)
        }
        continue
      }
      if (actual === 'codigo') {
        const p = ej.pistas[ej.pistas.length - 1]
        p.codigo = p.codigo ? p.codigo + '\n' + linea : linea
      } else if (actual === 'pista') {
        const p = ej.pistas[ej.pistas.length - 1]
        if (linea.trim()) p.texto += ' ' + linea.trim()
      } else if (actual && actual !== 'test') {
        if (linea.trim() !== '' || actual === 'desc') ej[actual].push(linea)
      }
    }
    ej.desc = ej.desc.filter((l, i, arr) => l.trim() !== '' || (i > 0 && i < arr.length - 1))
    ej.demo = ej.demo.join('\n')
    ej.salida = ej.salida.join('\n')
    ej.pistas = ej.pistas.map((p) => ({ texto: p.texto, codigo: p.codigo.replace(/\n+$/, '') }))
    ej.tests = ej.tests.map((t) => ({ ...t, oculta: !ej.demo.includes(t.args) }))
    return ej
  })
}

export function plantilla(ej) {
  const cab = ['# Ejercicio: ' + ej.fn, '#', ...ej.desc.map((l) => (l.trim() ? '# ' + l : '#'))]
  const sal = ej.salida.split('\n').map((l) => '# ' + l)
  return [
    ...cab,
    '',
    `def ${ej.fn}(${ej.params}):`,
    '    pass',
    '',
    ej.demo,
    '#',
    '# Salida esperada:',
    ...sal,
    '',
  ].join('\n')
}
