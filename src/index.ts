import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import chatRoutes from './routes/chats';
import whatsappRoutes from './routes/whatsapp';


import dns from "node:dns/promises";

dns.setServers(["8.8.8.8", "1.1.1.1"])

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

//using the cors
app.use(cors ( {
  origin: [
    'http://localhost:4000',
    'https://dashboard-two-green-46.vercel.app/dashboard'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Add this after your existing routes
app.use('/api/whatsapp', whatsappRoutes);

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'AI Intake Agent is running 🚀' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});