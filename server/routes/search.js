import { Router } from 'express'
import { query } from '../db/postgres.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /search?q=term — search posts (content/title) and users (name)
router.get('/', requireAuth, async (req, res) => {
  const q = (req.query.q || '').trim()
  if (!q) return res.json({ posts: [], users: [] })

  const pattern = `%${q}%`

  // If query starts with #, use word-boundary regex on content only
  const isTag = q.startsWith('#')
  const tagTerm = isTag ? q.slice(1) : null

  try {
    const [postsResult, usersResult] = await Promise.all([
      query(`
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
        WHERE (
          ($2::text IS NOT NULL AND p.content ~* ('(^|[^a-zA-Z0-9_])#' || $2 || '([^a-zA-Z0-9_]|$)'))
          OR
          ($2::text IS NULL AND (p.content ILIKE $1 OR COALESCE(p.title, '') ILIKE $1))
        )
        GROUP BY p.id, u.id
        ORDER BY p.created_at DESC
        LIMIT 50
      `, [pattern, tagTerm]),

      query(`
        SELECT id, full_name
        FROM users
        WHERE full_name ILIKE $1
        ORDER BY full_name
        LIMIT 20
      `, [pattern]),
    ])

    res.json({
      posts: postsResult.rows,
      users: usersResult.rows,
    })
  } catch (err) {
    console.error('Search error:', err)
    res.status(500).json({ error: 'Search failed' })
  }
})

// GET /search/suggest?q=term — lightweight suggestions for typeahead
router.get('/suggest', requireAuth, async (req, res) => {
  const q = (req.query.q || '').trim()
  if (q.length < 1) return res.json({ users: [], tags: [] })

  const isTag = q.startsWith('#')
  const tagPrefix = isTag ? q.slice(1).toLowerCase() : q.toLowerCase()
  const userPattern = `%${q}%`

  try {
    const [usersResult, tagsResult] = await Promise.all([
      // Only search users if query doesn't start with #
      isTag
        ? Promise.resolve({ rows: [] })
        : query(`
            SELECT id, full_name
            FROM users
            WHERE full_name ILIKE $1
            ORDER BY full_name
            LIMIT 5
          `, [userPattern]),

      // Extract distinct hashtags from post content matching the prefix
      query(`
        SELECT DISTINCT lower(m[1]) AS tag
        FROM posts, regexp_matches(content, '#([a-zA-Z0-9_]+)', 'g') AS m
        WHERE lower(m[1]) LIKE $1
        ORDER BY tag
        LIMIT 6
      `, [`${tagPrefix}%`]),
    ])

    res.json({
      users: usersResult.rows,
      tags: tagsResult.rows.map(r => r.tag),
    })
  } catch (err) {
    res.status(500).json({ error: 'Suggest failed' })
  }
})

export default router
