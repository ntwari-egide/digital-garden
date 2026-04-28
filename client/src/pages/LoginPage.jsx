// This is the login page
// Users enter their email and password here to sign in

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { apiFetch } from '../api/client'
import { useAuth } from '../context/AuthContext'
import '../styles/auth.css'

export default function LoginPage() {
  // Track what's typed in each input field
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Error message to show if login fails
  const [error, setError] = useState('')

  // True while the login request is being sent
  const [loading, setLoading] = useState(false)

  // login() saves the token and user info to context
  const { login } = useAuth()

  // navigate() lets us redirect to another page after login
  const navigate = useNavigate()

  // Handle the form being submitted
  async function handleSubmit(e) {
    e.preventDefault()  // stop the page from refreshing
    setError('')        // clear any previous error
    setLoading(true)

    try {
      // Send the email and password to the server
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      // Save the token and user to localStorage and context
      login(data.token, data.user)

      // Redirect to the main feed
      navigate('/')
    } catch (err) {
      // Show the error message from the server
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Header with logo and subtitle */}
        <div className="auth-card-header">
          <h1><Leaf size={22} strokeWidth={1.5} className="auth-logo-leaf" />The Digital Garden</h1>
          <p className="auth-subtitle">Welcome back — sign in to continue</p>
        </div>

        <div className="auth-card-body">
          {/* Login form */}
          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Email input */}
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Password input */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Show error message if login failed */}
            {error && <p className="error-msg">{error}</p>}

            {/* Submit button */}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Link to the register page */}
          <p className="auth-footer">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
