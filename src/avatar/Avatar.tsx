import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Defs, Ellipse, G as Group, Image as SvgImage, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Animation, FLOOR, Prop, poseAt, solve } from './rig';
import { Body } from './body';

type Props = {
  anim: Animation;
  playing?: boolean;
  speed?: number;
  onCycle?: () => void;
  /** combo step boundaries (fractions of a cycle) and a callback fired when the active step changes */
  segments?: number[];
  onSegment?: (index: number) => void;
  style?: StyleProp<ViewStyle>;
  /** start phase (0..1), used for still thumbnails */
  phase?: number;
};

export const segmentAt = (ends: number[], frac: number) => {
  const i = ends.findIndex((e) => frac < e);
  return i === -1 ? ends.length - 1 : i;
};

// Room background (assets/images/room.jpg, 2272×1888 source). 1 unit = 8 source px;
// source pixel (170, 120) maps to (0, 0), so the floor spot at source y≈1600 lands on FLOOR.
const ROOM = require('../../assets/images/room.jpg');
const ROOM_BOX = { x: -170 / 8, y: -120 / 8, w: 2272 / 8, h: 1888 / 8 };

const Stage = memo(function Stage({ props }: { props?: Prop[] }) {
  return (
    <Group>
      {/* backdrop colours for frames wider/taller than the room image */}
      <Rect x={-400} y={-200} width={1040} height={300} fill="#E6CBAE" />
      <Rect x={-400} y={100} width={1040} height={400} fill="#E2B98F" />
      {/* room illustration: scaled so the standing spot on its floor sits at FLOOR */}
      <SvgImage href={ROOM} x={ROOM_BOX.x} y={ROOM_BOX.y} width={ROOM_BOX.w} height={ROOM_BOX.h} preserveAspectRatio="none" />
      <Rect x={-400} y={-200} width={1040} height={600} fill="url(#vignette)" />
      {props?.map((p, i) => <PropView key={i} p={p} />)}
      {/* yoga mat */}
      <Rect x={22} y={FLOOR - 1.5} width={196} height={5} rx={2.5} fill="#7E9C86" />
      <Rect x={22} y={FLOOR - 1.5} width={196} height={1.4} rx={0.7} fill="#A4BFA9" />
    </Group>
  );
});

function PropView({ p }: { p: Prop }) {
  switch (p.kind) {
    case 'bar':
      return (
        <Group>
          <Rect x={p.x1 + 4} y={-200} width={4} height={p.y + 200} fill="#3B4552" />
          <Rect x={p.x2 - 8} y={-200} width={4} height={p.y + 200} fill="#3B4552" />
          <Rect x={p.x1} y={p.y - 2.2} width={p.x2 - p.x1} height={4.4} rx={2.2} fill="url(#metal)" />
        </Group>
      );
    case 'chair':
      return (
        <Group>
          <Rect x={p.x} y={p.seat - 48} width={6} height={50} rx={2.5} fill="#7A5A3E" />
          <Rect x={p.x + 2} y={p.seat + 4} width={4.5} height={FLOOR - p.seat - 4} rx={1.5} fill="#5E4430" />
          <Rect x={p.x + p.w - 7} y={p.seat + 4} width={4.5} height={FLOOR - p.seat - 4} rx={1.5} fill="#5E4430" />
          <Rect x={p.x - 1} y={p.seat - 1} width={p.w + 2} height={7} rx={3} fill="url(#wood)" />
        </Group>
      );
    case 'wall':
      return (
        <Group>
          <Rect x={-400} y={-200} width={p.x + 400} height={FLOOR + 200} fill="#E9D3BA" />
          <Rect x={p.x - 2} y={-200} width={2} height={FLOOR + 200} fill="#C9A987" />
        </Group>
      );
  }
}

export function Avatar({ anim, playing = true, speed = 1, onCycle, segments, onSegment, style, phase: initial = 0 }: Props) {
  const [phase, setPhase] = useState(initial);
  const phaseRef = useRef(initial);
  const cbRef = useRef(onCycle);
  const segRef = useRef({ segments, onSegment, last: -1 });
  useLayoutEffect(() => {
    cbRef.current = onCycle;
    segRef.current.segments = segments;
    segRef.current.onSegment = onSegment;
  });

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

  const s = solve(poseAt(anim, phase));
  const footY = Math.max(s.leg[1][1], s.leg2[1][1]);
  const lift = Math.max(0, FLOOR - 4 - footY); // airborne → smaller, lighter shadow
  const shadowX = (s.hip[0] + s.shoulder[0]) / 2;

  return (
    <Svg viewBox="0 0 240 200" style={style}>
      <Defs>
        <RadialGradient id="vignette" gradientUnits="userSpaceOnUse" cx="120" cy="105" r="175">
          <Stop offset="0.55" stopColor="#3A2614" stopOpacity="0" />
          <Stop offset="1" stopColor="#3A2614" stopOpacity="0.35" />
        </RadialGradient>
        <RadialGradient id="shadow" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <Stop offset="1" stopColor="#000" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E3E8EE" />
          <Stop offset="1" stopColor="#7D8894" />
        </LinearGradient>
        <LinearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#A47A52" />
          <Stop offset="1" stopColor="#6E4F35" />
        </LinearGradient>
      </Defs>

      <Stage props={anim.props} />
      <Ellipse
        cx={shadowX}
        cy={FLOOR + 1.5}
        rx={Math.max(16, 46 - lift * 0.6)}
        ry={4.5}
        fill="url(#shadow)"
        opacity={Math.max(0.35, 1 - lift / 50)}
      />

      <Body s={s} />
    </Svg>
  );
}
