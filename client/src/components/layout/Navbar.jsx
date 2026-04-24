import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../api/client'
import '../../styles/navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await apiFetch('/auth/logout', { method: 'POST' })
    } catch {}
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="navbar-logo-leaf">🌿</span>
          The Digital Garden
        </Link>
        <div className="navbar-right">
          {user?.role === 'admin' && (
            <Link to="/admin" className="navbar-link">Admin</Link>
          )}
          <span className="navbar-username">{user?.full_name}</span>
          <button className="navbar-logout" onClick={handleLogout}>Log out</button>
        </div>
      </div>
    </nav>
  )
}
