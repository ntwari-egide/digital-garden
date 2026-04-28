import 'dotenv/config'
import { query } from './postgres.js'
import bcrypt from 'bcryptjs'
import https from 'https'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.join(__dirname, '..', 'uploads')

function hash(plain) {
  return bcrypt.hashSync(plain, 10)
}

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) return resolve()
    const file = fs.createWriteStream(dest)
    const protocol = url.startsWith('https') ? https : http
    const req = protocol.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        res.resume()
        file.close(() => {
          try { fs.unlinkSync(dest) } catch (_) {}
          downloadImage(res.headers.location, dest).then(resolve).catch(reject)
        })
        return
      }
      if (res.statusCode !== 200) {
        res.resume()
        file.close(() => { try { fs.unlinkSync(dest) } catch (_) {} })
        reject(new Error(`HTTP ${res.statusCode} for ${url}`))
        return
      }
      res.pipe(file)
      file.on('finish', () => file.close(resolve))
    })
    req.on('error', err => {
      file.close(() => { try { fs.unlinkSync(dest) } catch (_) {} })
      reject(err)
    })
  })
}

async function addPost(user_id, title, content, image_url, created_at) {
  const r = await query(
    `INSERT INTO posts (user_id, title, content, image_url, created_at)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [user_id, title, content, image_url, created_at]
  )
  return r.rows[0].id
}

async function addComment(post_id, user_id, content, parent_id, created_at) {
  const r = await query(
    `INSERT INTO comments (post_id, user_id, content, parent_id, created_at)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [post_id, user_id, content, parent_id, created_at]
  )
  return r.rows[0].id
}

