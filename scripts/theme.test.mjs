import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../public/theme-init.js', import.meta.url), 'utf8');
function run(saved, prefersDark = false, blocked = false) {
  const root = { dataset: {}, style: {} };
  vm.runInNewContext(source, { localStorage: { getItem() { if (blocked) throw new Error('Storage blocked'); return saved; } }, window: { matchMedia: () => ({ matches: prefersDark }) }, document: { documentElement: root } });
  return root;
}
assert.equal(run('dark', false).dataset.theme, 'dark');
assert.equal(run('light', true).dataset.theme, 'light');
assert.equal(run(null, true).dataset.theme, 'dark');
assert.equal(run(null, false).dataset.theme, 'light');
assert.equal(run('invalid', true).dataset.theme, 'dark');
assert.equal(run(null, true, true).dataset.theme, 'dark');
assert.equal(run('dark').style.colorScheme, 'dark');
console.log('Passed 7 theme startup checks: saved choice, system preference, invalid/blocked storage and colour scheme.');
