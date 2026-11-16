// Coach voice: plays pre-recorded ElevenLabs clips (assets/voice, see scripts/gen-voice.mjs) back to back.
// If any clip of a phrase is missing (e.g. a new exercise not recorded yet), the whole phrase falls back
// to the device TTS so the coach never goes silent.
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';
import { VOICE_CLIPS } from './data/voice.generated';
import { stripTags, voiceLineFor, VoiceLang } from './data/voiceLines';

/** One spoken piece: a clip key, plus the text to say if that clip doesn't exist. */
export type VoicePart = { key: string; text?: string };

let player: AudioPlayer | null = null;
let queue: number[] = [];
let busy = false;
let speakingTts = false;

function ensurePlayer() {
  if (player) return player;
  // play even with the ring/silent switch on, and duck the user's music instead of stopping it
  setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers' }).catch(() => {});
  player = createAudioPlayer(null);
  player.addListener('playbackStatusUpdate', (s) => {
    if (s.didJustFinish) playNext();
  });
  return player;
}

function playNext() {
  const next = queue.shift();
  if (next === undefined) {
    busy = false;
    return;
  }
  busy = true;
  const p = ensurePlayer();
  p.replace(next);
  p.play();
}

export function stopVoice() {
  queue = [];
  busy = false;
  player?.pause();
  Speech.stop();
  speakingTts = false;
}

/**
 * Speak a phrase made of clips.
 * - 'interrupt': cut off whatever is playing (new step, countdown)
 * - 'queue': wait for the current phrase (rep counts, encouragement)
 * - 'ifIdle': say it only if nothing is playing (so "3…" doesn't cut off "Squat, ten reps")
 */
export function speak(
  lang: VoiceLang,
  parts: VoicePart[],
  mode: 'interrupt' | 'queue' | 'ifIdle' = 'queue',
  /** 'coach' = recorded ElevenLabs clips, 'device' = the phone's built-in voice */
  style: 'coach' | 'device' = 'coach',
) {
  const interrupt = mode === 'interrupt';
  if (mode === 'ifIdle' && (busy || queue.length > 0 || speakingTts)) return;
  if (interrupt) stopVoice();
  const clips = parts.map((p) => VOICE_CLIPS[lang]?.[p.key]);
  if (style === 'coach' && clips.every((c) => c !== undefined)) {
    // don't let counts pile up behind a long line: drop the backlog once more than 2 clips are waiting
    if (!interrupt && queue.length > 2) queue = [];
    queue.push(...(clips as number[]));
    if (!busy) playNext();
    return;
  }
  const text = parts.map((p) => stripTags(p.text ?? voiceLineFor(lang, p.key) ?? '')).filter(Boolean).join(' ');
  if (!text) return;
  speakingTts = true;
  const done = () => { speakingTts = false; };
  Speech.speak(text, { language: lang === 'vi' ? 'vi-VN' : 'en-US', rate: 1.05, onDone: done, onStopped: done, onError: done });
}
