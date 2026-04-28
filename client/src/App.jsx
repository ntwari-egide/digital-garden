// This file defines all the URL routes in the app
// It decides which page to show based on the current URL

// Routes and Route are how React Router maps URLs to components
import { Routes, Route, Navigate } from 'react-router-dom'
// ProtectedRoute blocks pages that require login (or admin)
import ProtectedRoute from './components/auth/ProtectedRoute'
// Import all the page components
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import FeedPage from './pages/FeedPage'
import AdminPage from './pages/AdminPage'
import ProfilePage from './pages/ProfilePage'
import TagFeedPage from './pages/TagFeedPage'
import SearchPage from './pages/SearchPage'

export default function App() {
  return (
    <Routes>
      {/* Public pages — anyone can visit these */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected pages — you must be logged in to visit these */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<FeedPage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/tag/:tagname" element={<TagFeedPage />} />
        <Route path="/search" element={<SearchPage />} />
      </Route>

      {/* Admin-only pages — you must be logged in AND be an admin */}
      <Route element={<ProtectedRoute adminOnly />}>
        <Route path="/admin" element={<AdminPage />} />
      </Route>

      {/* If the URL doesn't match anything, go to the home page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
