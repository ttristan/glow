/** Play ordered {ms, kind, data} events without executing their contents. */
export function createReplayPlayer(events, { reset, apply, update }) {
  const duration = Math.max(1, events.at(-1)?.ms ?? 0);
  let index = 0, elapsed = 0, playing = false, speed = 1, previous = performance.now();
  let frame;
  function seek(target) {
    if (!Number.isFinite(target)) throw new Error('Invalid replay position');
    target = Math.max(0, Math.min(duration, target));
    if (target < elapsed) { reset(); index = 0; }
    while (index < events.length && events[index].ms <= target) apply(events[index++]);
    elapsed = target;
    previous = performance.now();
    update({ elapsed, duration, playing, speed });
  }
  function tick(now) {
    if (!playing) return;
    const target = elapsed + (now - previous) * speed;
    seek(target);
    if (elapsed >= duration) { playing = false; update({ elapsed, duration, playing, speed }); return; }
    frame = requestAnimationFrame(tick);
  }
  return {
    seek,
    play() { if (playing) return; if (elapsed >= duration) seek(0); playing = true; previous = performance.now(); update({ elapsed, duration, playing, speed }); frame = requestAnimationFrame(tick); },
    pause() { if (!playing) return; playing = false; cancelAnimationFrame(frame); update({ elapsed, duration, playing, speed }); },
    setSpeed(value) { if (!Number.isFinite(value) || value <= 0) throw new Error('Invalid replay speed'); speed = value; previous = performance.now(); update({ elapsed, duration, playing, speed }); },
    destroy() { playing = false; cancelAnimationFrame(frame); },
  };
}
