// node peek.mjs <name> [n=12] [t0=0] [t1=end]   -> out/work/peek-<name>.png: n frames of the finished out/final/<name>.mp4 between t0 and t1 (seconds)
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { final, work, ffmpeg, ffprobe } from "./lib.mjs";
const [name, n = "12", t0 = "0", t1] = process.argv.slice(2);
const mp4 = join(final, name + ".mp4");
const probe = execFileSync(ffprobe, ["-v", "error", "-count_frames", "-select_streams", "v", "-show_entries", "stream=nb_read_frames,r_frame_rate", "-of", "csv=p=0", mp4]).toString().trim().split(",");
const fps = eval(probe[0]), total = Number(probe[1]);
const a = Math.round(Number(t0) * fps), b = t1 ? Math.min(total - 1, Math.round(Number(t1) * fps)) : total - 1;
const idx = Array.from({ length: Number(n) }, (_, i) => Math.round(a + (i / (Number(n) - 1)) * (b - a)));
execFileSync(ffmpeg, ["-v", "error", "-y", "-i", mp4, "-vf", `select='${idx.map((i) => "eq(n," + i + ")").join("+")}',scale=500:-1,tile=4x${Math.ceil(Number(n) / 4)}`, "-frames:v", "1", "-fps_mode", "passthrough", join(work, "peek-" + name + ".png")]);
console.log("out/work/peek-" + name + ".png frames", idx.join(" "), "of", total);
