import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

import authRouter     from './routes/auth.js'
import postsRouter    from './routes/posts.js'
import commentsRouter from './routes/comments.js'
import adminRouter    from './routes/admin.js'
import usersRouter    from './routes/users.js'
import searchRouter   from './routes/search.js'

const app = express()
app.set('port', process.env.PORT || 3000)
app.use(express.json())
app.use(cors())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/auth',     authRouter)
app.use('/posts',    postsRouter)
app.use('/comments', commentsRouter)
app.use('/admin',    adminRouter)
app.use('/users',    usersRouter)
app.use('/search',   searchRouter)

app.get('/', (req, res) => {
  res.send('Welcome to The Digital Garden API')
})


app.get('/up', (req, res) => {
  res.json({status: 'up'})
})


app.listen(app.get('port'), () => {
    console.log('App is running at http://localhost:%d in %s mode', app.get('port'), app.get('env'));
    console.log('  Press CTRL-C to stop\n');
  });
  