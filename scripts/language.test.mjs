import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import { translate } from '../src/i18n/translate.js';
const traverse = traverseModule.default;
const catalog = JSON.parse(fs.readFileSync(new URL('../src/i18n/hi.json', import.meta.url), 'utf8'));
test('English remains unchanged and Hindi uses everyday words', () => {
  assert.equal(translate('Need help', 'en'), 'Need help');
  assert.equal(translate('Need help', 'hi'), 'मदद चाहिए');
  assert.equal(translate('Completed', 'hi'), 'काम खत्म');
  assert.equal(translate('Cancel', 'hi'), 'रहने दें');
  assert.equal(translate('Welcome back, ', 'hi'), 'फिर से स्वागत है, ');
});
test('dynamic text translates while keeping identifiers and amounts', () => {
  assert.equal(translate('No active repairs yet', 'hi'), 'अभी चल रही रिपेयर नहीं हैं');
  assert.equal(translate('PARTIAL PAYMENT (₹1,200 DUE)', 'hi'), 'कुछ पैसे मिले (₹1,200 बाकी)');
  assert.equal(translate('Chat about OnePlus 11R', 'hi'), 'OnePlus 11R के बारे में चैट');
  assert.equal(translate('September 2026', 'hi'), 'सितंबर 2026');
  assert.equal(translate('sourabh@personal.in', 'hi'), 'sourabh@personal.in');
  assert.equal(translate('BK-9021', 'hi'), 'BK-9021');
  const data = { status: 'Completed' };
  assert.equal(translate(data, 'hi'), data);
  assert.equal(data.status, 'Completed');
});
test('static UI instructions are covered, option values stay canonical and hooks have valid scope', () => {
  const intentionallyUntranslated = new Set(['support@servicehub.com', 'you@email.com', 'you@example.com', 'ServiceHub', 'Service', 'Hub', 'owner@repairshop.com']);
  const missing = [];
  for (const file of fs.readdirSync('src', { recursive: true }).filter(f => f.endsWith('.jsx'))) {
    const ast = parse(fs.readFileSync('src/' + file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
    traverse(ast, {
      ReferencedIdentifier(p) {
        if (['tr', 'language'].includes(p.node.name)) assert.ok(p.scope.getBinding(p.node.name), `${file}: unbound ${p.node.name}`);
      },
      CallExpression(p) {
        const argument = p.node.arguments[0];
        if (p.node.callee.name !== 'tr' || argument?.type !== 'StringLiteral') return;
        const text = argument.value.trim();
        if (/[A-Za-z]/.test(text) && !catalog[text] && !intentionallyUntranslated.has(text)) missing.push(`${file}: ${text}`);
      },
      JSXOpeningElement(p) {
        if (p.node.name.name !== 'option' || file.includes('LanguageSwitch')) return;
        const value = p.node.attributes.find(a => a.name?.name === 'value');
        assert.ok(value, `${file}: translated option must keep its original value`);
        assert.notEqual(value.value?.expression?.callee?.name, 'tr', `${file}: do not translate a stored option value`);
      }
    });
  }
  assert.deepEqual(missing, []);
});
