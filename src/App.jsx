import { useEffect, useState } from 'react'
import Mapa from './Mapa.jsx'
import Ejercicio from './Ejercicio.jsx'
import { NIVELES, POR_ID } from './data/levels.js'
import { leerEstado, nivelDesbloqueado } from './store.js'

function useRuta() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const f = () => setHash(window.location.hash)
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  const m = hash.match(/^#\/n\/(\d+)\/(\d+)$/)
  if (!m) return { vista: 'mapa' }
  const nivel = Number(m[1])
  const indice = Number(m[2])
  if (!POR_ID[`${nivel}-${indice}`]) return { vista: 'mapa' }
  return { vista: 'ejercicio', nivel, indice }
}

export default function App() {
  const ruta = useRuta()
  const bloqueado = ruta.vista === 'ejercicio' && !nivelDesbloqueado(leerEstado(), ruta.nivel)

  useEffect(() => {
    if (bloqueado) window.location.hash = '#/'
  }, [bloqueado])

  useEffect(() => {
    if (ruta.vista === 'ejercicio') window.scrollTo(0, 0)
  }, [ruta.vista, ruta.nivel, ruta.indice])

  if (ruta.vista === 'ejercicio' && !bloqueado) {
    return <Ejercicio key={`${ruta.nivel}-${ruta.indice}`} nivel={ruta.nivel} indice={ruta.indice} niveles={NIVELES.length} />
  }
  return <Mapa />
}
