// Coach voice lines. Shared by the app (fallback text for the device TTS) and scripts/gen-voice.mjs
// (which records them with ElevenLabs into assets/voice/<lang>/<key>.mp3).
// No imports here: the generator loads this file directly with Node.
//
// Text in [brackets] is an ElevenLabs audio tag (delivery cue, not spoken). The app strips it for the
// device TTS fallback. Numbers are written out in words so every voice reads them the same way.

export type VoiceLang = 'vi' | 'en';

/** Fixed cues, keyed by clip name. */
export const VOICE_CUES: Record<VoiceLang, Record<string, string>> = {
  vi: {
    go: '[excited] Bắt đầu!',
    ready: 'Chuẩn bị!',
    next: 'Tiếp theo:',
    halfway: '[excited] Được một nửa rồi, cố lên!',
    three_left: '[excited] Còn ba cái nữa thôi!',
    last_one: '[shouting] Cái cuối cùng!',
    ten_left: '[excited] Còn mười giây, giữ vững!',
    done: '[excited] Tuyệt vời! Bạn đã hoàn thành buổi tập!',
    // variants: the app picks one at random so the coach doesn't repeat itself
    go_2: '[excited] Nào, chiến thôi!',
    go_3: '[excited] Làm thôi nào!',
    halfway_2: '[excited] Nửa chặng rồi, giữ nhịp nhé!',
    three_left_2: '[excited] Ba cái nữa, dồn sức nào!',
    last_one_2: '[shouting] Cái cuối, dồn hết sức!',
    ten_left_2: '[excited] Mười giây cuối, đừng bỏ cuộc!',
    done_2: '[excited] Xuất sắc! Hôm nay bạn đã làm rất tốt!',
    // said once in the middle of a longer rest
    tip_breathe: 'Hít sâu bằng mũi, thở ra bằng miệng.',
    tip_water: 'Uống một ngụm nước nhé.',
    tip_shake: 'Lắc nhẹ tay chân cho thả lỏng.',
    tip_shoulders: 'Thả lỏng vai, chuẩn bị cho bài tiếp theo.',
    // tempo cues ("Đếm theo nhịp")
    up: '[excited] Lên!',
    down: 'Hạ chậm.',
    preview: '[excited] Xin chào! Tôi là huấn luyện viên của bạn. Cùng tập nào!',
  },
  en: {
    go: "[excited] Let's go!",
    ready: 'Get ready!',
    next: 'Next up:',
    halfway: "[excited] Halfway there, keep pushing!",
    three_left: '[excited] Just three more!',
    last_one: '[shouting] Last one!',
    ten_left: '[excited] Ten seconds left, hold it!',
    done: '[excited] Awesome! You finished the workout!',
    go_2: '[excited] Here we go!',
    go_3: "[excited] Come on, let's do this!",
    halfway_2: '[excited] Halfway done, keep that pace!',
    three_left_2: '[excited] Three more, dig deep!',
    last_one_2: '[shouting] Last one, give it everything!',
    ten_left_2: "[excited] Final ten seconds, don't quit!",
    done_2: '[excited] Amazing work today, you crushed it!',
    tip_breathe: 'Breathe in through your nose, out through your mouth.',
    tip_water: 'Grab a sip of water.',
    tip_shake: 'Shake out your arms and legs.',
    tip_shoulders: 'Relax your shoulders, get ready for the next one.',
    up: '[excited] Up!',
    down: 'Lower slowly.',
    preview: "[excited] Hey! I'm your coach. Let's get to work!",
  },
};

/** Counts said during a set (1..MAX_COUNT) and amounts like "12 reps" / "rest 30 seconds". */
export const MAX_COUNT = 30;
export const SECOND_AMOUNTS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 75, 90, 120];

const VI_DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
export function viNumber(n: number): string {
  if (n < 10) return VI_DIGITS[n];
  if (n < 20) return 'mười' + (n % 10 === 0 ? '' : ' ' + (n % 10 === 5 ? 'lăm' : VI_DIGITS[n % 10]));
  if (n < 100) {
    const t = Math.floor(n / 10), u = n % 10;
    const unit = u === 0 ? '' : u === 1 ? ' mốt' : u === 4 ? ' tư' : u === 5 ? ' lăm' : ' ' + VI_DIGITS[u];
    return VI_DIGITS[t] + ' mươi' + unit;
  }
  const h = Math.floor(n / 100), r = n % 100;
  return VI_DIGITS[h] + ' trăm' + (r === 0 ? '' : r < 10 ? ' lẻ ' + VI_DIGITS[r] : ' ' + viNumber(r));
}

const EN_ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
export function enNumber(n: number): string {
  if (n < 20) return EN_ONES[n];
  if (n < 100) return EN_TENS[Math.floor(n / 10)] + (n % 10 ? '-' + EN_ONES[n % 10] : '');
  return EN_ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + enNumber(n % 100) : '');
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Text for a generated (non-cue) clip key, or undefined if the key is not one of them. */
export function voiceLineFor(lang: VoiceLang, key: string): string | undefined {
  if (VOICE_CUES[lang][key]) return VOICE_CUES[lang][key];
  const m = key.match(/^(count|reps|sec|rest)_(\d+)$/);
  if (!m) return undefined;
  const n = Number(m[2]);
  const w = lang === 'vi' ? viNumber(n) : enNumber(n);
  switch (m[1]) {
    case 'count': return `${cap(w)}!`;
    case 'reps': return lang === 'vi' ? `${w} lần.` : `${w} reps.`;
    case 'sec': return lang === 'vi' ? `${w} giây.` : `${w} seconds.`;
    case 'rest': return lang === 'vi' ? `Nghỉ ${w} giây.` : `Rest, ${w} seconds.`;
  }
}

/** Every number-based clip key the generator should record. */
export function numberKeys(): string[] {
  const keys: string[] = [];
  for (let n = 1; n <= MAX_COUNT; n++) keys.push(`count_${n}`, `reps_${n}`);
  for (const s of SECOND_AMOUNTS) keys.push(`sec_${s}`, `rest_${s}`);
  return keys;
}

/** Clip keys for one cue and its variants (go, go_2, go_3…), in order. */
export function cueVariants(lang: VoiceLang, base: string): string[] {
  return Object.keys(VOICE_CUES[lang]).filter((k) => k === base || new RegExp(`^${base}_\\d+$`).test(k));
}

/** Rest tips, said once in the middle of a rest of 20s or more. */
export const REST_TIPS = ['tip_breathe', 'tip_water', 'tip_shake', 'tip_shoulders'];

/** Removes ElevenLabs audio tags, for the device TTS fallback. */
export const stripTags = (s: string) => s.replace(/\[[^\]]*\]\s*/g, '').trim();
