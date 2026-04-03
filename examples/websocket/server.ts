import { createServer } from 'http'
import { Server } from 'socket.io'
import type { InterviewQuestion } from "./interview-engine";
import { buildInterviewPlan, gradeAnswer, roundsConfig } from "./interview-engine";

const httpServer = createServer()
const io = new Server(httpServer, {
  // DO NOT change the path, it is used by Caddy to forward the request to the correct port
  path: '/',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

interface User {
  id: string
  username: string
}

interface Message {
  id: string
  username: string
  content: string
  timestamp: Date
  type: 'user' | 'system'
}

const users = new Map<string, User>()

/** Live AI interview sessions (per socket) */
interface InterviewSession {
  skillName: string
  plan: InterviewQuestion[]
  index: number
  correct: number
}
const interviews = new Map<string, InterviewSession>()

const generateMessageId = () => Math.random().toString(36).substr(2, 9)

const createSystemMessage = (content: string): Message => ({
  id: generateMessageId(),
  username: 'System',
  content,
  timestamp: new Date(),
  type: 'system'
})

const createUserMessage = (username: string, content: string): Message => ({
  id: generateMessageId(),
  username,
  content,
  timestamp: new Date(),
  type: 'user'
})

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`)

  // Add test event handler
  socket.on('test', (data) => {
    console.log('Received test message:', data)
    socket.emit('test-response', { 
      message: 'Server received test message', 
      data: data,
      timestamp: new Date().toISOString()
    })
  })

  socket.on('join', (data: { username: string }) => {
    const { username } = data
    
    // Create user object
    const user: User = {
      id: socket.id,
      username
    }
    
    // Add to user list
    users.set(socket.id, user)
    
    // Send join message to all users
    const joinMessage = createSystemMessage(`${username} joined the chat room`)
    io.emit('user-joined', { user, message: joinMessage })
    
    // Send current user list to new user
    const usersList = Array.from(users.values())
    socket.emit('users-list', { users: usersList })
    
    console.log(`${username} joined the chat room, current online users: ${users.size}`)
  })

  socket.on('message', (data: { content: string; username: string }) => {
    const { content, username } = data
    const user = users.get(socket.id)
    
    if (user && user.username === username) {
      const message = createUserMessage(username, content)
      io.emit('message', message)
      console.log(`${username}: ${content}`)
    }
  })

  socket.on('disconnect', () => {
    interviews.delete(socket.id)
    const user = users.get(socket.id)
    
    if (user) {
      // Remove from user list
      users.delete(socket.id)
      
      // Send leave message to all users
      const leaveMessage = createSystemMessage(`${user.username} left the chat room`)
      io.emit('user-left', { user: { id: socket.id, username: user.username }, message: leaveMessage })
      
      console.log(`${user.username} left the chat room, current online users: ${users.size}`)
    } else {
      console.log(`User disconnected: ${socket.id}`)
    }
  })

  socket.on('error', (error) => {
    console.error(`Socket error (${socket.id}):`, error)
  })

  // --- Real-time AI technical interview (rapid Q&A) ---
  socket.on('interview:start', (data: { skillName?: string }) => {
    const skillName = typeof data?.skillName === 'string' ? data.skillName.trim() : ''
    if (!skillName) {
      socket.emit('interview:error', { message: 'Missing skill name' })
      return
    }
    const plan = buildInterviewPlan(skillName)
    if (plan.length === 0) {
      socket.emit('interview:error', { message: 'No interview questions available for this skill' })
      return
    }
    const { total, requiredCorrect } = roundsConfig()
    interviews.set(socket.id, {
      skillName,
      plan,
      index: 0,
      correct: 0,
    })
    socket.emit('interview:started', {
      skillName,
      total,
      requiredCorrect,
    })
    const q = plan[0]!
    socket.emit('interview:question', {
      id: q.id,
      prompt: q.prompt,
      round: 1,
      total,
    })
  })

  socket.on('interview:answer', (data: { answer?: string }) => {
    const session = interviews.get(socket.id)
    if (!session) {
      socket.emit('interview:error', { message: 'No active interview — start again' })
      return
    }
    const plan = session.plan
    const q = plan[session.index]
    if (!q) {
      socket.emit('interview:error', { message: 'Invalid round' })
      return
    }
    const raw = typeof data?.answer === 'string' ? data.answer : ''
    const ok = gradeAnswer(q, raw)
    if (ok) session.correct += 1

    const { total, requiredCorrect } = roundsConfig()
    socket.emit('interview:round-result', {
      correct: ok,
      skillName: session.skillName,
      round: session.index + 1,
      total,
      correctSoFar: session.correct,
      requiredCorrect,
    })

    session.index += 1

    if (session.index >= plan.length) {
      const verified = session.correct >= requiredCorrect
      socket.emit('interview:complete', {
        skillName: session.skillName,
        verified,
        correct: session.correct,
        total,
        requiredCorrect,
      })
      interviews.delete(socket.id)
      return
    }

    const next = plan[session.index]!
    socket.emit('interview:question', {
      id: next.id,
      prompt: next.prompt,
      round: session.index + 1,
      total,
    })
  })

  socket.on('interview:cancel', () => {
    interviews.delete(socket.id)
    socket.emit('interview:cancelled', {})
  })
})

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal, shutting down server...')
  httpServer.close(() => {
    console.log('WebSocket server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('Received SIGINT signal, shutting down server...')
  httpServer.close(() => {
    console.log('WebSocket server closed')
    process.exit(0)
  })
})