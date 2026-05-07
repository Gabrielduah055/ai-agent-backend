"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const intakeAgent_1 = require("../agents/intakeAgent");
const leads_1 = __importDefault(require("../models/leads"));
const router = (0, express_1.Router)();
const conversations = new Map();
router.post('/message', async (req, res) => {
    try {
        const { sessionId, message } = req.body;
        if (!conversations.has(sessionId)) {
            conversations.set(sessionId, []);
        }
        const history = conversations.get(sessionId);
        history.push({ role: 'user', content: message });
        const aiResponse = await (0, intakeAgent_1.chatWithIntakeAgent)(history);
        history.push({ role: 'assistant', content: aiResponse });
        const isComplete = aiResponse.includes('INTAKE_COMPLETE');
        if (isComplete) {
            const leadData = (0, intakeAgent_1.extractLeadData)(history);
            const newLead = new leads_1.default({
                ...leadData,
                conversation: history.map(m => ({
                    role: m.role,
                    content: m.content,
                    timestamp: new Date()
                })),
                status: 'qualified'
            });
            await newLead.save();
            console.log('New lead saved!', newLead._id);
            conversations.delete(sessionId);
        }
        res.json({
            response: aiResponse.replace('INTAKE_COMPLETE', '').trim(),
            isComplete,
            sessionId
        });
    }
    catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});
router.get('/leads', async (req, res) => {
    try {
        const leads = await leads_1.default.find().sort({ createdAt: -1 }); // ✅ changed Lead to Leads
        res.json(leads);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});
exports.default = router;
