import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import chatRoutes from './routes/chats';
import dns from "node:dns/promises";

dns.setServers(["8.8.8.8", "1.1.1.1"])

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

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