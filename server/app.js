// This is the main file that starts our server
// It connects all the different parts of the app together

// These are packages we installed to help build the server
import express from 'express'  // express is the framework that runs our server
import cors from 'cors'         // cors lets our frontend talk to the backend
import 'dotenv/config'          // dotenv loads our .env file (passwords, secrets, etc.)
import { fileURLToPath } from 'url'  // needed to get the folder path in ES modules
import path from 'path'              // path helps us work with file and folder paths

// This is a workaround to get __dirname in ES module files
// (It doesn't exist automatically like it does in older Node.js code)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Import all our route files — each one handles a different part of the app
import authRouter     from './routes/auth.js'      // handles login and register
import postsRouter    from './routes/posts.js'     // handles creating and viewing posts
import commentsRouter from './routes/comments.js'  // handles deleting comments
import adminRouter    from './routes/admin.js'     // handles admin actions
import usersRouter    from './routes/users.js'     // handles user profile data
import searchRouter   from './routes/search.js'   // handles searching

// Create the express app
const app = express()

// Set the port — use environment variable if available, otherwise use 3000
app.set('port', process.env.PORT || 3000)

// This lets us read JSON data from request bodies
app.use(express.json())

// This allows our React frontend (on a different port) to make requests to our server
app.use(cors())

// This serves uploaded images as static files from the /uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Connect each router to a URL path
app.use('/auth',     authRouter)      // all auth routes like /auth/login
app.use('/posts',    postsRouter)     // all post routes like /posts
app.use('/comments', commentsRouter)  // all comment routes
app.use('/admin',    adminRouter)     // all admin routes
app.use('/users',    usersRouter)     // all user routes
app.use('/search',   searchRouter)   // all search routes

// Basic home route — just shows a welcome message
app.get('/', (req, res) => {
  res.send('Welcome to The Digital Garden API')
})

// Health check route — used to confirm the server is running
app.get('/up', (req, res) => {
  res.json({status: 'up'})
})

// Start the server and listen for requests on our port
app.listen(app.get('port'), () => {
    console.log('App is running at http://localhost:%d in %s mode', app.get('port'), app.get('env'))
    console.log('  Press CTRL-C to stop\n')
  })
