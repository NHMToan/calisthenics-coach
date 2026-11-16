#!/usr/bin/env bash
# Prepare a raw AI-generated clip for the app:
#   square crop, 720x720, 30fps, no audio, H.264, small file, fast start.
#
# Usage: scripts/process-video.sh <input.mp4> <exercise-id> [start-sec] [end-sec] [reps-in-clip]
# Example: scripts/process-video.sh ~/Downloads/veo_squat.mp4 squat 0.4 6.4 2
#   -> assets/videos/squat.2x.mp4, then run: npm run videos:sync
set -euo pipefail

in="$1"; id="$2"; start="${3:-0}"; end="${4:-}"; reps="${5:-1}"
# same id format sync-videos.mjs accepts; also keeps the rm below inside assets/videos
[[ "$id" =~ ^[a-z0-9-]+$ ]] || { echo "bad exercise id: $id (expected [a-z0-9-]+)" >&2; exit 1; }
[[ "$reps" =~ ^[0-9]+$ ]] || { echo "bad reps-in-clip: $reps" >&2; exit 1; }
here="$(cd "$(dirname "$0")/.." && pwd)"
name="$id"; [ "$reps" != "1" ] && name="$id.${reps}x"
out="$here/assets/videos/$name.mp4"
tmp="$(mktemp "$here/assets/videos/.$id.XXXXXX")"
trap 'rm -f "$tmp"' EXIT

# encode first; the old clip is only replaced once the new one exists
trim=(-ss "$start"); [ -n "$end" ] && trim+=(-to "$end")
ffmpeg -y -loglevel error "${trim[@]}" -i "$in" \
  -vf "crop='min(iw,ih)':'min(iw,ih)',scale=720:720:flags=lanczos,fps=30,format=yuv420p" \
  -an -c:v libx264 -preset slow -crf 26 -movflags +faststart -f mp4 "$tmp"

rm -f "$here/assets/videos/$id.mp4" "$here/assets/videos/$id".*x.mp4
mv "$tmp" "$out"

echo "wrote $out ($(du -h "$out" | cut -f1))"
