import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Avatar, segmentAt } from '../avatar/Avatar';
import { Animation } from '../avatar/rig';
import { Exercise } from '../data/exercises';
import { EXERCISE_IMAGES } from '../data/images.generated';
import { tempoCue } from '../data/progression';
import { ExerciseVideo, getExerciseVideo } from '../data/videos';
import { useStore } from '../store';
import { colors, fonts } from '../theme';

type Props = {
  ex: Exercise;
  playing?: boolean;
  speed?: number;
  /** fired once per rep (avatar cycle, or 1/repsPerLoop of a video loop) */
  onCycle?: () => void;
  /** combo exercises: fired when the active step changes */
  onSegment?: (index: number) => void;
  /** segment ends (0..1] for exercises without parts, e.g. the tempo cue point */
  segments?: number[];
  style?: StyleProp<ViewStyle>;
  /** force a source; default follows the user setting */
  prefer?: 'video' | 'avatar';
  /** show the small "AI video" badge */
  badge?: boolean;
};

/**
 * AI demo first: the video when one exists, else the two AI stills cross-fading in the rhythm of the move,
 * else the animated avatar. With the "Avatar" setting the avatar is used, except for exercises whose
 * animation is only borrowed from a similar move (animApprox): those keep their AI images.
 */
export function ExerciseMedia({ ex, prefer, badge = true, segments: extra, ...rest }: Props) {
  const { settings } = useStore();
  const video = getExerciseVideo(ex.id);
  const images = EXERCISE_IMAGES[ex.id];
  const [failed, setFailed] = useState(false);
  const want = prefer ?? settings.media;
  const segments = ex.parts?.map((p) => p.end) ?? extra;

  if (video && want === 'video' && !failed) {
    return <VideoMedia key={ex.id} video={video} segments={video.partEnds ?? segments} badge={badge} onError={() => setFailed(true)} {...rest} />;
  }
  if (images && (want === 'video' || ex.animApprox)) {
    return <ImageMedia key={ex.id} anim={ex.anim} images={images} segments={segments} combo={!!ex.parts} {...rest} />;
  }
  return (
    <Avatar
      anim={ex.anim}
      playing={rest.playing}
      speed={rest.speed}
      onCycle={rest.onCycle}
      segments={segments}
      onSegment={rest.onSegment}
      style={rest.style}
    />
  );
}

function VideoMedia({
  video, segments, playing = true, speed = 1, onCycle, onSegment, style, badge, onError,
}: Omit<Props, 'ex' | 'prefer'> & { video: ExerciseVideo; segments?: number[]; onError: () => void }) {
  const player = useVideoPlayer(video.source, (p) => {
    p.loop = true;
    p.muted = true;
    p.timeUpdateEventInterval = 0.05;
    p.play();
  });
  const cbRef = useRef(onCycle);
  const lastFrac = useRef(0);
  const segCb = useRef(onSegment);
  const lastSeg = useRef(-1);
  useLayoutEffect(() => {
    cbRef.current = onCycle;
    segCb.current = onSegment;
  });

  useEffect(() => {
    if (playing) player.play();
    else player.pause();
  }, [playing, player]);

  useEffect(() => {
    // expo-video exposes speed only as a settable property on its native player object (no setter method)
    // eslint-disable-next-line react-hooks/immutability
    player.playbackRate = speed;
  }, [speed, player]);

  // Rep counting: split each loop into `repsPerLoop` equal segments and fire on every boundary crossed.
  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    const d = player.duration;
    if (!d) return;
    const frac = currentTime / d;
    const n = video.repsPerLoop;
    if (segments && segCb.current) {
      const i = segmentAt(segments, (frac * n) % 1);
      if (i !== lastSeg.current) {
        lastSeg.current = i;
        segCb.current(i);
      }
    }
    if (!cbRef.current) return;
    const prev = lastFrac.current;
    lastFrac.current = frac;
    const wrapped = frac < prev - 0.5; // loop restarted
    const before = Math.floor(prev * n);
    const after = Math.floor(frac * n) + (wrapped ? n : 0);
    for (let i = before; i < after; i++) cbRef.current();
  });

  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'error') onError();
  });

  return (
    <View style={[styles.wrap, style]}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls={false} />
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>AI VIDEO</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: colors.card2 },
  // explicit size: an Image with only absolute offsets renders at the bitmap's own size
  still: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  badge: { position: 'absolute', right: 10, top: 10, backgroundColor: 'rgba(7,9,13,0.6)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(198,244,50,0.35)' },
  badgeText: { color: colors.accent, fontSize: 11, fontFamily: fonts.cond, letterSpacing: 1.2 },
});

const smooth = (x: number) => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};

/**
 * Two AI stills: A = start of the rep, B = the other end. B fades in toward the far end of the move and out
 * again, timed by the exercise's animation cycle, which also drives rep counting (same as the avatar).
 */
function ImageMedia({
  anim, images, segments, combo, playing = true, speed = 1, onCycle, onSegment, style,
}: Omit<Props, 'ex' | 'prefer' | 'badge'> & { anim: Animation; images: { a: number; b?: number }; segments?: number[]; combo: boolean }) {
  const [phase, setPhase] = useState(0);
  const phaseRef = useRef(0);
  const cbRef = useRef(onCycle);
  const segRef = useRef({ segments, onSegment, last: -1 });
  useLayoutEffect(() => {
    cbRef.current = onCycle;
    segRef.current.segments = segments;
    segRef.current.onSegment = onSegment;
  });
  // where B is fully shown: the far end of the move (combos: the second move)
  const bAt = useMemo(() => (combo && segments?.[0] ? (segments[0] + 1) / 2 : tempoCue(anim)?.at ?? 0.5), [anim, combo, segments]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
      if (last) {
        const dt = Math.min(0.1, (now - last) / 1000);
        phaseRef.current += (dt * speed) / anim.cycle;
        if (phaseRef.current >= 1) {
          phaseRef.current -= 1;
          cbRef.current?.();
        }
        setPhase(phaseRef.current);
        const sg = segRef.current;
        if (sg.segments && sg.onSegment) {
          const i = segmentAt(sg.segments, phaseRef.current);
          if (i !== sg.last) {
            sg.last = i;
            sg.onSegment(i);
          }
        }
      }
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, anim]);

  // 0 at the start of the rep, 1 at bAt, back to 0 at the end; held at each end for a moment
  const u = phase < bAt ? phase / bAt : 1 - (phase - bAt) / (1 - bAt);
  const bOpacity = images.b ? smooth((u - 0.3) / 0.4) : 0;

  return (
    <View style={[styles.wrap, style]}>
      <Image source={images.a} style={styles.still} resizeMode="contain" />
      {images.b && <Image source={images.b} style={[styles.still, { opacity: bOpacity }]} resizeMode="contain" />}
    </View>
  );
}
