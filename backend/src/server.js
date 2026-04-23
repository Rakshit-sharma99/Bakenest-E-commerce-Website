// Import the built-in HTTP module to create the server
import http from 'http';
// Import Server from socket.io for real-time communication capabilities
import { Server } from 'socket.io';
// Import dotenv to load environment variables from a .env file
import dotenv from 'dotenv';
// Import the Express application instance from the local app.js file
import app from './app.js';
// Import the database connection utility to establish a MongoDB connection
import { connectDB } from './config/db.js';
// Import the socket initialization utility to handle socket events
import { initSocket } from './config/socket.js';

// Load environment variables into process.env for use throughout the application
dotenv.config();

// Define the port number, prioritizing the environment variable or defaulting to 5000
const PORT = process.env.PORT || 5000;

// Connect to the MongoDB database using the connection utility (using top-level await)
await connectDB();

// Create an HTTP server by wrapping the Express application instance
const server = http.createServer(app);

// Initialize a new Socket.IO server associated with the HTTP server
const io = new Server(server, {
  // Configure CORS to allow cross-origin requests from the client
  cors: {
    // Split the comma-separated CLIENT_URL if it exists, otherwise default to localhost:5173
    origin: process.env.CLIENT_URL?.split(',').map((u) => u.trim()) || ['http://localhost:5173'],
    // Specify the allowed HTTP methods for cross-origin requests
    methods: ['GET', 'POST'],
  },
});

// Set up a connection event listener for incoming socket clients
io.on('connection', (socket) => {
  // Emit a welcome message to the connecting client to verify real-time connectivity
  socket.emit('system:connected', { message: 'Connected to BakeNest realtime service' });
});

// Pass the Socket.IO instance to the initialization utility for global event handling
initSocket(io);

// Start the server and listen for incoming requests on the specified port
server.listen(PORT, '0.0.0.0', () => {
  // Log a message to the console indicating that the backend is successfully running
  console.log(`Backend running on port ${PORT}`);
});

