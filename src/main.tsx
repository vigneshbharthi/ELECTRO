import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { APP_TITLE } from './lib/appConfig'

// Set title synchronously before React mounts — avoids flicker (index.html has generic fallback)
document.title = APP_TITLE;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
