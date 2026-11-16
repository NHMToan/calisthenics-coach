# Tạo video AI cho FitMotion: ảnh → video

Quy trình gồm 4 bước:

1. Tạo **1 ảnh nhân vật gốc** (làm một lần).
2. Với mỗi bài, tạo **1 ảnh tư thế bắt đầu** từ ảnh gốc.
3. Đưa ảnh đó vào **Kling image-to-video**, kèm prompt mô tả chuyển động. Với bài khó, dùng **Motion Control** kèm video bạn tự quay.
4. Xử lý clip rồi đưa vào app.

Prompt viết bằng tiếng Anh vì các model tạo ảnh/video hiểu tiếng Anh tốt nhất. Mỗi bài bên dưới có 2 prompt để copy: **ảnh tư thế** và **chuyển động**.

---

## Bước 1 — Ảnh nhân vật gốc

Dùng bất kỳ model tạo ảnh nào: GPT Image, Gemini (Nano Banana), Midjourney, Kling Image... Tạo vài bản, chọn 1 bản ưng ý và **giữ nguyên ảnh đó cho mọi bài**.

```
Full-body character reference of a fit athletic man in his late 20s, short dark messy
hair, wearing a fitted black t-shirt, dark grey athletic shorts and white sneakers.
Standing in strict side profile facing right, arms relaxed by his sides. Warm
hand-painted anime illustration style, soft natural window light. Cozy minimal room:
light wooden floor, plain warm-beige wall, one window with a potted plant on the left
side. Square 1:1 image, full body visible with generous space above the head and in
front of him. No text, no logo.
```

Gợi ý:
- Hãy tự chọn phong cách riêng (căn phòng, màu sắc, trang phục). Đừng sao chép nhân vật hay khung cảnh của app khác.
- Muốn có huấn luyện viên nữ, chỉ cần đổi câu mô tả nhân vật, phần còn lại giữ nguyên.
- Cảnh nên **rộng và trống phía trước** nhân vật. Các bài nằm, chống đẩy hay bật nhảy cần nhiều chỗ, nếu không tay chân sẽ bị cắt khỏi khung hình.

---

## Bước 2 — Ảnh tư thế bắt đầu (cho từng bài)

Dùng model **chỉnh sửa ảnh** và đưa ảnh gốc vào làm tham chiếu. Gemini (Nano Banana) và GPT Image giữ nhân vật đồng nhất tốt. Dùng mẫu sau, thay `[POSE]` bằng mô tả tư thế ở từng bài:

```
Use the reference image. Keep exactly the same character, face, hair, outfit, room,
lighting, art style and camera angle. Change only his pose: [POSE]. Strict side view,
he faces the right side of the frame, whole body inside the frame. Square 1:1.
```

Bài có dụng cụ thì thêm câu mô tả dụng cụ, đã ghi sẵn trong `[POSE]` của bài đó: ghế, tường, xà đơn.

---

## Bước 3 — Video bằng Kling

### Cách A: Image-to-video (dùng cho đa số bài)
- **Khung đầu** = ảnh tư thế. **Khung cuối** = cũng chính ảnh đó. Nhờ khung đầu và khung cuối giống nhau, clip lặp lại liền mạch trong app.
- Prompt: chỉ dán **prompt chuyển động** của bài, rồi thêm dòng chung sau vào cuối:
  ```
  Static locked-off camera, no zoom, no cuts. Same character and room throughout.
  Clean textbook form, smooth steady tempo. Returns exactly to the starting pose at the end.
  ```
- Negative prompt:
  ```
  extra limbs, extra fingers, distorted hands, morphing body, melting, camera movement,
  zoom, cut, text, watermark, blurry, mirrored
  ```
- Thiết lập: chế độ Professional, tỉ lệ 1:1, độ dài 5s hoặc 10s (xem bảng). Mỗi bài nên tạo 2–4 bản rồi chọn bản tốt nhất.

