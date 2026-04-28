// This is the entry point for the React app
// It renders the whole app into the HTML page

// StrictMode helps catch bugs during development
import { StrictMode } from 'react'
// createRoot is how React 18+ mounts the app to the page
import { createRoot } from 'react-dom/client'
// BrowserRouter gives us URL-based navigation (React Router)
import { BrowserRouter } from 'react-router-dom'
// AuthProvider wraps the app so any component can access the logged-in user
import { AuthProvider } from './context/AuthContext'
// Global CSS styles
import './index.css'
// The main App component that has all the routes
import App from './App.jsx'

// Find the <div id="root"> in index.html and render our React app inside it
createRoot(document.getElementById('root')).render(
  // StrictMode runs extra checks during development (no effect in production)
  <StrictMode>
    {/* BrowserRouter enables client-side navigation */}
    <BrowserRouter>
      {/* AuthProvider makes login state available to all components */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
