import { useEffect, useRef, useState } from 'react'
import { NIVELES, idsDeNivel, POR_ID } from './data/levels.js'
import {
  borrarTodo,
  nivelActual,
  nivelCompleto,
  nivelDesbloqueado,
  practicoHoy,
  rachaVisible,
  resueltosDeNivel,
  useEstado,
} from './store.js'
import { Confirmar, Stats } from './ui.jsx'

const ANCHO = 300
const DY = 150
const TOP = 56
const R = 36
const px = (i) => ANCHO / 2 + 78 * Math.sin(i * 0.95)
const py = (i) => TOP + i * DY

function destinoDeNivel(e, n) {
  const ids = idsDeNivel(n)
  const pendiente = ids.find((id) => !e.resueltos[id])
  return `#/n/${n}/${POR_ID[pendiente || ids[0]].indice}`
}

function Anillo({ hechos }) {
  const r = R + 6
  const c = 2 * Math.PI * r
  const tramo = c / 3
  return (
    <svg className="anillo" width={(r + 5) * 2} height={(r + 5) * 2} viewBox={`${-(r + 5)} ${-(r + 5)} ${(r + 5) * 2} ${(r + 5) * 2}`}>
      {[0, 1, 2].map((k) => (
        <circle
          key={k}
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className={k < hechos ? 'seg-ok' : 'seg-no'}
          strokeDasharray={`${tramo - 14} ${c - (tramo - 14)}`}
          strokeDashoffset={-(k * tramo + 7)}
          transform="rotate(-90)"
        />
      ))}
    </svg>
  )
}

export default function Mapa() {
  const e = useEstado()
  const [borrar, setBorrar] = useState(false)
  const [aviso, setAviso] = useState('')
  const actualRef = useRef(null)
  const actual = nivelActual(e)

  useEffect(() => {
    actualRef.current?.scrollIntoView({ block: 'center' })
    // solo al abrir el mapa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(''), 2200)
    return () => clearTimeout(t)
  }, [aviso])

  const alto = TOP * 2 + (NIVELES.length - 1) * DY
  const completados = NIVELES.filter((l) => nivelCompleto(e, l.n)).length
  const total = Object.keys(e.resueltos).length

  return (
    <main className="pagina">
      <header className="barra">
        <h1 className="logo">
          <span className="logo-py">py</span>Camino
        </h1>
        <Stats xp={e.xp} racha={rachaVisible(e)} />
      </header>

      <section className="resumen">
        <div>
          <b>{completados}</b>/20 niveles · <b>{total}</b>/60 ejercicios
        </div>
        <div className="barra-prog" role="progressbar" aria-valuemin={0} aria-valuemax={60} aria-valuenow={total}>
          <div style={{ width: (total / 60) * 100 + '%' }} />
        </div>
        <p className="racha-msg">
          {practicoHoy(e)
            ? '¡Ya practicaste hoy! Tu racha está a salvo.'
            : rachaVisible(e) > 0
              ? 'Resuelve un ejercicio hoy para mantener tu racha.'
              : 'Resuelve un ejercicio hoy para empezar una racha.'}
        </p>
      </section>

      <div className="camino" style={{ width: ANCHO, height: alto }}>
        <svg className="camino-svg" width={ANCHO} height={alto} viewBox={`0 0 ${ANCHO} ${alto}`} aria-hidden="true">
          {NIVELES.slice(0, -1).map((l, i) => {
            const x0 = px(i), y0 = py(i), x1 = px(i + 1), y1 = py(i + 1)
            const d = `M ${x0} ${y0} C ${x0} ${y0 + DY / 2}, ${x1} ${y1 - DY / 2}, ${x1} ${y1}`
            return <path key={l.n} d={d} className={nivelCompleto(e, l.n) ? 'tramo hecho' : 'tramo'} />
          })}
        </svg>

        {NIVELES.map((l, i) => {
          const completo = nivelCompleto(e, l.n)
          const libre = nivelDesbloqueado(e, l.n)
          const hechos = resueltosDeNivel(e, l.n)
          const estadoNodo = completo ? 'completo' : libre ? 'libre' : 'bloqueado'
          const esActual = l.n === actual
          const contenido = (
            <>
              {libre && <Anillo hechos={hechos} />}
              <span className="nodo-icono">{completo ? '✓' : libre ? l.icono : '🔒'}</span>
              <span className="nodo-num">{l.n}</span>
            </>
          )
          return (
            <div
              key={l.n}
              className="nodo-caja"
              style={{ left: px(i), top: py(i) }}
              ref={esActual ? actualRef : null}
            >
              {esActual && <span className="burbuja">¡EMPIEZA!</span>}
              {libre ? (
                <a
                  href={destinoDeNivel(e, l.n)}
                  className={`nodo ${estadoNodo} ${esActual ? 'actual' : ''}`}
                  aria-label={`Nivel ${l.n}: ${l.titulo}. ${hechos} de 3 ejercicios resueltos`}
                >
                  {contenido}
                </a>
              ) : (
                <button
                  className="nodo bloqueado"
                  aria-label={`Nivel ${l.n}: ${l.titulo}. Bloqueado`}
                  onClick={() => setAviso(`Completa los 3 ejercicios del nivel ${l.n - 1} para desbloquear este.`)}
                >
                  {contenido}
                </button>
              )}
              <span className="nodo-titulo">
                <b>Nivel {l.n}</b>
                {l.titulo}
              </span>
            </div>
          )
        })}
      </div>

      <footer className="pie">
        <button className="btn-texto" onClick={() => setBorrar(true)}>
          Borrar todo mi progreso
        </button>
      </footer>

      {aviso && <div className="aviso" role="status">{aviso}</div>}

      {borrar && (
        <Confirmar
          peligro
          titulo="¿Borrar todo tu progreso?"
          texto="Se borrarán los niveles completados, el código que escribiste, tu XP y tu racha. Esto no se puede deshacer."
          si="Sí, borrar todo"
          no="Cancelar"
          onNo={() => setBorrar(false)}
          onSi={() => {
            borrarTodo()
            setBorrar(false)
          }}
        />
      )}
    </main>
  )
}