### Cách B: Motion Control (dùng cho bài kết hợp và bài chạm sàn phức tạp)
Chỉ mô tả bằng chữ thì model hay bỏ bớt bước hoặc làm biến dạng tay chân. Cách làm:
1. Tự quay 1–2 rep bằng điện thoại: quay nghiêng, người hướng sang phải, máy đặt cố định ngang hông, thấy toàn thân, nền gọn.
2. Đưa vào Kling Motion Control: **ảnh tư thế** làm nhân vật, **video bạn quay** làm chuyển động mẫu.
3. Prompt ngắn gọn:
   ```
   The character performs exactly the movement from the reference video, same timing,
   same side-view framing. Same room and lighting as the image.
   ```

Nếu không quay được, dùng **prompt chuyển động** của bài với Cách A. Tỉ lệ thành công thấp hơn, nên tạo nhiều bản hơn.

---

## Bước 4 — Đưa vào app

```bash
npm run video:process -- ~/Downloads/kling_squat.mp4 squat 0.3 6.3 2
```
```bash
npm run videos:sync
```

Lệnh `video:process` nhận các tham số theo thứ tự: file gốc, id bài, giây bắt đầu, giây kết thúc, số rep trong đoạn cắt. Lệnh này cắt clip thành hình vuông 720×720, bỏ âm thanh, nén nhỏ, rồi lưu thành `assets/videos/<id>.<N>x.mp4`. Lệnh `videos:sync` cập nhật danh sách video trong app.

- **Đếm rep:** app chia mỗi vòng lặp video thành N đoạn bằng nhau, mỗi đoạn tính 1 rep. Vì vậy N phải đúng với số rep có trong đoạn cắt.
- **Chọn điểm cắt:** cắt ở đúng hai thời điểm nhân vật ở cùng một tư thế, ví dụ đứng thẳng hoặc plank trên cao.
- **Bài tính giờ:** N không quan trọng, để mặc định là 1.
- **Bài kết hợp:** đo xem trong 1 rep của clip, mỗi bước kết thúc ở đâu (tính theo tỉ lệ 0–1), rồi ghi vào `VIDEO_PART_ENDS` trong [src/data/videos.ts](../src/data/videos.ts). Ví dụ `'squat-lunge': [0.56, 1]`. Nếu không ghi, chip từng bước sẽ sáng theo nhịp của avatar, không khớp với video.
- **Video trên CDN:** khai báo trong `REMOTE_VIDEOS` ở [src/data/videos.ts](../src/data/videos.ts).

---

## Bảng tổng hợp

