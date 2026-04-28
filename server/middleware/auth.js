// This file has two middleware functions that protect our routes
// Middleware is code that runs before the actual route handler
// It checks if the user is allowed to access something

// jsonwebtoken lets us create and verify login tokens
import jwt from 'jsonwebtoken'

// This function checks if the user is logged in
// It looks for a token in the request's Authorization header
export function requireAuth(req, res, next) {
  // Get the Authorization header from the request
  const header = req.headers.authorization

  // If there's no header, or it doesn't start with "Bearer ", reject the request
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  // The token comes after "Bearer " — so we cut off the first 7 characters
  const token = header.slice(7)

  // Try to verify the token using our secret key
  try {
    // jwt.verify checks if the token is valid and not expired
    // It decodes the token and gives us back the user info we stored in it
    req.user = jwt.verify(token, process.env.JWT_SECRET)

    // Token is valid — move on to the next step
    next()
  } catch {
    // Token was invalid or expired
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// This function checks if the logged-in user is an admin
// It must run AFTER requireAuth so req.user is already set
export function requireAdmin(req, res, next) {
  // Check if the user's role is "admin"
  if (req.user == null || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }

  // User is an admin — let them through
  next()
}
