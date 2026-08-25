import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('the pull-request workflow uses the complete release preflight', async () => {
  const workflow = await read('.github/workflows/site-quality.yml');
  const packageJson = JSON.parse(await read('package.json'));

  assert.match(workflow, /npm run quality:preflight/);
  assert.match(packageJson.scripts['quality:preflight'], /npm test/);
  assert.match(packageJson.scripts['quality:preflight'], /email:check/);
  assert.match(packageJson.scripts['quality:preflight'], /release:check/);
  assert.match(packageJson.scripts['quality:preflight'], /validate_site\.py/);
  assert.match(packageJson.scripts['quality:preflight'], /publish-discovery-layer/);
});

test('production monitoring covers current high-value public journeys and records incidents', async () => {
  const monitor = await read('.github/workflows/uptime-monitor.yml');
  const smokeCheck = await read('scripts/check_endpoints.py');

  assert.match(monitor, /npm run quality:production-smoke/);
  assert.match(monitor, /issues: write/);
  assert.match(monitor, /Production endpoint health check failed/);

  for (const path of [
    '/online-group-healing',
    '/144-stages-maintenance',
    '/children-weekly-practice',
    '/autism-family-support',
    '/awakening-your-inner-light-2026',
  ]) {
    assert.match(smokeCheck, new RegExp(path.replace(/[/?]/g, '\\$&')));
  }
});
