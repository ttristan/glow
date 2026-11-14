const canvas = document.querySelector("#world");
const ctx = canvas.getContext("2d");
const $ = (id) => document.getElementById(id);
const SIZE = 23;
const SAVE = "glow-tidelight-v1";
const hash = (x, y) => {
  const n = Math.sin(x * 127.1 + y * 311.7 + 18) * 43758.5453;
  return n - Math.floor(n);
};
const base = (x, y) => {
  const d = Math.hypot((x - 11) / 11, (y - 11) / 10);
  return d > 0.97 + 0.1 * Math.sin(x * 1.1)
    ? "water"
    : d > 0.79
      ? "shallow"
      : "land";
};
const key = (x, y) => `${x},${y}`;
const initial = () => ({
  x: 11,
  y: 11,
  glow: 3,
  stone: 2,
  seeds: 3,
  lens: 1,
  time: 0,
  planted: 0,
  lanterns: 0,
  tiles: {},
});
let state = initial();
try {
  const saved = JSON.parse(localStorage.getItem(SAVE));
  if (
    saved &&
    Number.isInteger(saved.x) &&
    Number.isInteger(saved.y) &&
    saved.x >= 0 &&
    saved.x < SIZE &&
    saved.y >= 0 &&
    saved.y < SIZE &&
    [
      saved.glow,
      saved.stone,
      saved.seeds,
      saved.time,
      saved.planted,
      saved.lanterns,
    ].every((n) => Number.isFinite(n) && n >= 0) &&
    [1, 2, 3].includes(saved.lens) &&
    saved.tiles &&
    typeof saved.tiles === "object" &&
    Object.values(saved.tiles).every(
      (t) =>
        t &&
        ["empty", "grove", "rock", "lantern"].includes(t.kind) &&
        Number.isFinite(t.ready),
    )
  )
    state = saved;
} catch {
  /* Storage is optional. */
}
let paused = false,
  hover = null,
  width = 0,
  height = 0,
  unit = 20,
  last = 0,
  saveClock = 0;
