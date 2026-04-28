// This is the registration page
// New users fill out this form to create their account

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { apiFetch } from '../api/client'
import { useAuth } from '../context/AuthContext'
import '../styles/auth.css'

export default function RegisterPage() {
  // Track the value of each input
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Error message shown if registration fails
  const [error, setError] = useState('')

  // True while the request is being sent
  const [loading, setLoading] = useState(false)

  // login() saves the token and user after registering
  const { login } = useAuth()

  // navigate() redirects to another page after success
  const navigate = useNavigate()

  // Handle the form being submitted
  async function handleSubmit(e) {
    e.preventDefault()  // prevent page refresh
    setError('')        // clear previous errors
    setLoading(true)

    try {
      // Send the new account info to the server
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ full_name: fullName, email, password }),
      })

      // Log in automatically after registering
      login(data.token, data.user)

      // Go to the main feed
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Header with logo */}
        <div className="auth-card-header">
          <h1><Leaf size={22} strokeWidth={1.5} className="auth-logo-leaf" />The Digital Garden</h1>
          <p className="auth-subtitle">Plant your first seed — create an account</p>
        </div>

        <div className="auth-card-body">
          {/* Registration form */}
          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Full name input */}
            <div className="form-group">
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Email input */}
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password input — must be at least 6 characters */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {/* Error message */}
            {error && <p className="error-msg">{error}</p>}

            {/* Submit button */}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Planting…' : 'Create account'}
            </button>
          </form>

          {/* Link to login page */}
          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
