import mongoose, {Schema, Document} from "mongoose";

export interface ILead extends Document {
  name: string;
  business: string;
  email: string;
  phone: string;
  projectType: string;
  budget: string;
  timeline: string;
  conversation: Array<{
    role: string;
    content: string;
    timestamp: Date;
  }>;
  status: 'new' | 'contacted' | 'qualified' | 'booked' | 'closed';
  createdAt: Date;
}

const LeadSchema: Schema = new Schema({
  name: { type: String, default: '' },
  business: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  projectType: { type: String, default: '' },
  budget: { type: String, default: '' },
  timeline: { type: String, default: '' },
  conversation: [{
    role: String,
    content: String,
    timestamp: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'booked', 'closed'],
    default: 'new'
  },
  source: { type: String, default: 'whatsapp' }, // whatsapp or prospecting
  location: { type: String, default: '' },
  currency: { type: String, default: '$' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ILead>('Lead', LeadSchema);