| id | Bài | Cách | Độ dài Kling | Cắt gợi ý (N) |
|---|---|---|---|---|
| `arm-circles` | Xoay tay | A | 5s | 2 vòng (giữ) |
| `high-knees` | Nâng gối cao | A | 5s | 4–6 bước (giữ) |
| `squat` | Squat | A | 10s | 2 |
| `jump-squat` | Squat bật nhảy | A | 5s | 2 |
| `reverse-lunge` | Lunge lùi | A | 10s | 2 (mỗi chân 1) |
| `glute-bridge` | Nâng hông | A | 10s | 2 |
| `wall-sit` | Ngồi dựa tường | A (giữ) | 5s | giữ |
| `knee-pushup` | Hít đất chống gối | A, hỏng thì B | 10s | 2 |
| `pushup` | Hít đất | A, hỏng thì B | 10s | 2 |
| `pike-pushup` | Pike push-up | B | 10s | 2 |
| `chair-dip` | Dip trên ghế | A | 10s | 2 |
| `dead-hang` | Treo xà | A (giữ) | 5s | giữ |
| `pullup` | Kéo xà | A | 10s | 2 |
| `superman` | Superman | A | 10s | 2 |
| `plank` | Plank | A (giữ) | 5s | giữ |
| `leg-raise` | Nâng chân | A | 10s | 2 |
| `mountain-climber` | Leo núi | B | 5s | 4–6 bước (giữ) |
| `burpee` | Burpee | B | 5s | 1 |
| `pushup-jump` | Hít đất + bật nhảy | B | 5s | 1 |
| `pushup-climber` | Hít đất + leo núi | B | 5s | 1 |
| `squat-lunge` | Squat + lunge lùi | A, hỏng thì B | 10s | 1 |
| `bridge-legraise` | Nâng hông + nâng chân | A, hỏng thì B | 10s | 1 |
| `diamond-pushup` | Hít đất kim cương | A, hỏng thì B | 10s | 2 |
| `archer-pushup` | Hít đất cung thủ | B | 10s | 2 (mỗi bên 1) |
| `decline-pushup` | Hít đất gác chân lên ghế | A, hỏng thì B | 10s | 2 |
| `hindu-pushup` | Hít đất Hindu | B | 10s | 2 |
| `bulgarian-split-squat` | Bulgarian split squat | A | 10s | 2 |
| `assisted-pistol-squat` | Pistol squat xuống ghế | A, hỏng thì B | 10s | 2 |
| `skater-hop` | Bật nhảy trượt băng | B | 5s | 4–6 bước (giữ) |
| `lunge-knee-drive` | Lunge lùi + đẩy gối | A | 10s | 2 |
| `hollow-hold` | Giữ thân rỗng | A (giữ) | 5s | giữ |
| `plank-up-down` | Plank lên xuống | B | 10s | 2 |
| `l-sit` | L-sit trên ghế | A (giữ) | 5s | giữ |
| `bear-crawl` | Bò gấu | B | 5s | 4 bước (giữ) |
| `burpee-tuck-jump` | Burpee + bật gối | A, hỏng thì B | 5s | 1 |
| `updown-pushup` | Plank lên xuống + hít đất | A, hỏng thì B | 10s | 1 |
| `bulgarian-jump` | Bulgarian squat + bật nhảy | A, hỏng thì B | 10s | 1 |
| `chinup-knee-raise` | Chin-up + nâng gối treo xà | A, hỏng thì B | 10s | 1 |

---

## Prompt từng bài

### Khởi động & cardio

#### arm-circles — Xoay tay
**Ảnh tư thế**
```
standing tall, feet shoulder-width apart, both arms fully straight and raised forward at shoulder height
```
**Chuyển động**
```
He swings both straight arms in large slow forward circles in the side plane, passing
overhead and down past his hips, shoulders relaxed, torso completely still. Two full circles.
```

#### high-knees — Nâng gối cao
**Ảnh tư thế**
```
mid-stride running in place: right knee raised to hip height, left foot on the floor, left arm forward, right arm back
```
**Chuyển động**
```
He runs in place with high knees, driving each knee up to hip height alternately at a
brisk pace, opposite arm pumping, upright torso, landing softly on the balls of his feet.
Stays on the same spot.
```

### Chân

#### squat
**Ảnh tư thế**
```
standing tall, feet shoulder-width apart, arms relaxed by his sides
```
**Chuyển động**
```
He performs two slow bodyweight squats: pushes hips back and bends knees until thighs are
parallel to the floor while raising straight arms forward to shoulder height, chest up,
heels down, then drives back up to standing with arms lowering to his sides.
```

#### jump-squat — Squat bật nhảy
**Ảnh tư thế**
```
in a half squat, thighs nearly parallel to the floor, arms swung slightly back
```
**Chuyển động**
```
He explodes from the squat into a vertical jump with arms reaching overhead and legs
fully extended, lands softly with bent knees back into the same squat, and repeats once.
Stays on the same spot.
```

#### reverse-lunge — Lunge lùi
**Ảnh tư thế**
```
standing tall with hands on hips, feet together
```
**Chuyển động**
```
He steps his left leg far back into a reverse lunge until both knees bend to 90 degrees
and the back knee hovers just above the floor, torso upright, then pushes back to
standing. Then repeats with the right leg stepping back. Hands stay on hips.
```

#### glute-bridge — Nâng hông
**Ảnh tư thế**
```
lying on his back on the floor, head on the left side of the frame, knees bent, feet flat on the floor near his glutes, arms flat along his sides
```
**Chuyển động**
```
He squeezes his glutes and lifts his hips until shoulders, hips and knees form a straight
line, holds for one second, then lowers slowly to the floor. Two repetitions.
```

