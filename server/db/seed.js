import 'dotenv/config'
import { query } from './postgres.js'
import bcrypt from 'bcryptjs'

function hash(plain) {
  return bcrypt.hashSync(plain, 10)
}

// Pexels CDN — free, reliable, no auth needed for embedding
const IMG = {
  forest:   'https://images.pexels.com/photos/167698/pexels-photo-167698.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
  path:     'https://images.pexels.com/photos/1179229/pexels-photo-1179229.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
  mountain: 'https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
  sunrise:  'https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
  sunset:   'https://images.pexels.com/photos/1287145/pexels-photo-1287145.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
  water:    'https://images.pexels.com/photos/247431/pexels-photo-247431.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
  garden:   'https://images.pexels.com/photos/1146242/pexels-photo-1146242.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
  field:    'https://images.pexels.com/photos/1237119/pexels-photo-1237119.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
  lake:     'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
  sky:      'https://images.pexels.com/photos/281260/pexels-photo-281260.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
  leaves:   'https://images.pexels.com/photos/1459505/pexels-photo-1459505.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
  rain:     'https://images.pexels.com/photos/1530258/pexels-photo-1530258.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
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

  // ── Posts ────────────────────────────────────────────────────────────
  const p = {}

  p.welcome = await addPost(adminId, 'Welcome to The Digital Garden',
    'This is a space to grow — slowly, honestly, at your own pace. No performance, no highlight reels. Just people showing up as they are and tending to what\'s inside. Whatever brought you here, you\'re welcome. #welcome #community #safeplace',
    null, '2025-12-01 09:00:00')

  p.therapy1 = await addPost(egideId, 'I finally started therapy',
    'I put it off for two years. Told myself I wasn\'t "bad enough" to need it. Started three weeks ago and I\'ve already said things out loud I\'ve never admitted to anyone. It\'s uncomfortable and I think that means it\'s working. #therapy #mentalhealth #growth',
    null, '2025-12-03 14:22:00')

  p.grief = await addPost(amosId, 'Grief doesn\'t follow a schedule',
    'It\'s been eight months since I lost my dad. Everyone said it would get easier. Some days it does. Some days I\'m in a grocery store and a song comes on and I have to leave the cart and sit in my car for twenty minutes. Both things are true at once. #grief #loss #healing',
    IMG.forest, '2025-12-05 20:10:00')

  p.anxiety = await addPost(sofiaId, 'What anxiety actually feels like for me',
    'It\'s not always a panic attack. Sometimes it\'s just a low hum underneath everything. A sense that something is wrong even when nothing is. The inability to enjoy a good moment because some part of my brain is waiting for it to fall apart. #anxiety #mentalhealth #awareness',
    null, '2025-12-08 11:30:00')

  p.burnout = await addPost(liamId, 'I burned out and didn\'t notice until I completely stopped',
    'I thought I was fine. I was productive, hitting deadlines, keeping it together. Then I took a week off and couldn\'t get off the couch. My body just... stopped. That\'s when I realised how long I\'d been running on empty. #burnout #rest #recovery',
    IMG.path, '2025-12-12 08:45:00')

  p.boundaries = await addPost(amaraId, 'Learning to say no without explaining myself',
    'I used to write paragraph-long texts explaining why I couldn\'t make it to things. Now I\'m practicing: "I can\'t make it, but I hope you have a great time." Full stop. It feels rude. My therapist says that feeling is the whole point. #boundaries #selfcare #growth',
    null, '2025-12-15 16:00:00')

  p.gratitude = await addPost(priyaId, 'The view from my window this morning',
    'I\'ve been trying to find one thing each morning before I look at my phone. Today it was the light through the curtains at 7am. It lasted about four minutes. I watched the whole thing. #gratitude #mindfulness #slowliving',
    IMG.sunrise, '2025-12-18 18:50:00')

  p.lonely = await addPost(kaiId, 'Is anyone else lonely in a way that\'s hard to explain?',
    'I have people around me. I have friends I could call. But there\'s this particular kind of loneliness that doesn\'t go away with company. Like something is missing that I can\'t even name. I don\'t know if I\'m looking for advice or just to know someone else feels this too. #loneliness #mentalhealth #connection',
    null, '2025-12-22 21:15:00')

  p.journaling = await addPost(egideId, 'Six months of journaling — what actually changed',
    'I started because someone told me to. I kept going because somewhere around month two I wrote something that surprised me — a thought I didn\'t know I had until I saw it on paper. Now I can\'t imagine not doing it. It\'s not therapy, but it\'s something. #journaling #selfawareness #mentalhealth',
    null, '2026-01-02 07:30:00')

  p.nature = await addPost(amosId, 'Why I keep coming back to this trail',
    'There\'s a path near my house I walk when things get heavy. I\'ve been on it in every season now. Something about moving through something — physically through a space — makes the internal movement feel possible too. #nature #healing #grief #walking',
    IMG.path, '2026-01-06 13:00:00')

  p.selfcompassion = await addPost(sofiaId, 'I\'m trying to talk to myself like I\'d talk to a friend',
    'I said something to myself last week that I would never say to someone I loved. Caught it mid-thought. The standard I hold myself to versus anyone else in my life is genuinely shocking when I notice it. Working on it. #selfcompassion #innercritic #therapy',
    null, '2026-01-10 10:20:00')

  p.rest = await addPost(liamId, 'Rest is not the same as doing nothing',
    'I used to think if I wasn\'t productive, I was wasting time. Now I understand that rest is what makes everything else possible. But I\'m still learning to do it without guilt. The guilt is the real thing I\'m working on. #rest #burnout #recovery #slowliving',
    IMG.field, '2026-01-14 19:45:00')

  p.smalljoys = await addPost(amaraId, 'Small things that have saved me this month',
    'Morning tea before anyone else is awake. A playlist I only listen to on walks. The specific feeling of cold water on my face when I\'ve been crying. A text from a friend who checked in without me asking. None of these are big. All of them have mattered. #smalljoys #gratitude #healing',
    IMG.garden, '2026-01-18 06:05:00')

  p.breakthrough = await addPost(priyaId, 'Something shifted in therapy this week',
    'I don\'t want to say too much because it still feels fragile. But my therapist asked me a question and I started answering and then I stopped and said "wait — I\'ve never thought about it that way before." Those moments are why I keep going. #therapy #breakthrough #mentalhealth',
    null, '2026-01-22 08:00:00')

  p.water = await addPost(kaiId, 'I moved to be near water and I think it saved me',
    'I know that sounds dramatic. But the first morning I woke up and could hear the water, something in my nervous system unclenched. I didn\'t realise how tightly wound I\'d been until I wasn\'t. #nature #healing #water #peace',
    IMG.water, '2026-01-27 00:30:00')

  p.vulnerability = await addPost(egideId, 'Posting this before I talk myself out of it',
    'I\'ve been struggling a lot lately. Not in a crisis way — just in a quiet, exhausting, hard-to-explain way. I don\'t really know what I need. But I\'ve learned that saying it out loud, even here, makes it slightly less heavy. So. Here it is. #vulnerability #mentalhealth #community',
    null, '2026-02-03 15:10:00')

  p.morningritual = await addPost(amosId, 'The morning ritual that keeps me grounded',
    'Ten minutes outside before I do anything else. No phone, no plans — just whatever is happening in the garden. A bird, the temperature, whether it rained overnight. It\'s a small act of presence that makes the rest of the day feel possible. #morningritual #mindfulness #grief #grounding',
    IMG.garden, '2026-02-08 07:15:00')

  p.peoplepleasing = await addPost(sofiaId, 'Recovering from a lifetime of people pleasing',
    'My therapist says people pleasing is a trauma response. That I learned to make myself small to keep the peace. Understanding that helped. But understanding it and actually changing it are two completely different things. I\'m somewhere in between right now. #peoplepleasing #therapy #boundaries #growth',
    null, '2026-02-12 12:30:00')

  p.compassion = await addPost(liamId, 'What self-compassion actually looks like on a bad day',
    'It\'s not a bubble bath. It\'s saying "this is genuinely hard" instead of "I should be able to handle this." It\'s lowering the bar to something survivable. It\'s treating yourself like someone who is doing their best, even when their best looks like lying on the floor for a while. #selfcompassion #mentalhealth #baddays',
    null, '2026-02-17 06:50:00')

  p.griefwave = await addPost(amaraId, 'Eight months out and grief still comes in waves',
    'Some weeks I feel almost normal. Then something small — a voicemail I forgot to delete, the way someone laughs in a similar way — and I\'m back at the beginning. Grief isn\'t linear and I\'m finally done pretending it should be. #grief #loss #healing #mentalhealth',
    IMG.lake, '2026-02-22 09:00:00')

  p.meditation = await addPost(priyaId, 'Three months of daily meditation — honest reflection',
    'Some days it\'s genuinely peaceful. Some days I spend the whole ten minutes thinking about what I need to buy at the store. Both count. The point isn\'t to empty your mind — it\'s to notice where your mind goes. That alone has been worth it. #meditation #mindfulness #honesty',
    null, '2026-03-01 20:00:00')

  p.askhelp = await addPost(kaiId, 'I finally asked for help',
    'I\'ve spent most of my life believing that needing help was a sign of weakness. That asking meant admitting I couldn\'t handle things. I asked for help last week. Nothing collapsed. Actually — the opposite. #askingforhelp #vulnerability #mentalhealth #growth',
    IMG.mountain, '2026-03-07 17:30:00')

  p.progress = await addPost(egideId, 'Progress looks nothing like I thought it would',
    'I imagined healing as a line going up. Instead it\'s more like tending a garden — some things bloom, some things die back, some things come up sideways. And a lot of it happens underground where you can\'t see it at all until one day you notice something green. #growth #healing #therapy #progress',
    IMG.leaves, '2026-03-14 14:00:00')

  p.silence = await addPost(amosId, 'Learning to sit with silence',
    'I used to fill every quiet moment — music, podcasts, anything. I was afraid of what I\'d hear if I stopped. Now I\'m starting to understand that the silence isn\'t empty. It\'s where the things I\'ve been avoiding have been waiting patiently. #silence #mindfulness #grief #innerwork',
    IMG.field, '2026-03-20 08:45:00')

  p.body = await addPost(sofiaId, 'My body kept score and I finally started listening',
    'Tension in my shoulders I didn\'t know was there until a massage therapist asked how long I\'d been holding them up. The answer was: always. I\'ve started checking in with my body throughout the day. Just asking: what are you carrying right now? #somatichealing #anxiety #bodyawareness #mentalhealth',
    null, '2026-04-01 11:00:00')

  p.adminreminder = await addPost(adminId, 'A reminder about this space',
    'The Digital Garden is for the tender, unfinished, still-figuring-it-out parts of being human. You are welcome here in whatever state you arrive. Please hold others\' words with care. #community #safeplace #reminder',
    null, '2026-04-05 09:30:00')

  p.seasonal = await addPost(liamId, 'Winter really does something to me',
    'Every year I forget. Then December hits and the light disappears and I become a different, slower, heavier version of myself. I\'m trying this year to treat it as a season of rest rather than a failure to thrive. It\'s only working about half the time. #seasonalaffective #depression #winter #mentalhealth',
    IMG.rain, '2026-04-10 16:20:00')

  p.letting = await addPost(priyaId, 'On letting go of who I thought I\'d be by now',
    'There was a version of my life I was certain I\'d have. I\'m grieving her a little — the imaginary me who had it more together. But I\'m also starting to appreciate the actual me, who has been through things and is still here. #lettinggo #grief #selfacceptance #growth',
    IMG.sky, '2026-04-15 10:00:00')

  p.joy = await addPost(amaraId, 'Feeling joy and then immediately feeling guilty about it',
    'It happened again this week. A genuinely good afternoon, and then this creeping guilt — like I didn\'t deserve it, or like feeling good was somehow a betrayal of the hard things. My therapist says this is common in grief. I\'m working on letting myself have it. #joy #grief #guilt #healing',
    IMG.sunset, '2026-04-18 09:30:00')

  p.slowmorning = await addPost(kaiId, 'Slow mornings are my therapy',
    'No alarm when I can help it. Tea before anything else. Sitting by the window for as long as I want. I built this into my life after a period of running so fast I couldn\'t feel anything. Slowing down was the most radical thing I\'ve done for my mental health. #slowliving #mornings #mentalhealth #rest',
    IMG.sunrise, '2026-04-22 11:00:00')

  console.log(`Seeded ${Object.keys(p).length} posts`)

  // ── Comments ─────────────────────────────────────────────────────────

  // welcome
  const cw1 = await addComment(p.welcome, egideId,
    'I needed a place like this. Thank you for building it.',
    null, '2025-12-01 10:00:00')
  await addComment(p.welcome, amosId, 'Showing up as I am. That\'s all I\'ve got some days.', null, '2025-12-01 10:30:00')
  await addComment(p.welcome, sofiaId, 'The "no performance" part is what got me. I\'m so tired of performing okayness.', null, '2025-12-01 11:00:00')
  await addComment(p.welcome, liamId, 'Grateful this exists.', cw1, '2025-12-01 11:15:00')

  // therapy1
  const ct1 = await addComment(p.therapy1, amosId, 'The "not bad enough" thing kept me from going for years too. So glad you went.', null, '2025-12-03 15:00:00')
  await addComment(p.therapy1, sofiaId, 'That discomfort you\'re describing — that\'s the work. You\'re doing it.', null, '2025-12-03 15:30:00')
  await addComment(p.therapy1, egideId, 'I think I needed to hear that the discomfort means it\'s working. Thank you.', ct1, '2025-12-03 16:00:00')
  await addComment(p.therapy1, priyaId, 'Two years was me too. Starting is the hardest part.', null, '2025-12-03 16:30:00')

  // grief
  await addComment(p.grief, sofiaId, 'The grocery store thing. Yes. Grief ambushes you in the most ordinary places.', null, '2025-12-05 21:00:00')
  await addComment(p.grief, liamId, 'Eight months is no time at all. Be gentle with yourself.', null, '2025-12-05 21:30:00')
  const cg1 = await addComment(p.grief, amosId, 'Thank you for saying both things are true at once. That\'s exactly it.', null, '2025-12-05 22:00:00')
  await addComment(p.grief, kaiId, 'I lost someone last year. The song thing happens to me too. Sending you a lot of care.', cg1, '2025-12-05 22:30:00')

  // anxiety
  const ca1 = await addComment(p.anxiety, egideId, '"Waiting for a good moment to fall apart." That\'s the most accurate description I\'ve ever read.', null, '2025-12-08 12:00:00')
  await addComment(p.anxiety, amosId, 'The low hum. That\'s it. That\'s what I\'ve been trying to describe to people for years.', null, '2025-12-08 12:30:00')
  await addComment(p.anxiety, sofiaId, 'It\'s validating and also really sad to know others feel this way. Thank you for naming it.', ca1, '2025-12-08 13:00:00')
  await addComment(p.anxiety, priyaId, 'This is the post I\'m sending to the people in my life who don\'t understand anxiety.', null, '2025-12-08 13:30:00')

  // burnout
  const cb1 = await addComment(p.burnout, amaraId, 'The "running on empty" thing is so real. And the scariest part is you don\'t notice.', null, '2025-12-12 09:00:00')
  await addComment(p.burnout, kaiId, 'I went through this two years ago. It took me six months to feel like myself again. You\'ll get there.', null, '2025-12-12 09:30:00')
  await addComment(p.burnout, liamId, 'The week off that revealed everything — I know exactly what that moment feels like.', cb1, '2025-12-12 10:00:00')
  await addComment(p.burnout, egideId, 'Rest isn\'t a reward for productivity. I keep having to relearn this.', null, '2025-12-12 10:30:00')

  // boundaries
  await addComment(p.boundaries, sofiaId, '"The feeling is the whole point." Your therapist is good.', null, '2025-12-15 17:00:00')
  const cbnd1 = await addComment(p.boundaries, priyaId, 'I also over-explain. Working on this too. It\'s so hard.', null, '2025-12-15 17:30:00')
  await addComment(p.boundaries, amaraId, 'The guilt of saying no is the exact thing we\'re supposed to learn to sit with. Thank you for sharing this.', cbnd1, '2025-12-15 18:00:00')

  // gratitude
  await addComment(p.gratitude, kaiId, 'Four minutes of light. That\'s beautiful. I\'m going to try this tomorrow.', null, '2025-12-18 19:30:00')
  await addComment(p.gratitude, egideId, 'Before you look at your phone. That detail matters a lot.', null, '2025-12-18 20:00:00')

  // lonely
  const cl1 = await addComment(p.lonely, sofiaId, 'Yes. I feel this too and have never known how to describe it. Thank you for trying.', null, '2025-12-22 22:00:00')
  await addComment(p.lonely, amosId, 'You\'re not alone in the loneliness. I know that sounds like a paradox but I mean it.', null, '2025-12-22 22:30:00')
  await addComment(p.lonely, kaiId, 'I was hoping to hear that. Thank you both.', cl1, '2025-12-22 23:00:00')
  await addComment(p.lonely, priyaId, 'My therapist calls it "existential loneliness." Knowing it has a name helped me somehow.', null, '2025-12-22 23:30:00')

  // journaling
  await addComment(p.journaling, amosId, 'The thought that surprises you — yes. That\'s the whole thing.', null, '2026-01-02 08:00:00')
  const cj1 = await addComment(p.journaling, liamId, 'How do you do it? Do you use prompts or just write?', null, '2026-01-02 08:30:00')
  await addComment(p.journaling, egideId, 'I just write whatever is loudest in my head. No structure. It looks like a mess but it helps.', cj1, '2026-01-02 09:00:00')

  // nature
  await addComment(p.nature, priyaId, 'Moving through something physically to make the internal movement possible — that\'s profound.', null, '2026-01-06 14:00:00')
  await addComment(p.nature, kaiId, 'I have a trail like this too. There\'s something about returning to the same place that\'s comforting.', null, '2026-01-06 14:30:00')

  // selfcompassion
  const csc1 = await addComment(p.selfcompassion, liamId, 'The double standard we have for ourselves vs. people we love is wild when you actually see it.', null, '2026-01-10 11:00:00')
  await addComment(p.selfcompassion, amaraId, 'My therapist gave me the same reframe. "Would you say that to your best friend?" Never fails to stop me.', csc1, '2026-01-10 11:30:00')
  await addComment(p.selfcompassion, sofiaId, 'Working on this too. It\'s slow work.', null, '2026-01-10 12:00:00')

  // rest
  await addComment(p.rest, egideId, 'The guilt is the thing. Intellectually I know rest matters. But sitting still feels like falling behind.', null, '2026-01-14 20:00:00')
  await addComment(p.rest, amosId, 'Rest is productive. I keep writing it in my journal until it feels true.', null, '2026-01-14 20:30:00')

  // smalljoys
  const csj1 = await addComment(p.smalljoys, kaiId, 'Cold water on your face after crying. I know exactly what you mean and now I feel seen.', null, '2026-01-18 07:00:00')
  await addComment(p.smalljoys, sofiaId, 'A playlist only for walks. I\'m stealing this.', null, '2026-01-18 07:30:00')
  await addComment(p.smalljoys, amaraId, 'Thank you for this list. I\'m going to make my own.', csj1, '2026-01-18 08:00:00')

  // breakthrough
  await addComment(p.breakthrough, egideId, 'Those moments are everything. Hold onto it carefully.', null, '2026-01-22 09:00:00')
  await addComment(p.breakthrough, amosId, 'I\'ve had a few of those. They don\'t feel big in the moment but they change something quietly.', null, '2026-01-22 09:30:00')

  // water
  await addComment(p.water, sofiaId, 'Not dramatic at all. The environment we\'re in shapes us more than we admit.', null, '2026-01-27 01:00:00')
  const cw2 = await addComment(p.water, liamId, 'What does that even feel like, to unclenche like that? I\'m trying to imagine it.', null, '2026-01-27 01:30:00')
  await addComment(p.water, kaiId, 'Like putting down something heavy you\'d been carrying so long you forgot it wasn\'t part of you.', cw2, '2026-01-27 02:00:00')

  // vulnerability
  const cv1 = await addComment(p.vulnerability, amosId, 'I\'m glad you posted it. Quiet struggles are still real struggles.', null, '2026-02-03 16:00:00')
  await addComment(p.vulnerability, sofiaId, 'You said "slightly less heavy." That\'s enough. That counts.', null, '2026-02-03 16:30:00')
  await addComment(p.vulnerability, priyaId, 'We see you. Thank you for trusting us with this.', null, '2026-02-03 17:00:00')
  await addComment(p.vulnerability, egideId, 'Reading these responses helps too. Thank you.', cv1, '2026-02-03 17:30:00')

  // morningritual
  await addComment(p.morningritual, priyaId, 'Ten minutes outside first. I\'m starting this tomorrow.', null, '2026-02-08 08:00:00')
  await addComment(p.morningritual, kaiId, 'An act of presence before the day pulls you in. This is beautiful.', null, '2026-02-08 08:30:00')

  // peoplepleasing
  const cpp1 = await addComment(p.peoplepleasing, liamId, 'A trauma response. I had to sit with that for a while when my therapist said it too.', null, '2026-02-12 13:00:00')
  await addComment(p.peoplepleasing, amaraId, 'Understanding it and changing it being different things — yes. Exactly this.', cpp1, '2026-02-12 13:30:00')
  await addComment(p.peoplepleasing, egideId, 'Somewhere in between is still movement. You\'re not stuck.', null, '2026-02-12 14:00:00')

  // compassion
  await addComment(p.compassion, amosId, '"Lowering the bar to something survivable." I needed to read that today.', null, '2026-02-17 07:30:00')
  await addComment(p.compassion, sofiaId, 'Lying on the floor for a while is sometimes genuinely the right thing to do.', null, '2026-02-17 08:00:00')

  // griefwave
  const cgw1 = await addComment(p.griefwave, kaiId, 'Grief isn\'t linear. It should be on a poster somewhere. Nobody tells you this beforehand.', null, '2026-02-22 10:00:00')
  await addComment(p.griefwave, sofiaId, 'The voicemail you forgot to delete. That image broke my heart a little. I\'m sorry.', null, '2026-02-22 10:30:00')
  await addComment(p.griefwave, amaraId, 'Done pretending it should be linear. That alone is something.', cgw1, '2026-02-22 11:00:00')

  // meditation
  await addComment(p.meditation, liamId, 'Noticing where the mind goes — that\'s the whole practice. This reframe helped me.', null, '2026-03-01 21:00:00')
  await addComment(p.meditation, egideId, 'Grocery list meditation still counts. You showed up.', null, '2026-03-01 21:30:00')

  // askhelp
  const cah1 = await addComment(p.askhelp, sofiaId, 'Nothing collapsed. That\'s the thing we have to keep learning.', null, '2026-03-07 18:00:00')
  await addComment(p.askhelp, amosId, 'I\'m proud of you. Genuinely.', null, '2026-03-07 18:30:00')
  await addComment(p.askhelp, kaiId, 'The opposite happened. Yes. I want to hold onto that.', cah1, '2026-03-07 19:00:00')

  // progress
  await addComment(p.progress, amaraId, 'Happening underground where you can\'t see it. This is the most comforting thing I\'ve read in months.', null, '2026-03-14 15:00:00')
  await addComment(p.progress, priyaId, 'The garden metaphor is perfect for this space. Growth that doesn\'t look like progress still is.', null, '2026-03-14 15:30:00')

  // silence
  await addComment(p.silence, liamId, 'What I\'ve been avoiding, waiting patiently. That\'s haunting and true.', null, '2026-03-20 09:30:00')
  await addComment(p.silence, kaiId, 'I fill silence the same way. I\'m working on it too.', null, '2026-03-20 10:00:00')

  // body
  const cbod1 = await addComment(p.body, egideId, '"Always." The answer being always. That landed hard.', null, '2026-04-01 12:00:00')
  await addComment(p.body, amaraId, 'The body keeps the score. What we hold emotionally shows up physically. Have you read that book?', null, '2026-04-01 12:30:00')
  await addComment(p.body, sofiaId, 'Asking your body what it\'s carrying is a practice I want to start. Thank you for this.', cbod1, '2026-04-01 13:00:00')

  // seasonal
  await addComment(p.seasonal, amosId, 'A season of rest rather than failure to thrive. I\'m borrowing this framing.', null, '2026-04-10 17:00:00')
  await addComment(p.seasonal, priyaId, 'Half the time working is still working. Be gentle with the other half.', null, '2026-04-10 17:30:00')

  // letting
  const clet1 = await addComment(p.letting, kaiId, 'Grieving a version of yourself that never got to exist — I didn\'t have words for this before.', null, '2026-04-15 11:00:00')
  await addComment(p.letting, liamId, 'The actual you who has been through things and is still here. That\'s someone worth appreciating.', clet1, '2026-04-15 11:30:00')

  // joy
  await addComment(p.joy, sofiaId, 'Feeling good as a betrayal of the hard things. I know this feeling and I hate it.', null, '2026-04-18 10:00:00')
  const cjoy1 = await addComment(p.joy, egideId, 'You deserve the good afternoons. Both things can be true.', null, '2026-04-18 10:30:00')
  await addComment(p.joy, amaraId, 'Letting myself have it. I\'m writing that down.', cjoy1, '2026-04-18 11:00:00')

  // slowmorning
  await addComment(p.slowmorning, amosId, 'Running so fast you couldn\'t feel anything — that\'s the clearest description of burnout I\'ve heard.', null, '2026-04-22 12:00:00')
  await addComment(p.slowmorning, priyaId, 'Slowing down as radical. Yes. In a world that rewards speed, choosing slow is an act of resistance.', null, '2026-04-22 12:30:00')

  console.log('Comments seeded')

  // ── Likes ────────────────────────────────────────────────────────────
  const likeData = [
    [p.welcome,       egideId], [p.welcome,       amosId],  [p.welcome,   sofiaId],
    [p.welcome,       liamId],  [p.welcome,       amaraId], [p.welcome,   priyaId], [p.welcome, kaiId],

    [p.therapy1,      amosId],  [p.therapy1,      sofiaId], [p.therapy1,  liamId],
    [p.therapy1,      amaraId], [p.therapy1,      priyaId], [p.therapy1,  kaiId],

    [p.grief,         egideId], [p.grief,         sofiaId], [p.grief,     liamId],
    [p.grief,         amaraId], [p.grief,         priyaId], [p.grief,     kaiId],

    [p.anxiety,       egideId], [p.anxiety,       amosId],  [p.anxiety,   liamId],
    [p.anxiety,       amaraId], [p.anxiety,       kaiId],

    [p.burnout,       egideId], [p.burnout,       amosId],  [p.burnout,   sofiaId],
    [p.burnout,       amaraId], [p.burnout,       priyaId], [p.burnout,   kaiId],

    [p.boundaries,    egideId], [p.boundaries,    sofiaId], [p.boundaries, liamId], [p.boundaries, kaiId],

    [p.gratitude,     egideId], [p.gratitude,     amosId],  [p.gratitude, liamId],
    [p.gratitude,     amaraId], [p.gratitude,     kaiId],

    [p.lonely,        egideId], [p.lonely,        amosId],  [p.lonely,    sofiaId],
    [p.lonely,        liamId],  [p.lonely,        amaraId], [p.lonely,    priyaId],

    [p.journaling,    amosId],  [p.journaling,    sofiaId], [p.journaling, liamId],
    [p.journaling,    amaraId], [p.journaling,    kaiId],

    [p.nature,        egideId], [p.nature,        sofiaId], [p.nature,    liamId],
    [p.nature,        priyaId], [p.nature,        kaiId],

    [p.selfcompassion, egideId],[p.selfcompassion, amosId], [p.selfcompassion, liamId], [p.selfcompassion, kaiId],

    [p.rest,          egideId], [p.rest,          amosId],  [p.rest,      sofiaId],
    [p.rest,          amaraId], [p.rest,          priyaId],

    [p.smalljoys,     egideId], [p.smalljoys,     amosId],  [p.smalljoys, sofiaId],
    [p.smalljoys,     liamId],  [p.smalljoys,     kaiId],

    [p.breakthrough,  egideId], [p.breakthrough,  amosId],  [p.breakthrough, liamId],
    [p.breakthrough,  amaraId], [p.breakthrough,  kaiId],

    [p.water,         egideId], [p.water,         amosId],  [p.water,     sofiaId],
    [p.water,         liamId],  [p.water,         amaraId], [p.water,     priyaId],

    [p.vulnerability, amosId],  [p.vulnerability, sofiaId], [p.vulnerability, liamId],
    [p.vulnerability, amaraId], [p.vulnerability, priyaId], [p.vulnerability, kaiId],

    [p.morningritual, egideId], [p.morningritual, sofiaId], [p.morningritual, liamId], [p.morningritual, kaiId],

    [p.peoplepleasing, egideId],[p.peoplepleasing, amosId], [p.peoplepleasing, liamId], [p.peoplepleasing, kaiId],

    [p.compassion,    egideId], [p.compassion,    amosId],  [p.compassion, sofiaId],
    [p.compassion,    amaraId], [p.compassion,    priyaId],

    [p.griefwave,     egideId], [p.griefwave,     sofiaId], [p.griefwave, liamId],
    [p.griefwave,     priyaId], [p.griefwave,     kaiId],

    [p.meditation,    egideId], [p.meditation,    amosId],  [p.meditation, sofiaId], [p.meditation, kaiId],

    [p.askhelp,       egideId], [p.askhelp,       amosId],  [p.askhelp,   sofiaId],
    [p.askhelp,       liamId],  [p.askhelp,       amaraId], [p.askhelp,   priyaId],

    [p.progress,      amosId],  [p.progress,      sofiaId], [p.progress,  liamId],
    [p.progress,      amaraId], [p.progress,      priyaId], [p.progress,  kaiId],

    [p.silence,       egideId], [p.silence,       amosId],  [p.silence,   sofiaId], [p.silence, priyaId],

    [p.body,          egideId], [p.body,          amosId],  [p.body,      liamId],
    [p.body,          amaraId], [p.body,          kaiId],

    [p.adminreminder, egideId], [p.adminreminder, amosId],  [p.adminreminder, sofiaId],

    [p.seasonal,      egideId], [p.seasonal,      amosId],  [p.seasonal,  amaraId], [p.seasonal, kaiId],

    [p.letting,       egideId], [p.letting,       amosId],  [p.letting,   sofiaId],
    [p.letting,       liamId],  [p.letting,       amaraId],

    [p.joy,           egideId], [p.joy,           sofiaId], [p.joy,       liamId],
    [p.joy,           priyaId], [p.joy,           kaiId],

    [p.slowmorning,   egideId], [p.slowmorning,   amosId],  [p.slowmorning, sofiaId],
    [p.slowmorning,   liamId],  [p.slowmorning,   amaraId], [p.slowmorning, priyaId],
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
