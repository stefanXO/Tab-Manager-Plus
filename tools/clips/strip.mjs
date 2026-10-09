// node strip.mjs <name> [n=8]   -> out/final/sheet-<name>.png (n frames evenly spread, 4 per row)
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { work, final, ffmpeg } from "./lib.mjs";
const name = process.argv[2], n = Number(process.argv[3] || 8), from = Number(process.argv[4] || 0), to = process.argv[5] ? Number(process.argv[5]) : null, out = process.argv[6] || "sheet-" + name + ".png";
const meta = JSON.parse(readFileSync(join(work, name, "meta.json"), "utf8"));
const idx = Array.from({ length: n }, (_, i) => Math.round(from + (i / (n - 1)) * ((to ?? meta.frames - 1) - from)));
const sel = idx.map((i) => "eq(n," + i + ")").join("+");
execFileSync(ffmpeg, ["-v", "error", "-y", "-start_number", "0", "-i", join(work, name, "frames", "%04d.png"),
	"-vf", "select='" + sel + "',scale=500:-1,drawtext=text='%{n}':x=6:y=6:fontcolor=red:fontsize=18:box=1:boxcolor=white,tile=4x" + Math.ceil(n / 4), "-frames:v", "1", "-fps_mode", "passthrough",
	join(final, out)], { stdio: "inherit" });
console.log(out + " frames", idx.join(" "));
