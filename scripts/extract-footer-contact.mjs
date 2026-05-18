import { readFileSync, writeFileSync } from "fs";

const h = readFileSync("scripts/ref-site-home.html", "utf8");
const start = h.indexOf('"footerContactCms"');
if (start < 0) {
  console.error("footerContactCms not found");
  process.exit(1);
}

const sub = h.slice(start, start + 15000);
const leftM = sub.match(/"left":"((?:\\.|[^"\\])*)"/);
const rightM = sub.match(/"right":"((?:\\.|[^"\\])*)"/);
const topM = sub.match(/"top":"((?:\\.|[^"\\])*)"/);

function dec(raw) {
  return JSON.parse(`"${raw}"`);
}

if (leftM) writeFileSync("scripts/contact-left.html", dec(leftM[1]));
if (rightM) writeFileSync("scripts/contact-right.html", dec(rightM[1]));
if (topM) writeFileSync("scripts/contact-top.html", dec(topM[1]));
console.log("wrote", { left: !!leftM, right: !!rightM, top: !!topM });
