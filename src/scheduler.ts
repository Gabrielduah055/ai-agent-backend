import cron from 'node-cron';
import { runProspectingAgent } from './agents/prospectingAgent';

export const startScheduler = (): void => {
  // Run every day at 6am
  cron.schedule('0 6 * * *', async () => {
    console.log('⏰ Scheduled prospecting starting...');
    await runProspectingAgent();
  });

  console.log('✅ Scheduler started — prospecting runs daily at 6am');
};