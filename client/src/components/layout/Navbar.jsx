import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Leaf, LogOut, ShieldCheck, Search, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../api/client'
import '../../styles/navbar.css'

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState({ users: [], tags: [] })
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debounceRef = useRef(null)
  const containerRef = useRef(null)

  // Fetch suggestions with debounce
  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (query.trim().length < 1) {
      setSuggestions({ users: [], tags: [] })
      setShowSuggestions(false)
      return
    }
    debounceRef.current = setTimeout(() => {
      apiFetch(`/search/suggest?q=${encodeURIComponent(query.trim())}`)
        .then(data => {
          setSuggestions(data)
          setShowSuggestions(data.users.length > 0 || data.tags.length > 0)
          setActiveIndex(-1)
        })
        .catch(() => {})
    }, 250)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    try {
      await apiFetch('/auth/logout', { method: 'POST' })
    } catch {}
    logout()
    navigate('/login')
  }

  function handleSearch(e) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setShowSuggestions(false)
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  // Flat list of suggestion items for keyboard nav
  const allItems = [
    ...suggestions.users.map(u => ({ type: 'user', ...u })),
    ...suggestions.tags.map(t => ({ type: 'tag', tag: t })),
  ]

  function handleKeyDown(e) {
    if (!showSuggestions) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, allItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, -1))
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setActiveIndex(-1)
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      activateSuggestion(allItems[activeIndex])
    }
  }

  function activateSuggestion(item) {
    setShowSuggestions(false)
    setQuery('')
    if (item.type === 'user') {
      navigate(`/profile/${item.id}`)
    } else {
      navigate(`/tag/${item.tag}`)
    }
  }

  const hasSuggestions = suggestions.users.length > 0 || suggestions.tags.length > 0

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <Leaf size={18} strokeWidth={1.75} />
          The Digital Garden
        </Link>

        <div className="navbar-search-wrap" ref={containerRef}>
          <form className="navbar-search" onSubmit={handleSearch} role="search">
            <Search size={13} strokeWidth={2} className="navbar-search-icon" />
            <input
              className="navbar-search-input"
              type="search"
              placeholder="Search notes, #tags, people…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => hasSuggestions && setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              aria-label="Search"
              aria-autocomplete="list"
              aria-expanded={showSuggestions}
              autoComplete="off"
            />
          </form>

          {showSuggestions && hasSuggestions && (
            <div className="search-dropdown">
              {suggestions.users.length > 0 && (
                <div className="search-dropdown-group">
                  <span className="search-dropdown-label">People</span>
                  {suggestions.users.map((u, i) => (
                    <button
                      key={u.id}
                      className={`search-dropdown-item${activeIndex === i ? ' search-dropdown-item--active' : ''}`}
                      onMouseDown={() => activateSuggestion({ type: 'user', ...u })}
                      onMouseEnter={() => setActiveIndex(i)}
                    >
                      <span className="search-dropdown-avatar">{initials(u.full_name)}</span>
                      <span className="search-dropdown-text">{u.full_name}</span>
                    </button>
                  ))}
                </div>
              )}

              {suggestions.tags.length > 0 && (
                <div className="search-dropdown-group">
                  <span className="search-dropdown-label">Tags</span>
                  {suggestions.tags.map((tag, i) => {
                    const idx = suggestions.users.length + i
                    return (
                      <button
                        key={tag}
                        className={`search-dropdown-item${activeIndex === idx ? ' search-dropdown-item--active' : ''}`}
                        onMouseDown={() => activateSuggestion({ type: 'tag', tag })}
                        onMouseEnter={() => setActiveIndex(idx)}
                      >
                        <span className="search-dropdown-tag-icon">#</span>
                        <span className="search-dropdown-text">#{tag}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="navbar-right">
          {user?.role === 'admin' && (
            <Link to="/admin" className="navbar-link">
              <ShieldCheck size={14} strokeWidth={2} />
              Admin
            </Link>
          )}
          <Link to={`/profile/${user?.id}`} className="navbar-username">{user?.full_name}</Link>
          <button className="navbar-logout" onClick={handleLogout}>
            <LogOut size={14} strokeWidth={2} />
            Log out
          </button>
        </div>
      </div>
    </nav>
  )
}
