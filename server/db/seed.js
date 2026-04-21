import 'dotenv/config'
import { query } from './postgres.js'
import bcrypt from 'bcryptjs'

function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10)
}

async function seed() {
  // Clear tables in reverse dependency order
  await query('DELETE FROM likes')
  await query('DELETE FROM comments')
  await query('DELETE FROM posts')
  await query('DELETE FROM users')
  await query('ALTER SEQUENCE users_id_seq RESTART WITH 1')
  await query('ALTER SEQUENCE posts_id_seq RESTART WITH 1')
  await query('ALTER SEQUENCE comments_id_seq RESTART WITH 1')
  await query('ALTER SEQUENCE likes_id_seq RESTART WITH 1')
  console.log('Tables cleared')

  // Users
  const usersResult = await query(`
    INSERT INTO users (full_name, email, password_hash, role) VALUES
      ('Admin User',   'admin@garden.com', $1, 'admin'),
      ('Egide Ntwari', 'egide@garden.com', $2, 'user'),
      ('Amos Mokaya',  'amos@garden.com',  $3, 'user')
    RETURNING id
  `, [hashPassword('admin123'), hashPassword('egide123'), hashPassword('amos123')])

  const [adminId, egideId, amosId] = usersResult.rows.map(r => r.id)
  console.log('Users seeded')

  // Posts — each $n is a unique placeholder, no duplicates in the array
  const postsResult = await query(`
    INSERT INTO posts (user_id, content) VALUES
      ($1, 'Welcome to The Digital Garden. A calm space for your thoughts.'),
      ($2, 'Just shipped my first full-stack app. The feeling is indescribable.'),
      ($3, 'Reading about distributed systems. The CAP theorem never gets old.'),
      ($4, 'Rainy days are perfect for deep work and good coffee.')
    RETURNING id
  `, [adminId, egideId, amosId, egideId])

  const [post1, post2, post3, post4] = postsResult.rows.map(r => r.id)
  console.log('Posts seeded')

  // Comments — unique $n per value
  await query(`
    INSERT INTO comments (post_id, user_id, content) VALUES
      ($1, $2, 'Love this space already!'),
      ($3, $4, 'Exactly the kind of place I needed.'),
      ($5, $6, 'Congrats! What stack did you use?'),
      ($7, $8, 'CAP theorem is brutal but so worth understanding.')
  `, [post1, egideId, post1, amosId, post2, amosId, post3, egideId])
  console.log('Comments seeded')

  // Likes — unique $n per value
  await query(`
    INSERT INTO likes (post_id, user_id) VALUES
      ($1, $2),
      ($3, $4),
      ($5, $6),
      ($7, $8),
      ($9, $10)
  `, [post1, egideId, post1, amosId, post2, amosId, post3, egideId, post4, amosId])
  console.log('Likes seeded')

  console.log('Seed complete.')
  process.exit(0)
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
