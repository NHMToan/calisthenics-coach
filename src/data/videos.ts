import type { VideoSource } from 'expo-video';
import { LOCAL_VIDEOS } from './videos.generated';

/**
 * AI demo videos per exercise.
 *
 * Two ways to add a video:
 *  1. Local (bundled, works offline): drop `assets/videos/<exercise-id>.mp4`
 *     and run `npm run videos:sync`. That regenerates `videos.generated.ts`.
 *  2. Remote (CDN): add an entry to REMOTE_VIDEOS below. Cached on device after first play.
 *
 * `repsPerLoop` = how many reps one play-through of the clip shows, so rep counting stays in sync.
 * Exercises without a video fall back to the animated avatar automatically.
 *
 * `partEnds` (combo exercises only) = where each step ends within ONE rep of the clip, as fractions 0–1,
 * e.g. [0.56, 1] = first step until 56% of the rep, second step to the end. Measure it from the real clip:
 * the avatar's own timing (exercise `parts`) rarely matches an AI video. Omit it to use the avatar timing.
 */
export type ExerciseVideo = { source: VideoSource; repsPerLoop: number; partEnds?: number[] };

const REMOTE_VIDEOS: Record<string, { uri: string; repsPerLoop?: number }> = {
  // squat: { uri: 'https://cdn.example.com/fitmotion/squat.mp4', repsPerLoop: 2 },
};

/** Step boundaries measured from each combo clip (see `partEnds` above). */
const VIDEO_PART_ENDS: Record<string, number[]> = {
  // squat-lunge.mp4 (9.7s): stands with hands on hips until ~5.5s, then steps back into the lunge.
  'squat-lunge': [0.56, 1],
};

export function getExerciseVideo(id: string): ExerciseVideo | undefined {
  const partEnds = VIDEO_PART_ENDS[id];
  const local = LOCAL_VIDEOS[id];
  if (local) return { source: local.source, repsPerLoop: local.repsPerLoop, partEnds };
  const remote = REMOTE_VIDEOS[id];
  if (remote) return { source: { uri: remote.uri, useCaching: true }, repsPerLoop: remote.repsPerLoop ?? 1, partEnds };
  return undefined;
}
