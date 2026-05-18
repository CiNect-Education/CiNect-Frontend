import { readFileSync } from "fs";

const html = readFileSync("scripts/ref-site-home.html", "utf8");

const keys = [
  "trailer",
  "fancybox",
  "data-fancybox",
  "link_video",
  "video_url",
  "youtube",
  "Xem trailer",
  "xem-trailer",
  "openVideo",
  "popup-trailer",
  "film-trailer",
];

for (const key of keys) {
  let idx = 0;
  let count = 0;
  while ((idx = html.indexOf(key, idx)) >= 0 && count < 3) {
    console.log(`\n=== ${key} @${idx} ===`);
    console.log(html.slice(idx - 120, idx + 280).replace(/\\u003c/g, "<").replace(/\\u0026quot;/g, '"'));
    idx += key.length;
    count++;
  }
}

const dataIdx = html.indexOf('"listMovie"');
if (dataIdx >= 0) {
  const sample = html.slice(dataIdx, dataIdx + 4000);
  const videoFields = [...sample.matchAll(/"(link_video[^"]*|video[^"]*|trailer[^"]*)"/gi)];
  console.log("\nvideo fields in listMovie sample:", [...new Set(videoFields.map((m) => m[1]))].slice(0, 20));
}
