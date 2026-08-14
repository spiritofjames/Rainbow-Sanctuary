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

const navigationFiles = ['SiteNavFixed.dc.html', 'SiteNavLotus.dc.html', 'SiteNavCinematic.dc.html'];
const requiredNavigationItems = [
  "{ key: 'group', label: 'Group Healing'",
  "{ label: 'Online Group Healing', href: '/online-group-healing' }",
  "{ label: 'Regeneration Maintenance', href: '/144-stages-maintenance' }",
  "{ label: 'Autism & Family Support', href: '/autism-family-support' }",
  "{ label: 'Young People’s Wellbeing Support', href: '/young-people-wellbeing' }",
];

for (const file of navigationFiles) {
  const source = readFileSync(file, 'utf8');
  const missingItems = requiredNavigationItems.filter((item) => !source.includes(item));
  if (missingItems.length) {
    throw new Error(`Release integrity check failed. ${file} is missing required navigation:\n${missingItems.join('\n')}`);
  }
  if (source.includes("key: 'community'") || source.includes("key: 'vision'") || source.includes("label: 'Bigger Vision'")) {
    throw new Error(`Release integrity check failed. ${file} contains retired primary navigation items.`);
  }
  if (source.indexOf("key: 'about'") < source.indexOf("key: 'events'")) {
    throw new Error(`Release integrity check failed. ${file} does not keep About at the end of the primary navigation.`);
  }
}

console.log(`Release integrity passed: ${requiredFiles.length} required files, reminder cron, favicon manifest, and primary navigation are present.`);
