import { useMemo } from 'react'

/** Muestra texto donde lo que va entre `comillas invertidas` se ve como código. */
export function Texto({ children }) {
  const partes = String(children).split('`')
  return partes.map((p, i) => (i % 2 ? <code key={i}>{p}</code> : <span key={i}>{p}</span>))
}

export function Confirmar({ titulo, texto, si, no, onSi, onNo, peligro }) {
  return (
    <div className="modal-fondo" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="modal">
        <h2>{titulo}</h2>
        <p>{texto}</p>
        <div className="modal-botones">
          <button className="btn btn-gris" onClick={onNo}>
            {no}
          </button>
          <button className={'btn ' + (peligro ? 'btn-rojo' : 'btn-verde')} onClick={onSi}>
            {si}
          </button>
        </div>
      </div>
    </div>
  )
}

const COLORES = ['#58cc02', '#1cb0f6', '#ffc800', '#ff4b4b', '#ce82ff', '#ff9600']

export function Confeti() {
  const piezas = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        left: Math.round(Math.random() * 100),
        delay: (Math.random() * 0.8).toFixed(2),
        dur: (1.8 + Math.random() * 1.4).toFixed(2),
        color: COLORES[i % COLORES.length],
        giro: Math.round(Math.random() * 360),
      })),
    [],
  )
  return (
    <div className="confeti" aria-hidden="true">
      {piezas.map((p, i) => (
        <i
          key={i}
          style={{
            left: p.left + '%',
            background: p.color,
            animationDelay: p.delay + 's',
            animationDuration: p.dur + 's',
            transform: `rotate(${p.giro}deg)`,
          }}
        />
      ))}
    </div>
  )
}

export function Stats({ xp, racha }) {
  return (
    <div className="stats">
      <span className="stat stat-racha" title="Racha de días">
        🔥 <b>{racha}</b>
      </span>
      <span className="stat stat-xp" title="Puntos de experiencia">
        ⭐ <b>{xp}</b>
      </span>
    </div>
  )
}
