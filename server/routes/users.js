import { Router } from 'express'
import { query } from '../db/postgres.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /users/:id — profile stats
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const result = await query(`
      SELECT u.id, u.full_name,
        COUNT(DISTINCT p.id)::int AS post_count,
        COUNT(DISTINCT l.id)::int  AS total_resonances
      FROM users u
      LEFT JOIN posts p ON p.user_id = u.id
      LEFT JOIN likes l ON l.post_id = p.id
      WHERE u.id = $1
      GROUP BY u.id, u.full_name
    `, [req.params.id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile' })
  }
})

// GET /users/:id/posts — all posts by user
router.get('/:id/posts', requireAuth, async (req, res) => {
  try {
    const result = await query(`
      SELECT
        p.id, p.title, p.content, p.image_url, p.created_at,
        u.id   AS user_id,
        u.full_name,
        COUNT(DISTINCT l.id)::int AS like_count,
        COUNT(DISTINCT c.id)::int AS comment_count
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN likes    l ON l.post_id = p.id
      LEFT JOIN comments c ON c.post_id = p.id
      WHERE p.user_id = $1
      GROUP BY p.id, u.id
      ORDER BY p.created_at DESC
    `, [req.params.id])

    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user posts' })
  }
})

export default router
