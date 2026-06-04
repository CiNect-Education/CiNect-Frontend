import { writeFileSync } from "fs";

const html = await (await fetch("https://cinestar.com.vn")).text();
writeFileSync("scripts/ref-site-home.html", html);

const cssUrls = [...html.matchAll(/href="(\/_next\/static\/css\/[^"]+\.css)"/g)].map((m) => m[1]);
for (const path of [...new Set(cssUrls)]) {
  const name = path.split("/").pop();
  const css = await (await fetch(`https://cinestar.com.vn${path}`)).text();
  writeFileSync(`scripts/ref-css-${name}`, css);
  console.log("css", path);
}

for (const img of ["ct-1.webp", "ct-2.webp", "ct-1.svg", "ct-2.svg", "ct-3.svg"]) {
  const url = `https://cinestar.com.vn/assets/images/${img}`;
  const res = await fetch(url);
  console.log(img, res.status, res.headers.get("content-type"));
}

for (const key of ["contact", "facebook", "zalo", "form-contact", "lien-he", "cskh", "GỬI NGAY"]) {
  const i = html.indexOf(key);
  if (i >= 0) console.log("\n===", key, "===\n", html.slice(i, i + 600));
}

const assets = [...html.matchAll(/\/assets\/images\/[^"'\\]+/g)].map((m) => m[0]);
const unique = [...new Set(assets)].filter((u) =>
  /fb|face|zalo|ct-|contact|lien|social|btn/i.test(u)
);
console.log("\nasset images:\n", unique.join("\n"));

const idx = html.search(/LIÊN HỆ|LI\\u00caN H\\u1ec6|contact-home|block-contact/i);
console.log("\ncontact block idx", idx);
if (idx >= 0) console.log(html.slice(idx, idx + 3000));

for (const key of ["contact", "block-contact", "home-contact", "ct-fb", "ct-zalo"]) {
  const i = (await (await fetch("https://cinestar.com.vn/_next/static/css/806e1befa4b8b0a1.css")).text()).indexOf(key);
  if (i >= 0) console.log("css806", key, i);
}
