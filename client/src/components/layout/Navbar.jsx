import { Link, useNavigate } from 'react-router-dom'
import { Leaf, LogOut, ShieldCheck } from 'lucide-react'
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
          <Leaf size={18} strokeWidth={1.75} />
          The Digital Garden
        </Link>
        <div className="navbar-right">
          {user?.role === 'admin' && (
            <Link to="/admin" className="navbar-link">
              <ShieldCheck size={14} strokeWidth={2} />
              Admin
            </Link>
          )}
          <span className="navbar-username">{user?.full_name}</span>
          <button className="navbar-logout" onClick={handleLogout}>
            <LogOut size={14} strokeWidth={2} />
            Log out
          </button>
        </div>
      </div>
    </nav>
  )
}
