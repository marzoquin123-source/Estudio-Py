import { useEffect, useState } from 'react'
import Editor from './Editor.jsx'
import { NIVELES, POR_ID, idsDeNivel } from './data/levels.js'
import { diagnosticos, traducirError } from './errores.js'
import { ejecutar, LIMITE_MS, reintentar, useRunner } from './runner.js'
import {
  borrarCodigo,
  guardarCodigo,
  leerEstado,
  marcarResuelto,
  nivelCompleto,
  rachaVisible,
  revelarPista,
  useEstado,
  verSolucion,
  xpPorPistas,
} from './store.js'
import { Confeti, Confirmar, Stats, Texto } from './ui.jsx'

function PanelError({ err, intro }) {
  const [titulo, explicacion] = traducirError(err)
  return (
    <div className="panel panel-mal">
      <h3>
        {intro && <span className="intro">{intro} </span>}
        {titulo}
      </h3>
      <p>
        <Texto>{explicacion}</Texto>
      </p>
      <p className="original">
        Python dijo: {err.tipo}: {err.msg}
        {err.linea ? ` (línea ${err.linea})` : ''}
      </p>
    </div>
  )
}

function Salida({ res }) {
  if (!res.salida) return null
  return (
    <div className="salida">
      <div className="salida-t">Lo que imprimió tu programa</div>
      <pre>{res.salida}{res.salida_cortada ? '\n… (salida recortada)' : ''}</pre>
    </div>
  )
}

function Resultado({ r, ej, siguiente, xpGanado, vioSol }) {
  if (!r) return null
  if (r.tipo === 'timeout')
    return (
      <div className="panel panel-aviso">
        <h3>⏱️ Tu código tardó más de {LIMITE_MS / 1000} segundos</h3>
        <p>
          Lo detuve porque probablemente tienes un <b>ciclo infinito</b>. En un <code>while</code>, revisa que la
          variable de la condición cambie en cada vuelta (¿olvidaste <code>i += 1</code>?) y que la condición
          algún día se vuelva falsa.
        </p>
      </div>
    )
  if (r.tipo === 'fallo')
    return (
      <div className="panel panel-aviso">
        <h3>No se pudo ejecutar</h3>
        <p>{r.mensaje}</p>
      </div>
    )
  const res = r.res
  if (res.fase === 'error_codigo')
    return (
      <>
        <PanelError err={res.error} />
        <Salida res={res} />
      </>
    )
  if (res.fase === 'sin_funcion')
    return (
      <div className="panel panel-mal">
        <h3>No encuentro tu función</h3>
        <p>
          Debe llamarse exactamente <code>{ej.fn}</code> y estar escrita con <code>def {ej.fn}({ej.params}):</code>.
        </p>
      </div>
    )

  const total = res.pruebas.length
  const buenas = res.pruebas.filter((p) => p.ok).length
  if (buenas === total)
    return (
      <>
        <div className="panel panel-bien">
          <h3>🎉 ¡Correcto! Pasaron las {total} pruebas</h3>
          <p>{xpGanado > 0 ? `+${xpGanado} XP` : vioSol ? 'Lo resolviste con la solución a la vista: no suma XP, pero cuenta para desbloquear el siguiente nivel.' : 'Ya habías resuelto este ejercicio, así que no suma XP de nuevo.'}</p>
          {siguiente}
        </div>
        <Salida res={res} />
      </>
    )

  const falla = res.pruebas.find((p) => !p.ok)
  const diag = diagnosticos(res, falla, ej.fn)
  return (
    <>
      <div className="panel panel-mal">
        <h3>
          Pasaron {buenas} de {total} pruebas
        </h3>
        {falla.error ? (
          <PanelErrorDentro falla={falla} ej={ej} />
        ) : (
          <dl className="caso">
            <dt>Entrada probada</dt>
            <dd>
              <code>
                {ej.fn}({falla.args})
              </code>
            </dd>
            <dt>Tu función devolvió</dt>
            <dd>
              <code>{falla.obtenido}</code>
            </dd>
            <dt>Se esperaba</dt>
            <dd>
              <code>{falla.esperado}</code>
            </dd>
          </dl>
        )}
        {diag.map((d, i) => (
          <p key={i} className="diag">
            💡 <Texto>{d}</Texto>
          </p>
        ))}
      </div>
      <Salida res={res} />
    </>
  )
}

