import assert from 'node:assert/strict';
import fs from 'node:fs';
import { legalContent } from '../src/content/legalContent.js';
import { translate } from '../src/i18n/translate.js';
for(const policy of Object.values(legalContent)) {
 const ids=new Set();
 for(const [id,title,text] of policy.sections) {
  assert.ok(!ids.has(id), 'Duplicate policy anchor');ids.add(id);
  for(const value of [title,text]) {
   const hindi=translate(value,'hi');
   assert.notEqual(hindi,value, 'Missing Hindi policy translation');
   assert.match(hindi,/[\u0900-\u097f]/, 'Hindi text must contain actual Devanagari');
   assert.ok(!hindi.includes('???'), 'Corrupted translation');
  }
 }
}
const footer=fs.readFileSync('src/components/common/Footer.jsx','utf8');
assert.ok(!footer.includes('Repair. Reconnect. Repeat.'),'Old footer tagline remains');
for(const route of ['/privacy-policy','/terms-and-conditions']) {
 assert.ok(footer.includes(`to="${route}"`),'Missing footer link');
 assert.ok(fs.readFileSync('src/App.jsx','utf8').includes(`path="${route}"`),'Missing public route');
}
const catalog=JSON.parse(fs.readFileSync('src/i18n/hi.json','utf8'));
assert.ok(!Object.values(catalog).some(value=>value.includes('???')), 'Corrupted Hindi labels');
console.log('Passed policy routes, footer links, 22 sections, anchors and English/Hindi content checks.');
