import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '8px', fontFamily: 'inherit' },
          success: { style: { background: '#166534', color: '#fff' } },
          error:   { style: { background: '#991b1b', color: '#fff' } },
        }}
      />
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

