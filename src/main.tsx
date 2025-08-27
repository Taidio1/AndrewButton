import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AudioProvider } from './contexts/AudioContext'
import './index.css'

console.log('🚀 main.tsx loaded')
console.log('React version:', React.version)
console.log('Root element:', document.getElementById('root'))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AudioProvider>
      <App />
    </AudioProvider>
  </React.StrictMode>,
)
