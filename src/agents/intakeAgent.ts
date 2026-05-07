interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface LeadData {
  name: string;
  business: string;
  email: string;
  phone: string;
  projectType: string;
  budget: string;
  timeline: string;
}

const SYSTEM_PROMPT = `You are a friendly professional intake assistant for Gabriel's web design agency based in Ghana.

Your job is to warmly welcome potential clients and collect the following information ONE question at a time:
1. Their full name
2. Their business name
3. Type of website they need (e.g. portfolio, ecommerce, business website)
4. Their budget range (in Ghana Cedis)
5. Their timeline (when they need it done)
6. Their email address
7. Their phone number

Rules:
- Be warm, friendly and professional
- Ask ONE question at a time
- Keep responses short and conversational
- When you have ALL information, end with: "Thank you! Gabriel will be in touch with you within 24 hours to discuss your project. INTAKE_COMPLETE"
- Extract and remember info from natural conversation
- If they ask about pricing, say projects start from ₵2,000 depending on requirements`;

export const extractLeadData = (conversation: Message[]): LeadData => {
  // Simple extraction - Gemini can help you make this smarter
  const fullConversation = conversation
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');

  return {
    name: extractInfo(fullConversation, 'name'),
    business: extractInfo(fullConversation, 'business'),
    email: extractInfo(fullConversation, 'email'),
    phone: extractInfo(fullConversation, 'phone'),
    projectType: extractInfo(fullConversation, 'project'),
    budget: extractInfo(fullConversation, 'budget'),
    timeline: extractInfo(fullConversation, 'timeline'),
  };
};

const extractInfo = (text: string, type: string): string => {
  // Basic extraction - good enough to start
  return '';
};

export const chatWithIntakeAgent = async (
  messages: Message[]
): Promise<string> => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen/qwen3-235b-a22b',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      max_tokens: 500,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
};