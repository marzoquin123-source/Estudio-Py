import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { iniciar } from './runner.js'
import './styles.css'

iniciar() // empieza a cargar Python en segundo plano apenas abre la página
createRoot(document.getElementById('root')).render(<App />)
