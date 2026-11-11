import { useLayoutEffect, useRef } from 'react'

const SIMBOLOS = ['Tab', ':', '(', ')', '[', ']', '{', '}', '"', ',', '=', '#']

export default function Editor({ value, onChange, errorLine, onRun }) {
  const ta = useRef(null)
  const lineas = value.split('\n').length

  useLayoutEffect(() => {
    const el = ta.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [value])

  // execCommand mantiene el historial de deshacer; si no existe, se inserta a mano.
  function insertar(texto) {
    const el = ta.current
    el.focus()
    let ok = false
    try {
      ok = document.execCommand('insertText', false, texto)
    } catch {
      ok = false
    }
    if (!ok) {
      const { selectionStart: s, selectionEnd: e } = el
      onChange(value.slice(0, s) + texto + value.slice(e))
      requestAnimationFrame(() => el.setSelectionRange(s + texto.length, s + texto.length))
    }
  }

  function onKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      onRun?.()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      insertar('    ')
    } else if (e.key === 'Enter') {
      const el = ta.current
      const antes = value.slice(0, el.selectionStart)
      const linea = antes.slice(antes.lastIndexOf('\n') + 1)
      const sangria = linea.match(/^ */)[0]
      const extra = /:\s*$/.test(linea) ? '    ' : ''
      e.preventDefault()
      insertar('\n' + sangria + extra)
    }
  }

  return (
    <div className="editor">
      <div className="editor-caja">
        <div className="gutter" aria-hidden="true">
          {Array.from({ length: lineas }, (_, i) => (
            <div key={i} className={errorLine === i + 1 ? 'gl err' : 'gl'}>
              {i + 1}
            </div>
          ))}
        </div>
        <textarea
          ref={ta}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          wrap="off"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          aria-label="Editor de código Python"
          rows={lineas}
        />
      </div>
      <div className="simbolos" role="toolbar" aria-label="Símbolos rápidos">
        {SIMBOLOS.map((s) => (
          <button
            key={s}
            type="button"
            className="simbolo"
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => insertar(s === 'Tab' ? '    ' : s)}
          >
            {s === 'Tab' ? '⇥' : s}
          </button>
        ))}
      </div>
    </div>
  )
}
