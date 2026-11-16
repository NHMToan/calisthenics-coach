// More exercises, added for the body-region programs (arms, shoulders, core, legs, upper, lower body).
// They are shown with AI still images (assets/images/exercises). Their avatar animation is borrowed from a
// similar exercise (`animApprox`), so it only drives the rep timing and is a rough fallback, not a demo.
import type { Animation } from '../avatar/rig';
import type { Exercise } from './exercises';

type Base = (id: string) => Exercise;

export function moreExercises(base: Base): Exercise[] {
  /** borrow another exercise's animation, optionally at a different tempo */
  const like = (id: string, cycle?: number): Animation => ({ ...base(id).anim, ...(cycle && { cycle }) });

  const list: Omit<Exercise, 'animApprox'>[] = [
    // ---------------- PUSH / ARMS / SHOULDERS ----------------
    {
      id: 'incline-pushup', category: 'push', level: 1, equipment: 'chair', mode: 'reps', met: 3.8,
      name: { vi: 'Hít đất tay trên ghế', en: 'Incline push-up' },
      muscles: { vi: 'Ngực, tay sau, vai', en: 'Chest, triceps, shoulders' },
      anim: like('pushup', 2.4),
      steps: {
        vi: ['Đặt hai tay lên mép ghế chắc chắn, rộng hơn vai.', 'Lùi chân ra sau, người thành một đường thẳng.', 'Hạ ngực xuống gần mép ghế.', 'Đẩy mạnh để trở lại.'],
        en: ['Hands on the edge of a sturdy chair, wider than shoulders.', 'Walk your feet back until your body is one straight line.', 'Lower your chest toward the seat edge.', 'Press back up.'],
      },
      tips: { vi: ['Bài dễ nhất họ hít đất. Ghế càng cao càng dễ.'], en: ['The easiest push-up. A higher surface makes it easier.'] },
      mistakes: { vi: ['Võng hông', 'Ghế bị trượt'], en: ['Sagging hips', 'Chair sliding away'] },
    },
    {
      id: 'wide-pushup', category: 'push', level: 2, equipment: 'none', mode: 'reps', met: 4,
      name: { vi: 'Hít đất tay rộng', en: 'Wide push-up' },
      muscles: { vi: 'Ngực, vai trước', en: 'Chest, front delts' },
      anim: like('pushup', 2.6),
      steps: {
        vi: ['Chống tay rộng gấp rưỡi vai, ngón tay hơi xoay ra ngoài.', 'Siết bụng, người thẳng từ đầu đến gót.', 'Hạ ngực xuống sát sàn, khuỷu mở sang hai bên.', 'Đẩy lên đến khi tay gần thẳng.'],
        en: ['Hands about 1.5× shoulder width, fingers turned slightly out.', 'Brace, body straight from head to heels.', 'Lower your chest close to the floor, elbows out to the sides.', 'Press up until the arms are almost straight.'],
      },
      tips: { vi: ['Tập trung cảm nhận cơ ngực.'], en: ['Focus on squeezing the chest.'] },
      mistakes: { vi: ['Tay rộng quá gây đau vai', 'Hạ không đủ sâu'], en: ['Hands so wide the shoulders hurt', 'Partial range'] },
    },
    {
      id: 'plank-shoulder-tap', category: 'core', level: 2, equipment: 'none', mode: 'reps', met: 4,
      name: { vi: 'Plank chạm vai', en: 'Plank shoulder tap' },
      muscles: { vi: 'Bụng, vai, ổn định thân', en: 'Core, shoulders, anti-rotation' },
      anim: like('plank-up-down', 1.6),
      steps: {
        vi: ['Vào tư thế plank tay thẳng, chân hơi rộng.', 'Nhấc tay phải chạm vai trái, đặt xuống.', 'Đổi bên: tay trái chạm vai phải.', 'Mỗi lần chạm tính là 1 lần.'],
        en: ['High plank, feet slightly apart.', 'Lift the right hand and tap the left shoulder, put it back.', 'Switch: left hand to right shoulder.', 'Each tap is one rep.'],
      },
      tips: { vi: ['Giữ hông đứng yên, không lắc lư.'], en: ['Keep the hips still, no rocking.'] },
      mistakes: { vi: ['Xoay hông theo tay', 'Chạm quá nhanh'], en: ['Hips twisting with the tap', 'Rushing'] },
    },
    {
      id: 'prone-ytw', category: 'pull', level: 1, equipment: 'none', mode: 'reps', met: 2.8,
      name: { vi: 'Nằm sấp nâng tay Y-T-W', en: 'Prone Y-T-W raise' },
      muscles: { vi: 'Vai sau, lưng trên, tư thế', en: 'Rear delts, upper back, posture' },
      anim: like('superman', 3.6),
      steps: {
        vi: ['Nằm sấp, trán gần sàn.', 'Nâng tay thành chữ Y, giữ 1 giây.', 'Hạ xuống, nâng tay thành chữ T, rồi chữ W (khuỷu kéo về sau).', 'Một vòng Y-T-W là 1 lần.'],
        en: ['Lie face down, forehead near the floor.', 'Raise the arms into a Y, hold one second.', 'Lower, then lift into a T, then a W (elbows pulled back).', 'One Y-T-W round is one rep.'],
      },
      tips: { vi: ['Kéo bả vai xuống và vào trong, không nhún vai.'], en: ['Pull the shoulder blades down and together, no shrugging.'] },
      mistakes: { vi: ['Ngửa cổ quá mức', 'Dùng lưng dưới để nâng'], en: ['Cranking the neck up', 'Lifting with the lower back'] },
    },
    {
      id: 'plank-to-downdog', category: 'mobility', level: 1, equipment: 'none', mode: 'reps', met: 3,
      name: { vi: 'Plank sang chó úp mặt', en: 'Plank to downward dog' },
      muscles: { vi: 'Vai, bụng, giãn đùi sau', en: 'Shoulders, core, hamstring stretch' },
      anim: like('pike-pushup', 3.2),
      steps: {
        vi: ['Bắt đầu ở plank tay thẳng.', 'Đẩy hông lên cao, người thành chữ V ngược.', 'Ấn gót về phía sàn, đầu nằm giữa hai tay.', 'Từ từ trở lại plank.'],
        en: ['Start in a high plank.', 'Push the hips up into an upside-down V.', 'Press the heels toward the floor, head between the arms.', 'Slowly return to the plank.'],
      },
      tips: { vi: ['Tốt để khởi động vai trước bài đẩy.'], en: ['A great shoulder warm-up before pushing.'] },
      mistakes: { vi: ['Cong lưng ở tư thế chữ V', 'Nín thở'], en: ['Rounded back in the V', 'Holding the breath'] },
    },
    {
      id: 'wall-handstand-hold', category: 'push', level: 3, equipment: 'wall', mode: 'time', met: 5,
      name: { vi: 'Trồng chuối dựa tường', en: 'Wall handstand hold' },
      muscles: { vi: 'Vai, tay sau, bụng', en: 'Shoulders, triceps, core' },
      anim: like('pike-pushup', 4),
      steps: {
        vi: ['Quay lưng vào tường, chống hai tay cách tường một gang tay.', 'Đi chân lên tường từng bước đến khi người gần thẳng đứng.', 'Đẩy sàn, tay duỗi thẳng, siết bụng và giữ.', 'Đi chân xuống từ từ.'],
        en: ['Back to the wall, hands on the floor a hand-length from it.', 'Walk your feet up the wall until you are almost vertical.', 'Push the floor away, arms locked, core tight, hold.', 'Walk back down slowly.'],
      },
      tips: { vi: ['Chỉ tập khi đã làm được pike push-up. Có thể bắt đầu với chân trên ghế.'], en: ['Only after pike push-ups feel easy. You can start with feet on a chair.'] },
      mistakes: { vi: ['Võng lưng thành hình quả chuối', 'Đầu đặt xuống sàn'], en: ['Banana-shaped arched back', 'Resting the head on the floor'] },
    },
    {
      id: 'chinup', category: 'pull', level: 3, equipment: 'bar', mode: 'reps', met: 8,
      name: { vi: 'Kéo xà tay ngửa', en: 'Chin-up' },
      muscles: { vi: 'Tay trước, lưng xô', en: 'Biceps, lats' },
      anim: like('pullup', 3.2),
      steps: {
        vi: ['Nắm xà, lòng bàn tay hướng về mặt, tay rộng bằng vai.', 'Kéo người lên đến khi cằm qua xà.', 'Hạ chậm đến khi tay gần thẳng.'],
        en: ['Grip the bar with palms facing you, shoulder-width.', 'Pull up until your chin clears the bar.', 'Lower slowly until the arms are almost straight.'],
      },
      tips: { vi: ['Dễ hơn kéo xà tay úp, tốt cho cơ tay trước.'], en: ['Easier than the pull-up, great for the biceps.'] },
      mistakes: { vi: ['Đánh đu lấy đà', 'Chỉ kéo nửa chừng'], en: ['Swinging for momentum', 'Half reps'] },
    },
    {
      id: 'negative-pullup', category: 'pull', level: 2, equipment: 'bar', mode: 'reps', met: 6,
      name: { vi: 'Hạ xà chậm', en: 'Negative pull-up' },
      muscles: { vi: 'Lưng xô, tay trước, lực nắm', en: 'Lats, biceps, grip' },
      anim: like('pullup', 5),
      steps: {
        vi: ['Bước lên ghế để cằm ở trên xà, tay nắm chắc.', 'Bỏ chân khỏi ghế, giữ cằm trên xà.', 'Hạ người thật chậm trong 3–5 giây đến khi tay thẳng.', 'Bước lại lên ghế và lặp lại.'],
        en: ['Use a chair to get your chin above the bar, grip firmly.', 'Take your feet off the chair, chin still above the bar.', 'Lower yourself slowly over 3–5 seconds until the arms are straight.', 'Step back up and repeat.'],
      },
      tips: { vi: ['Cách nhanh nhất để tập được cái kéo xà đầu tiên.'], en: ['The fastest way to your first pull-up.'] },
      mistakes: { vi: ['Rơi người quá nhanh', 'Thả lỏng vai ở dưới cùng'], en: ['Dropping too fast', 'Loose shoulders at the bottom'] },
    },
    {
      id: 'scapula-pullup', category: 'pull', level: 1, equipment: 'bar', mode: 'reps', met: 3.5,
      name: { vi: 'Kéo xà bả vai', en: 'Scapula pull-up' },
      muscles: { vi: 'Lưng trên, vai, lực nắm', en: 'Upper back, shoulders, grip' },
      anim: like('dead-hang', 2.4),
      steps: {
        vi: ['Treo xà, tay thẳng.', 'Không gập khuỷu, kéo bả vai xuống để người nhô lên vài cm.', 'Thả lỏng về tư thế treo.'],
        en: ['Hang from the bar with straight arms.', 'Without bending the elbows, pull the shoulder blades down to rise a few cm.', 'Relax back into the hang.'],
      },
      tips: { vi: ['Bài nền tảng giúp vai khoẻ trước khi kéo xà.'], en: ['Builds shoulder strength before pull-ups.'] },
      mistakes: { vi: ['Gập khuỷu tay', 'Đung đưa'], en: ['Bending the elbows', 'Swinging'] },
    },

    // ---------------- LEGS / LOWER BODY ----------------
    {
      id: 'sumo-squat', category: 'legs', level: 1, equipment: 'none', mode: 'reps', met: 5,
      name: { vi: 'Squat chân rộng', en: 'Sumo squat' },
      muscles: { vi: 'Đùi trong, mông, đùi trước', en: 'Inner thighs, glutes, quads' },
      anim: like('squat', 3),
      steps: {
        vi: ['Đứng chân rộng gấp đôi vai, mũi chân xoay ra ngoài.', 'Hạ hông thẳng xuống, gối mở theo mũi chân.', 'Giữ lưng thẳng, tay chắp trước ngực.', 'Đạp gót đứng lên, siết mông.'],
        en: ['Feet twice shoulder width, toes turned out.', 'Lower the hips straight down, knees following the toes.', 'Back straight, hands together at the chest.', 'Drive through the heels to stand, squeeze the glutes.'],
      },
      tips: { vi: ['Giữ thân trên thẳng đứng hơn squat thường.'], en: ['Stay more upright than a regular squat.'] },
      mistakes: { vi: ['Gối khuỵu vào trong', 'Nhấc gót'], en: ['Knees caving in', 'Heels lifting'] },
    },
    {
      id: 'side-lunge', category: 'legs', level: 2, equipment: 'none', mode: 'reps', met: 5,
      name: { vi: 'Lunge sang ngang', en: 'Side lunge' },
      muscles: { vi: 'Đùi trong, mông, đùi trước', en: 'Inner thighs, glutes, quads' },
      anim: like('reverse-lunge', 3),
      steps: {
        vi: ['Đứng hai chân sát nhau.', 'Bước rộng sang một bên, đẩy hông ra sau và khuỵu gối chân bước.', 'Chân còn lại duỗi thẳng, hai bàn chân đặt phẳng.', 'Đạp chân về vị trí đứng, đổi bên.'],
        en: ['Stand with feet together.', 'Take a big step to the side, sit the hips back and bend that knee.', 'Keep the other leg straight, both feet flat.', 'Push back to standing, switch sides.'],
      },
      tips: { vi: ['Mỗi bên tính là 1 lần.'], en: ['Each side counts as one rep.'] },
      mistakes: { vi: ['Gối vượt quá mũi chân nhiều', 'Cong lưng'], en: ['Knee far past the toes', 'Rounded back'] },
    },
    {
      id: 'step-up', category: 'legs', level: 2, equipment: 'chair', mode: 'reps', met: 6,
      name: { vi: 'Bước lên ghế', en: 'Step-up' },
      muscles: { vi: 'Đùi trước, mông, thăng bằng', en: 'Quads, glutes, balance' },
      anim: like('lunge-knee-drive', 2.6),
      steps: {
        vi: ['Đứng trước ghế chắc chắn, đặt cả bàn chân phải lên ghế.', 'Đạp chân phải để đứng thẳng lên ghế.', 'Bước chân trái xuống trước, rồi chân phải.', 'Đổi chân sau mỗi lần hoặc mỗi hiệp.'],
        en: ['Stand facing a sturdy chair, put your whole right foot on it.', 'Drive through the right foot to stand up on the chair.', 'Step down with the left foot first, then the right.', 'Switch legs each rep or each set.'],
      },
      tips: { vi: ['Dùng chân trên ghế để đẩy, không bật chân dưới.'], en: ['Push with the top leg, don’t bounce off the bottom one.'] },
      mistakes: { vi: ['Ghế không chắc chắn', 'Gối khuỵu vào trong'], en: ['Wobbly chair', 'Knee caving in'] },
    },
    {
      id: 'calf-raise', category: 'legs', level: 1, equipment: 'none', mode: 'reps', met: 2.8,
      name: { vi: 'Nhón gót', en: 'Calf raise' },
      muscles: { vi: 'Bắp chân, cổ chân', en: 'Calves, ankles' },
      anim: like('arm-circles', 1.8),
      steps: {
        vi: ['Đứng thẳng, hai chân rộng bằng hông. Có thể vịn tường.', 'Nhón gót lên cao nhất có thể, giữ 1 giây.', 'Hạ gót chậm xuống sàn.'],
        en: ['Stand tall, feet hip-width. Hold a wall for balance if needed.', 'Rise onto the balls of your feet as high as you can, pause.', 'Lower the heels slowly.'],
      },
      tips: { vi: ['Muốn khó hơn: nhón một chân.'], en: ['Harder: one leg at a time.'] },
      mistakes: { vi: ['Nhún nhanh, không giữ ở trên', 'Ngả người ra trước'], en: ['Bouncing without the pause', 'Leaning forward'] },
    },
    {
      id: 'single-leg-bridge', category: 'legs', level: 2, equipment: 'none', mode: 'reps', met: 4,
      name: { vi: 'Nâng hông một chân', en: 'Single-leg glute bridge' },
      muscles: { vi: 'Mông, đùi sau', en: 'Glutes, hamstrings' },
      anim: like('glute-bridge', 2.8),
      steps: {
        vi: ['Nằm ngửa, co gối, một chân duỗi thẳng lên trời.', 'Đạp gót chân trụ, nâng hông lên cao.', 'Giữ hông ngang bằng, siết mông 1 giây.', 'Hạ xuống, đổi chân sau mỗi hiệp.'],
        en: ['Lie on your back, knees bent, one leg straight up.', 'Press through the planted heel and lift the hips.', 'Keep the hips level, squeeze the glutes for a second.', 'Lower, switch legs each set.'],
      },
      tips: { vi: ['Gót chân trụ đặt gần mông.'], en: ['Keep the planted heel close to your glutes.'] },
      mistakes: { vi: ['Hông lệch một bên', 'Đẩy bằng lưng dưới'], en: ['Hips tilting', 'Arching the lower back'] },
    },
    {
      id: 'hip-thrust', category: 'legs', level: 2, equipment: 'chair', mode: 'reps', met: 4.5,
      name: { vi: 'Đẩy hông tựa ghế', en: 'Hip thrust' },
      muscles: { vi: 'Mông, đùi sau', en: 'Glutes, hamstrings' },
      anim: like('glute-bridge', 2.8),
      steps: {
        vi: ['Ngồi trên sàn, tựa lưng trên (bả vai) vào mép ghế chắc chắn.', 'Co gối, bàn chân phẳng rộng bằng hông.', 'Đẩy hông lên đến khi người thẳng từ vai đến gối.', 'Siết mông, hạ chậm.'],
        en: ['Sit on the floor with your upper back against the edge of a sturdy chair.', 'Knees bent, feet flat, hip-width.', 'Drive the hips up until shoulders to knees form a line.', 'Squeeze the glutes, lower slowly.'],
      },
      tips: { vi: ['Cằm hơi cúi, mắt nhìn về phía gối.'], en: ['Chin slightly tucked, eyes toward the knees.'] },
      mistakes: { vi: ['Võng lưng ở trên cùng', 'Ghế bị trượt'], en: ['Over-arching at the top', 'Chair sliding'] },
    },
    {
      id: 'donkey-kick', category: 'legs', level: 1, equipment: 'none', mode: 'reps', met: 3,
      name: { vi: 'Đá chân sau', en: 'Donkey kick' },
      muscles: { vi: 'Mông', en: 'Glutes' },
      anim: like('superman', 2),
      steps: {
        vi: ['Quỳ bốn điểm, tay dưới vai, gối dưới hông.', 'Giữ gối gập 90°, đẩy bàn chân lên về phía trần.', 'Siết mông ở trên cùng, hạ xuống.', 'Làm hết một bên rồi đổi bên.'],
        en: ['On all fours, hands under shoulders, knees under hips.', 'Keep the knee bent at 90° and push the foot toward the ceiling.', 'Squeeze the glute at the top, lower.', 'Finish one side, then switch.'],
      },
      tips: { vi: ['Chuyển động nhỏ nhưng có kiểm soát.'], en: ['Small, controlled movement.'] },
      mistakes: { vi: ['Võng lưng dưới', 'Xoay hông'], en: ['Arching the lower back', 'Rotating the hips'] },
    },

    // ---------------- CORE ----------------
    {
      id: 'side-plank', category: 'core', level: 2, equipment: 'none', mode: 'time', met: 3.5,
      name: { vi: 'Plank nghiêng', en: 'Side plank' },
      muscles: { vi: 'Bụng chéo, vai, hông', en: 'Obliques, shoulders, hips' },
      anim: like('plank', 4),
      steps: {
        vi: ['Nằm nghiêng, chống cẳng tay dưới vai.', 'Xếp chồng hai chân, nâng hông lên.', 'Người thẳng từ đầu đến gót, giữ nguyên.', 'Đổi bên ở hiệp sau.'],
        en: ['Lie on your side, forearm under the shoulder.', 'Stack the feet and lift the hips.', 'Straight line from head to heels, hold.', 'Switch sides next set.'],
      },
      tips: { vi: ['Dễ hơn: chống gối thay vì bàn chân.'], en: ['Easier: support on the knee instead of the feet.'] },
      mistakes: { vi: ['Hông tụt', 'Vai nhô lên tai'], en: ['Hips dropping', 'Shoulder up by the ear'] },
    },
    {
      id: 'bicycle-crunch', category: 'core', level: 2, equipment: 'none', mode: 'reps', met: 4,
      name: { vi: 'Gập bụng đạp xe', en: 'Bicycle crunch' },
      muscles: { vi: 'Bụng, bụng chéo', en: 'Abs, obliques' },
      anim: like('leg-raise', 1.8),
      steps: {
        vi: ['Nằm ngửa, tay đặt nhẹ sau đầu, nâng vai khỏi sàn.', 'Kéo gối phải về ngực, xoay khuỷu trái về phía gối.', 'Đổi bên như đạp xe.', 'Mỗi bên tính 1 lần.'],
        en: ['Lie on your back, hands lightly behind the head, shoulders off the floor.', 'Pull the right knee in and rotate the left elbow toward it.', 'Switch sides like pedalling.', 'Each side is one rep.'],
      },
      tips: { vi: ['Xoay bằng thân, không kéo cổ.'], en: ['Rotate from the torso, don’t pull the neck.'] },
      mistakes: { vi: ['Kéo đầu bằng tay', 'Làm quá nhanh'], en: ['Yanking the head', 'Going too fast'] },
    },
    {
      id: 'dead-bug', category: 'core', level: 1, equipment: 'none', mode: 'reps', met: 3,
      name: { vi: 'Bọ chết', en: 'Dead bug' },
      muscles: { vi: 'Bụng sâu, lưng dưới', en: 'Deep core, lower back' },
      anim: like('leg-raise', 3),
      steps: {
        vi: ['Nằm ngửa, tay duỗi thẳng lên trần, gối co 90° trên không.', 'Ép lưng dưới sát sàn.', 'Hạ tay phải và chân trái ra xa gần chạm sàn.', 'Trở về rồi đổi bên.'],
        en: ['Lie on your back, arms straight up, knees bent 90° in the air.', 'Press the lower back into the floor.', 'Lower the right arm and left leg toward the floor.', 'Return and switch sides.'],
      },
      tips: { vi: ['Thở ra khi duỗi tay chân.'], en: ['Exhale as you extend.'] },
      mistakes: { vi: ['Lưng dưới nhấc khỏi sàn', 'Làm quá nhanh'], en: ['Lower back lifting', 'Rushing'] },
    },
    {
      id: 'russian-twist', category: 'core', level: 2, equipment: 'none', mode: 'reps', met: 4,
      name: { vi: 'Xoay người kiểu Nga', en: 'Russian twist' },
      muscles: { vi: 'Bụng chéo, bụng', en: 'Obliques, abs' },
      anim: like('leg-raise', 1.6),
      steps: {
        vi: ['Ngồi, ngả người ra sau khoảng 45°, gối co.', 'Chắp tay trước ngực, có thể nhấc chân khỏi sàn.', 'Xoay thân sang phải, rồi sang trái.', 'Mỗi lần xoay một bên tính 1 lần.'],
        en: ['Sit and lean back about 45°, knees bent.', 'Hands together at the chest, feet up if you can.', 'Rotate the torso to the right, then to the left.', 'Each side counts as one rep.'],
      },
      tips: { vi: ['Mắt nhìn theo tay để xoay đủ.'], en: ['Follow your hands with your eyes.'] },
      mistakes: { vi: ['Cong lưng', 'Chỉ đưa tay mà không xoay thân'], en: ['Rounded back', 'Moving the arms, not the torso'] },
    },
    {
      id: 'v-up', category: 'core', level: 3, equipment: 'none', mode: 'reps', met: 5,
      name: { vi: 'Gập người chữ V', en: 'V-up' },
      muscles: { vi: 'Bụng trên, bụng dưới, cơ gập hông', en: 'Upper and lower abs, hip flexors' },
      anim: like('hollow-hold', 2.4),
      steps: {
        vi: ['Nằm ngửa, tay duỗi thẳng qua đầu, chân thẳng.', 'Cùng lúc nâng thân và chân, tay chạm mũi chân.', 'Người thành chữ V, giữ thăng bằng trên mông.', 'Hạ xuống có kiểm soát.'],
        en: ['Lie on your back, arms overhead, legs straight.', 'Lift the torso and legs at the same time, reach for the toes.', 'Make a V shape, balancing on your glutes.', 'Lower with control.'],
      },
      tips: { vi: ['Dễ hơn: co gối (tuck-up).'], en: ['Easier: bend the knees (tuck-up).'] },
      mistakes: { vi: ['Dùng đà vung tay', 'Rơi người xuống sàn'], en: ['Swinging the arms for momentum', 'Crashing down'] },
    },
  ];
  return list.map((e) => ({ ...e, animApprox: true }));
}
