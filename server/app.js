import express from 'express'
import cors from 'cors'
import 'dotenv/config'

import authRouter     from './routes/auth.js'
import postsRouter    from './routes/posts.js'
import commentsRouter from './routes/comments.js'
import adminRouter    from './routes/admin.js'

const app = express()
app.set('port', process.env.PORT || 3000)
app.use(express.json())
app.use(cors())

app.use('/auth',     authRouter)
app.use('/posts',    postsRouter)
app.use('/comments', commentsRouter)
app.use('/admin',    adminRouter)

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
  