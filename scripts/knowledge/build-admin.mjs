import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const guardianDir = path.join(root, 'guardian');
await mkdir(guardianDir, { recursive: true });
await cp(path.join(root, 'node_modules/@sveltia/cms/dist/sveltia-cms.js'), path.join(guardianDir, 'sveltia-cms.js'));
