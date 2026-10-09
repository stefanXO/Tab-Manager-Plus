// node encode.mjs [names...]   out/work/<name>/frames -> out/final/<name>.webm|.mp4|.jpg (+ sheet-<name>.png, loop-<name>.png)
// Loop: a clip whose last state differs from its first (clips.mjs `loopFade` = K) records K extra frames of untouched popup
// at the start; here the last K frames are cross-faded into those K frames and the video starts after them, so the end
// leads into the first frame by a dissolve.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, statSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { work, final, ffmpeg, ffprobe, here } from "./lib.mjs";

const POSTER = { look: 4.1, search: 1.45, saved: 10.05, info: 4.35, options: 5.6, keys: 5.95 };   // seconds into the finished clip (at clips.mjs PACE 1.5)
const LIMIT = 600 * 1024;                     // per webm (400 KB before the 1.5x slower pace)
const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(POSTER);
mkdirSync(final, { recursive: true });
const ff = (args) => execFileSync(ffmpeg, ["-v", "error", "-y", ...args], { stdio: ["ignore", "inherit", "inherit"] });
// sizes.json keeps the entries of the clips not encoded this run
const sizesFile = join(final, "sizes.json");
const report = existsSync(sizesFile) ? JSON.parse(readFileSync(sizesFile, "utf8")) : {};

for (const name of names) {
	const dir = join(work, name);
	const meta = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8"));
	const { frames: N, fps, loopFade: K } = meta;
	const input = ["-framerate", String(fps), "-start_number", "0", "-i", join(dir, "frames", "%04d.png")];
	const loop = K > 0
		? `[0:v]split=3[a][b][c];[a]trim=start_frame=${K}:end_frame=${N - K},setpts=PTS-STARTPTS[mid];[b]trim=start_frame=${N - K}:end_frame=${N},setpts=PTS-STARTPTS[tail];[c]trim=start_frame=0:end_frame=${K},setpts=PTS-STARTPTS[head];[tail][head]blend=all_expr='A*(1-(N+1)/${K})+B*((N+1)/${K})'[x];[mid][x]concat=n=2:v=1:a=0`
		: "[0:v]null";
	const total = K > 0 ? N - K : N;
	const target = (r) => `${loop},fps=${r},format=yuv420p[v]`;
	const out = join(final, name);

	// webm: first the highest quality that fits LIMIT (30 fps, then 24 fps)
	let chosen = null;
	for (const [r, crf] of [[30, 34], [30, 36], [30, 38], [24, 36], [24, 38], [24, 40], [24, 43]]) {
		ff([...input, "-filter_complex", target(r), "-map", "[v]", "-an", "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", String(crf),
			"-row-mt", "1", "-deadline", "good", "-cpu-used", "1", "-g", "240", "-pix_fmt", "yuv420p", out + ".webm"]);
		const size = statSync(out + ".webm").size;
		chosen = { r, crf, size };
		if (size <= LIMIT) break;
	}
	// mp4 at the same frame rate
	ff([...input, "-filter_complex", target(chosen.r), "-map", "[v]", "-an", "-c:v", "libx264", "-profile:v", "main", "-preset", "slow", "-crf", "27",
		"-pix_fmt", "yuv420p", "-movflags", "+faststart", out + ".mp4"]);
	// poster: a frame of the finished loop
	ff(["-ss", String(POSTER[name]), "-i", out + ".mp4", "-frames:v", "1", "-q:v", "4", out + ".jpg"]);
	// strips from the finished mp4: 8 frames across, and the loop point (last 2 frames then first 2)
	const sel = (idx) => idx.map((i) => `eq(n,${i})`).join("+");
	const nFrames = Number(execFileSync(ffprobe, ["-v", "error", "-count_frames", "-select_streams", "v", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", out + ".mp4"]).toString().trim());
	const idx = Array.from({ length: 8 }, (_, i) => Math.round((i / 7) * (nFrames - 1)));
	ff(["-i", out + ".mp4", "-vf", `select='${sel(idx)}',scale=500:-1,tile=4x2`, "-frames:v", "1", "-fps_mode", "passthrough", join(final, `sheet-${name}.png`)]);
	ff(["-i", out + ".mp4", "-vf", `select='${sel([nFrames - 3, nFrames - 2, nFrames - 1, 0, 1, 2])}',scale=500:-1,tile=3x2`, "-frames:v", "1", "-fps_mode", "passthrough", join(final, `loop-${name}.png`)]);
	report[name] = { frames: nFrames, seconds: +(nFrames / chosen.r).toFixed(2), fps: chosen.r, crf: chosen.crf, webmKB: Math.round(chosen.size / 1024), mp4KB: Math.round(statSync(out + ".mp4").size / 1024), jpgKB: Math.round(statSync(out + ".jpg").size / 1024) };
	console.log(name, JSON.stringify(report[name]));
}
const ordered = Object.fromEntries(Object.keys(POSTER).filter((n) => report[n]).map((n) => [n, report[n]]));
writeFileSync(sizesFile, JSON.stringify(ordered, null, 1));
