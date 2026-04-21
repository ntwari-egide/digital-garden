import { Router } from 'express'
import { query } from '../db/postgres.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

// GET /posts — all posts, newest first (public)
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        p.id, p.content, p.created_at,
        u.id   AS user_id,
        u.full_name,
        COUNT(DISTINCT l.id)::int AS like_count,
        COUNT(DISTINCT c.id)::int AS comment_count
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN likes    l ON l.post_id = p.id
      LEFT JOIN comments c ON c.post_id = p.id
      GROUP BY p.id, u.id
      ORDER BY p.created_at DESC
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' })
  }
})

// POST /posts — create a post (auth required)
router.post('/', requireAuth, async (req, res) => {
  const { content } = req.body
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Content is required' })
  }
  if (content.length > 280) {
    return res.status(400).json({ error: 'Content must be 280 characters or fewer' })
  }

  try {
    const result = await query(
      `INSERT INTO posts (user_id, content) VALUES ($1, $2)
       RETURNING id, content, created_at, user_id`,
      [req.user.id, content.trim()]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to create post' })
  }
})

// DELETE /posts/:id — user deletes their own post
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found or not yours' })
    }
    res.json({ message: 'Post deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post' })
  }
})

// DELETE /posts/admin/:id — admin deletes any post
router.delete('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM posts WHERE id = $1 RETURNING id',
      [req.params.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' })
    }
    res.json({ message: 'Post deleted by admin' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post' })
  }
})

// GET /posts/:id/comments — all comments for a post
router.get('/:id/comments', async (req, res) => {
  try {
    const result = await query(`
      SELECT c.id, c.content, c.created_at,
             u.id AS user_id, u.full_name
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `, [req.params.id])
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments' })
  }
})

// POST /posts/:id/comments — add a comment (auth required)
router.post('/:id/comments', requireAuth, async (req, res) => {
  const { content } = req.body
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Content is required' })
  }

  try {
    const post = await query('SELECT id FROM posts WHERE id = $1', [req.params.id])
    if (post.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' })
    }

    const result = await query(
      `INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3)
       RETURNING id, content, created_at, post_id, user_id`,
      [req.params.id, req.user.id, content.trim()]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment' })
  }
})

// POST /posts/:id/like — toggle like (auth required)
router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const existing = await query(
      'SELECT id FROM likes WHERE post_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )

    if (existing.rows.length > 0) {
      await query('DELETE FROM likes WHERE post_id = $1 AND user_id = $2',
        [req.params.id, req.user.id])
      return res.json({ liked: false })
    }

    await query('INSERT INTO likes (post_id, user_id) VALUES ($1, $2)',
      [req.params.id, req.user.id])
    res.json({ liked: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle like' })
  }
})

// GET /posts/:id/likes — like count for a post
router.get('/:id/likes', async (req, res) => {
  try {
    const result = await query(
      'SELECT COUNT(*)::int AS like_count FROM likes WHERE post_id = $1',
      [req.params.id]
    )
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch likes' })
  }
})

export default router
