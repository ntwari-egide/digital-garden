// This file handles search — both full results and typeahead suggestions
// Users can search for posts by content/title, or filter by hashtag using #

import { Router } from 'express'
import { query } from '../db/postgres.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /search?q=term — search posts and users
// If the query starts with #, search for posts with that hashtag instead
router.get('/', requireAuth, async (req, res) => {
  // Get the search term from the URL, trim any extra whitespace
  const q = (req.query.q || '').trim()

  // If nothing was typed, return empty results
  if (!q) return res.json({ posts: [], users: [] })

  // Build a LIKE pattern — %term% matches anything containing the term
  const pattern = `%${q}%`

  // Check if the user is searching for a hashtag (starts with #)
  const isTag = q.startsWith('#')

  // If it's a tag search, strip the # to get just the tag name
  const tagTerm = isTag ? q.slice(1) : null

  try {
    // Run both the post search and user search at the same time (in parallel)
    // This is faster than running them one after the other
    const postsQuery = query(`
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
      `, [pattern, tagTerm])

    const usersQuery = query(`
        SELECT id, full_name
        FROM users
        WHERE full_name ILIKE $1
        ORDER BY full_name
        LIMIT 20
      `, [pattern])

    // Wait for both queries to finish
    const postsResult = await postsQuery
    const usersResult = await usersQuery

    res.json({
      posts: postsResult.rows,
      users: usersResult.rows,
    })
  } catch (err) {
    console.error('Search error:', err)
    res.status(500).json({ error: 'Search failed' })
  }
})

// GET /search/suggest?q=term — fast suggestions for the search dropdown
// Returns matching users and hashtags as the user types
router.get('/suggest', requireAuth, async (req, res) => {
  const q = (req.query.q || '').trim()

  // Don't search if nothing has been typed yet
  if (q.length < 1) return res.json({ users: [], tags: [] })

  // Check if user is typing a hashtag
  const isTag = q.startsWith('#')

  // Get the tag prefix without the # sign, lowercase for matching
  const tagPrefix = isTag ? q.slice(1).toLowerCase() : q.toLowerCase()
  const userPattern = `%${q}%`

  try {
    // If the user typed a #, skip the user search and only look for tags
    let usersPromise
    if (isTag) {
      // Return empty users when searching for a tag
      usersPromise = Promise.resolve({ rows: [] })
    } else {
      // Search for users whose name matches
      usersPromise = query(`
          SELECT id, full_name
          FROM users
          WHERE full_name ILIKE $1
          ORDER BY full_name
          LIMIT 5
        `, [userPattern])
    }

    // Search for hashtags used in posts that start with the typed prefix
    const tagsPromise = query(`
        SELECT DISTINCT lower(m[1]) AS tag
        FROM posts, regexp_matches(content, '#([a-zA-Z0-9_]+)', 'g') AS m
        WHERE lower(m[1]) LIKE $1
        ORDER BY tag
        LIMIT 6
      `, [`${tagPrefix}%`])

    // Wait for both to finish
    const usersResult = await usersPromise
    const tagsResult = await tagsPromise

    res.json({
      users: usersResult.rows,
      // Extract just the tag string from each row
      tags: tagsResult.rows.map(r => r.tag),
    })
  } catch (err) {
    console.log('Suggest error:', err)
    res.status(500).json({ error: 'Suggest failed' })
  }
})

export default router
