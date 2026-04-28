// This file handles user registration and login
// It creates JWT tokens that the frontend uses to stay logged in

// Router lets us define routes in a separate file
import { Router } from 'express'
// bcrypt is used to securely hash (scramble) passwords before saving them
import bcrypt from 'bcryptjs'
// jsonwebtoken lets us create login tokens
import jwt from 'jsonwebtoken'
// query is our function that runs SQL commands on the database
import { query } from '../db/postgres.js'

// Create a new router for auth routes
const router = Router()

// POST /auth/register — create a new account
router.post('/register', async (req, res) => {
  // Pull the submitted fields out of the request body
  const full_name = req.body.full_name
  const email = req.body.email
  const password = req.body.password

  // Make sure all required fields are provided
  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'full_name, email, and password are required' })
  }

  // Password must be at least 6 characters
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  try {
    // Check if someone already has this email
    const existing = await query('SELECT id FROM users WHERE email = $1', [email])

    if (existing.rows.length > 0) {
      // Email is already taken
      return res.status(409).json({ error: 'Email already in use' })
    }

    // Hash the password before saving it — never store plain text passwords!
    // The "10" is the number of salt rounds — higher means more secure but slower
    const password_hash = await bcrypt.hash(password, 10)

    // Insert the new user into the database
    const result = await query(
      `INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, full_name, email, role`,
      [full_name, email, password_hash]
    )

    // Get the newly created user from the result
    const user = result.rows[0]

    // Create a login token that expires in 7 days
    // We store the user's id, email, and role inside the token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Send back the token and user info
    res.status(201).json({ token, user })
  } catch (err) {
    console.log('Registration error:', err)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// POST /auth/login — log into an existing account
router.post('/login', async (req, res) => {
  // Get the submitted email and password
  const email = req.body.email
  const password = req.body.password

  // Make sure both fields are present
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' })
  }

  try {
    // Look up the user by their email address
    const result = await query(
      'SELECT id, full_name, email, password_hash, role FROM users WHERE email = $1',
      [email]
    )

    // Get the user from the result (or undefined if not found)
    const user = result.rows[0]

    // If no user found, or if the password doesn't match, return an error
    // bcrypt.compare checks the plain password against the stored hash
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Create a login token for the user
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Build a user object without the password hash — we never send that to the client
    const safeUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role
    }

    res.json({ token, user: safeUser })
  } catch (err) {
    console.log('Login error:', err)
    res.status(500).json({ error: 'Login failed' })
  }
})

// POST /auth/logout — the client just throws away their token
// The server doesn't store tokens so there's nothing to delete
router.post('/logout', (_req, res) => {
  res.json({ message: 'Logged out successfully' })
})

export default router
