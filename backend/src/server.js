import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './config/socket.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

await connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL?.split(',').map((u) => u.trim()) || ['http://localhost:5173'],
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  socket.emit('system:connected', { message: 'Connected to BakeNest realtime service' });
});

initSocket(io);

server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
