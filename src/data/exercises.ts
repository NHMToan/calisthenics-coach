import { A, Animation, G, Pose, Prop, T } from '../avatar/rig';
import { moreExercises } from './exercisesMore';

export type Text = { vi: string; en: string };
export type TextList = { vi: string[]; en: string[] };
export type Category = 'combo' | 'push' | 'pull' | 'legs' | 'core' | 'cardio' | 'mobility';

/** A step inside a combo; `end` is where it finishes, as a fraction (0..1] of one rep cycle. */
export type ComboPart = { name: Text; end: number };
export type Equipment = 'none' | 'bar' | 'chair' | 'wall';

export type Exercise = {
  id: string;
  name: Text;
  category: Category;
  level: 1 | 2 | 3;
  equipment: Equipment;
  /** reps-based or time-based */
  mode: 'reps' | 'time';
  muscles: Text;
  /** MET value for calorie estimation */
  met: number;
  anim: Animation;
  /** combo exercises only: the sequence of moves inside one rep */
  parts?: ComboPart[];
  /** the avatar animation is borrowed from a similar exercise: only good for timing, not as a demo */
  animApprox?: boolean;
  steps: TextList;
  tips: TextList;
  mistakes: TextList;
};

// ---------- shared poses ----------
const STAND: Pose = { hip: [118, 107], torso: -90, arm: A(95, 92), arm2: A(85, 88), leg: T(120, G), leg2: T(114, G) };
const PLANK_TOP: Pose = { hip: [123.5, 150.5], torso: -24, arm: T(166, G), arm2: T(170, G), leg: T(55, G), leg2: T(59, G) };
const SQUAT_HANDS: Pose = { hip: [112, 148], torso: -20, arm: T(158, G), arm2: T(162, G), leg: T(124, G), leg2: T(118, G) };
const JUMP_AIR: Pose = { hip: [118, 80], torso: -88, arm: A(-100, -100), arm2: A(-95, -95), leg: T(122, 153), leg2: T(116, 151) };
const HANG: Pose = { hip: [118, 110], torso: -88, arm: T(126, 12), arm2: T(122, 12), leg: A(100, 130), leg2: A(95, 125) };
const BAR = { kind: 'bar' as const, y: 10, x1: 70, x2: 180 };
const PUSH_BOTTOM: Pose = { hip: [129, 170.6], torso: -8, arm: T(166, G), arm2: T(170, G), leg: T(55, G), leg2: T(59, G) };
const SQ_TOP: Pose = { hip: [116, 108], torso: -86, arm: A(85, 85), arm2: A(80, 82), leg: T(124, G), leg2: T(118, G) };
const SQ_BOTTOM: Pose = { hip: [96, 148], torso: -50, arm: A(-5, -8), arm2: A(-10, -12), leg: T(124, G), leg2: T(118, G) };
const LAND: Pose = { hip: [112, 120], torso: -75, arm: A(-10, -10), arm2: A(-15, -15), leg: T(124, G), leg2: T(118, G) };
const BRIDGE_DOWN: Pose = { hip: [96, 176], torso: 180, arm: A(4, 0), leg: T(140, G), leg2: T(136, G) };
const BRIDGE_UP: Pose = { hip: [88, 146], torso: 145, arm: A(4, 0), leg: T(140, G), leg2: T(136, G) };

// Plank family: feet pinned at x=55 and the body kept in one straight line (hip→ankle 74.9, ankle→shoulder 122.9),
// so the legs stay straight while the shoulders move on an arc around the feet. Both feet share one target:
// a foot even 1 unit closer to the hip makes that knee buckle down through the floor.
const HIGH_PLANK: Pose = { hip: [123.3, 150.2], torso: -24.3, arm: T(167, G), arm2: T(170, G), leg: T(55, G), leg2: T(55, G) };
const LOW_PUSH: Pose = { ...HIGH_PLANK, hip: [129.1, 170], torso: -8.4 };
/** forearm plank: elbows under the shoulders, forearms flat (wrist targets on the floor) */
const ELBOW_PLANK: Pose = { ...HIGH_PLANK, hip: [127.6, 162.7], torso: -14.1, arm: T(199, 178.5), arm2: T(201, 178.5) };
/** half-way: one hand pushing up, the other still on its forearm */
const HALF_UP: Pose = { ...HIGH_PLANK, hip: [127, 160.3], torso: -16.1, arm: T(167, G), arm2: T(201, 178.5) };
const HALF_DOWN: Pose = { ...HALF_UP, arm: T(199, 178.5), arm2: T(170, G) };

// Bulgarian split squat: rear foot (far leg) up on a chair behind, toes tucked on the seat.
const BSS_CHAIR = { kind: 'chair' as const, x: 8, seat: 143, w: 52 };
const BSS_TOP: Pose = { hip: [114, 110], torso: -84, arm: A(100, 70), arm2: A(95, 75), leg: T(134, G), leg2: T(57, 133) };
const BSS_BOTTOM: Pose = { hip: [100, 148], torso: -78, arm: A(100, 70), arm2: A(95, 75), leg: T(134, G), leg2: T(62, 140) };

// Hanging from the bar (chin-up grip).
const CHIN_TOP: Pose = { ...HANG, hip: [118, 78] };
const HANG_KNEES: Pose = { ...HANG, hip: [117, 108], torso: -92, leg: A(-14, 76), leg2: A(-10, 80) };

// Burpee with the feet leaving the floor on the jump back/in (lerping feet along the floor buckles the knees).
const BURPEE_SQUAT: Pose = { hip: [119, 148], torso: -20, arm: T(167, G), arm2: T(170, G), leg: T(122, G), leg2: T(117, G) };
const BURPEE_KICK: Pose = { hip: [118, 138], torso: -10, arm: T(167, G), arm2: T(170, G), leg: T(56, 160), leg2: T(56, 160) };
const TUCK_AIR: Pose = { hip: [118, 86], torso: -76, arm: A(62, 50), arm2: A(57, 45), leg: A(-6, 86), leg2: A(-2, 90) };

/** Builds one looping animation out of several moves and records where each move ends in the cycle. */
function combo(cycle: number, parts: { name: Text; frames: Pose[]; weights: number[] }[], props?: Prop[]) {
  const frames = parts.flatMap((p) => p.frames);
  const weights = parts.flatMap((p) => p.weights);
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  const comboParts = parts.map((p) => {
    acc += p.weights.reduce((a, b) => a + b, 0);
    return { name: p.name, end: acc / total };
  });
  return { anim: { cycle, frames, weights, ...(props && { props }) }, parts: comboParts };
}