function tile(x, y) {
  const id = key(x, y);
  if (state.tiles[id]) return state.tiles[id];
  const r = hash(x, y);
  return {
    kind:
      base(x, y) === "land" && !(x === 11 && y === 11)
        ? r > 0.72
          ? "grove"
          : r < 0.13
            ? "rock"
            : "empty"
        : "empty",
    ready: 0,
  };
}
function high() {
  return Math.floor(state.time / 45) % 2 === 1;
}
function walkable(x, y) {
  return (
    x >= 0 &&
    x < SIZE &&
    y >= 0 &&
    y < SIZE &&
    base(x, y) !== "water" &&
    !(base(x, y) === "shallow" && high())
  );
}
function save() {
  try {
    localStorage.setItem(SAVE, JSON.stringify(state));
  } catch {
    $("note").textContent =
      "Browser storage is unavailable. This visit will not be saved.";
  }
}
function message(text) {
  $("toast").textContent = text;
}
function ui() {
  for (const resource of ["glow", "stone", "seeds"])
    $(resource).textContent = state[resource];
  $("phase").textContent = high() ? "HIGH TIDE" : "LOW TIDE";
  $("coordinates").textContent =
    `${String(state.x).padStart(2, "0")}° E / ${String(state.y).padStart(2, "0")}° N`;
  $("stats").textContent =
    `${state.planted} groves planted · ${state.lanterns} lanterns lit`;
  $("lens-title").textContent =
    `Gathering lens · ${["", "I", "II", "III"][state.lens]}`;
  $("upgrade").disabled = state.lens === 3;
  $("upgrade").innerHTML =
    state.lens === 3
      ? "Lens fully grown"
      : `Upgrade lens <span>${state.lens * 6} glow + ${state.lens * 4} stone</span>`;
}
function act(action) {
  if (paused) {
    message("The island is resting. Resume to continue.");
    return;
  }
  const t = tile(state.x, state.y),
    id = key(state.x, state.y);
  if (action === "gather") {
    let glow = 0,
      stone = 0,
      seeds = 0;
    for (let x = 0; x < SIZE; x++)
      for (let y = 0; y < SIZE; y++) {
        if (Math.hypot(x - state.x, y - state.y) > state.lens + 1) continue;
        const near = tile(x, y);
        if (near.ready > state.time) continue;
        if (near.kind === "grove") {
          glow += state.lens;
          seeds++;
          state.tiles[key(x, y)] = { kind: "grove", ready: state.time + 32 };
        }
        if (near.kind === "rock") {
          stone += 2;
          state.tiles[key(x, y)] = { kind: "rock", ready: state.time + 48 };
        }
      }
    state.glow += glow;
    state.stone += stone;
    state.seeds += seeds;
    message(
      glow || stone
        ? `Gathered ${glow} glow, ${stone} stone and ${seeds} seeds.`
        : "Wander closer to a glowing grove or a pale stone.",
    );
  }
  if (action === "plant" || action === "build") {
    if (base(state.x, state.y) !== "land" || t.kind !== "empty") {
      message("Find an empty grass tile to make your mark.");
      return;
    }
    if (action === "plant") {
      if (state.seeds < 1) {
        message("Gather a grove to find more seeds.");
        return;
      }
      state.seeds--;
      state.planted++;
      state.tiles[id] = { kind: "grove", ready: state.time + 25 };
      message("A small beginning. Your grove will glow in 25 seconds.");
    } else {
      if (state.glow < 3 || state.stone < 2) {
        message("A lantern needs 3 glow and 2 stone.");
        return;
      }
      state.glow -= 3;
      state.stone -= 2;
      state.lanterns++;
      state.tiles[id] = { kind: "lantern", ready: 0 };
      message("A light to return to. Nearby groves now grow twice as fast.");
      $("note").textContent =
        "Lanterns nurture every grove within three tiles. A quiet kind of automation.";
    }
  }
  if (action === "upgrade") {
    const level = state.lens;
    if (level === 3) return;
    if (state.glow < level * 6 || state.stone < level * 4) {
      message(`The next lens needs ${level * 6} glow and ${level * 4} stone.`);
      return;
    }
    state.glow -= level * 6;
    state.stone -= level * 4;
    state.lens++;
    message("Your lens reaches farther and gathers more glow.");
  }
  ui();
  save();
}
function move(x, y) {
  if (paused) return;
  if (walkable(x, y)) {
    state.x = x;
    state.y = y;
    ui();
    save();
  } else message("The tide covers this path. There is always another way.");
}
for (const a of ["gather", "plant", "build", "upgrade"])
  $(a).onclick = () => act(a);
