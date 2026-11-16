# FitMotion – Calisthenics & tập tại nhà

App React Native (Expo SDK 58 + Expo Router), có huấn luyện viên dạng **avatar động** làm mẫu từng động tác. Avatar chạy offline, không cần video.

## Chạy app

```bash
npm install
npx expo start --ios      # hoặc --android, hoặc quét QR bằng Expo Go
```

## Tính năng

- **59 bài tập**, lọc theo vùng cơ (tay, vai, bụng, chân, thân trên, thân dưới) hoặc theo kiểu (kết hợp, cardio, khởi động). 4 bài kết hợp nhiều động tác liền mạch (hít đất + bật nhảy, hít đất + leo núi, squat + lunge, nâng hông + nâng chân); khi tập, app hiện chuỗi động tác và làm nổi bật bước đang làm. Mỗi bài có avatar làm mẫu, các bước thực hiện, mẹo và lỗi thường gặp. Có chỉnh tốc độ 0.5x / 1x / 1.5x.
- **15 giáo án** từ cơ bản đến nâng cao, gồm 6 giáo án theo vùng cơ: tay, vai, bụng, chân & mông, thân trên, thân dưới.
- **Màn hình tập**: avatar làm mẫu theo nhịp, tự đếm rep theo từng chu kỳ động tác, đếm ngược cho bài tính giờ, nghỉ giữa hiệp có xem trước bài tiếp theo, nút +10s, tạm dừng, chuyển bài trước/sau.
- **Giọng huấn luyện viên** (ElevenLabs thu sẵn, hoặc giọng máy) đọc tên bài, đếm rep, đếm ngược 3-2-1, cổ vũ (nhiều câu khác nhau, chọn ngẫu nhiên) và nhắc thở/uống nước lúc nghỉ. Ba kiểu đếm: đếm từng lần, đếm + nhịp ("Lên!" / "Hạ chậm"), hoặc chỉ cổ vũ. Có rung phản hồi và giữ màn hình sáng khi tập.
- **Tự tạo buổi tập**: chọn bài, số lần / thời gian, số vòng, thời gian nghỉ. Có thể sao chép và tuỳ chỉnh bất kỳ giáo án nào.
- **Tăng độ khó tự động**: cuối buổi chọn Dễ / Vừa sức / Khó. Lần sau app tăng hoặc giảm ~10% số lần và thời gian (tối đa +40%, tối thiểu −20%). Nếu thấy dễ, trang giáo án gợi ý thay bài khó hơn (ví dụ squat → squat bật nhảy) và tạo sẵn bản nâng cao.
- **Nhắc tập hằng ngày**: chọn giờ trong Cài đặt. App lên lịch 7 ngày tới, bỏ qua ngày đã tập và nhắc kèm chuỗi ngày tập.
- **Tiến độ**: chuỗi ngày tập, tổng số buổi / phút / kcal, biểu đồ 7 ngày, lịch sử tập (lưu bằng AsyncStorage).
- **Song ngữ** Việt / Anh, chuyển trong Cài đặt.

## Cấu trúc

```
src/
  avatar/rig.ts      # khung xương 2D: forward kinematics + IK 2 khớp, nội suy keyframe
  avatar/Avatar.tsx  # vẽ avatar bằng react-native-svg, chạy bằng requestAnimationFrame
  data/exercises.ts  # bài tập: nội dung song ngữ + keyframe chuyển động
  data/programs.ts   # giáo án
  data/progression.ts # tăng/giảm độ khó, bài khó hơn, điểm nhắc nhịp lên/xuống
  store.tsx          # cài đặt, lịch sử, buổi tập tự tạo, mức độ khó (AsyncStorage)
  voice.ts           # phát giọng HLV (expo-audio), dự phòng bằng expo-speech
  reminders.ts       # nhắc tập hằng ngày (expo-notifications)
  i18n.ts            # chuỗi giao diện vi/en
  app/               # các màn hình (Expo Router)
```

## Thêm bài tập mới

