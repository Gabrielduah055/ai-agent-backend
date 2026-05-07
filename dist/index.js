"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./config/db"));
const chats_1 = __importDefault(require("./routes/chats"));
const promises_1 = __importDefault(require("node:dns/promises"));
promises_1.default.setServers(["8.8.8.8", "1.1.1.1"]);
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Connect to MongoDB
(0, db_1.default)();
// Routes
app.use('/api/chat', chats_1.default);
app.get('/', (req, res) => {
    res.json({ message: 'AI Intake Agent is running 🚀' });
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
