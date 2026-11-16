#!/usr/bin/env node
// Records the coach voice with ElevenLabs into assets/voice/<lang>/<key>.mp3 and writes
// src/data/voice.generated.ts (static require() map for Metro).
//
// Needs ELEVENLABS_API_KEY in .env.local (used only here, on your machine; it never ships in the app).
// Clips are cached: a clip is re-recorded only when its text, voice, model or settings change.
//
//   npm run voice:gen              record missing/changed clips
//   npm run voice:gen -- --dry     show what would be recorded and the character count, spend nothing
//   npm run voice:gen -- --force   re-record everything
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { VOICE_CUES, numberKeys, voiceLineFor } = await import(join(root, 'src/data/voiceLines.ts'));

// ---------- voice config ----------
const MODEL = 'eleven_v4';
const VOICES = {
  vi: process.env.VOICE_VI ?? '47rM9DW5VmjOw23BVHWi', // Tuấn Anh – northern Vietnamese baritone,
  en: process.env.VOICE_EN ?? 'TX3LPaxmHKxFdv7VOQHJ', // Liam – energetic American,
};
/** Energetic delivery for cues and counts, calmer for exercise names so they stay clear. */
const HYPE = { stability: 0.35, similarity_boost: 0.75, style: 0.6, use_speaker_boost: true, speed: 1.1 };
const CLEAR = { stability: 0.55, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true, speed: 1.05 };
const FORMAT = 'mp3_44100_64';

const args = new Set(process.argv.slice(2));
const DRY = args.has('--dry');
const FORCE = args.has('--force');

// ---------- what to record ----------
/** Exercise names, read from the data files (id + name.vi/name.en). */
function exerciseNames() {
  const src = ['src/data/exercises.ts', 'src/data/exercisesMore.ts'].map((f) => readFileSync(join(root, f), 'utf8')).join('\n');
  const re = /id:\s*'([a-z0-9-]+)'[\s\S]*?name:\s*\{\s*vi:\s*'((?:[^'\\]|\\.)*)',\s*en:\s*'((?:[^'\\]|\\.)*)'\s*\}/g;
  const out = [];
  for (const m of src.matchAll(re)) out.push({ id: m[1], vi: m[2].replace(/\\'/g, "'"), en: m[3].replace(/\\'/g, "'") });
  return out;
}

function clips(lang) {
  const list = [];
  // rest tips and "lower slowly" are calm on purpose; everything else is hype
  const calm = (key) => key.startsWith('tip_') || key === 'down';
  for (const key of Object.keys(VOICE_CUES[lang])) list.push({ key, text: VOICE_CUES[lang][key], settings: calm(key) ? CLEAR : HYPE });
  for (const key of numberKeys()) {
    const text = voiceLineFor(lang, key);
    list.push({ key, text: key.startsWith('count_') ? `[excited] ${text}` : text, settings: key.startsWith('count_') ? HYPE : CLEAR });
  }
  // "Hít đất + bật nhảy" / "Pike push-up (V)": read "+" and brackets as pauses, not "cộng"
  const spoken = (s) => s.replace(/\s*\+\s*/g, ', ').replace(/\s*\(([^)]*)\)/g, ', $1');
  // short names the voice slurs get a slightly longer spoken form
  const SPOKEN = {
    vi: { 'calf-raise': 'Nhón gót chân', 'dead-bug': 'Bài bọ chết', 'prone-ytw': 'Nằm sấp, nâng tay chữ Y, chữ T, chữ W' },
    en: {},
  };
  for (const ex of exerciseNames()) list.push({ key: `ex_${ex.id}`, text: `${SPOKEN[lang][ex.id] ?? spoken(ex[lang])}.`, settings: CLEAR });
  return list;
}

// ---------- recording ----------
function loadKey() {
  const env = readFileSync(join(root, '.env.local'), 'utf8');
  const line = env.split('\n').find((l) => l.startsWith('ELEVENLABS_API_KEY='));
  const key = line?.slice('ELEVENLABS_API_KEY='.length).trim().replace(/^["']|["']$/g, '');
  if (!key) throw new Error('ELEVENLABS_API_KEY missing in .env.local');
  return key;
}

async function record(apiKey, lang, clip) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICES[lang]}?output_format=${FORMAT}`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: clip.text, model_id: MODEL, language_code: lang, voice_settings: clip.settings }),
  });
  if (!res.ok) throw new Error(`${lang}/${clip.key}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  return Buffer.from(await res.arrayBuffer());
}

const voiceDir = join(root, 'assets/voice');
const manifestPath = join(voiceDir, 'manifest.json');
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
const apiKey = DRY ? null : loadKey();
let chars = 0;
let recorded = 0;
const keep = { vi: [], en: [] };

for (const lang of ['vi', 'en']) {
  mkdirSync(join(voiceDir, lang), { recursive: true });
  manifest[lang] ??= {};
  const todo = [];
  for (const clip of clips(lang)) {
    keep[lang].push(clip.key);
    const hash = createHash('sha1').update(JSON.stringify([clip.text, VOICES[lang], MODEL, clip.settings, FORMAT])).digest('hex').slice(0, 12);
    const file = join(voiceDir, lang, `${clip.key}.mp3`);
    if (!FORCE && manifest[lang][clip.key]?.hash === hash && existsSync(file)) continue;
    todo.push({ ...clip, hash, file });
  }
  for (const clip of todo) {
    chars += clip.text.length;
    if (DRY) { console.log(`would record ${lang}/${clip.key}: ${clip.text}`); continue; }
    writeFileSync(clip.file, await record(apiKey, lang, clip));
    manifest[lang][clip.key] = { hash: clip.hash, text: clip.text };
    // save after every paid clip, so a failure later in the run doesn't re-bill the ones already recorded
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    recorded++;
    process.stdout.write(`\r${lang}: ${recorded} recorded`);
  }
}

// drop clips that are no longer used (e.g. a renamed exercise), only after every recording succeeded,
// so a failed run never leaves voice.generated.ts pointing at deleted files
for (const lang of ['vi', 'en']) {
  for (const f of readdirSync(join(voiceDir, lang))) {
    const key = f.replace(/\.mp3$/, '');
    if (keep[lang].includes(key)) continue;
    if (DRY) { console.log(`would remove ${lang}/${key}`); continue; }
    rmSync(join(voiceDir, lang, f));
    delete manifest[lang][key];
    console.log(`\nremoved ${lang}/${key}`);
  }
}

if (DRY) {
  console.log(`\n${chars} characters to record (≈ $${((chars / 1000) * 0.08).toFixed(2)} at ${MODEL} API price).`);
  process.exit(0);
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
const body = ['vi', 'en']
  .map((lang) => `  ${lang}: {\n` + keep[lang].sort().map((k) => `    '${k}': require('../../assets/voice/${lang}/${k}.mp3'),`).join('\n') + '\n  },')
  .join('\n');
writeFileSync(
  join(root, 'src/data/voice.generated.ts'),
  `// AUTO-GENERATED by scripts/gen-voice.mjs. Do not edit by hand.\nexport const VOICE_CLIPS: Record<'vi' | 'en', Record<string, number>> = {\n${body}\n};\n`,
);
console.log(`\nvoice: ${recorded} clip(s) recorded, ${chars} characters. voice.generated.ts updated.`);
