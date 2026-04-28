// This component protects routes that require login
// If the user isn't logged in, it redirects them to /login
// If adminOnly is true and the user isn't an admin, it redirects to /

// Navigate redirects to another page, Outlet renders the child route
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// adminOnly defaults to false — set it to true for admin-only pages
export default function ProtectedRoute({ adminOnly = false }) {
  // Get the current user and loading state from auth context
  const { user, isLoading } = useAuth()

  // Wait for the auth check to finish before deciding what to render
  // (prevents a flash of the login page on refresh)
  if (isLoading) return null

  // If there's no user, redirect to login
  if (!user) return <Navigate to="/login" replace />

  // If this is an admin-only route and the user isn't an admin, go home
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />

  // User is allowed — render the child route
  return <Outlet />
}