async function addLike(post_id, user_id) {
  await query(
    `INSERT INTO likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [post_id, user_id]
  )
}

async function seed() {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

  // ── Download seed images ─────────────────────────────────────────────
  console.log('Downloading seed images...')
  const seedImages = [
    ['seed-forest.jpg',   'https://picsum.photos/id/10/900/600'],
    ['seed-books.jpg',    'https://picsum.photos/id/24/900/600'],
    ['seed-coffee.jpg',   'https://picsum.photos/id/766/900/600'],
    ['seed-sunset.jpg',   'https://picsum.photos/id/162/900/600'],
    ['seed-city.jpg',     'https://picsum.photos/id/64/900/600'],
    ['seed-mountain.jpg', 'https://picsum.photos/id/29/900/600'],
    ['seed-tech.jpg',     'https://picsum.photos/id/180/900/600'],
    ['seed-desk.jpg',     'https://picsum.photos/id/3/900/600'],
    ['seed-coffee2.jpg',  'https://picsum.photos/id/431/900/600'],
    ['seed-sunrise.jpg',  'https://picsum.photos/id/110/900/600'],
    ['seed-keyboard.jpg', 'https://picsum.photos/id/119/900/600'],
    ['seed-running.jpg',  'https://picsum.photos/id/173/900/600'],
  ]
  for (const [name, url] of seedImages) {
    await downloadImage(url, path.join(uploadsDir, name))
    process.stdout.write('.')
  }
  console.log('\nImages ready')

  // ── Clear data ───────────────────────────────────────────────────────
  await query('DELETE FROM likes')
  await query('DELETE FROM comments')
  await query('DELETE FROM posts')
  await query('DELETE FROM users')
  await query('ALTER SEQUENCE users_id_seq RESTART WITH 1')
  await query('ALTER SEQUENCE posts_id_seq RESTART WITH 1')
  await query('ALTER SEQUENCE comments_id_seq RESTART WITH 1')
  await query('ALTER SEQUENCE likes_id_seq RESTART WITH 1')
  console.log('Tables cleared')

  // ── Users ────────────────────────────────────────────────────────────
  const ur = await query(`
    INSERT INTO users (full_name, email, password_hash, role) VALUES
      ('Admin User',   'admin@garden.com',  $1, 'admin'),
      ('Egide Ntwari', 'egide@garden.com',  $2, 'user'),
      ('Amos Mokaya',  'amos@garden.com',   $3, 'user'),
      ('Sofia Reyes',  'sofia@garden.com',  $4, 'user'),
      ('Liam Chen',    'liam@garden.com',   $5, 'user'),
      ('Amara Osei',   'amara@garden.com',  $6, 'user'),
      ('Priya Patel',  'priya@garden.com',  $7, 'user'),
      ('Kai Nakamura', 'kai@garden.com',    $8, 'user')
    RETURNING id
  `, [hash('admin123'), hash('egide123'), hash('amos123'), hash('sofia123'),
      hash('liam123'),  hash('amara123'),  hash('priya123'), hash('kai123')])

  const [adminId, egideId, amosId, sofiaId, liamId, amaraId, priyaId, kaiId] =
    ur.rows.map(r => r.id)
  console.log('Users seeded')

  // ── Posts — spread over ~5 months ────────────────────────────────────
  const p = {}

  p.welcome = await addPost(adminId, 'Welcome to The Digital Garden',
    'This is a calm, algorithm-free space for thoughts, ideas, and quiet conversations. No engagement bait, no noise — just people sharing what\'s on their mind. #community #welcome',
    null, '2025-12-01 09:00:00')

  p.shipped = await addPost(egideId, 'Shipped my first full-stack app',
    'After three months of late nights and more Stack Overflow tabs than I can count, it\'s finally live. React on the front, Node + Postgres on the back. I learned more building this than from any course I\'ve ever taken. #coding #webdev #milestone',
    null, '2025-12-03 14:22:00')

  p.ddia = await addPost(amosId, null,
    'Reading Designing Data-Intensive Applications by Martin Kleppmann. This might be the most important tech book I\'ve picked up in years. If you work with data at any scale — read it. #books #distributedsystems #learning',
    '/uploads/seed-books.jpg', '2025-12-05 20:10:00')

  p.hike = await addPost(sofiaId, 'Weekend in Muir Woods',
    'Completely offline for two days. No notifications, no Slack — just tall trees and cold air. My nervous system needed that more than I realised. #nature #travel #offline #mindfulness',
    '/uploads/seed-forest.jpg', '2025-12-08 11:30:00')

  p.mornings = await addPost(liamId, null,
    'The single biggest productivity unlock for me was protecting my mornings. No meetings before 11am, no email until I\'ve done two hours of focused work. Simple rule, hard to enforce, completely worth it. #productivity #deepwork',
    null, '2025-12-12 08:45:00')

  p.cap = await addPost(amaraId, 'CAP theorem, actually explained',
    'Consistency, Availability, Partition tolerance — pick two. What most explanations miss: partition tolerance isn\'t optional in a real distributed system. You\'re always choosing between C and A when things go wrong. #coding #distributedsystems',
    null, '2025-12-15 16:00:00')

  p.golden = await addPost(priyaId, 'Golden hour',
    'Drove an hour to catch this. Completely worth it. The best creative reset is sometimes just going somewhere beautiful and doing absolutely nothing. #photography #nature #mindfulness',
    '/uploads/seed-sunset.jpg', '2025-12-18 18:50:00')

  p.piano = await addPost(kaiId, null,
    'Three weeks into learning Chopin\'s Nocturne Op. 9 No. 2. The left and right hands feel like they belong to completely different people. But today, for about thirty seconds, something clicked. #music #piano #practice',
    null, '2025-12-22 21:15:00')

  p.coffee = await addPost(egideId, 'One cup and done',
    'Switched from four cups a day to one. The crash was rough for about ten days, then everything evened out — better sleep, more consistent energy. The single cup hits completely differently now. #productivity #coffee #health',
    '/uploads/seed-coffee.jpg', '2026-01-02 07:30:00')

  p.ux = await addPost(amosId, null,
    'Great UI doesn\'t ask users to think. It anticipates. The gap between a good designer and a great one is usually just how much time they\'ve spent watching real users struggle. #design #ux',
    '/uploads/seed-tech.jpg', '2026-01-06 13:00:00')

  p.rust = await addPost(sofiaId, 'Learning Rust is humbling',
    'I thought I understood memory management. Rust\'s borrow checker disagrees, firmly and loudly. It\'s the strictest teacher I\'ve ever had and I\'m here for it. #coding #rust #learning',
    null, '2026-01-10 10:20:00')

  p.pragprog = await addPost(liamId, null,
    'Finished The Pragmatic Programmer. The chapter on orthogonality alone changed how I think about every feature I build. If you write code and haven\'t read it — stop and go read it. #books #coding',
    '/uploads/seed-desk.jpg', '2026-01-14 19:45:00')

  p.ghana = await addPost(amaraId, 'Sunrise from Labadi Beach',
    'Home for the holidays. No filter, no edit. Ghana just looks like this sometimes. #travel #nature #photography #ghana',
    '/uploads/seed-sunrise.jpg', '2026-01-18 06:05:00')

  p.journal10 = await addPost(priyaId, null,
    'Ten days of morning journaling. I expected clarity. I didn\'t expect to realise I\'ve been saying yes to things I don\'t actually want to do. That was uncomfortable and useful. #mindfulness #journaling',
    null, '2026-01-22 08:00:00')

  p.tokyo = await addPost(kaiId, 'Tokyo at midnight',
    'This city has a completely different personality after dark — quiet, clean, unexpectedly calm. I walked for three hours and barely anyone was out. The contrast with daytime Tokyo is something else. #travel #photography #tokyo',
    '/uploads/seed-city.jpg', '2026-01-27 00:30:00')

  p.fts = await addPost(egideId, null,
    'Built full-text search with Postgres tsvector and tsquery today. No Elasticsearch, no Algolia — just SQL. The fact that this has been in Postgres for decades and people still reach for external services is wild to me. #coding #postgres #sql',
    null, '2026-02-03 15:10:00')

  p.pourover = await addPost(amosId, 'The pour-over ritual',
    'Grind size, water temperature, bloom time — it\'s a small meditation before the day starts. The coffee is also just objectively better. #coffee #morning',
    '/uploads/seed-coffee2.jpg', '2026-02-08 07:15:00')

  p.apple = await addPost(sofiaId, null,
    'Spent a week reverse-engineering Apple\'s design system. Their consistency isn\'t magic — it\'s obsessive constraint. Same 8pt grid, same type scale, same motion curves, everywhere, always. #design #apple',
    null, '2026-02-12 12:30:00')

  p.journalwhy = await addPost(liamId, 'Why I journal every morning',
    'Not for posterity. Not to record events. Just to externalize the noise in my head before the day starts. Five minutes, no rules, no going back to re-read it. Clears the slate. #mindfulness #productivity #journaling',
    null, '2026-02-17 06:50:00')

  p.fivek = await addPost(amaraId, 'First 5K. Done.',
    'Signed up on a whim three months ago. Trained through the cold, through the excuses, through more than a few early mornings I wanted to skip. Cried a little at the finish line. #fitness #running #goals',
    '/uploads/seed-running.jpg', '2026-02-22 09:00:00')

  p.atomic = await addPost(priyaId, null,
    'Re-reading Atomic Habits for the third time. Something different jumps out each read depending on where you are in life. Right now it\'s the identity chapter — you don\'t rise to goals, you fall to systems. #books #habits #mindfulness',
    null, '2026-03-01 20:00:00')

  p.keyboard = await addPost(kaiId, 'Built a mechanical keyboard this weekend',
    'Lubed 90 switches by hand. Took four hours. Sounds like typing on clouds now. Completely irrational use of a weekend. Absolutely zero regrets. #diy #maker #keyboards',
    '/uploads/seed-keyboard.jpg', '2026-03-07 17:30:00')

  p.windowfns = await addPost(egideId, null,
    'PostgreSQL window functions are one of those things that, once you learn them, you wonder how you ever lived without them. ROW_NUMBER, LAG, LEAD, NTILE — the queries you can replace are incredible. #coding #postgres #sql',
    null, '2026-03-14 14:00:00')

  p.yosemite = await addPost(amosId, 'Yosemite, completely offline',
    'Three days, no signal, no Wi-Fi. Anxious for the first six hours, then I forgot my phone existed. Half Dome at sunrise might be the most beautiful thing I have ever seen in my life. #nature #travel #offline',
    '/uploads/seed-mountain.jpg', '2026-03-20 08:45:00')

  p.shipfaster = await addPost(sofiaId, null,
    'My team ships faster since we added one rule: no feature leaves the branch without a user story written in the PR description. Forces you to think about what you\'re building before you build it. #productivity #coding #teamwork',
    null, '2026-04-01 11:00:00')

  p.adminreminder = await addPost(adminId, null,
    'Friendly reminder: The Digital Garden is a space for honest, constructive sharing. Be the kind of commenter you\'d want to encounter. #community #reminder',
    null, '2026-04-05 09:30:00')

  p.mountain = await addPost(liamId, 'First time above treeline',
    'Got to 12,000 ft on a hike last weekend. The air is thin and the view makes no sense. Hiking is my new therapy. #nature #hiking #fitness',
    '/uploads/seed-mountain.jpg', '2026-04-10 16:20:00')

  p.portfolio = await addPost(egideId, 'Rebuilt my portfolio from scratch',
    'Fewer projects, better write-ups. Spent a weekend on it and it already feels more like me. Quality over quantity every time. #webdev #design #portfolio',
    '/uploads/seed-desk.jpg', '2026-04-15 10:00:00')

  p.slowmorning = await addPost(priyaId, null,
    'Had a slow morning today — no alarm, no agenda, just tea and a book for two hours. I forget how much I need those until I accidentally have one. #mindfulness #slowliving',
    null, '2026-04-18 09:30:00')

  p.postgres = await addPost(amosId, 'Postgres is quietly incredible',
    'The longer I use it the more I think it\'s one of the best pieces of software ever written. Full-text search, JSONB, window functions, partitioning, extensions — it just keeps going. #postgres #sql #coding',
    null, '2026-04-22 11:00:00')

  console.log(`Seeded ${Object.keys(p).length} posts`)

  // ── Comments ─────────────────────────────────────────────────────────

  // welcome
  const cw1 = await addComment(p.welcome, egideId,
    'Love the vibe here. Finally a place that isn\'t trying to hack my attention span.',
    null, '2025-12-01 10:00:00')
  await addComment(p.welcome, amosId, 'Glad to be here. Let\'s keep it this way.', null, '2025-12-01 10:30:00')
  await addComment(p.welcome, sofiaId, 'This is exactly what I needed. Bookmarked on day one.', null, '2025-12-01 11:00:00')
  await addComment(p.welcome, liamId, 'Agreed — looking forward to seeing what people share here.', cw1, '2025-12-01 11:15:00')

  // shipped
  const cs1 = await addComment(p.shipped, amosId, 'Congrats! What was the hardest part?', null, '2025-12-03 15:00:00')
  await addComment(p.shipped, sofiaId, 'Huge milestone. What does it do?', null, '2025-12-03 15:30:00')
  await addComment(p.shipped, egideId, 'Auth + file uploads were the roughest parts. But it all clicked eventually.', cs1, '2025-12-03 16:00:00')
  await addComment(p.shipped, kaiId, 'That feeling of seeing something live that you built yourself never gets old.', null, '2025-12-03 16:30:00')

  // ddia
  await addComment(p.ddia, sofiaId, 'That book changed how I think about databases. Chapter 3 especially.', null, '2025-12-05 21:00:00')
  await addComment(p.ddia, liamId, 'Dense but worth every page. Take notes or you\'ll forget half of it within a week.', null, '2025-12-05 21:30:00')
  await addComment(p.ddia, amosId, 'The replication chapter is where everything clicked for me. Mind-bending.', null, '2025-12-05 22:00:00')

  // hike
  const ch1 = await addComment(p.hike, amaraId, 'This photo is stunning. Where exactly?', null, '2025-12-08 12:00:00')
  const ch2 = await addComment(p.hike, sofiaId, 'Muir Woods! About 30 mins north of San Francisco.', ch1, '2025-12-08 12:30:00')
  await addComment(p.hike, kaiId, 'Going to add this to my list. Haven\'t been to the Bay Area in years.', ch2, '2025-12-08 13:00:00')
  await addComment(p.hike, priyaId, 'The offline part is what I need. No notifications for 48 hours sounds like heaven.', null, '2025-12-08 13:30:00')

  // mornings
  await addComment(p.mornings, egideId, 'The morning protection thing is real. Started this six months ago. Complete game changer.', null, '2025-12-12 09:00:00')
  const cm1 = await addComment(p.mornings, kaiId, 'What do you do in those two hours? Structured or free-form?', null, '2025-12-12 09:30:00')
  await addComment(p.mornings, liamId, 'The one thing that matters most that week. No multitasking, no switching.', cm1, '2025-12-12 10:00:00')
  await addComment(p.mornings, amaraId, 'I tried this and got pushback from my manager. Currently negotiating it back.', null, '2025-12-12 10:30:00')

  // cap
  await addComment(p.cap, egideId, 'Partition tolerance is what confuses everyone. You cannot turn it off in a real distributed system.', null, '2025-12-15 17:00:00')
  await addComment(p.cap, sofiaId, 'Great explainer. Most tutorials treat it like a one-time design choice rather than a runtime tradeoff.', null, '2025-12-15 17:30:00')

  // piano
  const cp1 = await addComment(p.piano, sofiaId, 'Which nocturne? The E-flat major one?', null, '2025-12-22 22:00:00')
  await addComment(p.piano, kaiId, 'Op. 9 No. 2. Everyone knows it, which somehow makes it harder.', cp1, '2025-12-22 22:30:00')
  await addComment(p.piano, egideId, 'The hand independence thing takes months. Then suddenly it feels automatic.', null, '2025-12-22 23:00:00')

  // coffee
  await addComment(p.coffee, amosId, 'One cup crew. Welcome to the other side.', null, '2026-01-02 08:00:00')
  const cc1 = await addComment(p.coffee, liamId, 'How long did the adjustment take? I\'m on week two and it\'s rough.', null, '2026-01-02 08:30:00')
  await addComment(p.coffee, egideId, 'About 10 days for me. Then one cup was genuinely enough.', cc1, '2026-01-02 09:00:00')
  await addComment(p.coffee, liamId, 'Okay, that gives me hope. Sticking with it.', cc1, '2026-01-02 09:15:00')

  // rust
  await addComment(p.rust, egideId, 'The borrow checker is simultaneously the best teacher and worst enemy I\'ve encountered in programming.', null, '2026-01-10 11:00:00')
  await addComment(p.rust, amaraId, 'Stick with it. The moment it clicks, you start seeing memory bugs in all your old code.', null, '2026-01-10 11:30:00')
  const cr1 = await addComment(p.rust, sofiaId, 'What are you building with it?', null, '2026-01-10 12:00:00')
  await addComment(p.rust, sofiaId, 'Just exercises for now. CLI tool next. #rust', cr1, '2026-01-10 12:30:00')

  // pragprog
  await addComment(p.pragprog, amosId, 'The DRY section hits different the second time you read it.', null, '2026-01-14 20:00:00')
  await addComment(p.pragprog, egideId, 'Orthogonality is the most underrated idea in software and nobody talks about it enough.', null, '2026-01-14 20:30:00')

  // ghana
  await addComment(p.ghana, sofiaId, 'This is breathtaking. I\'ve never seen light like that.', null, '2026-01-18 07:00:00')
  await addComment(p.ghana, kaiId, 'Ghana is on my list. This just moved it up.', null, '2026-01-18 07:30:00')
  await addComment(p.ghana, amaraId, 'Nothing beats coming home. Happy holidays everyone.', null, '2026-01-18 08:00:00')

  // tokyo
  const ct1 = await addComment(p.tokyo, sofiaId, 'Tokyo at night is a different planet. Miss it constantly.', null, '2026-01-27 01:00:00')
  const ct2 = await addComment(p.tokyo, priyaId, 'Did you go to the Shibuya crossing at night? Unreal.', null, '2026-01-27 01:30:00')
  await addComment(p.tokyo, kaiId, 'Yes — and then walked to Harajuku. The contrast between those two places is wild.', ct2, '2026-01-27 02:00:00')
  await addComment(p.tokyo, egideId, 'Adding Tokyo to the bucket list immediately.', ct1, '2026-01-27 02:30:00')

  // fts
  await addComment(p.fts, amosId, 'Did this last year. ts_rank is surprisingly good out of the box.', null, '2026-02-03 16:00:00')
  const cf1 = await addComment(p.fts, amaraId, 'How does it handle typos and partial matches?', null, '2026-02-03 16:30:00')
  await addComment(p.fts, egideId, 'Typos need pg_trgm. Partial matches work great with prefix queries. Way less infra than Elasticsearch.', cf1, '2026-02-03 17:00:00')

  // pourover
  await addComment(p.pourover, priyaId, 'The bloom step is where most people rush. Thirty seconds changes everything.', null, '2026-02-08 08:00:00')
  await addComment(p.pourover, liamId, 'Started pour-over last year and I can\'t go back to drip. The ritual is half the point.', null, '2026-02-08 08:30:00')

  // apple
  await addComment(p.apple, amosId, 'The 8pt grid is such a simple constraint and it explains why everything feels so consistent.', null, '2026-02-12 13:00:00')
  await addComment(p.apple, egideId, 'Have you looked at their motion guidelines? Even more obsessive about easing curves.', null, '2026-02-12 13:30:00')

  // fivek
  await addComment(p.fivek, sofiaId, 'Three months of training paid off. Be proud of this.', null, '2026-02-22 10:00:00')
  const c5k1 = await addComment(p.fivek, liamId, 'Amazing! What\'s the next goal?', null, '2026-02-22 10:30:00')
  await addComment(p.fivek, amaraId, '10K. Told myself I wouldn\'t say it until I finished this one.', c5k1, '2026-02-22 11:00:00')
  await addComment(p.fivek, kaiId, 'From someone who hated running six months ago: it gets addictive. Keep going.', null, '2026-02-22 11:30:00')

  // keyboard
  const ckb1 = await addComment(p.keyboard, egideId, 'What switches did you go with?', null, '2026-03-07 18:00:00')
  await addComment(p.keyboard, kaiId, 'Gateron Oil Kings. Linear, smooth, almost silent. Perfect for late-night sessions.', ckb1, '2026-03-07 18:30:00')
  await addComment(p.keyboard, amosId, 'Four hours lubing is serious commitment. Most people skip that step.', null, '2026-03-07 19:00:00')
  await addComment(p.keyboard, kaiId, 'Never skipping it again after hearing the difference. Completely worth it.', null, '2026-03-07 19:30:00')

  // windowfns
  await addComment(p.windowfns, amosId, 'LAG and LEAD for time-series analysis are genuinely magic once you understand them.', null, '2026-03-14 15:00:00')
  await addComment(p.windowfns, liamId, 'PARTITION BY changed my life. Grouping without collapsing rows is something else.', null, '2026-03-14 15:30:00')

  // yosemite
  await addComment(p.yosemite, sofiaId, 'Half Dome at sunrise is on my list. How was the trail?', null, '2026-03-20 09:30:00')
  await addComment(p.yosemite, liamId, 'The three days offline sounds terrifying and necessary at the same time.', null, '2026-03-20 10:00:00')
  await addComment(p.yosemite, amosId, 'Sub Dome is the crux — cables at the top are wild. Worth every step.', null, '2026-03-20 10:30:00')

  // shipfaster
  await addComment(p.shipfaster, amaraId, 'We do this too. Cut review back-and-forth by at least half.', null, '2026-04-01 12:00:00')
  await addComment(p.shipfaster, egideId, 'Also forces you to think about what you\'re building before you start. Prevents so many wasted hours.', null, '2026-04-01 12:30:00')
  await addComment(p.shipfaster, liamId, 'Tried this with my team last sprint. Pushback at first, then everyone loved it.', null, '2026-04-01 13:00:00')

  // postgres
  await addComment(p.postgres, egideId, 'JSONB support alone puts it above most databases. But yeah, the full picture is absurd.', null, '2026-04-22 11:30:00')
  await addComment(p.postgres, sofiaId, 'The fact that it\'s free and open source while being this capable is wild.', null, '2026-04-22 12:00:00')

  console.log('Comments seeded')

  // ── Likes — distributed realistically across posts ────────────────────
  const likeData = [
    // welcome — everyone likes the first post
    [p.welcome, egideId], [p.welcome, amosId], [p.welcome, sofiaId],
    [p.welcome, liamId],  [p.welcome, amaraId], [p.welcome, priyaId], [p.welcome, kaiId],

    // shipped
    [p.shipped, amosId], [p.shipped, sofiaId], [p.shipped, liamId],
    [p.shipped, amaraId], [p.shipped, priyaId], [p.shipped, kaiId],

    // ddia
    [p.ddia, egideId], [p.ddia, sofiaId], [p.ddia, liamId], [p.ddia, priyaId], [p.ddia, kaiId],

    // hike — visual posts do well
    [p.hike, egideId], [p.hike, amosId], [p.hike, liamId],
    [p.hike, amaraId], [p.hike, priyaId], [p.hike, kaiId],

    // mornings
    [p.mornings, egideId], [p.mornings, amosId], [p.mornings, sofiaId], [p.mornings, amaraId],

    // cap
    [p.cap, egideId], [p.cap, sofiaId], [p.cap, liamId], [p.cap, kaiId],

    // golden hour — photo post, high likes
    [p.golden, egideId], [p.golden, amosId], [p.golden, sofiaId],
    [p.golden, liamId],  [p.golden, amaraId], [p.golden, kaiId],

    // piano
    [p.piano, sofiaId], [p.piano, amaraId], [p.piano, priyaId],

    // coffee
    [p.coffee, amosId], [p.coffee, sofiaId], [p.coffee, liamId], [p.coffee, priyaId],

    // ux
    [p.ux, egideId], [p.ux, sofiaId], [p.ux, liamId], [p.ux, priyaId], [p.ux, kaiId],

    // rust
    [p.rust, egideId], [p.rust, amaraId], [p.rust, liamId], [p.rust, kaiId],

    // pragprog
    [p.pragprog, amosId], [p.pragprog, egideId], [p.pragprog, sofiaId], [p.pragprog, amaraId],

    // ghana — photo, high likes
    [p.ghana, egideId], [p.ghana, amosId], [p.ghana, sofiaId],
    [p.ghana, liamId],  [p.ghana, priyaId], [p.ghana, kaiId],

    // journal10
    [p.journal10, amosId], [p.journal10, sofiaId], [p.journal10, liamId], [p.journal10, kaiId],

    // tokyo — photo, high likes
    [p.tokyo, egideId], [p.tokyo, amosId], [p.tokyo, sofiaId],
    [p.tokyo, liamId],  [p.tokyo, amaraId], [p.tokyo, priyaId],

    // fts
    [p.fts, amosId], [p.fts, sofiaId], [p.fts, liamId], [p.fts, kaiId],

    // pourover
    [p.pourover, egideId], [p.pourover, sofiaId], [p.pourover, liamId], [p.pourover, priyaId],

    // apple
    [p.apple, amosId], [p.apple, egideId], [p.apple, liamId], [p.apple, kaiId],

    // journalwhy
    [p.journalwhy, egideId], [p.journalwhy, amosId], [p.journalwhy, sofiaId], [p.journalwhy, amaraId],

    // fivek — emotional post, high likes
    [p.fivek, egideId], [p.fivek, amosId], [p.fivek, sofiaId],
    [p.fivek, liamId],  [p.fivek, priyaId], [p.fivek, kaiId],

    // atomic
    [p.atomic, egideId], [p.atomic, amosId], [p.atomic, sofiaId], [p.atomic, kaiId],

    // keyboard
    [p.keyboard, egideId], [p.keyboard, amosId], [p.keyboard, sofiaId], [p.keyboard, liamId],

    // windowfns
    [p.windowfns, amosId], [p.windowfns, sofiaId], [p.windowfns, liamId], [p.windowfns, amaraId],

    // yosemite — photo, high likes
    [p.yosemite, egideId], [p.yosemite, sofiaId], [p.yosemite, liamId],
    [p.yosemite, amaraId], [p.yosemite, priyaId], [p.yosemite, kaiId],

    // shipfaster
    [p.shipfaster, egideId], [p.shipfaster, amosId], [p.shipfaster, amaraId], [p.shipfaster, priyaId],

    // adminreminder
    [p.adminreminder, egideId], [p.adminreminder, amosId], [p.adminreminder, sofiaId],

    // mountain
    [p.mountain, egideId], [p.mountain, amaraId], [p.mountain, priyaId],

    // portfolio
    [p.portfolio, amosId], [p.portfolio, sofiaId], [p.portfolio, liamId],

    // slowmorning
    [p.slowmorning, amosId], [p.slowmorning, sofiaId], [p.slowmorning, amaraId],

    // postgres
    [p.postgres, egideId], [p.postgres, sofiaId], [p.postgres, liamId],
    [p.postgres, amaraId], [p.postgres, priyaId], [p.postgres, kaiId],
  ]

  for (const [post_id, user_id] of likeData) {
    await addLike(post_id, user_id)
  }
  console.log(`Seeded ${likeData.length} likes`)

  console.log(`
Seed complete.

Users:
  admin@garden.com  / admin123  (admin)
  egide@garden.com  / egide123
  amos@garden.com   / amos123
  sofia@garden.com  / sofia123
  liam@garden.com   / liam123
  amara@garden.com  / amara123
  priya@garden.com  / priya123
  kai@garden.com    / kai123
`)
  process.exit(0)
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
