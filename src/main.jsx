import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Analytics } from '@vercel/analytics/react' // <-- Added import

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Analytics /> {/* <-- Added component */}
  </StrictMode>,
)