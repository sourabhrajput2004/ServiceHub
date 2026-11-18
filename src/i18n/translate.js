import hindi from './hi.json' with { type: 'json' };
// Translate presentation text only. Stored statuses, option values and user data stay unchanged.
const normalise = text => text.replace(/\s+/g, ' ').trim();
const exact = new Map(Object.entries(hindi).map(([key, value]) => [normalise(key), value]));
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const patterns = Object.entries(hindi).filter(([key]) => /\{\d+\}/.test(key)).map(([key, value]) => {
  const parts = normalise(key).split(/(\{\d+\})/);
  const slots = [];
  const regex = new RegExp('^' + parts.map(part => { const match = part.match(/^\{(\d+)\}$/); if (match) { slots.push(match[1]); return '(.+?)'; } return escape(part); }).join('') + '$');
  return { regex, slots, value };
});
export function translate(value, language = 'en') {
  if (typeof value !== 'string' || language !== 'hi' || !value.trim()) return value;
  const key = normalise(value);
  let translated = exact.get(key);
  if (translated === undefined) {
    for (const pattern of patterns) {
      const match = key.match(pattern.regex);
      if (!match) continue;
      const replacements = Object.fromEntries(pattern.slots.map((slot, i) => [slot, translate(match[i + 1], language)]));
      translated = pattern.value.replace(/\{(\d+)\}/g, (_, slot) => replacements[slot]);
      break;
    }
  }
  if (translated === undefined) return value;
  return (value.match(/^\s*/)?.[0] || '') + translated + (value.match(/\s*$/)?.[0] || '');
}
