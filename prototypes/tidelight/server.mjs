import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
const root = new URL("./", import.meta.url);
const files = {
  "/": ["index.html", "text/html"],
  "/game.js": ["game.js", "text/javascript"],
  "/style.css": ["style.css", "text/css"],
};
const port = Number(process.env.PORT || 8791);
createServer(async (req, res) => {
  const entry = files[new URL(req.url, "http://localhost").pathname];
  if (!entry) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  try {
    const data = await readFile(new URL(entry[0], root));
    res.writeHead(200, { "Content-Type": `${entry[1]}; charset=utf-8` });
    res.end(data);
  } catch {
    res.writeHead(500);
    res.end("Could not load prototype");
  }
}).listen(port, "127.0.0.1", () =>
  console.log(`Tidelight: http://127.0.0.1:${port}`),
);
