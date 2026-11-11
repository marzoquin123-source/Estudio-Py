// Traduce los errores de Python a explicaciones cortas en español.

const C = (s) => '`' + s + '`'

export function traducirError(err) {
  const { tipo, msg } = err
  let m

  if (tipo === 'IndentationError' || tipo === 'TabError' || tipo === 'SyntaxError') {
    if (/expected an indented block/.test(msg))
      return ['Falta la sangría (indentación)', `Después de una línea que termina en ${C(':')} (if, for, while, def) la línea siguiente debe ir con 4 espacios más hacia la derecha.`]
    if (/unexpected indent/.test(msg))
      return ['Sobran espacios al inicio de la línea', 'Esta línea tiene más sangría de la que le toca. Alinéala con las líneas de su mismo bloque.']
    if (/unindent does not match/.test(msg))
      return ['La sangría no coincide', 'Esta línea no queda alineada con ningún bloque anterior. Usa siempre la misma cantidad de espacios (4) para cada nivel.']
    if (/expected ':'/.test(msg))
      return ['Falta el signo de dos puntos', `if, elif, else, for, while y def deben terminar en ${C(':')}.`]
    if (/was never closed/.test(msg))
      return ['Falta cerrar un paréntesis, corchete o llave', 'Abriste uno con ( [ { y no lo cerraste. Cuenta que cada apertura tenga su cierre.']
    if (/unmatched/.test(msg))
      return ['Sobra un paréntesis, corchete o llave', 'Hay un cierre ) ] } que no tiene su apertura.']
    if (/unterminated string/.test(msg))
      return ['Falta cerrar unas comillas', 'Un texto debe empezar y terminar con el mismo tipo de comillas.']
    if (/forgot a comma/.test(msg))
      return ['Parece que falta una coma', 'Entre dos valores de una tupla, lista o llamada a función va una coma.']
    if (/Maybe you meant '=='/.test(msg) || /cannot assign to/.test(msg))
      return ['Usaste = donde va ==', `Para comparar se usa ${C('==')}. Un solo ${C('=')} sirve para guardar un valor en una variable.`]
    if (/outside function/.test(msg))
      return ['return fuera de una función', 'El return debe ir dentro del def, con sangría.']
    if (/invalid syntax|invalid decimal|invalid character|invalid non-printable/.test(msg) || tipo === 'SyntaxError')
      return ['Error de sintaxis', 'Python no entiende cómo está escrita esta línea. Revisa los dos puntos, paréntesis, comillas, operadores y que no haya palabras o símbolos de más.']
  }

  switch (tipo) {
    case 'NameError':
      if ((m = msg.match(/name '(.+)' is not defined/)))
        return [`Usaste ${C(m[1])} pero no existe`, `Una variable debe recibir un valor antes de usarse. Revisa que la hayas creado, que esté escrita igual (mayúsculas y minúsculas cuentan) y que, si es un texto, lleve comillas.`]
      break
    case 'UnboundLocalError':
      if ((m = msg.match(/variable '(.+)'/)))
        return [`Usas ${C(m[1])} antes de darle un valor`, `Dentro de la función, ${C(m[1])} se usa antes de crearla. Asígnale un valor inicial (por ejemplo ${C(m[1] + ' = 0')}) antes del ciclo o del if donde la usas.`]
      return ['Variable usada antes de crearla', 'Asígnale un valor antes de usarla.']
    case 'IndexError':
      return ['Índice fuera de rango', 'Pediste una posición que no existe. Con N elementos las posiciones válidas son de 0 a N-1. Revisa el range() o el valor del índice (¿te pasaste por uno?).']
    case 'ZeroDivisionError':
      return ['División entre cero', 'Estás dividiendo (/, // o %) entre 0, y eso no se puede.']
    case 'RecursionError':
      return ['La función se llama a sí misma sin parar', 'No hace falta que llames tu propia función dentro de ella: resuélvelo con un ciclo.']
    case 'EOFError':
      return ['No uses input()', 'Aquí los datos llegan por los parámetros de la función. Quita el input().']
    case 'KeyError':
      return ['Elemento no encontrado en el conjunto', `Con ${C('remove()')} y ${C('pop()')} da error si el elemento no existe o el conjunto está vacío. Si el elemento puede no estar, usa ${C('discard()')}.`]
    case 'ValueError':
      if (/invalid literal for int/.test(msg)) return ['No se puede convertir ese texto a entero', `${C('int()')} solo acepta textos con dígitos (como "42"). Revisa qué texto le estás pasando.`]
      if (/could not convert string to float/.test(msg)) return ['No se puede convertir ese texto a decimal', `${C('float()')} solo acepta textos como "3.5".`]
      if (/substring not found/.test(msg)) return ['index() no encontró el texto', `${C('index()')} da error cuando el texto no existe; ${C('find()')} en cambio retorna -1.`]
      break
    case 'AttributeError':
      if (/has no attribute 'append'/.test(msg))
        return ['En tu curso no se usa append', `Arma el resultado así: ${C('resultado = resultado + (valor,)')} si es una tupla, o ${C('resultado = resultado + [valor]')} si es una lista.`]
      if (/'NoneType' object has no attribute/.test(msg))
        return ['Hay un None donde esperabas un valor', `Algo vale None. Suele pasar cuando guardas el resultado de un método que no retorna nada (como ${C('add()')}) o a una función le falta el ${C('return')}.`]
      if ((m = msg.match(/'(\w+)' object has no attribute '(\w+)'/)))
        return [`El tipo ${m[1]} no tiene ${C(m[2])}`, `Revisa cómo escribiste el método (¿mayúsculas? ¿paréntesis?) y que lo llames sobre el tipo correcto.`]
      break
    case 'TypeError':
      if (/'NoneType' object is not subscriptable|'NoneType' object is not iterable|NoneType.*has no len|NoneType/.test(msg))
        return ['Hay un None donde esperabas un valor', `Algo vale None. La causa más común es una función a la que le falta el ${C('return')}.`]
      if (/can only concatenate str/.test(msg))
        return ['No se puede unir un texto con un número', `Convierte el número con ${C('str()')} antes de unirlo con +.`]
      if (/can only concatenate tuple/.test(msg))
        return ['Solo puedes sumar una tupla con otra tupla', `Para agregar un valor: ${C('resultado + (valor,)')}. La coma dentro del paréntesis es lo que lo convierte en tupla.`]
      if (/can only concatenate list/.test(msg))
        return ['Solo puedes sumar una lista con otra lista', `Para agregar un valor: ${C('resultado + [valor]')}.`]
      if ((m = msg.match(/unsupported operand type\(s\) for (.+): '(\w+)' and '(\w+)'/)))
        return [`No se puede usar ${C(m[1])} entre ${m[2]} y ${m[3]}`, `Los tipos no combinan. Convierte alguno con ${C('int()')}, ${C('float()')} o ${C('str()')}.`]
      if (/does not support item assignment/.test(msg))
        return ['Las tuplas y los textos no se modifican por posición', 'Construye un valor nuevo en lugar de cambiar una posición.']
      if (/object is not callable/.test(msg))
        return ['Usaste paréntesis donde no va', 'Estás llamando como función algo que no lo es. Revisa si querías multiplicar (usa *) o indexar (usa [ ]).']
      if (/positional argument/.test(msg))
        return ['Cantidad de argumentos incorrecta', 'Llamaste la función con más o menos valores de los que define en el def.']
      if (/has no len/.test(msg)) return ['len() no funciona con ese tipo', 'len() solo sirve con textos, tuplas, listas y conjuntos, no con números.']
      if (/is not iterable/.test(msg)) return ['No se puede recorrer eso con for', `Un número no se recorre directamente: usa ${C('range(...)')}.`]
      if (/not subscriptable/.test(msg)) return ['No se puede usar [ ] aquí', 'Los corchetes con índice solo funcionan con textos, tuplas y listas.']
      if (/expected str instance/.test(msg)) return ['join() solo une textos', `Convierte cada elemento con ${C('str()')} antes de unirlo.`]
      if (/'(<|>|<=|>=)' not supported/.test(msg)) return ['No se pueden comparar esos tipos', 'Estás comparando, por ejemplo, un texto con un número. Convierte alguno.']
      break
    default:
  }
  return [`Python lanzó un ${tipo}`, msg]
}

/** Textos de diagnóstico cuando el código corre pero el resultado no es el esperado. */
export function diagnosticos(res, primeraFalla, fn) {
  const out = []
  const a = res.analisis || {}
  if (primeraFalla?.es_none) {
    out.push(`Tu función devolvió ${C('None')}: no está retornando nada. ¿Olvidaste el ${C('return')}?` +
      (a.fn_con_print ? ` Imprimir con ${C('print()')} dentro de la función no es retornar: usa ${C('return')}.` : ''))
  }
  if (a.return_en_ciclo?.length)
    out.push(`El ${C('return')} de la línea ${a.return_en_ciclo[0]} está dentro del ciclo: se ejecuta en la primera vuelta y la función termina ahí. Muévelo después del ciclo (con menos sangría).`)
  for (const u of (a.metodo_sin_guardar || []).slice(0, 2))
    out.push(`En la línea ${u.linea} llamas ${C('.' + u.metodo + '()')} pero no guardas el resultado. Los textos y los conjuntos así no se modifican solos: guarda el resultado en una variable o retórnalo directamente.`)
  return out
}