#### wall-sit — Ngồi dựa tường
**Ảnh tư thế**
```
wall sit: back pressed flat against the plain wall on the left side of the frame, knees bent at 90 degrees, thighs parallel to the floor, knees over ankles, hands resting on thighs
```
**Chuyển động**
```
He holds the wall sit perfectly still with calm steady breathing; only a very subtle
breathing motion of the chest. No other movement.
```

#### bulgarian-split-squat
**Ảnh tư thế**
```
Bulgarian split squat on a sturdy wooden chair placed behind him on the left: standing tall on his right foot about a long step in front of the chair, toes of his left foot resting on the chair seat behind him, hands on hips
```
**Chuyển động**
```
He lowers straight down until the front thigh is parallel to the floor and the back knee
hovers just above the floor, torso upright, front knee over the toes, then drives up
through the front heel to standing. Two repetitions. The back foot stays on the chair
and the chair does not move.
```

#### assisted-pistol-squat — Pistol squat xuống ghế
**Ảnh tư thế**
```
standing on his left leg directly in front of a low sturdy wooden chair placed behind him on the left side of the frame, the seat edge just behind his heel, right leg raised slightly forward off the floor, both arms reaching forward at chest height
```
**Chuyển động**
```
He performs a slow single-leg pistol squat to the chair: pushes his hips back and lowers
on the standing leg until his hips lightly touch the chair seat, the other leg extended
straight forward off the floor and arms reaching forward for balance, standing heel down,
then drives back up to standing without sitting down. Two repetitions. The chair does
not move.
```

#### skater-hop — Bật nhảy trượt băng
**Ảnh tư thế**
```
landing on his right leg with the knee bent, torso leaning forward, left leg swept behind him off the floor, left arm swung forward and right arm back
```
**Chuyển động**
```
He does skater hops: bounds sideways from one leg to the other like a speed skater,
landing softly on a bent knee each time while the free leg sweeps behind, arms swinging
across with the rhythm. Brisk steady pace, stays in the same area of the frame.
```

#### lunge-knee-drive — Lunge lùi + đẩy gối
**Ảnh tư thế**
```
reverse lunge bottom: right foot in front, left knee hovering just above the floor behind him, torso upright, right arm back and left arm forward
```
**Chuyển động**
```
He drives up through the front foot to stand on the right leg while bringing the left
knee up to hip height in front of him, right arm swinging forward, holds for a moment,
then steps the left leg back down into the reverse lunge. Two repetitions.
```

### Đẩy

#### knee-pushup — Hít đất chống gối
**Ảnh tư thế**
```
knee push-up top position: hands on the floor slightly wider than shoulders, arms straight, knees on the floor, feet raised behind, straight line from head to knees
```
**Chuyển động**
```
He lowers his chest toward the floor with elbows at 45 degrees, then presses back up to
straight arms. Two smooth repetitions, body stays in a straight line from head to knees.
```

#### pushup — Hít đất
**Ảnh tư thế**
```
high plank on the floor: hands under shoulders, arms straight, legs straight, body in one straight line from head to heels
```
**Chuyển động**
```
He performs two slow full push-ups: lowers his chest to just above the floor with
elbows at 45 degrees, then pushes up until arms are straight. Hips never sag.
```

#### pike-pushup — Pike push-up
**Ảnh tư thế**
```
pike position: hands and feet on the floor, hips pushed high forming an inverted V, legs and arms straight, head between the arms looking at the floor
```
**Chuyển động**
```
He bends his elbows and lowers the top of his head toward the floor just in front of his
hands, then presses back up to straight arms. Hips stay high. Two repetitions.
```

#### chair-dip — Dip trên ghế
**Ảnh tư thế**
```
bench dip on a sturdy wooden chair placed behind him on the left: hands gripping the front edge of the seat behind his hips, arms straight, hips just in front of the seat, legs extended forward with heels on the floor
```
**Chuyển động**
```
He bends his elbows straight back to lower his hips toward the floor until elbows reach
90 degrees, then presses up until arms are straight. Back stays close to the chair.
Two repetitions. The chair does not move.
```

