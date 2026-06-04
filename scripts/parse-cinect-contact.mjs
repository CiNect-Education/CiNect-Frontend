import { readFileSync, writeFileSync } from "fs";

const html = readFileSync("scripts/ref-site-home.html", "utf8");

const patterns = [
  "ct-1.webp",
  "FACEBOOK",
  "ZALO CHAT",
  "block-contact",
  "contact-home",
  "home-contact",
  "form-contact",
  "ct-social",
  "ct-btn",
  "ct-form",
  "GỬI NGAY",
];

for (const p of patterns) {
  let i = 0;
  let count = 0;
  while ((i = html.indexOf(p, i)) >= 0 && count < 2) {
    console.log(`\n=== ${p} @${i} ===`);
    console.log(html.slice(Math.max(0, i - 150), i + 400));
    i += p.length;
    count++;
  }
}

function decodeChunk(s) {
  return s
    .replace(/\\u003c/g, "<")
    .replace(/\\u003e/g, ">")
    .replace(/\\u0026quot;/g, '"')
    .replace(/\\u0026#39;/g, "'")
    .replace(/\\n/g, "\n");
}

const idx = html.indexOf("ct-social");
if (idx >= 0) {
  writeFileSync("scripts/contact-snippet.html", decodeChunk(html.slice(idx - 600, idx + 3500)));
  console.log("wrote snippet");
}

const css = readFileSync("scripts/ref-css-26dbd44eb6d6c6ee.css", "utf8");
for (const k of ["ct-social", "ct-social-link", "ct-tt", "ct-form", "block-contact", ".contact"]) {
  let i = 0;
  while ((i = css.indexOf(k, i)) >= 0) {
    if (k.length > 3) {
      console.log("\nCSS", k, css.slice(Math.max(0, i), i + 280));
    }
    i += 1;
    if (i > 500000) break;
  }
}
