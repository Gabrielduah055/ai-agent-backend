import { Router} from 'express';
import type { Request, Response } from 'express';
import { chatWithIntakeAgent, extractLeadData } from '../agents/intakeAgent';
import Leads from '../models/leads';

const router = Router();

const conversations = new Map<string, any[]>();

router.post('/message', async (req: Request, res: Response) => {
  try {
    const { sessionId, message } = req.body;

    if (!conversations.has(sessionId)) {
      conversations.set(sessionId, []);
    }

    const history = conversations.get(sessionId)!;

    history.push({ role: 'user', content: message });

    const aiResponse = await chatWithIntakeAgent(history);

    history.push({ role: 'assistant', content: aiResponse });

    const isComplete = aiResponse.includes('INTAKE_COMPLETE');

    if (isComplete) {
      const leadData = extractLeadData(history);
      const newLead = new Leads({  // ✅ changed Lead to Leads
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

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.get('/leads', async (req: Request, res: Response) => {
  try {
    const leads = await Leads.find().sort({ createdAt: -1 }); // ✅ changed Lead to Leads
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

export default router;