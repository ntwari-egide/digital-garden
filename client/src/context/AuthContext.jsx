// This file manages the logged-in user's state across the whole app
// Any component can access the current user and login/logout functions
// using the useAuth() hook at the bottom

// createContext creates a "shared box" that all components can read from
// useContext reads from that shared box
// useState holds reactive data
// useEffect runs code when the component first loads
import { createContext, useContext, useState, useEffect } from 'react'

// Create the auth context — this is the "shared box"
const AuthContext = createContext(null)

// AuthProvider wraps the whole app and provides auth state to all children
export function AuthProvider({ children }) {
  // The logged-in user object (or null if not logged in)
  const [user, setUser] = useState(null)

  // The JWT token string (or null if not logged in)
  const [token, setToken] = useState(null)

  // True while we're checking localStorage on first load
  const [isLoading, setIsLoading] = useState(true)

  // When the app first loads, check if the user was already logged in
  // (their token and user info might be saved in localStorage)
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    // If we have both saved, restore the session
    if (storedToken && storedUser) {
      try {
        // Parse the user JSON string back into an object
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch {
        // If the saved data is corrupted, clear it out
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }

    // Done loading — the rest of the app can render now
    setIsLoading(false)
  }, [])

  // Called after a successful login or register
  // Saves the token and user to localStorage so they persist on refresh
  function login(newToken, newUser) {
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  // Called when the user clicks "Log out"
  // Clears the saved session data
  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  // Provide the auth values and functions to all child components
  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook — lets any component easily access auth state
// Usage: const { user, login, logout } = useAuth()
export function useAuth() {
  return useContext(AuthContext)
}