$("pause").onclick = () => {
  paused = !paused;
  $("pause").textContent = paused ? "▶" : "Ⅱ";
  $("pause").title = paused ? "Resume world" : "Pause world";
  message(
    paused
      ? "Take your time. The island is resting."
      : "The island is breathing again.",
  );
};
$("reset").onclick = () => {
  if (
    confirm(
      "Start a fresh island? This replaces the island saved on this device.",
    )
  ) {
    state = initial();
    paused = false;
    $("pause").textContent = "Ⅱ";
    ui();
    save();
    message("A new shore. The same sense of possibility.");
  }
};
window.addEventListener("keydown", (e) => {
  if (e.target instanceof HTMLButtonElement) return;
  const d = {
    w: [0, -1],
    ArrowUp: [0, -1],
    s: [0, 1],
    ArrowDown: [0, 1],
    a: [-1, 0],
    ArrowLeft: [-1, 0],
    d: [1, 0],
    ArrowRight: [1, 0],
  }[e.key];
  if (d) {
    e.preventDefault();
    move(state.x + d[0], state.y + d[1]);
  }
  const action = { e: "gather", 1: "plant", 2: "build" }[e.key];
  if (action && !e.repeat) act(action);
});
function project(x, y, z = 0) {
  return [
    width / 2 + (x - y) * unit,
    height * 0.47 + (x + y - 22) * unit * 0.48 - z,
  ];
}
function pick(e) {
  const r = canvas.getBoundingClientRect(),
    dx = (e.clientX - r.left - width / 2) / unit,
    dy = (e.clientY - r.top - height * 0.47) / (unit * 0.48);
  return {
    x: Math.round((dx + dy + 22) / 2),
    y: Math.round((dy - dx + 22) / 2),
  };
}
canvas.addEventListener("pointermove", (e) => {
  hover = pick(e);
});
canvas.addEventListener("pointerleave", () => (hover = null));
canvas.addEventListener("click", (e) => {
  canvas.focus();
  const p = pick(e);
  if (!walkable(p.x, p.y)) {
    message("Deep water and high tides ask us to take another path.");
    return;
  }
  const queue = [[state.x, state.y]],
    seen = new Set([key(state.x, state.y)]);
  let reachable = false;
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    if (x === p.x && y === p.y) {
      reachable = true;
      break;
    }
    for (const [dx, dy] of [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ]) {
      const nx = x + dx,
        ny = y + dy,
        k = key(nx, ny);
      if (walkable(nx, ny) && !seen.has(k)) {
        seen.add(k);
        queue.push([nx, ny]);
      }
    }
  }
  if (reachable) move(p.x, p.y);
  else message("That shore is disconnected at this tide.");
});
function polygon(points, fill, stroke) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }
}
function ellipse(x, y, rx, ry, color) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}
function halo(x, y, r, color) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "transparent");
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function drawPlayer(px, py) {
  halo(px, py - 8, 30, "#cfe5b025");
  ellipse(px, py + 1, 11, 5, "#091d2966");
  ctx.strokeStyle = "#e6edc7";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(px, py + 1, 13, 6, 0, 0, Math.PI * 2);
  ctx.stroke();
  polygon(
    [
      [px - 6, py - 11],
      [px - 8, py - 1],
      [px + 7, py - 1],
      [px + 5, py - 11],
    ],
    "#ddccb0",
  );
  ellipse(px, py - 17, 5, 6, "#e5e5cc");
  ctx.fillStyle = "#32554f";
  ctx.fillRect(px - 5, py - 13, 10, 3);
  ctx.fillStyle = "#e4bd7c";
  ctx.fillRect(px + 10, py - 13, 3, 5);
  halo(px + 11, py - 10, 15, "#f2c97638");
}
function draw(now) {
  const delta = Math.min((now - last) / 1000, 0.1);
  last = now;
  if (!paused) {
    const wasHigh = high();
    state.time += delta;
    const lanterns = Object.entries(state.tiles)
      .filter(([, t]) => t.kind === "lantern")
      .map(([k]) => k.split(",").map(Number));
    for (const [k, t] of Object.entries(state.tiles))
      if (t.kind === "grove" && t.ready > state.time) {
        const [x, y] = k.split(",").map(Number);
        if (lanterns.some(([lx, ly]) => Math.hypot(x - lx, y - ly) <= 3))
          t.ready -= delta;
      }
    if (wasHigh !== high()) {
      if (!walkable(state.x, state.y)) {
        state.x = 11;
        state.y = 11;
        message("The rising water carries you gently back to the meadow.");
      } else
        message(
          high()
            ? "The tide is rising. The meadow stays welcoming."
            : "The tide recedes. New paths wait along the shore.",
        );
      ui();
    }
    saveClock += delta;
    if (saveClock > 5) {
      save();
      saveClock = 0;
    }
  }
  const rect = canvas.getBoundingClientRect();
  if (rect.width !== width || rect.height !== height) {
    width = rect.width;
    height = rect.height;
    const dpr = Math.min(devicePixelRatio, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    unit = Math.min(width / 49, height / 27);
  }
  ctx.clearRect(0, 0, width, height);
  for (let i = 0; i < 55; i++) {
    const x = hash(i, 91) * width,
      y = hash(i, 43) * height;
    ctx.strokeStyle = "#89bec00e";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 12 + Math.sin(state.time + i) * 4, y);
    ctx.stroke();
  }
  for (let sum = 0; sum < SIZE * 2; sum++)
    for (let x = 0; x < SIZE; x++) {
      const y = sum - x;
      if (y < 0 || y >= SIZE) continue;
      const terrain = base(x, y);
      if (terrain === "water") continue;
      const [px, py] = project(x, y),
        u = unit,
        h = u * 0.48,
        n = hash(x, y),
        wet = terrain === "shallow";
      const lift = wet ? 0 : 5;
      if (!wet)
        polygon(
          [
            [px - u, py],
            [px, py + h],
            [px + u, py],
            [px + u, py + 7],
            [px, py + h + 7],
            [px - u, py + 7],
          ],
          "#25413b",
        );
      const color = wet
        ? high()
          ? "#2b5960"
          : "#547470"
        : `hsl(${143 + n * 17} ${17 + n * 8}% ${25 + n * 8}%)`;
      polygon(
        [
          [px, py - h - lift],
          [px + u, py - lift],
          [px, py + h - lift],
          [px - u, py - lift],
        ],
        color,
        "#9dd6b00b",
      );
      if (wet) {
        if (n > 0.65) {
          ctx.strokeStyle = "#95c8bd25";
          ctx.beginPath();
          ctx.moveTo(px - 5, py);
          ctx.lineTo(px + 7, py);
          ctx.stroke();
        }
        if (state.x === x && state.y === y) drawPlayer(px, py);
        continue;
      }
      const t = tile(x, y),
        ready = t.ready <= state.time;
      if (t.kind === "grove") {
        const growth = ready ? 1 : 0.4;
        ellipse(px, py, 10, 4, "#142e3c55");
        for (let j = 0; j < 3; j++) {
          const gx = px + (j - 1) * 6,
            gy = py - 5 - (j % 2) * 5;
          ctx.strokeStyle = "#6f9f84";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(gx, py);
          ctx.lineTo(gx, gy - 14 * growth);
          ctx.stroke();
          if (ready) halo(gx, gy - 12 * growth, 17, "#a9efd32b");
          polygon(
            [
              [gx, gy - 23 * growth],
              [gx + 7 * growth, gy - 12 * growth],
              [gx, gy - 5 * growth],
              [gx - 6 * growth, gy - 12 * growth],
            ],
            ready ? "#a4dbc0" : "#689f85",
          );
          polygon(
            [
              [gx, gy - 23 * growth],
              [gx + 7 * growth, gy - 12 * growth],
              [gx, gy - 5 * growth],
            ],
            ready ? "#d9efbe" : "#83b095",
          );
        }
      }
      if (t.kind === "rock") {
        ellipse(px, py, 11, 4, "#18313666");
        polygon(
          [
            [px - 11, py - 3],
            [px - 5, py - 15],
            [px + 6, py - 17],
            [px + 12, py - 5],
            [px + 3, py + 1],
          ],
          ready ? "#94a6a0" : "#536e6a",
        );
        polygon(
          [
            [px - 5, py - 15],
            [px + 6, py - 17],
            [px + 12, py - 5],
            [px, py - 6],
          ],
          ready ? "#b6c0ad" : "#70877c",
        );
      }
      if (t.kind === "lantern") {
        halo(px, py - 15, 65, "#efd59b27");
        ellipse(px, py, 14, 6, "#ddd9a424");
        ctx.fillStyle = "#758a71";
        ctx.fillRect(px - 2, py - 25, 4, 24);
        polygon(
          [
            [px - 8, py - 25],
            [px, py - 34],
            [px + 8, py - 25],
            [px, py - 16],
          ],
          "#f3dea0",
        );
        halo(px, py - 25, 22, "#ffde9a55");
      }
      if (t.kind === "empty" && n > 0.4) {
        ctx.strokeStyle = "#9fbb802d";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - 2, py - 5);
        ctx.moveTo(px + 2, py);
        ctx.lineTo(px + 4, py - 7);
        ctx.stroke();
      }
      if (hover?.x === x && hover?.y === y)
        polygon(
          [
            [px, py - h - lift],
            [px + u, py - lift],
            [px, py + h - lift],
            [px - u, py - lift],
          ],
          "#dfedba13",
          "#e0edbd88",
        );
      if (state.x === x && state.y === y) drawPlayer(px, py);
    }
  for (let i = 0; i < 24; i++) {
    const [x, y] = project(
      5 + hash(i, 5) * 13,
      5 + hash(i, 9) * 13,
      25 + Math.sin(state.time * 0.6 + i) * 8,
    );
    ellipse(
      x + Math.sin(state.time * 0.3 + i) * 12,
      y,
      1,
      1,
      `rgba(220,237,173,${0.2 + Math.sin(state.time + i) ** 2 * 0.5})`,
    );
  }
  requestAnimationFrame(draw);
}
ui();
requestAnimationFrame(draw);
