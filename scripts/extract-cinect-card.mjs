import { readFileSync } from "fs";

const html = readFileSync("scripts/ref-site-home.html", "utf8");
const i = html.indexOf("web-movie-box");
console.log(html.slice(i, i + 2500).replace(/\\u003c/g, "<").replace(/\\u0026quot;/g, '"').replace(/\\n/g, "\n"));
