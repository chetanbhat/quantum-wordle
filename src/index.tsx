import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { startAnalytics } from './lib/analytics'
import { AlertProvider } from './context/AlertContext'
import { TransferPage } from './components/transfer/TransferPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {window.location.pathname === '/transfer' ? (
      <TransferPage />
    ) : (
      <AlertProvider>
        <App />
      </AlertProvider>
    )}
  </StrictMode>,
)

startAnalytics()
