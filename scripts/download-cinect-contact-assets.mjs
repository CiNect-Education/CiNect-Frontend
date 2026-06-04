import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const outDir = "public/media/cinect-contact";
mkdirSync(outDir, { recursive: true });

const files = ["ct-1.webp", "ct-2.webp", "ct-1.svg", "ct-2.svg", "ct-3.svg"];

for (const file of files) {
  const url = `https://cinestar.com.vn/assets/images/${file}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error("fail", file, res.status);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(join(outDir, file), buf);
  console.log("saved", file, buf.length);
}
