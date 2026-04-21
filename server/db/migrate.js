import 'dotenv/config'
import { query } from './postgres.js'

async function migrate() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      full_name  VARCHAR(255) NOT NULL,
      email      VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role       VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  console.log('users table ready')

  await query(`
    CREATE TABLE IF NOT EXISTS posts (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content    VARCHAR(280) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  console.log('posts table ready')

  await query(`
    CREATE TABLE IF NOT EXISTS comments (
      id         SERIAL PRIMARY KEY,
      post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content    TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  console.log('comments table ready')

  await query(`
    CREATE TABLE IF NOT EXISTS likes (
      id         SERIAL PRIMARY KEY,
      post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (post_id, user_id)
    )
  `)
  console.log('likes table ready')

  console.log('Migration complete.')
  process.exit(0)
}

migrate().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
