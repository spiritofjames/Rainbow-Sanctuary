import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const adminDir = path.join(root, 'admin');
await mkdir(adminDir, { recursive: true });
await cp(path.join(root, 'node_modules/@sveltia/cms/dist/sveltia-cms.js'), path.join(adminDir, 'sveltia-cms.js'));
