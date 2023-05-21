import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import userRoutes from './routes/userRoutes.js'
import chatRoutes from './routes/chatRoutes.js'
import messageRoutes from './routes/messageRoutes.js'
import { createServer } from 'http'
import { Server } from 'socket.io'

dotenv.config()
connectDB()

const app = express()

app.use(cors())
app.use(
  express.json({
    limit: '50mb',
  })
)

//By combining Express and Socket.IO in this way, you can use Express to handle regular HTTP requests and routes, while also enabling real-time communication with clients using Socket.IO. The app instance is passed to createServer() to create an HTTP server, and then the HTTP server is passed to new Server() to create a Socket.IO server instance.

// creates an HTTP server using the Express application. It takes the app instance as an argument and creates an HTTP server that can handle HTTP requests.
const server = createServer(app)

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

// Check the connection from client side of socket.io
let onlineUsers = []
io.on('connection', (socket) => {
  // socket events will be here

  // The chat members join the room i.e. the sender and the recipent
  socket.on('join-room', (userId) => {
    socket.join(userId)
  })

  // send mesaage to the clients who are present in the members array(sender and recipent)
  socket.on('send-message', (message) => {
    io.to(message.members[0])
      .to(message.members[1])
      .emit('receive-message', message)
  })

  // clear unread messages
  socket.on('clear-unread-messages', (data) => {
    io.to(data.members[0])
      .to(data.members[1])
      .emit('unread-messages-cleared', data)
  })

  //typing event
  socket.on('typing', (data) => {
    io.to(data.members[0]).to(data.members[1]).emit('started-typing', data)
  })

  // online users
  socket.on('came-online', (userId) => {
    if (!onlineUsers.includes(userId)) {
      onlineUsers.push(userId)
    }
    io.emit('online-users', onlineUsers)
  })

  // Moving an user from onLineUsers array when he/she goes offline
  socket.on('went-offline', (userId) => {
    onlineUsers = onlineUsers.filter((user) => user !== userId)
    io.emit('online-users', onlineUsers)
  })
})

app.use('/api/auth', userRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/messages', messageRoutes)

const PORT = process.env.PORT

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))