export const EXERCISES: Exercise[] = [
  // ---------------- MOBILITY / WARM-UP ----------------
  {
    id: 'arm-circles', category: 'mobility', level: 1, equipment: 'none', mode: 'time', met: 2.8,
    name: { vi: 'Xoay tay', en: 'Arm circles' },
    muscles: { vi: 'Vai, khởi động', en: 'Shoulders, warm-up' },
    anim: {
      cycle: 2.4,
      frames: [
        { ...STAND, arm: A(90, 90), arm2: A(90, 90) },
        { ...STAND, arm: A(0, 0), arm2: A(0, 0) },
        { ...STAND, arm: A(-90, -90), arm2: A(-90, -90) },
        { ...STAND, arm: A(180, 180), arm2: A(180, 180) },
      ],
    },
    steps: {
      vi: ['Đứng thẳng, hai chân rộng bằng vai.', 'Duỗi thẳng tay, xoay thành vòng tròn lớn.', 'Giữ hông và lưng cố định, thở đều.'],
      en: ['Stand tall, feet shoulder-width apart.', 'Keep arms straight and draw big circles.', 'Keep hips and back still, breathe steadily.'],
    },
    tips: { vi: ['Bắt đầu vòng nhỏ rồi to dần.'], en: ['Start small, then make the circles bigger.'] },
    mistakes: { vi: ['Gập khuỷu tay', 'Nhún vai lên tai'], en: ['Bending the elbows', 'Shrugging toward the ears'] },
  },
  {
    id: 'high-knees', category: 'cardio', level: 1, equipment: 'none', mode: 'time', met: 8,
    name: { vi: 'Nâng gối cao', en: 'High knees' },
    muscles: { vi: 'Đùi, bụng, tim mạch', en: 'Hip flexors, core, cardio' },
    anim: {
      cycle: 0.8,
      frames: [
        { hip: [118, 105], torso: -88, arm: A(-40, -100), arm2: A(120, 70), leg: A(-5, 88), leg2: A(92, 90) },
        { hip: [118, 105], torso: -88, arm: A(120, 70), arm2: A(-40, -100), leg: A(92, 90), leg2: A(-5, 88) },
      ],
    },
    steps: {
      vi: ['Chạy tại chỗ, kéo gối lên ngang hông.', 'Đánh tay nhịp nhàng theo chân.', 'Tiếp đất bằng mũi chân, nhẹ nhàng.'],
      en: ['Run in place, driving knees to hip height.', 'Pump your arms in rhythm.', 'Land softly on the balls of your feet.'],
    },
    tips: { vi: ['Giữ thân trên thẳng, siết bụng.'], en: ['Stay upright and brace your core.'] },
    mistakes: { vi: ['Ngả người ra sau', 'Tiếp đất bằng gót'], en: ['Leaning back', 'Landing on the heels'] },
  },

  // ---------------- LEGS ----------------
  {
    id: 'squat', category: 'legs', level: 1, equipment: 'none', mode: 'reps', met: 5,
    name: { vi: 'Squat', en: 'Squat' },
    muscles: { vi: 'Đùi trước, mông', en: 'Quads, glutes' },
    anim: {
      cycle: 3,
      frames: [
        { hip: [116, 108], torso: -86, arm: A(85, 85), arm2: A(80, 82), leg: T(124, G), leg2: T(118, G) },
        { hip: [96, 148], torso: -50, arm: A(-5, -8), arm2: A(-10, -12), leg: T(124, G), leg2: T(118, G) },
      ],
    },
    steps: {
      vi: ['Đứng chân rộng bằng vai, mũi chân hơi mở.', 'Đẩy hông ra sau, hạ người như ngồi ghế.', 'Hạ đến khi đùi song song sàn, tay đưa ra trước.', 'Đạp gót chân để đứng lên.'],
      en: ['Feet shoulder-width, toes slightly out.', 'Push hips back as if sitting in a chair.', 'Lower until thighs are parallel, arms forward.', 'Drive through your heels to stand.'],
    },
    tips: { vi: ['Gối đi cùng hướng mũi chân.', 'Ngực mở, lưng thẳng.'], en: ['Knees track over toes.', 'Chest up, back flat.'] },
    mistakes: { vi: ['Nhấc gót chân', 'Gối khuỵu vào trong', 'Cong lưng'], en: ['Heels lifting', 'Knees caving in', 'Rounding the back'] },
  },
  {
    id: 'jump-squat', category: 'cardio', level: 2, equipment: 'none', mode: 'reps', met: 8,
    name: { vi: 'Squat bật nhảy', en: 'Jump squat' },
    muscles: { vi: 'Đùi, mông, bắp chân', en: 'Quads, glutes, calves' },
    anim: {
      cycle: 1.8,
      weights: [0.7, 0.6, 0.8],
      frames: [
        { hip: [96, 148], torso: -50, arm: A(100, 95), arm2: A(105, 100), leg: T(124, G), leg2: T(118, G) },
        JUMP_AIR,
        { hip: [112, 120], torso: -75, arm: A(-10, -10), arm2: A(-15, -15), leg: T(124, G), leg2: T(118, G) },
      ],
    },
    steps: {
      vi: ['Hạ người xuống tư thế squat.', 'Bật mạnh lên, vung tay lên cao.', 'Tiếp đất nhẹ, khuỵu gối ngay để giảm chấn.'],
      en: ['Lower into a squat.', 'Explode up, swinging arms overhead.', 'Land softly and sink straight into the next squat.'],
    },
    tips: { vi: ['Tiếp đất bằng cả bàn chân.'], en: ['Land on your whole foot.'] },
    mistakes: { vi: ['Tiếp đất với gối thẳng', 'Gối khuỵu vào trong khi tiếp đất'], en: ['Landing with locked knees', 'Knees caving on landing'] },
  },
  {
    id: 'reverse-lunge', category: 'legs', level: 2, equipment: 'none', mode: 'reps', met: 4.5,
    name: { vi: 'Lunge lùi', en: 'Reverse lunge' },
    muscles: { vi: 'Đùi, mông, giữ thăng bằng', en: 'Quads, glutes, balance' },
    anim: {
      cycle: 3.2,
      weights: [0.6, 1, 1, 0.6],
      frames: [
        { ...STAND, arm: A(100, 70), arm2: A(95, 75), leg: T(120, G), leg2: T(114, G) },
        { hip: [110, 116], torso: -90, arm: A(100, 70), arm2: A(95, 75), leg: T(120, G), leg2: T(90, 166) },
        { hip: [100, 140], torso: -86, arm: A(100, 70), arm2: A(95, 75), leg: T(120, G), leg2: T(64, G) },
        { hip: [110, 116], torso: -90, arm: A(100, 70), arm2: A(95, 75), leg: T(120, G), leg2: T(90, 166) },
      ],
    },
    steps: {
      vi: ['Đứng thẳng, tay chống hông.', 'Bước một chân ra sau một bước dài.', 'Hạ người đến khi gối sau gần chạm sàn.', 'Đẩy chân trước để về vị trí đứng, đổi chân.'],
      en: ['Stand tall, hands on hips.', 'Step one foot far back.', 'Lower until the back knee nearly touches the floor.', 'Push through the front foot to return; switch legs.'],
    },
    tips: { vi: ['Hai gối tạo góc ~90°.'], en: ['Aim for ~90° at both knees.'] },
    mistakes: { vi: ['Gối trước vượt quá xa mũi chân', 'Ngả người về trước'], en: ['Front knee shooting far past toes', 'Leaning forward'] },
  },
  {
    id: 'glute-bridge', category: 'legs', level: 1, equipment: 'none', mode: 'reps', met: 3.5,
    name: { vi: 'Nâng hông', en: 'Glute bridge' },
    muscles: { vi: 'Mông, đùi sau, lưng dưới', en: 'Glutes, hamstrings, lower back' },
    anim: {
      cycle: 3,
      weights: [1, 0.5, 1],
      frames: [
        { hip: [96, 176], torso: 180, arm: A(4, 0), leg: T(140, G), leg2: T(136, G) },
        { hip: [88, 146], torso: 145, arm: A(4, 0), leg: T(140, G), leg2: T(136, G) },
        { hip: [88, 146], torso: 145, arm: A(4, 0), leg: T(140, G), leg2: T(136, G) },
      ],
    },
    steps: {
      vi: ['Nằm ngửa, co gối, bàn chân đặt sát mông.', 'Siết mông, đẩy hông lên cao.', 'Giữ 1 giây ở đỉnh, vai - hông - gối thẳng hàng.', 'Hạ hông từ từ.'],
      en: ['Lie on your back, knees bent, feet near glutes.', 'Squeeze glutes and lift hips.', 'Hold 1s at the top: shoulders, hips, knees in line.', 'Lower slowly.'],
    },
    tips: { vi: ['Đẩy bằng gót chân.'], en: ['Push through your heels.'] },
    mistakes: { vi: ['Ưỡn lưng quá mức', 'Dùng lưng thay vì mông'], en: ['Over-arching the back', 'Lifting with the back instead of glutes'] },
  },
  {
    id: 'wall-sit', category: 'legs', level: 1, equipment: 'wall', mode: 'time', met: 3.5,
    name: { vi: 'Ngồi dựa tường', en: 'Wall sit' },
    muscles: { vi: 'Đùi trước, sức bền', en: 'Quads, endurance' },
    anim: {
      cycle: 4,
      props: [{ kind: 'wall', x: 74 }],
      frames: [
        { hip: [82, 146], torso: -90, arm: A(60, 5), arm2: A(65, 10), leg: T(120, G), leg2: T(116, G) },
        { hip: [82, 145], torso: -91, arm: A(60, 5), arm2: A(65, 10), leg: T(120, G), leg2: T(116, G) },
      ],
    },
    steps: {
      vi: ['Dựa lưng sát tường.', 'Trượt xuống đến khi gối vuông góc 90°.', 'Giữ tư thế, thở đều.'],
      en: ['Lean your back flat against a wall.', 'Slide down until knees are at 90°.', 'Hold and breathe steadily.'],
    },
    tips: { vi: ['Gối ngay trên cổ chân.'], en: ['Knees stacked over ankles.'] },
    mistakes: { vi: ['Chống tay lên đùi', 'Hông cao hơn gối'], en: ['Pushing hands on thighs', 'Hips above knee level'] },
  },
  {
    id: 'bulgarian-split-squat', category: 'legs', level: 2, equipment: 'chair', mode: 'reps', met: 5,
    name: { vi: 'Bulgarian split squat', en: 'Bulgarian split squat' },
    muscles: { vi: 'Đùi trước, mông, thăng bằng', en: 'Quads, glutes, balance' },
    anim: {
      cycle: 3.2,
      props: [BSS_CHAIR],
      frames: [BSS_TOP, BSS_BOTTOM],
    },
    steps: {
      vi: ['Đứng quay lưng vào ghế, cách khoảng một bước dài.', 'Gác mũi chân sau lên mặt ghế, tay chống hông.', 'Hạ thẳng người xuống đến khi đùi trước song song sàn.', 'Đạp gót chân trước để đứng lên; làm đủ rep rồi đổi chân.'],
      en: ['Stand with your back to a chair, about a long step away.', 'Rest your rear toes on the seat, hands on hips.', 'Lower straight down until the front thigh is parallel to the floor.', 'Drive through the front heel to stand; finish your reps, then switch legs.'],
    },
    tips: { vi: ['Dồn trọng tâm vào chân trước, chân sau chỉ giữ thăng bằng.'], en: ['Keep the weight on the front leg; the back leg only balances.'] },
    mistakes: { vi: ['Đứng quá gần ghế', 'Gối trước khuỵu vào trong', 'Đẩy bằng chân sau'], en: ['Standing too close to the chair', 'Front knee caving in', 'Pushing off the back leg'] },
  },
  {
    id: 'assisted-pistol-squat', category: 'legs', level: 3, equipment: 'chair', mode: 'reps', met: 5,
    name: { vi: 'Pistol squat xuống ghế', en: 'Pistol squat to chair' },
    muscles: { vi: 'Đùi trước, mông, thăng bằng, cổ chân', en: 'Quads, glutes, balance, ankle mobility' },
    anim: {
      cycle: 3.6,
      weights: [1.2, 0.3, 1],
      props: [{ kind: 'chair', x: 48, seat: 153, w: 52 }],
      frames: [
        { hip: [118, 107], torso: -88, arm: A(70, 40), arm2: A(65, 35), leg: T(122, G), leg2: A(55, 75) },
        { hip: [100, 144], torso: -55, arm: A(-8, -10), arm2: A(-12, -14), leg: T(122, G), leg2: A(-8, -8) },
        { hip: [100, 144.5], torso: -55, arm: A(-8, -10), arm2: A(-12, -14), leg: T(122, G), leg2: A(-8, -8) },
      ],
    },
    steps: {
      vi: ['Đứng một chân trước ghế, mép ghế ngay sau gót chân.', 'Duỗi chân kia ra trước, nhấc khỏi sàn; hai tay đưa ra trước.', 'Đẩy hông ra sau, hạ người trên một chân đến khi mông chạm nhẹ mặt ghế.', 'Đạp gót chân trụ để đứng lên, không ngồi hẳn xuống; làm đủ rep rồi đổi chân.'],
      en: ['Stand on one leg in front of a chair, its edge just behind your heel.', 'Reach the other leg straight forward, off the floor, arms out in front.', 'Push your hips back and lower on one leg until your hips lightly touch the seat.', "Drive through the standing heel to rise without sitting down; finish your reps, then switch legs."],
    },
    tips: { vi: ['Ghế càng thấp, bài càng khó.', 'Gót chân trụ luôn chạm sàn.'], en: ['The lower the chair, the harder it gets.', 'Keep the standing heel down.'] },
    mistakes: { vi: ['Ngồi phịch xuống ghế rồi lấy đà', 'Nhấc gót chân trụ', 'Gối trụ khuỵu vào trong'], en: ['Plopping onto the chair and rocking up', 'Standing heel lifting', 'Standing knee caving in'] },
  },
  {
    id: 'skater-hop', category: 'legs', level: 2, equipment: 'none', mode: 'time', met: 7,
    name: { vi: 'Bật nhảy trượt băng', en: 'Skater hops' },
    muscles: { vi: 'Mông, đùi, thăng bằng, tim mạch', en: 'Glutes, legs, balance, cardio' },
    anim: {
      cycle: 1.6,
      frames: [
        { hip: [110, 136], torso: -55, arm: A(-20, -30), arm2: A(150, 140), leg: T(120, G), leg2: T(62, 163) },
        { hip: [114, 112], torso: -72, arm: A(80, 60), arm2: A(100, 90), leg: T(124, 172), leg2: T(104, 170) },
        { hip: [110, 136], torso: -55, arm: A(150, 140), arm2: A(-20, -30), leg: T(62, 163), leg2: T(120, G) },
        { hip: [114, 112], torso: -72, arm: A(100, 90), arm2: A(80, 60), leg: T(104, 170), leg2: T(124, 172) },
      ],
    },
    steps: {
      vi: ['Đứng trên một chân, gối hơi khuỵu, người đổ nhẹ về trước.', 'Bật ngang sang bên kia như vận động viên trượt băng.', 'Tiếp đất mềm bằng chân còn lại, chân kia vắt chéo ra sau.', 'Đánh tay theo nhịp, bật qua lại liên tục.'],
      en: ['Stand on one leg, knee soft, chest leaning slightly forward.', 'Leap sideways to the other side like a speed skater.', 'Land softly on the other foot, sweeping the free leg behind you.', 'Swing your arms with the rhythm and keep bounding side to side.'],
    },
    tips: { vi: ['Giữ một nhịp ngắn khi tiếp đất để kiểm soát thăng bằng.'], en: ['Pause briefly on each landing to own your balance.'] },
    mistakes: { vi: ['Tiếp đất gối thẳng', 'Gối khuỵu vào trong khi tiếp đất'], en: ['Landing with a straight knee', 'Knee caving in on landing'] },
  },
  {
    id: 'lunge-knee-drive', category: 'legs', level: 2, equipment: 'none', mode: 'reps', met: 5.5,
    name: { vi: 'Lunge lùi + đẩy gối', en: 'Lunge with knee drive' },
    muscles: { vi: 'Đùi, mông, cơ gập hông, thăng bằng', en: 'Quads, glutes, hip flexors, balance' },
    anim: {
      cycle: 3.4,
      weights: [0.9, 0.6, 0.4, 0.6, 0.9],
      frames: [
        { hip: [100, 140], torso: -84, arm: A(120, 100), arm2: A(55, -20), leg: T(120, G), leg2: T(64, G) },
        { hip: [112, 116], torso: -88, arm: A(90, 50), arm2: A(95, 80), leg: T(120, G), leg2: T(98, 168) },
        { hip: [118, 108], torso: -88, arm: A(50, -30), arm2: A(130, 110), leg: T(120, G), leg2: A(-10, 85) },
        { hip: [118, 108], torso: -88, arm: A(50, -30), arm2: A(130, 110), leg: T(120, G), leg2: A(-10, 85) },
        { hip: [112, 116], torso: -88, arm: A(90, 50), arm2: A(95, 80), leg: T(120, G), leg2: T(98, 168) },
      ],
    },
    steps: {
      vi: ['Bước một chân ra sau, hạ xuống tư thế lunge.', 'Đạp chân trước để đứng lên.', 'Đồng thời kéo gối sau lên ngang hông, tay đối diện đánh lên.', 'Đưa chân đó lùi lại về lunge; làm đủ rep rồi đổi chân.'],
      en: ['Step one foot back and lower into a lunge.', 'Drive through the front foot to stand.', 'At the same time bring the back knee up to hip height, opposite arm swinging up.', 'Step that leg back into the lunge; finish your reps, then switch legs.'],
    },
    tips: { vi: ['Siết bụng để đứng vững trên một chân ở đỉnh.'], en: ['Brace your core to stay steady on one leg at the top.'] },
    mistakes: { vi: ['Ngả người ra sau khi nâng gối', 'Gối sau đập xuống sàn'], en: ['Leaning back on the knee drive', 'Slamming the back knee into the floor'] },
  },

  // ---------------- PUSH ----------------
  {
    id: 'knee-pushup', category: 'push', level: 1, equipment: 'none', mode: 'reps', met: 3.8,
    name: { vi: 'Hít đất chống gối', en: 'Knee push-up' },
    muscles: { vi: 'Ngực, tay sau, vai', en: 'Chest, triceps, shoulders' },
    anim: {
      cycle: 2.8,
      frames: [
        { hip: [107, 154], torso: -30, arm: T(150, G), leg: A(135, -160) },
        { hip: [116, 168], torso: -12, arm: T(150, G), leg: A(160, -165) },
      ],
    },
    steps: {
      vi: ['Chống tay rộng hơn vai, đầu gối chạm sàn.', 'Thân người thẳng từ đầu đến gối.', 'Hạ ngực xuống gần sàn, khuỷu tay ~45°.', 'Đẩy mạnh lên.'],
      en: ['Hands slightly wider than shoulders, knees down.', 'Keep a straight line from head to knees.', 'Lower chest near the floor, elbows ~45°.', 'Press back up.'],
    },
    tips: { vi: ['Siết bụng và mông suốt động tác.'], en: ['Keep core and glutes tight.'] },
    mistakes: { vi: ['Võng lưng', 'Khuỷu tay bè ngang 90°'], en: ['Sagging hips', 'Elbows flared to 90°'] },
  },
  {
    id: 'pushup', category: 'push', level: 2, equipment: 'none', mode: 'reps', met: 3.8,
    name: { vi: 'Hít đất', en: 'Push-up' },
    muscles: { vi: 'Ngực, tay sau, vai, bụng', en: 'Chest, triceps, shoulders, core' },
    anim: {
      cycle: 2.6,
      frames: [
        PLANK_TOP,
        { hip: [129, 170.6], torso: -8, arm: T(166, G), arm2: T(170, G), leg: T(55, G), leg2: T(59, G) },
      ],
    },
    steps: {
      vi: ['Tư thế plank cao, tay ngay dưới vai.', 'Cơ thể thành một đường thẳng.', 'Hạ ngực sát sàn, khuỷu tay ép ~45°.', 'Đẩy lên đến khi tay duỗi thẳng.'],
      en: ['High plank, hands under shoulders.', 'Body in one straight line.', 'Lower chest to the floor, elbows ~45°.', 'Push up until arms are straight.'],
    },
    tips: { vi: ['Hít vào khi xuống, thở ra khi lên.'], en: ['Inhale down, exhale up.'] },
    mistakes: { vi: ['Hông võng hoặc chổng cao', 'Biên độ ngắn', 'Cúi đầu'], en: ['Hips sagging or piking', 'Half reps', 'Dropping the head'] },
  },
  {
    id: 'pike-pushup', category: 'push', level: 3, equipment: 'none', mode: 'reps', met: 4,
    name: { vi: 'Hít đất chữ V (Pike)', en: 'Pike push-up' },
    muscles: { vi: 'Vai, tay sau', en: 'Shoulders, triceps' },
    anim: {
      cycle: 3,
      frames: [
        { hip: [106, 116], torso: 30, arm: T(172, G), arm2: T(176, G), leg: T(70, G), leg2: T(74, G) },
        { hip: [112, 124], torso: 52, arm: T(172, G), arm2: T(176, G), leg: T(70, G), leg2: T(74, G) },
      ],
    },
    steps: {
      vi: ['Từ plank, đẩy hông lên cao thành chữ V ngược.', 'Gập khuỷu tay, hạ đỉnh đầu về phía sàn.', 'Đẩy lên trở lại.'],
      en: ['From plank, push hips up into an inverted V.', 'Bend elbows, lowering the top of your head toward the floor.', 'Press back up.'],
    },
    tips: { vi: ['Đầu đi về phía trước tay, tạo hình tam giác.'], en: ['Head travels slightly in front of the hands.'] },
    mistakes: { vi: ['Hông tụt thấp', 'Khuỷu tay bè ra ngoài'], en: ['Hips dropping', 'Elbows flaring out'] },
  },
  {
    id: 'chair-dip', category: 'push', level: 2, equipment: 'chair', mode: 'reps', met: 4,
    name: { vi: 'Dip trên ghế', en: 'Chair dip' },
    muscles: { vi: 'Tay sau, ngực dưới, vai', en: 'Triceps, lower chest, shoulders' },
    anim: {
      cycle: 2.8,
      props: [{ kind: 'chair', x: 44, seat: 143, w: 52 }],
      frames: [
        { hip: [106, 138], torso: -90, arm: T(92, 140), leg: T(164, G), leg2: T(160, G) },
        { hip: [104, 166], torso: -88, arm: T(92, 140), leg: T(164, G), leg2: T(160, G) },
      ],
    },
    steps: {
      vi: ['Ngồi mép ghế chắc chắn, tay nắm mép ghế cạnh hông.', 'Trượt hông ra khỏi ghế, chân duỗi phía trước.', 'Gập khuỷu tay hạ người đến ~90°.', 'Đẩy lên đến khi tay thẳng.'],
      en: ['Sit on a sturdy chair edge, hands beside hips.', 'Slide hips off, legs forward.', 'Bend elbows to ~90° to lower.', 'Press up until arms are straight.'],
    },
    tips: { vi: ['Giữ lưng sát ghế.', 'Co gối để dễ hơn.'], en: ['Keep your back close to the chair.', 'Bend knees to make it easier.'] },
    mistakes: { vi: ['Hạ quá sâu gây đau vai', 'Dùng ghế có bánh xe'], en: ['Going too deep (shoulder strain)', 'Using a chair with wheels'] },
  },
  {
    id: 'diamond-pushup', category: 'push', level: 2, equipment: 'none', mode: 'reps', met: 4,
    name: { vi: 'Hít đất kim cương', en: 'Diamond push-up' },
    muscles: { vi: 'Tay sau, ngực trong, vai', en: 'Triceps, inner chest, shoulders' },
    anim: {
      cycle: 2.8,
      frames: [
        { ...HIGH_PLANK, arm: T(159, G), arm2: T(161, G) },
        { ...HIGH_PLANK, hip: [128.8, 168.2], torso: -9.8, arm: T(159, G), arm2: T(161, G) },
      ],
    },
    steps: {
      vi: ['Plank cao, hai tay chụm lại dưới ngực, ngón cái và ngón trỏ tạo hình kim cương.', 'Siết bụng, thân người thẳng một đường.', 'Hạ ngực xuống sát mu bàn tay, khuỷu tay ép sát sườn.', 'Đẩy lên đến khi tay duỗi thẳng.'],
      en: ['High plank, hands together under your chest, thumbs and index fingers forming a diamond.', 'Brace your core, body in one straight line.', 'Lower your chest to your hands, elbows tucked along your ribs.', 'Press up until your arms are straight.'],
    },
    tips: { vi: ['Khó quá thì chống gối hoặc để hai tay hơi xa nhau.'], en: ['Too hard? Drop to your knees or move the hands slightly apart.'] },
    mistakes: { vi: ['Khuỷu tay bè ra hai bên', 'Hông võng', 'Tay đặt dưới mặt thay vì dưới ngực'], en: ['Elbows flaring out', 'Sagging hips', 'Hands under the face instead of the chest'] },
  },
  {
    id: 'archer-pushup', category: 'push', level: 3, equipment: 'none', mode: 'reps', met: 4.5,
    name: { vi: 'Hít đất cung thủ', en: 'Archer push-up' },
    muscles: { vi: 'Ngực, tay sau, vai, bụng', en: 'Chest, triceps, shoulders, core' },
    anim: {
      cycle: 3.2,
      weights: [1.2, 1],
      frames: [
        { hip: [134, 151.7], torso: -23, arm: T(174, G), arm2: T(197, G), leg: T(65, G), leg2: T(65, G) },
        { hip: [138.2, 165.2], torso: -12.2, arm: T(174, G), arm2: T(197, G), leg: T(65, G), leg2: T(65, G) },
      ],
    },
    steps: {
      vi: ['Plank cao, hai tay đặt rất rộng, gấp đôi độ rộng vai.', 'Dồn trọng tâm sang một tay, gập khuỷu tay đó để hạ người.', 'Tay còn lại duỗi thẳng, chỉ đỡ nhẹ như kéo dây cung.', 'Đẩy lên giữa, lần sau đổi bên.'],
      en: ['High plank with hands very wide, about twice shoulder width.', 'Shift your weight to one hand and bend that elbow to lower.', 'Keep the other arm straight, only lightly supporting, like drawing a bow.', 'Press back to the middle; switch sides next rep.'],
    },
    tips: { vi: ['Bước đệm trước khi tập hít đất một tay.', 'Mới tập: hạ nửa biên độ.'], en: ['A stepping stone toward one-arm push-ups.', 'New to it? Go halfway down first.'] },
    mistakes: { vi: ['Gập cả tay thẳng', 'Xoay hông lệch theo bên đang hạ'], en: ['Bending the straight arm', 'Hips twisting toward the working side'] },
  },
  {
    id: 'decline-pushup', category: 'push', level: 2, equipment: 'chair', mode: 'reps', met: 4.2,
    name: { vi: 'Hít đất gác chân lên ghế', en: 'Decline push-up' },
    muscles: { vi: 'Ngực trên, vai, tay sau', en: 'Upper chest, shoulders, triceps' },
    anim: {
      cycle: 2.8,
      props: [{ kind: 'chair', x: 20, seat: 143, w: 52 }],
      frames: [
        { hip: [139.5, 131.9], torso: -1.6, arm: T(186, G), arm2: T(189, G), leg: T(64.6, 134), leg2: T(64.6, 134) },
        { hip: [137.5, 151.1], torso: 13.2, arm: T(186, G), arm2: T(189, G), leg: T(64.6, 134), leg2: T(64.6, 134) },
      ],
    },
    steps: {
      vi: ['Đặt mũi chân lên mặt ghế chắc chắn, hai tay chống sàn dưới vai.', 'Siết bụng, mông để thân người thẳng.', 'Hạ ngực về phía sàn, khuỷu tay ~45°.', 'Đẩy lên đến khi tay duỗi thẳng.'],
      en: ['Toes on a sturdy chair seat, hands on the floor under your shoulders.', 'Squeeze core and glutes to keep your body straight.', 'Lower your chest toward the floor, elbows ~45°.', 'Push up until your arms are straight.'],
    },
    tips: { vi: ['Chân càng cao, vai và ngực trên càng phải làm nhiều.'], en: ['The higher the feet, the more the shoulders and upper chest work.'] },
    mistakes: { vi: ['Võng lưng dưới', 'Chạm đầu xuống trước ngực', 'Ghế trượt hoặc có bánh xe'], en: ['Sagging lower back', 'Head reaching the floor before the chest', 'A sliding chair or one with wheels'] },
  },
  {
    id: 'hindu-pushup', category: 'push', level: 3, equipment: 'none', mode: 'reps', met: 5,
    name: { vi: 'Hít đất Hindu', en: 'Hindu push-up' },
    muscles: { vi: 'Vai, ngực, tay sau, lưng, độ dẻo', en: 'Shoulders, chest, triceps, back, mobility' },
    anim: {
      cycle: 3.6,
      weights: [1, 0.8, 1.2],
      frames: [
        { hip: [106, 116], torso: 30, arm: T(172, G), arm2: T(176, G), leg: T(70, G), leg2: T(70, G) },
        { hip: [133, 146], torso: 24, head: -35, arm: T(172, G), arm2: T(176, G), leg: T(70, G), leg2: T(70, G) },
        { hip: [143.7, 168], torso: -50, arm: T(172, G), arm2: T(176, G), leg: T(70, G), leg2: T(70, G) },
      ],
    },
    steps: {
      vi: ['Bắt đầu ở tư thế chữ V ngược, hông cao, tay và chân thẳng.', 'Gập khuỷu tay, lướt ngực sát sàn về phía trước giữa hai tay.', 'Duỗi tay, ngẩng ngực lên, hông hạ thấp gần sàn (rắn hổ mang).', 'Đẩy hông ra sau về chữ V ngược.'],
      en: ['Start in an inverted V: hips high, arms and legs straight.', 'Bend your elbows and swoop your chest forward, just above the floor between your hands.', 'Straighten your arms and lift your chest, hips low near the floor (cobra).', 'Push your hips back up into the inverted V.'],
    },
    tips: { vi: ['Chuyển động như làn sóng, liền mạch.', 'Thở ra khi ngẩng ngực.'], en: ['Move in one smooth wave.', 'Exhale as you lift the chest.'] },
    mistakes: { vi: ['Đổ cả người xuống sàn', 'Nhún vai lên tai ở tư thế rắn hổ mang'], en: ['Collapsing onto the floor', 'Shrugging into the ears in the cobra'] },
  },

  // ---------------- PULL ----------------
  {
    id: 'dead-hang', category: 'pull', level: 1, equipment: 'bar', mode: 'time', met: 3,
    name: { vi: 'Treo xà', en: 'Dead hang' },
    muscles: { vi: 'Cẳng tay, lực nắm, vai', en: 'Grip, forearms, shoulders' },
    anim: {
      cycle: 4,
      props: [BAR],
      frames: [HANG, { ...HANG, hip: [120, 110] }],
    },
    steps: {
      vi: ['Nắm xà rộng hơn vai, lòng bàn tay hướng ra trước.', 'Thả lỏng treo người, tay duỗi thẳng.', 'Giữ vai hơi kéo xuống, thở đều.'],
      en: ['Grip the bar slightly wider than shoulders, palms forward.', 'Hang with straight arms.', 'Keep shoulders slightly engaged, breathe.'],
    },
    tips: { vi: ['Bài nền tảng trước khi tập kéo xà.'], en: ['The foundation before pull-ups.'] },
    mistakes: { vi: ['Đung đưa người', 'Nhún vai lên tai'], en: ['Swinging', 'Shoulders up by the ears'] },
  },
  {
    id: 'pullup', category: 'pull', level: 3, equipment: 'bar', mode: 'reps', met: 8,
    name: { vi: 'Kéo xà', en: 'Pull-up' },
    muscles: { vi: 'Lưng xô, tay trước, bụng', en: 'Lats, biceps, core' },
    anim: {
      cycle: 3.2,
      props: [BAR],
      weights: [1, 0.4, 1.2],
      frames: [HANG, { ...HANG, hip: [118, 78] }, { ...HANG, hip: [118, 78] }],
    },
    steps: {
      vi: ['Treo xà, tay rộng hơn vai.', 'Kéo vai xuống, siết lưng xô.', 'Kéo người lên đến khi cằm qua xà.', 'Hạ người chậm, kiểm soát.'],
      en: ['Hang from the bar, hands wider than shoulders.', 'Pull shoulders down, engage lats.', 'Pull up until your chin clears the bar.', 'Lower slowly with control.'],
    },
    tips: { vi: ['Chưa kéo được? Tập treo xà và hạ chậm (negative).'], en: ["Can't do one yet? Practice dead hangs and slow negatives."] },
    mistakes: { vi: ['Đánh đu lấy đà', 'Không duỗi thẳng tay ở dưới'], en: ['Kipping / swinging', 'Not reaching full extension'] },
  },
  {
    id: 'superman', category: 'pull', level: 1, equipment: 'none', mode: 'reps', met: 3,
    name: { vi: 'Superman', en: 'Superman' },
    muscles: { vi: 'Lưng dưới, mông, vai sau', en: 'Lower back, glutes, rear delts' },
    anim: {
      cycle: 3.2,
      weights: [1, 0.6, 1],
      frames: [
        { hip: [100, 176], torso: 0, arm: A(-2, 0), leg: A(180, 180), leg2: A(182, 182) },
        { hip: [100, 177], torso: -14, arm: A(-24, -20), leg: A(196, 194), leg2: A(198, 196) },
        { hip: [100, 177], torso: -14, arm: A(-24, -20), leg: A(196, 194), leg2: A(198, 196) },
      ],
    },
    steps: {
      vi: ['Nằm sấp, tay duỗi thẳng qua đầu.', 'Đồng thời nâng tay, ngực và chân lên.', 'Giữ 1-2 giây rồi hạ xuống.'],
      en: ['Lie face down, arms extended overhead.', 'Lift arms, chest and legs at the same time.', 'Hold 1–2s, then lower.'],
    },
    tips: { vi: ['Nhìn xuống sàn để giữ cổ trung lập.'], en: ['Look at the floor to keep the neck neutral.'] },
    mistakes: { vi: ['Ngửa cổ quá mức', 'Giật mạnh'], en: ['Cranking the neck up', 'Jerky movement'] },
  },

  // ---------------- CORE ----------------
  {
    id: 'plank', category: 'core', level: 1, equipment: 'none', mode: 'time', met: 3.5,
    name: { vi: 'Plank', en: 'Plank' },
    muscles: { vi: 'Bụng, vai, lưng', en: 'Core, shoulders, back' },
    anim: {
      cycle: 4,
      frames: [
        { hip: [122, 163], torso: -14, arm: A(90, 0), arm2: A(88, 2), leg: T(50, G), leg2: T(54, G) },
        { hip: [122, 162], torso: -14.5, arm: A(90, 0), arm2: A(88, 2), leg: T(50, G), leg2: T(54, G) },
      ],
    },
    steps: {
      vi: ['Chống cẳng tay, khuỷu ngay dưới vai.', 'Duỗi chân, nâng hông thành đường thẳng.', 'Siết bụng, mông; giữ và thở đều.'],
      en: ['Forearms down, elbows under shoulders.', 'Extend legs, lift hips into a straight line.', 'Brace core and glutes; hold and breathe.'],
    },
    tips: { vi: ['Tưởng tượng kéo khuỷu tay về phía chân.'], en: ['Imagine pulling elbows toward your toes.'] },
    mistakes: { vi: ['Võng lưng', 'Chổng mông', 'Nín thở'], en: ['Sagging hips', 'Piking hips', 'Holding your breath'] },
  },
  {
    id: 'leg-raise', category: 'core', level: 2, equipment: 'none', mode: 'reps', met: 3.8,
    name: { vi: 'Nâng chân', en: 'Leg raise' },
    muscles: { vi: 'Bụng dưới, cơ gập hông', en: 'Lower abs, hip flexors' },
    anim: {
      cycle: 3,
      frames: [
        { hip: [120, 176], torso: 180, arm: A(0, 0), leg: A(-4, -4), leg2: A(-5, -5) },
        { hip: [120, 176], torso: 180, arm: A(0, 0), leg: A(-86, -86), leg2: A(-87, -87) },
      ],
    },
    steps: {
      vi: ['Nằm ngửa, tay đặt dọc thân.', 'Giữ chân thẳng, nâng lên vuông góc với sàn.', 'Hạ chân chậm, dừng ngay trên sàn.'],
      en: ['Lie on your back, arms by your sides.', 'Keep legs straight and raise them to vertical.', 'Lower slowly, stopping just above the floor.'],
    },
    tips: { vi: ['Ép lưng dưới sát sàn.'], en: ['Press your lower back into the floor.'] },
    mistakes: { vi: ['Lưng dưới ưỡn lên', 'Thả chân rơi nhanh'], en: ['Lower back arching', 'Dropping legs fast'] },
  },
  {
    id: 'hollow-hold', category: 'core', level: 2, equipment: 'none', mode: 'time', met: 3.8,
    name: { vi: 'Giữ thân rỗng (Hollow hold)', en: 'Hollow hold' },
    muscles: { vi: 'Bụng, cơ gập hông', en: 'Abs, hip flexors' },
    anim: {
      cycle: 4,
      frames: [
        { hip: [118, 174], torso: 196, arm: A(192, 190), leg: A(-12, -12), leg2: A(-13, -13) },
        { hip: [118, 174], torso: 195, arm: A(191, 189), leg: A(-11, -11), leg2: A(-12, -12) },
      ],
    },
    steps: {
      vi: ['Nằm ngửa, ép lưng dưới sát sàn.', 'Nâng vai và chân khỏi sàn, chân duỗi thẳng khép lại.', 'Duỗi tay qua đầu, sát tai.', 'Giữ thân cong như chiếc thuyền, thở đều.'],
      en: ['Lie on your back and press your lower back into the floor.', 'Lift shoulders and legs off the floor, legs straight and together.', 'Reach your arms overhead, close to your ears.', 'Hold the banana shape and breathe steadily.'],
    },
    tips: { vi: ['Khó quá thì co gối hoặc để tay dọc thân.'], en: ['Too hard? Bend your knees or keep arms by your sides.'] },
    mistakes: { vi: ['Lưng dưới bị nhấc khỏi sàn', 'Nín thở'], en: ['Lower back lifting off the floor', 'Holding your breath'] },
  },
  {
    id: 'plank-up-down', category: 'core', level: 2, equipment: 'none', mode: 'reps', met: 4.5,
    name: { vi: 'Plank lên xuống', en: 'Plank up-down' },
    muscles: { vi: 'Bụng, vai, tay sau', en: 'Core, shoulders, triceps' },
    anim: {
      cycle: 3.2,
      frames: [ELBOW_PLANK, HALF_UP, HIGH_PLANK, HALF_DOWN],
    },
    steps: {
      vi: ['Bắt đầu ở plank cẳng tay.', 'Đặt một bàn tay xuống, đẩy lên; rồi đến tay kia, thành plank cao.', 'Hạ từng tay về cẳng tay, trở lại plank thấp.', 'Đổi tay đi trước sau mỗi lần.'],
      en: ['Start in a forearm plank.', 'Place one hand down and press up, then the other, into a high plank.', 'Lower one arm at a time back to your forearms.', 'Switch the leading arm each rep.'],
    },
    tips: { vi: ['Mở rộng chân để hông ít lắc hơn.'], en: ['Widen your feet to keep the hips steadier.'] },
    mistakes: { vi: ['Hông lắc qua lại', 'Chổng mông khi đẩy lên'], en: ['Hips rocking side to side', 'Piking the hips on the way up'] },
  },
  {
    id: 'l-sit', category: 'core', level: 3, equipment: 'chair', mode: 'time', met: 4,
    name: { vi: 'L-sit trên ghế', en: 'Chair L-sit' },
    muscles: { vi: 'Bụng, cơ gập hông, tay sau, vai', en: 'Abs, hip flexors, triceps, shoulders' },
    anim: {
      cycle: 3,
      props: [{ kind: 'chair', x: 44, seat: 143, w: 52 }],
      frames: [
        { hip: [110, 137], torso: -100.7, arm: T(94, 140), arm2: T(91, 140), leg: A(-4, -4), leg2: A(-5, -5) },
        { hip: [110, 136.5], torso: -100.7, arm: T(94, 140), arm2: T(91, 140), leg: A(-5, -5), leg2: A(-6, -6) },
      ],
    },
    steps: {
      vi: ['Đứng trước ghế chắc chắn, hai tay nắm mép ghế phía sau, sát hông.', 'Duỗi thẳng tay, ấn mạnh xuống ghế, kéo vai xuống.', 'Nhấc hai chân khỏi sàn, duỗi thẳng ra trước thành hình chữ L.', 'Giữ hông lơ lửng trước mép ghế, thở đều.'],
      en: ['Stand in front of a sturdy chair, hands gripping the seat edge behind you, close to your hips.', 'Lock your arms, press hard into the seat, shoulders down.', 'Lift both feet off the floor and extend your legs straight forward in an L shape.', 'Keep your hips hovering in front of the seat edge and breathe.'],
    },
    tips: { vi: ['Mới tập: co gối (tuck) hoặc nhấc từng chân.', 'Dùng ghế không có bánh xe, đặt sát tường.'], en: ['New to it: tuck your knees or lift one leg at a time.', 'Use a chair without wheels, pushed against a wall.'] },
    mistakes: { vi: ['Gập khuỷu tay', 'Nhún vai lên tai', 'Ngồi lên mép ghế'], en: ['Bent elbows', 'Shoulders shrugging up', 'Sitting on the seat edge'] },
  },
  {
    id: 'bear-crawl', category: 'core', level: 2, equipment: 'none', mode: 'time', met: 6,
    name: { vi: 'Bò gấu', en: 'Bear crawl' },
    muscles: { vi: 'Bụng, vai, đùi, phối hợp', en: 'Core, shoulders, quads, coordination' },
    anim: {
      cycle: 1.4,
      frames: [
        { hip: [100, 135.5], torso: -5, arm: T(159, G), arm2: T(137, G), leg: T(58, 174), leg2: T(76, 174) },
        { hip: [100, 134.5], torso: -5, arm: T(148, G), arm2: T(148, 173), leg: T(67, 166), leg2: T(67, 174) },
        { hip: [100, 135.5], torso: -5, arm: T(137, G), arm2: T(159, G), leg: T(76, 174), leg2: T(58, 174) },
        { hip: [100, 134.5], torso: -5, arm: T(148, 173), arm2: T(148, G), leg: T(67, 174), leg2: T(67, 166) },
      ],
    },
    steps: {
      vi: ['Chống tay dưới vai, gối dưới hông, nhấc gối cách sàn vài cm.', 'Lưng phẳng như mặt bàn, siết bụng.', 'Bước tay và chân đối diện cùng lúc, bước ngắn.', 'Giữ gối thấp suốt bài, bò tới rồi bò lùi.'],
      en: ['Hands under shoulders, knees under hips, knees hovering a few cm off the floor.', 'Keep your back flat like a tabletop and brace your core.', 'Move opposite hand and foot together in small steps.', 'Keep the knees low throughout; crawl forward, then back.'],
    },
    tips: { vi: ['Bước càng nhỏ, bụng càng phải làm việc.'], en: ['Smaller steps make your core work harder.'] },
    mistakes: { vi: ['Chổng mông cao', 'Hông lắc qua lại', 'Gối chạm sàn'], en: ['Hips too high', 'Hips swaying', 'Knees touching the floor'] },
  },
  {
    id: 'mountain-climber', category: 'cardio', level: 2, equipment: 'none', mode: 'time', met: 8,
    name: { vi: 'Leo núi', en: 'Mountain climbers' },
    muscles: { vi: 'Bụng, vai, tim mạch', en: 'Core, shoulders, cardio' },
    anim: {
      cycle: 0.9,
      frames: [
        { ...PLANK_TOP, leg: T(128, 174), leg2: T(59, G) },
        { ...PLANK_TOP, leg: T(55, G), leg2: T(128, 174) },
      ],
    },
    steps: {
      vi: ['Bắt đầu ở tư thế plank cao.', 'Kéo luân phiên từng gối về phía ngực.', 'Giữ hông thấp, tốc độ nhanh và đều.'],
      en: ['Start in a high plank.', 'Drive knees toward your chest alternately.', 'Keep hips low; fast, steady pace.'],
    },
    tips: { vi: ['Vai luôn nằm trên cổ tay.'], en: ['Keep shoulders over wrists.'] },
    mistakes: { vi: ['Chổng mông cao', 'Nảy hông lên xuống'], en: ['Hips too high', 'Bouncing hips'] },
  },
  {
    id: 'burpee', category: 'cardio', level: 3, equipment: 'none', mode: 'reps', met: 10,
    name: { vi: 'Burpee', en: 'Burpee' },
    muscles: { vi: 'Toàn thân, tim mạch', en: 'Full body, cardio' },
    anim: {
      cycle: 4,
      weights: [0.8, 0.6, 0.8, 0.6, 0.7],
      frames: [STAND, SQUAT_HANDS, PLANK_TOP, SQUAT_HANDS, JUMP_AIR],
    },
    steps: {
      vi: ['Từ tư thế đứng, ngồi xuống chống tay.', 'Bật chân ra sau thành plank.', 'Bật chân về, đứng dậy.', 'Nhảy lên, vỗ tay trên đầu.'],
      en: ['From standing, squat and place hands down.', 'Jump feet back to plank.', 'Jump feet in and stand up.', 'Jump, reaching overhead.'],
    },
    tips: { vi: ['Mới tập: bước chân thay vì bật.'], en: ['Beginner: step back instead of jumping.'] },
    mistakes: { vi: ['Võng lưng ở plank', 'Tiếp đất nặng nề'], en: ['Sagging in the plank', 'Heavy landings'] },
  },

  // ---------------- COMBOS ----------------
  {
    id: 'pushup-jump', category: 'combo', level: 3, equipment: 'none', mode: 'reps', met: 9,
    name: { vi: 'Hít đất + bật nhảy', en: 'Push-up + jump' },
    muscles: { vi: 'Ngực, tay sau, chân, tim mạch', en: 'Chest, triceps, legs, cardio' },
    ...combo(4.4, [
      { name: { vi: 'Hít đất', en: 'Push-up' }, frames: [PLANK_TOP, PUSH_BOTTOM], weights: [0.8, 0.8] },
      { name: { vi: 'Thu chân', en: 'Feet in' }, frames: [PLANK_TOP], weights: [0.6] },
      { name: { vi: 'Bật nhảy', en: 'Jump' }, frames: [SQUAT_HANDS, JUMP_AIR], weights: [0.6, 0.5] },
      { name: { vi: 'Về plank', en: 'Back to plank' }, frames: [LAND, SQUAT_HANDS], weights: [0.5, 0.6] },
    ]),
    steps: {
      vi: ['Bắt đầu ở plank cao, làm 1 lần hít đất.', 'Bật hai chân lên sát tay, vào tư thế squat.', 'Bật nhảy thẳng lên, vươn tay qua đầu.', 'Tiếp đất nhẹ, chống tay xuống và bật chân về plank.'],
      en: ['Start in a high plank and do one push-up.', 'Jump your feet in toward your hands into a squat.', 'Jump straight up, reaching overhead.', 'Land softly, place your hands down and jump back to plank.'],
    },
    tips: { vi: ['Giữ thân thẳng ở cả đoạn hít đất lẫn plank.', 'Mới tập: bước chân thay vì bật.'], en: ['Keep a straight body in the push-up and the plank.', 'Beginner: step your feet instead of jumping.'] },
    mistakes: { vi: ['Hít đất nửa vời để vội bật nhảy', 'Tiếp đất với gối thẳng'], en: ['Rushing half push-ups to get to the jump', 'Landing with locked knees'] },
  },
  {
    id: 'pushup-climber', category: 'combo', level: 2, equipment: 'none', mode: 'reps', met: 8,
    name: { vi: 'Hít đất + leo núi', en: 'Push-up + climbers' },
    muscles: { vi: 'Ngực, vai, bụng, tim mạch', en: 'Chest, shoulders, core, cardio' },
    ...combo(3, [
      { name: { vi: 'Hít đất', en: 'Push-up' }, frames: [PLANK_TOP, PUSH_BOTTOM], weights: [0.9, 0.9] },
      { name: { vi: 'Leo núi ×2', en: 'Climbers ×2' }, frames: [PLANK_TOP, { ...PLANK_TOP, leg: T(128, 174), leg2: T(59, G) }, { ...PLANK_TOP, leg: T(55, G), leg2: T(128, 174) }], weights: [0.3, 0.4, 0.3] },
    ]),
    steps: {
      vi: ['Plank cao, tay dưới vai.', 'Làm 1 lần hít đất đầy đủ biên độ.', 'Kéo gối phải rồi gối trái về ngực (leo núi).', 'Lặp lại ngay, không nghỉ giữa hai động tác.'],
      en: ['High plank, hands under shoulders.', 'Do one full-range push-up.', 'Drive the right knee, then the left, to your chest.', 'Repeat straight away without pausing.'],
    },
    tips: { vi: ['Hông luôn thấp và ngang khi leo núi.'], en: ['Keep hips low and level during the climbers.'] },
    mistakes: { vi: ['Chổng mông khi kéo gối', 'Võng lưng khi hít đất'], en: ['Piking hips on the knee drives', 'Sagging during the push-up'] },
  },
  {
    id: 'squat-lunge', category: 'combo', level: 2, equipment: 'none', mode: 'reps', met: 5.5,
    name: { vi: 'Squat + lunge lùi', en: 'Squat + reverse lunge' },
    muscles: { vi: 'Đùi, mông, thăng bằng', en: 'Quads, glutes, balance' },
    ...combo(6.2, [
      { name: { vi: 'Squat', en: 'Squat' }, frames: [SQ_TOP, SQ_BOTTOM], weights: [1, 1] },
      {
        name: { vi: 'Lunge lùi', en: 'Reverse lunge' },
        frames: [
          SQ_TOP,
          { hip: [112, 116], torso: -90, arm: A(100, 70), arm2: A(95, 75), leg: T(122, G), leg2: T(92, 166) },
          { hip: [102, 140], torso: -86, arm: A(100, 70), arm2: A(95, 75), leg: T(122, G), leg2: T(66, G) },
          { hip: [112, 116], torso: -90, arm: A(100, 70), arm2: A(95, 75), leg: T(122, G), leg2: T(92, 166) },
        ],
        weights: [0.6, 1, 1, 0.6],
      },
    ]),
    steps: {
      vi: ['Làm 1 squat sâu, tay đưa ra trước.', 'Đứng lên, chống tay hông.', 'Bước một chân ra sau, hạ gối sau gần sàn.', 'Về tư thế đứng; lần sau đổi chân lunge.'],
      en: ['Do one deep squat, arms forward.', 'Stand up, hands on hips.', 'Step one foot back and lower the back knee near the floor.', 'Return to standing; switch the lunging leg next rep.'],
    },
    tips: { vi: ['Giữ ngực mở suốt cả chuỗi.'], en: ['Keep your chest up through the whole sequence.'] },
    mistakes: { vi: ['Gối khuỵu vào trong', 'Ngả người về trước khi lunge'], en: ['Knees caving in', 'Leaning forward in the lunge'] },
  },
  {
    id: 'bridge-legraise', category: 'combo', level: 2, equipment: 'none', mode: 'reps', met: 4,
    name: { vi: 'Nâng hông + nâng chân', en: 'Bridge + leg raise' },
    muscles: { vi: 'Mông, bụng dưới, lưng dưới', en: 'Glutes, lower abs, lower back' },
    ...combo(6, [
      { name: { vi: 'Nâng hông', en: 'Glute bridge' }, frames: [BRIDGE_DOWN, BRIDGE_UP, BRIDGE_UP], weights: [1, 0.4, 1] },
      {
        name: { vi: 'Nâng chân', en: 'Leg raise' },
        frames: [
          { hip: [96, 176], torso: 180, arm: A(4, 0), leg: A(-4, -4), leg2: A(-5, -5) },
          { hip: [96, 176], torso: 180, arm: A(4, 0), leg: A(-86, -86), leg2: A(-87, -87) },
          { hip: [96, 176], torso: 180, arm: A(4, 0), leg: A(-4, -4), leg2: A(-5, -5) },
        ],
        weights: [1.1, 1.1, 0.6],
      },
    ]),
    steps: {
      vi: ['Nằm ngửa, co gối, nâng hông lên và giữ 1 giây.', 'Hạ hông xuống, duỗi thẳng hai chân.', 'Nâng chân thẳng lên vuông góc rồi hạ chậm.', 'Co gối về tư thế ban đầu.'],
      en: ['Lie on your back, knees bent, lift the hips and hold 1s.', 'Lower the hips and straighten both legs.', 'Raise straight legs to vertical, then lower slowly.', 'Bend the knees back to the start.'],
    },
    tips: { vi: ['Ép lưng dưới xuống sàn khi nâng chân.'], en: ['Press your lower back down during the leg raise.'] },
    mistakes: { vi: ['Ưỡn lưng khi hạ chân', 'Thả hông rơi nhanh'], en: ['Arching when lowering the legs', 'Dropping the hips fast'] },
  },
  {
    id: 'burpee-tuck-jump', category: 'combo', level: 3, equipment: 'none', mode: 'reps', met: 11,
    name: { vi: 'Burpee + bật gối', en: 'Burpee + tuck jump' },
    muscles: { vi: 'Toàn thân, chân, bụng, tim mạch', en: 'Full body, legs, core, cardio' },
    ...combo(4.6, [
      { name: { vi: 'Xuống plank', en: 'Down to plank' }, frames: [STAND, BURPEE_SQUAT, BURPEE_KICK], weights: [0.8, 0.3, 0.3] },
      { name: { vi: 'Thu chân', en: 'Feet in' }, frames: [HIGH_PLANK, HIGH_PLANK, BURPEE_KICK], weights: [0.2, 0.3, 0.3] },
      { name: { vi: 'Bật gối', en: 'Tuck jump' }, frames: [BURPEE_SQUAT, TUCK_AIR, LAND], weights: [0.6, 0.5, 0.6] },
    ]),
    steps: {
      vi: ['Từ tư thế đứng, ngồi xuống chống tay.', 'Bật chân ra sau thành plank cao.', 'Bật chân về sát tay, giữ tư thế squat.', 'Bật thật cao, kéo hai gối lên ngực, tiếp đất nhẹ và đứng dậy.'],
      en: ['From standing, squat and place your hands down.', 'Jump your feet back into a high plank.', 'Jump your feet in next to your hands, staying low.', 'Explode up, pull both knees to your chest, land softly and stand.'],
    },
    tips: { vi: ['Mới tập: bỏ bật gối, chỉ nhảy thẳng.', 'Tiếp đất bằng mũi chân rồi cả bàn chân.'], en: ['New to it: skip the tuck and do a straight jump.', 'Land on the balls of your feet, then the whole foot.'] },
    mistakes: { vi: ['Võng lưng ở plank', 'Gập người xuống thay vì kéo gối lên', 'Tiếp đất gối thẳng'], en: ['Sagging in the plank', 'Folding the chest down instead of lifting the knees', 'Landing with locked knees'] },
  },
  {
    id: 'updown-pushup', category: 'combo', level: 3, equipment: 'none', mode: 'reps', met: 5.5,
    name: { vi: 'Plank lên xuống + hít đất', en: 'Plank up-down + push-up' },
    muscles: { vi: 'Ngực, vai, tay sau, bụng', en: 'Chest, shoulders, triceps, core' },
    ...combo(4.4, [
      { name: { vi: 'Lên plank cao', en: 'Up to high plank' }, frames: [ELBOW_PLANK, HALF_UP], weights: [0.6, 0.6] },
      { name: { vi: 'Hít đất', en: 'Push-up' }, frames: [HIGH_PLANK, LOW_PUSH], weights: [0.8, 0.8] },
      { name: { vi: 'Về plank cẳng tay', en: 'Down to forearms' }, frames: [HIGH_PLANK, HALF_DOWN], weights: [0.6, 0.6] },
    ]),
    steps: {
      vi: ['Bắt đầu ở plank cẳng tay.', 'Đẩy từng tay lên thành plank cao.', 'Làm 1 lần hít đất đầy đủ biên độ.', 'Hạ từng tay về cẳng tay; lần sau đổi tay đi trước.'],
      en: ['Start in a forearm plank.', 'Press up one arm at a time into a high plank.', 'Do one full-range push-up.', 'Lower one arm at a time back to your forearms; switch the leading arm next rep.'],
    },
    tips: { vi: ['Giữ hông ngang và yên suốt cả chuỗi.'], en: ['Keep the hips level and quiet through the whole sequence.'] },
    mistakes: { vi: ['Hông lắc khi đổi tay', 'Hít đất nửa vời'], en: ['Hips rocking as you switch arms', 'Half-range push-ups'] },
  },
  {
    id: 'bulgarian-jump', category: 'combo', level: 3, equipment: 'chair', mode: 'reps', met: 8,
    name: { vi: 'Bulgarian squat + bật nhảy', en: 'Bulgarian squat + jump' },
    muscles: { vi: 'Đùi, mông, sức bật, thăng bằng', en: 'Quads, glutes, power, balance' },
    ...combo(4.6, [
      { name: { vi: 'Bulgarian squat', en: 'Bulgarian squat' }, frames: [BSS_TOP, BSS_BOTTOM], weights: [1, 1] },
      {
        name: { vi: 'Bật nhảy', en: 'Jump' },
        frames: [
          BSS_TOP,
          BSS_BOTTOM,
          { hip: [118, 100], torso: -84, arm: A(-70, -80), arm2: A(-65, -75), leg: T(131, 172), leg2: T(57, 133) },
          { hip: [106, 128], torso: -80, arm: A(70, 30), arm2: A(65, 25), leg: T(134, G), leg2: T(59, 135) },
        ],
        weights: [0.6, 0.4, 0.4, 0.6],
      },
    ], [BSS_CHAIR]),
    steps: {
      vi: ['Gác mũi chân sau lên ghế, làm 1 Bulgarian squat chậm.', 'Hạ xuống lần nữa để lấy đà.', 'Bật mạnh chân trước lên khỏi sàn, vung tay lên cao.', 'Tiếp đất mềm, khuỵu gối ngay; làm đủ rep rồi đổi chân.'],
      en: ['Rear toes on the chair, do one slow Bulgarian squat.', 'Sink down again to load.', 'Explode off the front foot, swinging your arms up.', 'Land softly and bend straight into the knee; finish your reps, then switch legs.'],
    },
    tips: { vi: ['Chân sau chỉ giữ thăng bằng trên ghế.', 'Mới tập: nhón gót thay vì bật hẳn.'], en: ['The back foot only balances on the chair.', 'New to it: rise onto your toes instead of fully jumping.'] },
    mistakes: { vi: ['Tiếp đất gối thẳng', 'Gối trước khuỵu vào trong', 'Ghế trượt'], en: ['Landing with a locked knee', 'Front knee caving in', 'A sliding chair'] },
  },
  {
    id: 'chinup-knee-raise', category: 'combo', level: 3, equipment: 'bar', mode: 'reps', met: 8,
    name: { vi: 'Chin-up + nâng gối treo xà', en: 'Chin-up + hanging knee raise' },
    muscles: { vi: 'Lưng xô, tay trước, bụng dưới', en: 'Lats, biceps, lower abs' },
    ...combo(5, [
      { name: { vi: 'Chin-up', en: 'Chin-up' }, frames: [HANG, CHIN_TOP, CHIN_TOP], weights: [1, 0.3, 1.1] },
      { name: { vi: 'Nâng gối', en: 'Knee raise' }, frames: [HANG, HANG_KNEES], weights: [0.9, 0.9] },
    ], [BAR]),
    steps: {
      vi: ['Treo xà, lòng bàn tay hướng về phía mặt, tay rộng bằng vai.', 'Kéo người lên đến khi cằm qua xà, rồi hạ chậm.', 'Ở tư thế treo, kéo hai gối lên ngang hông.', 'Hạ chân có kiểm soát, không đánh đu.'],
      en: ['Hang from the bar with palms facing you, hands shoulder-width.', 'Pull up until your chin clears the bar, then lower slowly.', 'From the hang, raise both knees to hip height.', 'Lower the legs with control, no swinging.'],
    },
    tips: { vi: ['Siết vai nhẹ khi treo để bảo vệ khớp vai.'], en: ['Keep the shoulders lightly engaged in the hang.'] },
    mistakes: { vi: ['Đánh đu lấy đà', 'Thả rơi chân', 'Không duỗi hết tay ở dưới'], en: ['Kipping for momentum', 'Dropping the legs', 'Not reaching full extension'] },
  },
];

EXERCISES.push(
  ...moreExercises((id) => {
    const ex = EXERCISES.find((e) => e.id === id);
    if (!ex) throw new Error(`moreExercises: unknown base exercise ${id}`);
    return ex;
  }),
);

export const EXERCISE_MAP = Object.fromEntries(EXERCISES.map((e) => [e.id, e])) as Record<string, Exercise>;

export const CATEGORIES: Category[] = ['combo', 'push', 'pull', 'legs', 'core', 'cardio', 'mobility'];
