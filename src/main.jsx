import { createRoot } from 'react-dom/client'
import { lazy, Suspense } from 'react'
import './index.css'
import BureauPage from './pages/BureauPage.jsx'

// Lightweight path-based routing. The canonical /bureau surface is a standalone
// page with a real, shareable URL. App.jsx (the Most Wanted List) is lazy-loaded so
// visiting /bureau never loads it; it only fetches /bureau/latest.json.
const App = lazy(() => import('./App.jsx'))

const route = window.location.pathname.replace(/\/+$/, '') || '/'

createRoot(document.getElementById('root')).render(
  route === '/bureau'
    ? <BureauPage />
    : <Suspense fallback={null}><App /></Suspense>
)