Mỗi động tác là một chuỗi tư thế (keyframe). Một tư thế gồm vị trí hông, góc thân, và cho mỗi tay/chân:
- `A(góc1, góc2)`: đặt góc tuyệt đối của từng đoạn chi (0° = phải, 90° = xuống), hoặc
- `T(x, y)`: đặt điểm đích của bàn tay/bàn chân, IK tự tính khớp khuỷu/gối. Nhờ vậy tay chân bám chắc vào sàn, xà hoặc ghế.

Khung hình là 240×200, sàn ở `y = 185`. Hằng số `G` là độ cao của cổ chân khi chạm sàn.

## Ảnh nền phòng tập

Nền phía sau avatar là ảnh `assets/images/room.jpg` (tạo bằng AI, đã nén còn ~94KB). Muốn thay ảnh khác: giữ tỉ lệ ~6:5, khoảng giữa trống, rồi chỉnh `ROOM_BOX` trong `src/avatar/Avatar.tsx` để chỗ đứng trên sàn của ảnh trùng với `FLOOR` (hiện tại: pixel y≈1600 của ảnh gốc 2272×1888).

## Ảnh AI

Bài chưa có video thì app hiện 2 ảnh AI (`assets/images/exercises/<id>_a.jpg` = đầu động tác, `<id>_b.jpg` = cuối động tác), chuyển mờ qua lại theo nhịp và vẫn đếm rep theo nhịp của bài. Bài giữ tư thế (plank…) chỉ có ảnh `_a`. Ảnh tạo bằng Kling (`kling-image-v3_0` cho ảnh đầu, `kling-image-o1` sửa từ ảnh đầu cho ảnh cuối để khớp khung hình), khoảng 1 credit mỗi ảnh. Thêm hoặc đổi ảnh xong thì chạy:

```bash
npm run images:sync   # cập nhật src/data/images.generated.ts
```

21 bài mới (`src/data/exercisesMore.ts`) mượn animation avatar của bài tương tự nên chỉ dùng để tính nhịp; chúng luôn hiện ảnh AI.

## Video AI

Bài tập nào có video thì app phát video, bài nào chưa có thì dùng ảnh AI, rồi mới đến avatar. Người dùng có thể đổi giữa video và avatar trong Cài đặt hoặc ngay trên màn chi tiết bài tập. Số rep được đếm theo vòng lặp của video.

Prompt và quy trình tạo video nằm trong [docs/ai-video-prompts.md](docs/ai-video-prompts.md):

```bash
npm run video:process -- ~/Downloads/clip.mp4 squat 0.4 6.4 2   # cắt vuông 720p, bỏ âm thanh → assets/videos/squat.2x.mp4
npm run videos:sync                                              # cập nhật src/data/videos.generated.ts
```

Video lưu trên CDN thì khai báo trong `REMOTE_VIDEOS` ở `src/data/videos.ts` (có cache trên máy).

## Giọng huấn luyện viên (ElevenLabs)

App phát các file giọng thu sẵn trong `assets/voice/<vi|en>/` (model `eleven_v4`; giọng Tuấn Anh cho tiếng Việt, Liam cho tiếng Anh), ghép thành câu như "Chuẩn bị! · Squat · mười hai lần". Câu nào thiếu file thì app đọc cả câu bằng giọng máy (expo-speech).

Câu thoại nằm trong `src/data/voiceLines.ts`. Thêm bài tập mới hoặc sửa câu thoại xong thì thu lại:

```bash
npm run voice:gen -- --dry   # xem câu nào sẽ được thu và số ký tự, chưa tốn tiền
npm run voice:gen            # chỉ thu các câu mới hoặc đã đổi; cần ELEVENLABS_API_KEY trong .env.local
```

Key chỉ được dùng trên máy bạn lúc chạy lệnh, không nằm trong app. Muốn đổi giọng: đặt `VOICE_VI` / `VOICE_EN` (voice id) khi chạy lệnh, hoặc sửa `VOICES` trong `scripts/gen-voice.mjs`.

## Hướng phát triển

- Dùng camera + pose detection (MediaPipe / ML Kit) để chấm tư thế và đếm rep thật. Cần development build.
- Huấn luyện viên AI (Claude API) tạo giáo án cá nhân theo mục tiêu và lịch sử tập.