#### diamond-pushup — Hít đất kim cương
**Ảnh tư thế**
```
high plank on the floor with both hands close together under his chest forming a diamond shape, arms straight, body in one straight line from head to heels
```
**Chuyển động**
```
He performs two slow diamond push-ups: lowers his chest down to his hands with elbows
tucked tight along his ribs, then pushes back up to straight arms. Hips never sag.
```

#### archer-pushup — Hít đất cung thủ
**Ảnh tư thế**
```
high plank on the floor with hands placed very wide, about twice shoulder width, arms straight, body in one straight line
```
**Chuyển động**
```
He shifts his weight to one side and bends that elbow to lower his chest toward that
hand while the other arm stays completely straight, then presses back to the middle and
repeats to the other side. One repetition per side. Body stays straight.
```

#### decline-pushup — Hít đất gác chân lên ghế
**Ảnh tư thế**
```
decline push-up top position: toes resting on the seat of a sturdy wooden chair on the left side of the frame, hands on the floor under his shoulders, arms straight, body in one straight line
```
**Chuyển động**
```
He performs two slow decline push-ups: lowers his chest toward the floor with elbows at
45 degrees, then pushes up until arms are straight. Feet stay on the chair, hips never
sag. The chair does not move.
```

#### hindu-pushup — Hít đất Hindu
**Ảnh tư thế**
```
inverted V position: hands and feet on the floor, hips pushed high, arms and legs straight, head between the arms
```
**Chuyển động**
```
He performs a Hindu push-up: bends his elbows and swoops his chest forward just above
the floor between his hands, then straightens his arms into an upward-facing dog with
chest lifted and hips low, then pushes his hips back up into the inverted V. Two
smooth wave-like repetitions. Hands and feet stay in place.
```

### Kéo

#### dead-hang — Treo xà
**Ảnh tư thế**
```
hanging from a horizontal pull-up bar mounted near the top of the frame (add the bar if needed): overhand grip slightly wider than shoulders, arms fully straight, feet off the floor, legs together with knees slightly bent
```
**Chuyển động**
```
He hangs calmly from the bar with straight arms; only a tiny natural sway and breathing.
The bar does not move.
```

#### pullup — Kéo xà
**Ảnh tư thế**
```
dead hang from a horizontal pull-up bar near the top of the frame (add the bar if needed): overhand grip, arms straight, feet off the floor
```
**Chuyển động**
```
He performs two strict pull-ups: pulls up smoothly until his chin clears the bar, elbows
driving down, no swinging, then lowers slowly to full arm extension.
```

#### superman
**Ảnh tư thế**
```
lying face down on the floor, head on the right side of the frame, arms extended straight overhead, legs straight together
```
**Chuyển động**
```
He lifts his arms, chest and legs a few inches off the floor at the same time, holds for
one second, then lowers slowly. Neck neutral, eyes on the floor. Two repetitions.
```

### Bụng

#### plank
**Ảnh tư thế**
```
forearm plank: elbows directly under shoulders, forearms flat on the floor pointing forward, legs straight, toes on the floor, body in a straight line from head to heels
```
**Chuyển động**
```
He holds the forearm plank perfectly still with calm breathing; only subtle breathing
motion. Hips stay level.
```

#### leg-raise — Nâng chân
**Ảnh tư thế**
```
lying on his back on the floor, head on the left side of the frame, arms flat along his sides, legs straight together hovering just above the floor
```
**Chuyển động**
```
He raises both straight legs up to vertical, then lowers them slowly until they hover
just above the floor, lower back pressed into the floor. Two repetitions.
```

#### mountain-climber — Leo núi
**Ảnh tư thế**
```
high plank on the floor, hands under shoulders, right knee pulled in toward the chest, left leg extended back
```
**Chuyển động**
```
He does mountain climbers: quickly switches legs in a running motion, driving each knee
toward the chest alternately, hips low and level, shoulders over wrists. Fast steady rhythm.
```

