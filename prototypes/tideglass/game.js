const canvas = document.querySelector("#world"),
  ctx = canvas.getContext("2d"),
  $ = (s) => document.querySelector(s);
const size = 15,
  key = "glow-tideglass-v1";
const noise = (x, y) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
function terrain(x, y) {
  const a = Math.hypot((x - 6) / 1.2, y - 7),
    b = Math.hypot(x - 11, y - 4),
    c = Math.hypot(x - 3, y - 12);
  return a < 4.8 || b < 2.7 || c < 2.2
    ? noise(x, y) > 0.22
      ? "land"
      : "shallow"
    : "water";
}
const fresh = () => ({
  day: 1,
  reed: 4,
  stone: 3,
  glow: 0,
  tiles: Array.from({ length: size * size }, (_, i) => {
    let x = i % size,
      y = Math.floor(i / size),
      kind = terrain(x, y);
    return {
      x,
      y,
      kind,
      item:
        kind === "land"
          ? noise(x + 9, y + 2) > 0.55
            ? "reed"
            : noise(x + 2, y + 9) > 0.6
              ? "rock"
              : null
          : null,
      planted: 0,
      level: 0,
    };
  }),
});
let state = fresh();
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (
    saved &&
    saved.tiles?.length === 225 &&
    ["day", "reed", "stone", "glow"].every((k) => Number.isFinite(saved[k])) &&
    saved.tiles.every(
      (t, i) =>
        t.x === i % size &&
        t.y === Math.floor(i / size) &&
        ["water", "land", "shallow"].includes(t.kind),
    )
  )
    state = saved;
} catch {}
let tool = "gather",
  selected = 112,
  hover = -1,
  width = 0,
  height = 0,
  scale = 1;
const select = $("#tileSelect");
state.tiles.forEach((t, i) => {
  const o = document.createElement("option");
  o.value = i;
  o.textContent = `${t.x + 1}, ${t.y + 1}`;
  select.append(o);
});
select.value = selected;
function save() {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    message(
      "This garden will last until you close the page; storage is unavailable.",
    );
  }
}
function message(s) {
  $("#notice").textContent = s;
}
function update() {
  for (const [id, k] of [
    ["fiber", "reed"],
    ["stone", "stone"],
    ["light", "glow"],
  ])
    $("#" + id).textContent = state[k];
  $("#day").textContent = "DAY " + String(state.day).padStart(2, "0");
  $("#tide").textContent = state.day % 2 ? "LOW TIDE" : "HIGH TIDE";
  $("#weather").textContent =
    state.day % 2
      ? "The shallows are yours to wander."
      : "Water rises. Bridges keep the way open.";
  const n = state.tiles.filter((t) => t.item === "garden").length;
  $("#garden").textContent = `${n} garden${n === 1 ? "" : "s"} growing`;
  describe();
  save();
}
function describe() {
  const t = state.tiles[selected];
  $("#tileLabel").textContent =
    `${t.kind === "water" ? "OPEN WATER" : t.kind === "shallow" ? "TIDAL FLAT" : "MEADOW"} · ${t.x + 1}, ${t.y + 1}`;
  $("#tileTitle").textContent =
    t.item === "garden"
      ? "A pocket of sunlight"
      : t.item === "beacon"
        ? `Beacon · level ${t.level}`
        : t.item === "bridge"
          ? "A way across"
          : t.item === "reed"
            ? "Reeds in the breeze"
            : t.item === "rock"
              ? "River-worn stone"
              : "Room for possibility";
  $("#tileText").textContent =
    t.item === "garden"
      ? state.day > t.planted
        ? "Ready to gather: 2 reed + 1 glow."
        : "Let a day pass. Your garden will bloom."
      : t.item === "beacon"
        ? "Gather here for glow once each day. Upgrade with the Beacon tool."
        : t.item === "bridge"
          ? "A permanent place above the tide. Plant here if you like."
          : "Choose a tool, then click this tile.";
  select.value = selected;
}
function use(i) {
  selected = i;
  const t = state.tiles[i];
  describe();
  if (
    state.day % 2 === 0 &&
    t.kind === "shallow" &&
    !["bridge", "garden", "beacon"].includes(t.item) &&
    tool !== "bridge"
  )
    return message(
      "This flat is under water. Build a bridge, or let a day pass.",
    );
  if (tool === "gather") {
    if (t.item === "reed") {
      state.reed += 2;
      t.item = null;
      message("Gathered 2 reed. A small beginning.");
    } else if (t.item === "rock") {
      state.stone += 2;
      t.item = null;
      message("Gathered 2 stone. What might you build?");
    } else if (t.item === "garden" && state.day > t.planted) {
      state.reed += 2;
      state.glow++;
      t.planted = state.day;
      message("Gathered 2 reed and 1 glow. The roots remain.");
    } else if (t.item === "beacon" && t.planted < state.day) {
      state.glow += t.level;
      t.planted = state.day;
      message(`Collected ${t.level} glow from your beacon.`);
    } else
      return message(
        "Nothing ready to gather here. Explore, plant, or let a day pass.",
      );
  } else if (tool === "plant") {
    if (t.kind === "water" && t.item !== "bridge")
      return message("Open water needs a bridge before a garden.");
    if (t.item && t.item !== "bridge")
      return message("Gather or choose an empty tile first.");
    if (state.reed < 2)
      return message("Planting needs 2 reed. Gather some nearby.");
    state.reed -= 2;
    t.item = "garden";
    t.planted = state.day;
    message("A garden takes root. It will bloom tomorrow.");
  } else if (tool === "bridge") {
    if (t.kind === "land" || t.item)
      return message("Choose an empty stretch of water or tidal flat.");
    if (state.stone < 3)
      return message("A bridge needs 3 stone. Look for pale rocks.");
    state.stone -= 3;
    t.item = "bridge";
    message("A new place to stand. A new place to grow.");
  } else {
    if (t.kind === "water" && t.item !== "bridge")
      return message("Build a bridge before a beacon on water.");
    if (t.item && !["bridge", "beacon"].includes(t.item))
      return message("Choose an empty tile or an existing beacon.");
    if (state.stone < 5 || state.glow < 3)
      return message("A beacon needs 5 stone and 3 glow. Gardens yield glow.");
    state.stone -= 5;
    state.glow -= 3;
    t.item = "beacon";
    t.level++;
    t.planted = state.day;
    message(`Beacon level ${t.level}. Its light grows with your world.`);
  }
  update();
}
function choose(name) {
  tool = name;
  document
    .querySelectorAll("[data-tool]")
    .forEach((b) => b.classList.toggle("active", b.dataset.tool === tool));
  message(
    {
      gather: "Click reeds, stones, a blooming garden, or a beacon.",
      plant: "Click an empty island or bridge to plant a garden.",
      bridge: "Click open water or a tidal flat to build a bridge.",
      beacon: "Click a clear tile to build, or a beacon to upgrade.",
    }[tool],
  );
}
document
  .querySelectorAll("[data-tool]")
  .forEach((b) => (b.onclick = () => choose(b.dataset.tool)));
