import { existsSync, readFileSync } from 'node:fs';

const requiredFiles = [
  'favicon.svg',
  'site.webmanifest',
  'vercel.json',
  'api/crm/intake.mjs',
  'api/jobs/regeneration-maintenance-reminders.mjs',
  'api/resend/webhook.mjs',
  'api/stripe/checkout-status.mjs',
  'api/stripe/create-checkout-session.mjs',
  'api/stripe/create-donation-checkout.mjs',
  'api/stripe/payment-invite.mjs',
  'api/stripe/webhook.mjs',
  'Home.dc.html',
  'Book-Consultation.dc.html',
  'Group-Healing.dc.html',
  'Online-Group-Healing.dc.html',
  '144-Stages-Maintenance.dc.html',
];

const missing = requiredFiles.filter((file) => !existsSync(file));
if (missing.length) {
  throw new Error(`Release integrity check failed. Missing required files:\n${missing.join('\n')}`);
}

const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
const reminderCron = vercel.crons?.find(
  (job) => job.path === '/api/jobs/regeneration-maintenance-reminders' && job.schedule === '15 1 * * 1',
);
if (!reminderCron) {
  throw new Error('Release integrity check failed. The 9:15 AM Beijing Maintenance reminder cron is missing.');
}

const manifest = JSON.parse(readFileSync('site.webmanifest', 'utf8'));
if (!Array.isArray(manifest.icons) || !manifest.icons.length) {
  throw new Error('Release integrity check failed. Site manifest has no favicon entries.');
}

console.log(`Release integrity passed: ${requiredFiles.length} required files, reminder cron, and favicon manifest are present.`);
