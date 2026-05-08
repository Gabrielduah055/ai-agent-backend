import { Router } from 'express';
import type { Request, Response } from 'express';
import { chatWithIntakeAgent } from '../agents/intakeAgent';
import Leads from '../models/leads';
import twilio from 'twilio';

const router = Router();
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

// Store conversations in memory
const conversations = new Map<string, any[]>();

router.post('/incoming', async (req: Request, res: Response) => {
  try {
    const { From, Body } = req.body;

    console.log(`Message from ${From}: ${Body}`);

    // Get or create conversation for this number
    if (!conversations.has(From)) {
      conversations.set(From, []);
    }

    const history = conversations.get(From)!;

    // Add client message to history
    history.push({ role: 'user', content: Body });

    // Get AI response
    const aiResponse = await chatWithIntakeAgent(history);

    // Add AI response to history
    history.push({ role: 'assistant', content: aiResponse });

    // Check if intake is complete
    const isComplete = aiResponse.includes('INTAKE_COMPLETE');

    if (isComplete) {
      // Save lead to MongoDB
      const newLead = new Leads({
        phone: From.replace('whatsapp:', ''),
        conversation: history.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: new Date()
        })),
        status: 'qualified'
      });
      await newLead.save();
      console.log('New WhatsApp lead saved!', newLead._id);
      conversations.delete(From);
    }

    // Send response back via WhatsApp
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER!,
      to: From,
      body: aiResponse.replace('INTAKE_COMPLETE', '').trim()
    });

    res.status(200).send('OK');

  } catch (error) {
    console.error('WhatsApp error:', error);
    res.status(500).send('Error');
  }
});

export default router;