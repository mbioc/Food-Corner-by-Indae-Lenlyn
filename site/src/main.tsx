import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// The admin panel is a separate chunk so customers never download it.
const AdminApp = lazy(() => import('./admin/AdminApp.tsx'))
const isAdmin = window.location.pathname.replace(import.meta.env.BASE_URL, '/').startsWith('/admin')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdmin ? (
      <Suspense fallback={null}>
        <AdminApp />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)
