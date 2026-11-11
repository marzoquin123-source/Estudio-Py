// Resaltado de sintaxis mínimo para Python básico (sin dependencias).
const CLAVES = new Set(['def', 'return', 'if', 'elif', 'else', 'for', 'while', 'in', 'and', 'or', 'not', 'pass', 'break', 'continue'])
const CONSTANTES = new Set(['True', 'False', 'None'])
const INTEGRADAS = new Set(['print', 'len', 'range', 'int', 'float', 'str', 'bool', 'tuple', 'set', 'bin', 'list'])

const RE = /(#[^\n]*)|("(?:[^"\\n]|\.)*"?|'(?:[^'\\n]|\.)*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|(\s+|[\s\S])/g

/** Devuelve [{ t: texto, c: clase|'' }]; la unión de todos los t es exactamente el código original. */
export function resaltar(codigo) {
  const out = []
  let tras_def = false
  for (const m of codigo.matchAll(RE)) {
    const [txt, com, cad, num, id] = m
    let c = ''
    if (com) c = 'tk-com'
    else if (cad) c = 'tk-str'
    else if (num) c = 'tk-num'
    else if (id) {
      if (tras_def) c = 'tk-fn'
      else if (CLAVES.has(id)) c = 'tk-kw'
      else if (CONSTANTES.has(id)) c = 'tk-cn'
      else if (INTEGRADAS.has(id)) c = 'tk-bi'
      tras_def = id === 'def' && !tras_def
    } else if (!/^\s+$/.test(txt)) tras_def = false
    out.push({ t: txt, c })
  }
  return out
}