function PanelErrorDentro({ falla, ej }) {
  const [titulo, explicacion] = traducirError(falla.error)
  return (
    <>
      <p>
        Al probar con{' '}
        <code>
          {ej.fn}({falla.args})
        </code>{' '}
        tu función falló:
      </p>
      <p className="titulo-err">{titulo}</p>
      <p>
        <Texto>{explicacion}</Texto>
      </p>
      <p className="original">
        Python dijo: {falla.error.tipo}: {falla.error.msg}
        {falla.error.linea ? ` (línea ${falla.error.linea})` : ''}
      </p>
    </>
  )
}

export default function Ejercicio({ nivel, indice }) {
  const id = `${nivel}-${indice}`
  const ej = POR_ID[id]
  const meta = NIVELES[nivel - 1]
  const e = useEstado()
  const runner = useRunner()
  const [codigo, setCodigo] = useState(() => e.codigo[id] ?? ej.inicial)
  const [r, setR] = useState(null)
  const [corriendo, setCorriendo] = useState(false)
  const [xpGanado, setXpGanado] = useState(0)
  const [celebrar, setCelebrar] = useState(false)
  const [reiniciar, setReiniciar] = useState(false)
  const [pedirSol, setPedirSol] = useState(false)
  const [solucion, setSolucion] = useState(null)

  const pistasVistas = e.pistas[id] || 0
  const resuelto = !!e.resueltos[id]
  const vioSol = !!e.vistas[id]
  const ids = idsDeNivel(nivel)

  const lineaError = r?.tipo === 'ok'
    ? r.res.fase === 'error_codigo'
      ? r.res.error?.linea
      : r.res.pruebas?.find((p) => !p.ok && p.error)?.error?.linea
    : null

  useEffect(() => {
    if (!vioSol) return
    import('./data/soluciones.js').then((m) => setSolucion(m.default[id] || null))
  }, [vioSol, id])

  function cambiar(texto) {
    setCodigo(texto)
    guardarCodigo(id, texto)
  }

  async function correr() {
    if (corriendo || runner.estado !== 'listo') return
    setCorriendo(true)
    setR(null)
    const res = await ejecutar(codigo, ej.fn, ej.tests)
    setCorriendo(false)
    setR(res)
    if (res.tipo === 'ok' && res.res.fase === 'pruebas' && res.res.pruebas.every((p) => p.ok)) {
      const xp = marcarResuelto(id)
      setXpGanado(xp)
      if (xp > 0 && nivelCompleto(leerEstado(), nivel)) setCelebrar(true)
    }
  }

  const sigId = ids.map((x) => x).find((x) => x !== id && !leerEstado().resueltos[x])
  const siguiente = sigId ? (
    <a className="btn btn-verde" href={`#/n/${nivel}/${POR_ID[sigId].indice}`}>
      Siguiente ejercicio →
    </a>
  ) : nivelCompleto(e, nivel) ? (
    <a className="btn btn-verde" href={nivel < NIVELES.length ? `#/n/${nivel + 1}/1` : '#/'}>
      {nivel < NIVELES.length ? 'Siguiente nivel →' : 'Volver al camino'}
    </a>
  ) : null

  const estadoPy =
    runner.estado === 'listo' ? null : runner.estado === 'error' ? (
      <div className="carga carga-error" role="alert">
        No se pudo cargar Python ({runner.detalleError}). Revisa tu conexión a internet (la primera vez se descarga desde
        un CDN).{' '}
        <button className="btn-texto" onClick={reintentar}>
          Reintentar
        </button>
      </div>
    ) : (
      <div className="carga" role="status">
        <span className="spinner" />
        {runner.estado === 'reiniciando'
          ? 'Reiniciando Python… (un momento)'
          : 'Cargando Python… (la primera vez tarda unos segundos)'}
      </div>
    )

  return (
    <main className="pagina ej">
      <header className="barra barra-ej">
        <a className="volver" href="#/" aria-label="Volver al camino">
          ✕
        </a>
        <div className="segmentos" aria-label={`Progreso del nivel ${nivel}`}>
          {ids.map((x) => (
            <a
              key={x}
              href={`#/n/${nivel}/${POR_ID[x].indice}`}
              className={`seg ${e.resueltos[x] ? 'ok' : ''} ${x === id ? 'actual' : ''}`}
              aria-label={`Ejercicio ${POR_ID[x].indice}${e.resueltos[x] ? ' resuelto' : ''}`}
            />
          ))}
        </div>
        <Stats xp={e.xp} racha={rachaVisible(e)} />
      </header>

      <section className="enunciado">
        <div className="etiqueta">
          Nivel {nivel} · {meta.titulo} · Ejercicio {indice} de 3 {resuelto && <span className="chip-ok">✓ resuelto</span>}
        </div>
        <h2>
          <code>{ej.fn}</code>
        </h2>
        <p>{ej.desc.join(' ')}</p>
      </section>

      {vioSol && solucion && !resuelto && (
        <section className="solucion">
          <b>Solución · escríbela tú en el editor (el pegado está desactivado)</b>
          <pre>{solucion}</pre>
        </section>
      )}

      <Editor value={codigo} onChange={cambiar} errorLine={lineaError} onRun={correr} bloquearPegar={vioSol && !resuelto} />

      {estadoPy}

      <div className="resultado" aria-live="polite">
        <Resultado r={r} ej={ej} siguiente={siguiente} xpGanado={xpGanado} vioSol={vioSol} />
      </div>

      {pistasVistas > 0 && (
        <section className="pistas">
          {ej.pistas.slice(0, pistasVistas).map((p, i) => (
            <div key={i} className="pista">
              <b>Pista {i + 1}</b>
              <p>
                <Texto>{p.texto}</Texto>
              </p>
              {p.codigo && <pre>{p.codigo}</pre>}
            </div>
          ))}
        </section>
      )}

      {!resuelto && !vioSol && pistasVistas >= ej.pistas.length && (
        <button className="btn-texto rendirse" onClick={() => setPedirSol(true)}>
          No puedo: ver la solución y reescribirla
        </button>
      )}

      <div className="acciones">
        <button className="btn btn-gris" onClick={() => setReiniciar(true)} title="Volver al código inicial">
          ↺ <span className="oculto-movil">Reiniciar</span>
        </button>
        <button
          className="btn btn-azul"
          disabled={pistasVistas >= ej.pistas.length}
          onClick={() => revelarPista(id, ej.pistas.length)}
          title={`Con cada pista ganas menos XP. Este ejercicio vale ${xpPorPistas(pistasVistas)} XP ahora`}
        >
          💡 Pista {Math.min(pistasVistas + 1, ej.pistas.length)}/{ej.pistas.length}
          {!resuelto && pistasVistas < ej.pistas.length && (
            <small> (−{xpPorPistas(pistasVistas) - xpPorPistas(pistasVistas + 1)} XP)</small>
          )}
        </button>
        <button className="btn btn-verde btn-grande" disabled={corriendo || runner.estado !== 'listo'} onClick={correr}>
          {corriendo ? 'Ejecutando…' : runner.estado !== 'listo' ? 'Cargando…' : '▶ Ejecutar'}
        </button>
      </div>

      {pedirSol && (
        <Confirmar
          titulo="¿Ver la solución?"
          texto="Verás una solución y el editor volverá al código inicial: tendrás que escribirla tú (no se puede pegar). Este ejercicio dará 0 XP."
          si="Sí, mostrar"
          no="Seguir intentando"
          onNo={() => setPedirSol(false)}
          onSi={() => {
            verSolucion(id)
            borrarCodigo(id)
            setCodigo(ej.inicial)
            setR(null)
            setPedirSol(false)
          }}
        />
      )}

      {reiniciar && (
        <Confirmar
          titulo="¿Reiniciar el código?"
          texto="Vas a perder lo que escribiste en este ejercicio y volverá el código inicial."
          si="Sí, reiniciar"
          no="Cancelar"
          onNo={() => setReiniciar(false)}
          onSi={() => {
            borrarCodigo(id)
            setCodigo(ej.inicial)
            setR(null)
            setReiniciar(false)
          }}
        />
      )}

      {celebrar && (
        <div className="modal-fondo celebracion" role="dialog" aria-modal="true" aria-label="Nivel completado">
          <Confeti />
          <div className="modal">
            <div className="trofeo">{nivel === NIVELES.length ? '🏆' : '🎉'}</div>
            <h2>{nivel === NIVELES.length ? '¡Terminaste los 20 niveles!' : `¡Nivel ${nivel} completado!`}</h2>
            <p>
              {meta.titulo} · {ids.reduce((s, x) => s + (leerEstado().resueltos[x]?.xp || 0), 0)} XP en este nivel
            </p>
            <div className="modal-botones">
              <a className="btn btn-gris" href="#/">
                Ver el camino
              </a>
              {nivel < NIVELES.length && (
                <a className="btn btn-verde" href={`#/n/${nivel + 1}/1`}>
                  Siguiente nivel →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
