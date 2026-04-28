// This is the navigation bar shown at the top of every page
// It has the logo, search bar (with live suggestions), and logout button

import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
// Icons from the lucide-react library
import { Leaf, LogOut, ShieldCheck, Search, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../api/client'
import '../../styles/navbar.css'

// Helper: get the first letter of each word in a name, up to 2 letters
// Example: "John Doe" => "JD"
function initials(name = '') {
  // Split the name into words
  var words = name.split(' ')
  // Get the first letter of each word
  var letters = words.map(w => w[0])
  // Join them and take at most 2, then make uppercase
  return letters.join('').slice(0, 2).toUpperCase()
}

export default function Navbar() {
  // Get the logged-in user and logout function from context
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // The text currently typed in the search box
  const [query, setQuery] = useState('')

  // The suggestions to show in the dropdown (users and hashtags)
  const [suggestions, setSuggestions] = useState({ users: [], tags: [] })

  // Whether the suggestions dropdown is visible
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Which suggestion is highlighted by keyboard arrow keys (-1 = none)
  const [activeIndex, setActiveIndex] = useState(-1)

  // Used to implement "debounce" — wait a moment before fetching suggestions
  const debounceRef = useRef(null)

  // Reference to the search container, used to detect outside clicks
  const containerRef = useRef(null)

  // Fetch search suggestions whenever the query text changes
  useEffect(() => {
    // Cancel any pending fetch from the previous keystroke
    clearTimeout(debounceRef.current)

    // If the search box is empty, clear suggestions and hide the dropdown
    if (query.trim().length < 1) {
      setSuggestions({ users: [], tags: [] })
      setShowSuggestions(false)
      return
    }

    // Wait 250ms after the user stops typing before fetching
    // This prevents a request on every single keystroke
    debounceRef.current = setTimeout(() => {
      apiFetch(`/search/suggest?q=${encodeURIComponent(query.trim())}`)
        .then(data => {
          setSuggestions(data)
          // Only show the dropdown if there are results
          setShowSuggestions(data.users.length > 0 || data.tags.length > 0)
          // Reset keyboard selection when new results come in
          setActiveIndex(-1)
        })
        .catch(() => {})  // silently ignore errors in the suggestion box
    }, 250)

    // Clean up the timeout if the component re-renders before it fires
    return () => clearTimeout(debounceRef.current)
  }, [query])

  // Close the dropdown if the user clicks anywhere outside the search box
  useEffect(() => {
    function handleClickOutside(e) {
      // Check if the click was outside our search container
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }

    // Add the event listener when this component mounts
    document.addEventListener('mousedown', handleClickOutside)

    // Remove it when the component unmounts to avoid memory leaks
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle clicking the logout button
  async function handleLogout() {
    try {
      // Tell the server the user is logging out (optional — server doesn't track tokens)
      await apiFetch('/auth/logout', { method: 'POST' })
    } catch {}
    // Clear the local session regardless
    logout()
    navigate('/login')
  }

  // Handle submitting the search form
  function handleSearch(e) {
    e.preventDefault()  // don't refresh the page
    const q = query.trim()
    if (!q) return  // don't search if the box is empty
    setShowSuggestions(false)
    // Navigate to the search results page with the query in the URL
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  // Build a flat list of all suggestion items for keyboard navigation
  const allItems = [
    // Add user suggestions first
    ...suggestions.users.map(u => ({ type: 'user', ...u })),
    // Then tag suggestions
    ...suggestions.tags.map(t => ({ type: 'tag', tag: t })),
  ]

  // Handle keyboard arrow keys and Enter in the search box
  function handleKeyDown(e) {
    // Ignore key events when the dropdown isn't visible
    if (!showSuggestions) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      // Move selection down (don't go past the last item)
      setActiveIndex(i => Math.min(i + 1, allItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      // Move selection up (don't go above -1)
      setActiveIndex(i => Math.max(i - 1, -1))
    } else if (e.key === 'Escape') {
      // Close the dropdown
      setShowSuggestions(false)
      setActiveIndex(-1)
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      // Navigate to the highlighted suggestion
      activateSuggestion(allItems[activeIndex])
    }
  }

  // Navigate to a suggestion when clicked or selected with Enter
  function activateSuggestion(item) {
    setShowSuggestions(false)
    setQuery('')  // clear the search box

    if (item.type === 'user') {
      // Go to the user's profile page
      navigate(`/profile/${item.id}`)
    } else {
      // Go to the hashtag feed
      navigate(`/tag/${item.tag}`)
    }
  }

  // True if there are any suggestions to show
  const hasSuggestions = suggestions.users.length > 0 || suggestions.tags.length > 0

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo and site name — links to the home feed */}
        <Link to="/" className="navbar-logo">
          <Leaf size={18} strokeWidth={1.75} />
          The Digital Garden
        </Link>

        {/* Search bar with autocomplete dropdown */}
        <div className="navbar-search-wrap" ref={containerRef}>
          <form className="navbar-search" onSubmit={handleSearch} role="search">
            <Search size={13} strokeWidth={2} className="navbar-search-icon" />
            <input
              className="navbar-search-input"
              type="search"
              placeholder="Search notes, #tags, people…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              // Re-show dropdown on focus if there are already suggestions loaded
              onFocus={() => hasSuggestions && setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              aria-label="Search"
              aria-autocomplete="list"
              aria-expanded={showSuggestions}
              autoComplete="off"
            />
          </form>

          {/* Suggestions dropdown — only shown when there are results */}
          {showSuggestions && hasSuggestions && (
            <div className="search-dropdown">
              {/* User suggestions section */}
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

              {/* Hashtag suggestions section */}
              {suggestions.tags.length > 0 && (
                <div className="search-dropdown-group">
                  <span className="search-dropdown-label">Tags</span>
                  {suggestions.tags.map((tag, i) => {
                    // Tags come after users in the allItems list, so offset the index
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

        {/* Right side: admin link (if admin), profile name, logout button */}
        <div className="navbar-right">
          {/* Only show the Admin link if the user is an admin */}
          {user != null && user.role === 'admin' && (
            <Link to="/admin" className="navbar-link">
              <ShieldCheck size={14} strokeWidth={2} />
              Admin
            </Link>
          )}

          {/* Link to the user's own profile page */}
          <Link to={`/profile/${user != null ? user.id : ''}`} className="navbar-username">
            {user != null ? user.full_name : ''}
          </Link>

          {/* Logout button */}
          <button className="navbar-logout" onClick={handleLogout}>
            <LogOut size={14} strokeWidth={2} />
            Log out
          </button>
        </div>
      </div>
    </nav>
  )
}
