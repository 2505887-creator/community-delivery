import 'dotenv/config';
import { processEmailQueue } from '../server/lib/emailQueue';

const intervalMs = Number(process.env.EMAIL_WORKER_INTERVAL_MS || 15000);
let running = true;

const tick = async () => {
  if (!running) return;
  try { await processEmailQueue(); }
  catch (error) { console.error('[email-worker]', error); }
};

await tick();
const timer = setInterval(() => void tick(), intervalMs);
const shutdown = () => { running = false; clearInterval(timer); };
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