#### burpee
**Ảnh tư thế**
```
standing tall, feet hip-width apart, arms by his sides
```
**Chuyển động**
```
One burpee: he squats and places both hands on the floor, jumps his feet back into a
high plank, jumps his feet back in toward his hands, stands up and jumps vertically with
arms reaching overhead, landing softly back in the standing start position.
```

#### hollow-hold — Giữ thân rỗng
**Ảnh tư thế**
```
hollow body hold lying on his back on the floor, head on the left side of the frame: lower back pressed into the floor, shoulders and straight legs lifted a few inches off the floor, arms extended overhead beside his ears, body curved like a shallow banana
```
**Chuyển động**
```
He holds the hollow body position perfectly still with calm breathing; only subtle
breathing motion. Lower back stays on the floor.
```

#### plank-up-down — Plank lên xuống
**Ảnh tư thế**
```
forearm plank: elbows directly under shoulders, forearms flat on the floor pointing forward, legs straight, body in a straight line from head to heels
```
**Chuyển động**
```
He places his right hand on the floor and presses up, then his left, into a high plank,
then lowers back down one forearm at a time to the forearm plank. Hips stay level and
quiet. Two repetitions.
```

#### l-sit — L-sit trên ghế
**Ảnh tư thế**
```
chair L-sit: a sturdy wooden chair behind him on the left side of the frame, both hands gripping the front edge of the seat just behind his hips, arms locked straight, hips hovering just in front of the seat edge clearly above the floor, legs straight together extended forward roughly parallel to the floor
```
**Chuyển động**
```
He holds the chair L-sit still, pressing down through straight arms with shoulders pushed
down, hips hovering in front of the seat, legs straight and off the floor; only subtle
breathing and a slight tremble. The chair does not move.
```

#### bear-crawl — Bò gấu
**Ảnh tư thế**
```
bear crawl position: hands on the floor under his shoulders, knees bent 90 degrees under his hips and hovering just above the floor, back flat like a tabletop
```
**Chuyển động**
```
He bear crawls with small steps, moving opposite hand and foot together, knees hovering
just above the floor, back flat and hips level. He crawls a few steps forward then a few
steps back, ending where he started.
```

### Bài kết hợp
1 clip = 1 rep của cả chuỗi. Khi tập, app làm nổi bật bước đang diễn ra dựa trên tỉ lệ thời gian dưới đây. Clip nên giữ gần đúng tỉ lệ này. Nếu clip lệch nhiều, chỉnh `weights` của bài đó trong [exercises.ts](../src/data/exercises.ts).

| id | Tỉ lệ thời lượng các bước trong 1 rep | Nhịp |
|---|---|---|
| `pushup-jump` | Hít đất 36% → Thu chân 14% → Bật nhảy 25% → Về plank 25% | ~4.4s |
| `pushup-climber` | Hít đất 64% → Leo núi ×2 36% | ~3s |
| `squat-lunge` | Squat 38% → Lunge lùi 62% | ~6.2s |
| `bridge-legraise` | Nâng hông 45% → Nâng chân 55% | ~6s |
| `burpee-tuck-jump` | Xuống plank 36% → Thu chân 20% → Bật gối 44% | ~4.6s |
| `updown-pushup` | Lên plank cao 30% → Hít đất 40% → Về plank cẳng tay 30% | ~4.4s |
| `bulgarian-jump` | Bulgarian squat 50% → Bật nhảy 50% | ~4.6s |
| `chinup-knee-raise` | Chin-up 57% → Nâng gối 43% | ~5s |

#### pushup-jump — Hít đất + bật nhảy
**Ảnh tư thế**
```
high plank on the floor: hands under shoulders, arms straight, body in one straight line from head to heels
```
**Chuyển động** (nếu không dùng Motion Control)
```
One continuous combo: he performs one full push-up, jumps both feet forward next to his
hands into a low squat, explodes into a vertical jump with arms overhead, lands softly in
a squat, places both hands on the floor and jumps his feet back into the high plank.
```