document.addEventListener("keydown", (e) => {
  if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  const n = Number(e.key);
  if (n >= 1 && n <= 4) choose(["gather", "plant", "bridge", "beacon"][n - 1]);
});
select.onchange = () => {
  selected = Number(select.value);
  describe();
};
$("#useTile").onclick = () => use(selected);
$("#rest").onclick = () => {
  state.day++;
  state.tiles.forEach((t) => {
    if (t.kind === "land" && !t.item && noise(t.x + state.day, t.y) > 0.82)
      t.item = noise(t.x, t.y + state.day) > 0.5 ? "reed" : "rock";
  });
  message("Another quiet day. Gardens bloom; the tide turns.");
  update();
};
$("#reset").onclick = () => {
  if (
    confirm("Start a new garden? This replaces your saved Tideglass world.")
  ) {
    state = fresh();
    update();
    message("A fresh shore. Make it yours.");
  }
};
function point(x, y, z = 0) {
  return {
    x: width * 0.53 + (x - y) * 30 * scale,
    y: height * 0.23 + (x + y) * 15 * scale - z * scale,
  };
}
function poly(points, fill, stroke) {
  ctx.beginPath();
  points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}
function diamond(x, y, z, fill, stroke) {
  poly(
    [
      point(x, y, z),
      point(x + 1, y, z),
      point(x + 1, y + 1, z),
      point(x, y + 1, z),
    ],
    fill,
    stroke,
  );
}
function line(a, b, color, w = 1) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = w * scale;
  ctx.stroke();
}
function circle(x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r * scale, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}
function draw(time) {
  ctx.clearRect(0, 0, width, height);
  const bg = ctx.createRadialGradient(
    width * 0.55,
    height * 0.46,
    0,
    width * 0.55,
    height * 0.5,
    width * 0.7,
  );
  bg.addColorStop(0, state.day % 2 ? "#285657" : "#234c59");
  bg.addColorStop(1, "#0d252e");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  for (let j = 0; j < 50; j++) {
    const x = noise(j, 8) * width,
      y = noise(j, 9) * height;
    line({ x, y }, { x: x + 12 * scale, y }, "#86c4b80d");
  }
  for (const t of state.tiles) {
    const { x, y } = t,
      n = noise(x, y),
      land = t.kind === "land",
      dry = t.kind === "shallow" && state.day % 2,
      z = land ? 12 : dry ? 3 : 0,
      p = point(x + 0.5, y + 0.5, z);
    if (land) {
      poly(
        [
          point(x, y + 1, z),
          point(x + 1, y + 1, z),
          point(x + 1, y + 1, -10),
          point(x, y + 1, -10),
        ],
        "#2e5143",
      );
      poly(
        [
          point(x + 1, y, z),
          point(x + 1, y + 1, z),
          point(x + 1, y + 1, -10),
          point(x + 1, y, -10),
        ],
        "#24443d",
      );
    }
    diamond(
      x,
      y,
      z,
      land
        ? n > 0.6
          ? "#789577"
          : n > 0.3
            ? "#6e8a6c"
            : "#627d60"
        : dry
          ? "#647d70"
          : t.kind === "shallow"
            ? "#467e7e"
            : "#356467",
      land ? "#aec69920" : "#82c5bb12",
    );
    if (!land && !dry) {
      line(point(x + 0.2, y + 0.45), point(x + 0.6, y + 0.45), "#99cebf26");
      if (t.kind === "shallow") circle(p.x, p.y, 2, "#82b1a35c");
    }
    if (land && !t.item) {
      for (let q = 0; q < 3; q++) {
        const a = point(x + noise(q + x, y), y + noise(q + y, x), z);
        line(a, { x: a.x + 2 * scale, y: a.y - 4 * scale }, "#a7bb7c60");
      }
    }
    if (t.item === "bridge") {
      diamond(x + 0.05, y + 0.05, 8, "#b5a27b", "#e2cf9c55");
      for (let k = 1; k < 5; k++)
        line(
          point(x + 0.05, y + k * 0.19, 8),
          point(x + 0.95, y + k * 0.19, 8),
          "#746d55",
          1,
        );
    }
    if (t.item === "rock") {
      poly(
        [
          { x: p.x - 12 * scale, y: p.y + 3 * scale },
          { x: p.x - 9 * scale, y: p.y - 13 * scale },
          { x: p.x + 3 * scale, y: p.y - 19 * scale },
          { x: p.x + 13 * scale, y: p.y - 7 * scale },
          { x: p.x + 10 * scale, y: p.y + 6 * scale },
        ],
        "#a9bbb0",
      );
      poly(
        [
          { x: p.x - 9 * scale, y: p.y - 13 * scale },
          { x: p.x + 3 * scale, y: p.y - 19 * scale },
          { x: p.x + 13 * scale, y: p.y - 7 * scale },
          { x: p.x, y: p.y - 4 * scale },
        ],
        "#d1d8bf",
      );
    }
    if (t.item === "reed" || t.item === "garden") {
      const garden = t.item === "garden",
        bloom = garden && state.day > t.planted;
      for (let k = 0; k < 7; k++) {
        const a = point(
            x + 0.22 + noise(k, x) * 0.56,
            y + 0.22 + noise(k, y) * 0.56,
            z,
          ),
          h = (12 + noise(k, x + y) * 22) * scale,
          sway = Math.sin(time / 1800 + x + k) * 2 * scale;
        line(
          a,
          { x: a.x + sway, y: a.y - h },
          garden ? "#b9c99a" : "#a1bb83",
          1.5,
        );
        circle(
          a.x + sway,
          a.y - h,
          garden ? (bloom ? 4 : 2) : 2,
          bloom ? "#f6dda2" : garden ? "#99c5a2" : "#cecb9a",
        );
        if (bloom) {
          ctx.shadowColor = "#f5d497";
          ctx.shadowBlur = 12 * scale;
          circle(a.x + sway, a.y - h, 2, "#ffebbd");
          ctx.shadowBlur = 0;
        }
      }
    }
    if (t.item === "beacon") {
      const h = (40 + t.level * 8) * scale;
      line(p, { x: p.x, y: p.y - h }, "#c3bc9b", 5);
      ctx.shadowColor = "#ffe8a5";
      ctx.shadowBlur = 25 * scale;
      circle(p.x, p.y - h, 7, "#fff0bb");
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#f0dea24d";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, 26 * scale, 12 * scale, 0, 0, 7);
      ctx.stroke();
    }
    if (selected === y * size + x || hover === y * size + x)
      diamond(
        x,
        y,
        z + 1,
        "#f5e9b514",
        selected === y * size + x ? "#eee3ad" : "#d1e2c67a",
      );
  }
  const home = point(6.5, 7.5, 14);
  circle(home.x, home.y + 3 * scale, 9, "#173e3e55");
  line(home, { x: home.x, y: home.y - 13 * scale }, "#e5d6b4", 6);
  circle(home.x, home.y - 18 * scale, 5, "#f5e7c9");
  circle(home.x + 7 * scale, home.y - 7 * scale, 3, "#eed790");
  ctx.fillStyle = "#8eada0";
  ctx.font = "10px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    "T H E   S T I L L W A T E R   R E A C H",
    width * 0.55,
    height * 0.86,
  );
  requestAnimationFrame(draw);
}
function hit(e) {
  const rect = canvas.getBoundingClientRect(),
    mx = (e.clientX - rect.left - width * 0.53) / (30 * scale),
    my = (e.clientY - rect.top - height * 0.23 + 6 * scale) / (15 * scale),
    x = Math.floor((mx + my) / 2),
    y = Math.floor((my - mx) / 2);
  return x >= 0 && y >= 0 && x < size && y < size ? y * size + x : -1;
}
canvas.onpointermove = (e) => {
  hover = hit(e);
  canvas.style.cursor = hover >= 0 ? "pointer" : "default";
};
canvas.onclick = (e) => {
  const i = hit(e);
  if (i >= 0) use(i);
};
canvas.onpointerleave = () => (hover = -1);
function resize() {
  width = innerWidth;
  height = innerHeight;
  scale = Math.min(width / 1400, height / 900);
  const dpr = devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);
resize();
update();
requestAnimationFrame(draw);