#### pushup-climber — Hít đất + leo núi
**Ảnh tư thế**
```
high plank on the floor: hands under shoulders, arms straight, body in one straight line from head to heels
```
**Chuyển động**
```
One continuous combo: he performs one full push-up, then immediately two quick
mountain-climber knee drives (right knee to chest, then left knee to chest) with hips
low, ending back in the same high plank.
```

#### squat-lunge — Squat + lunge lùi
**Ảnh tư thế**
```
standing tall, feet shoulder-width apart, arms relaxed by his sides
```
**Chuyển động**
```
One continuous combo: he performs one deep bodyweight squat with arms raised forward,
stands up and places hands on hips, steps his left leg far back into a reverse lunge
with the back knee hovering above the floor, then steps forward back to standing with
arms by his sides.
```

#### bridge-legraise — Nâng hông + nâng chân
**Ảnh tư thế**
```
lying on his back on the floor, head on the left side of the frame, knees bent, feet flat on the floor near his glutes, arms flat along his sides
```
**Chuyển động**
```
One continuous combo: he lifts his hips into a glute bridge and holds one second, lowers
his hips, straightens both legs and raises them straight up to vertical, lowers them
slowly to just above the floor, then bends his knees back to the starting position.
```

#### burpee-tuck-jump — Burpee + bật gối
**Ảnh tư thế**
```
standing tall, feet hip-width apart, arms by his sides
```
**Chuyển động** (nếu không dùng Motion Control)
```
One continuous combo: he squats and places both hands on the floor, jumps his feet back
into a high plank, jumps his feet back in toward his hands, then explodes into a tuck
jump pulling both knees up toward his chest, lands softly with bent knees and stands
back up in the starting position.
```

#### updown-pushup — Plank lên xuống + hít đất
**Ảnh tư thế**
```
forearm plank: elbows directly under shoulders, forearms flat on the floor pointing forward, legs straight, body in a straight line from head to heels
```
**Chuyển động**
```
One continuous combo: he presses up one hand at a time from the forearm plank into a
high plank, performs one full push-up, then lowers back down one forearm at a time to the
forearm plank. Hips stay level throughout.
```

#### bulgarian-jump — Bulgarian squat + bật nhảy
**Ảnh tư thế**
```
Bulgarian split squat on a sturdy wooden chair placed behind him on the left: standing tall on his right foot about a long step in front of the chair, toes of his left foot resting on the chair seat behind him, hands on hips
```
**Chuyển động**
```
One continuous combo: he does one slow Bulgarian split squat down and up, then sinks
again and explodes upward so the front foot leaves the floor, arms swinging overhead,
back foot staying on the chair, and lands softly back into a bent front knee before
standing tall. The chair does not move.
```

#### chinup-knee-raise — Chin-up + nâng gối treo xà
**Ảnh tư thế**
```
dead hang from a horizontal pull-up bar near the top of the frame (add the bar if needed): underhand chin-up grip with palms facing him, hands shoulder-width, arms straight, feet off the floor
```
**Chuyển động**
```
One continuous combo: he performs one strict chin-up until his chin clears the bar,
lowers slowly to straight arms, then raises both knees up to hip height and lowers them
with control. No swinging. The bar does not move.
```

---

## Kiểm tra trước khi đưa vào app

- [ ] Cùng một nhân vật, trang phục và căn phòng với các bài đã làm.
- [ ] Nhìn nghiêng, người hướng sang phải, toàn thân nằm trong khung hình.
- [ ] Không có tay chân thừa, không biến dạng, không có chữ hay watermark.
- [ ] Động tác đúng kỹ thuật (đối chiếu với mục "Cách thực hiện" trong app).
- [ ] Điểm đầu và điểm cuối đoạn cắt trùng tư thế, video lặp lại không giật.
- [ ] Số `N` trong lệnh xử lý đúng với số rep trong đoạn cắt.
- [ ] Bạn có quyền dùng thương mại ảnh và video theo điều khoản của công cụ đã dùng.
