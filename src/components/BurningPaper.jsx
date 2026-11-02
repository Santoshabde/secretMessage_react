import { useEffect, useRef } from "react";

// ------------------------------------------------------------------
// A sheet of paper drawn on a <canvas>, so we can burn it pixel by pixel.
//
// How the burn works:
// 1. Every pixel gets a "burn time" number between 0 and 1.
//    Pixels near the starting point (bottom corner) get small numbers,
//    plus some random noise so the fire edge is wavy, not a straight line.
// 2. During the animation a clock goes from 0 to 1.
//    - pixel's time already passed  -> gone (transparent)
//    - just about to burn           -> glowing ember (yellow/orange)
//    - a little further away        -> blackened char
//    - further still                -> slightly browned (scorched)
//    - far away                     -> untouched paper
// 3. Sparks fly up from the burning edge on a second canvas.
// ------------------------------------------------------------------

const PAD = 32;
const LINE_HEIGHT = 32;
const BODY_FONT = '20px "Special Elite", "Courier New", Courier, monospace';
const FROM_FONT = '700 14px "Karla", "Helvetica Neue", Arial, sans-serif';
const BURN_MS = 3800;
const SPARK_SPACE = 90; // room above the paper for sparks to rise into

export default function BurningPaper({ fromName, text, burning, onBurnt }) {
  const wrapRef = useRef(null);
  const paperRef = useRef(null);
  const sparksRef = useRef(null);
  const sheet = useRef(null); // pixels + burn times, filled after drawing
  const onBurntRef = useRef(onBurnt);
  onBurntRef.current = onBurnt;

  // ---------- draw the paper with the message ----------
  useEffect(() => {
    let cancelled = false;

    async function draw() {
      try {
        await Promise.all([
          document.fonts.load(BODY_FONT),
          document.fonts.load(FROM_FONT),
        ]);
      } catch {
        /* fall back to system fonts */
      }
      if (cancelled || !wrapRef.current) return;

      const canvas = paperRef.current;
      const ctx = canvas.getContext("2d");
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = wrapRef.current.clientWidth;

      ctx.font = BODY_FONT;
      const lines = wrapText(ctx, text, cssW - PAD * 2);
      const cssH = PAD + 18 + 22 + lines.length * LINE_HEIGHT + PAD;

      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // paper
      ctx.fillStyle = "#efebe0";
      ctx.fillRect(0, 0, cssW, cssH);
      // a little grain so it feels like paper
      for (let i = 0; i < (cssW * cssH) / 60; i++) {
        ctx.fillStyle = `rgba(90, 70, 40, ${Math.random() * 0.06})`;
        ctx.fillRect(Math.random() * cssW, Math.random() * cssH, 1.2, 1.2);
      }

      // "From Arjun"
      ctx.fillStyle = "#6b6155";
      ctx.font = FROM_FONT;
      ctx.textBaseline = "top";
      ctx.fillText(`From ${fromName}`, PAD, PAD);

      // the message
      ctx.fillStyle = "#1e1a16";
      ctx.font = BODY_FONT;
      lines.forEach((line, i) => {
        ctx.fillText(line, PAD, PAD + 18 + 22 + i * LINE_HEIGHT);
      });

      const W = canvas.width;
      const H = canvas.height;
      sheet.current = {
        W, H, dpr, cssW, cssH,
        pixels: ctx.getImageData(0, 0, W, H),
        burnTime: makeBurnTimes(W, H, dpr),
      };

      // size the sparks layer: same width, extra room on top
      const sparks = sparksRef.current;
      sparks.width = Math.round(cssW * dpr);
      sparks.height = Math.round((cssH + SPARK_SPACE) * dpr);
      sparks.style.width = cssW + "px";
      sparks.style.height = cssH + SPARK_SPACE + "px";
    }

    draw();
    return () => { cancelled = true; };
  }, [fromName, text]);

  // ---------- burn it ----------
  useEffect(() => {
    if (!burning) return;
    const s = sheet.current;
    if (!s) { onBurntRef.current(); return; }

    // People who turn off animations get a quick fade instead.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      paperRef.current.style.transition = "opacity 0.6s";
      paperRef.current.style.opacity = "0";
      const t = setTimeout(() => onBurntRef.current(), 700);
      return () => clearTimeout(t);
    }

    const ctx = paperRef.current.getContext("2d");
    const sctx = sparksRef.current.getContext("2d");
    const out = ctx.createImageData(s.W, s.H);
    const src = s.pixels.data;
    const dst = out.data;
    const bt = s.burnTime;
    const total = s.W * s.H;
    const sparks = [];
    const start = performance.now();
    let frameId;

    function frame(now) {
      const progress = (now - start) / BURN_MS;
      const clock = -0.04 + progress * 1.12;
      const edge = [];

      for (let i = 0; i < total; i++) {
        const j = i * 4;
        const d = bt[i] - clock; // how far this pixel is from burning

        if (d < 0) { dst[j + 3] = 0; continue; } // burnt away

        let r = src[j], g = src[j + 1], b = src[j + 2];

        if (d < 0.012) {
          // glowing ember: white-yellow at the very edge, deep orange behind it
          const k = d / 0.012;
          r = 255;
          g = 225 - 165 * k;
          b = 130 - 120 * k;
          if (edge.length < 400 && Math.random() < 0.002) edge.push(i);
        } else if (d < 0.05) {
          // char: nearly black, fading back towards brown
          const k = (d - 0.012) / 0.038;
          r = 28 + (120 - 28) * k * k;
          g = 18 + (78 - 18) * k * k;
          b = 12 + (45 - 12) * k * k;
        } else if (d < 0.13) {
          // scorch: paper turning brown before it catches
          const k = 1 - (d - 0.05) / 0.08;
          r = r + (150 - r) * k * 0.6;
          g = g + (100 - g) * k * 0.6;
          b = b + (55 - b) * k * 0.6;
        }

        dst[j] = r; dst[j + 1] = g; dst[j + 2] = b; dst[j + 3] = 255;
      }
      ctx.putImageData(out, 0, 0);

      // new sparks from the burning edge
      if (progress < 1) {
        for (let n = 0; n < 4 && edge.length; n++) {
          const i = edge[Math.floor(Math.random() * edge.length)];
          sparks.push({
            x: (i % s.W) / s.dpr,
            y: Math.floor(i / s.W) / s.dpr + SPARK_SPACE,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -0.8 - Math.random() * 1.6,
            life: 1,
            size: 0.8 + Math.random() * 1.8,
          });
        }
      }

      // move and draw sparks
      sctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
      sctx.clearRect(0, 0, s.cssW, s.cssH + SPARK_SPACE);
      for (let n = sparks.length - 1; n >= 0; n--) {
        const p = sparks[n];
        p.x += p.vx + Math.sin((now + n * 97) / 180) * 0.3;
        p.y += p.vy;
        p.life -= 0.018;
        if (p.life <= 0) { sparks.splice(n, 1); continue; }
        sctx.globalAlpha = p.life;
        sctx.fillStyle = p.life > 0.5 ? "#ffd27a" : "#e2622b";
        sctx.beginPath();
        sctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        sctx.fill();
      }
      sctx.globalAlpha = 1;

      if (progress < 1 || sparks.length) {
        frameId = requestAnimationFrame(frame);
      } else {
        onBurntRef.current();
      }
    }

    frameId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(frameId);
  }, [burning]);

  return (
    <div className="burn-wrap" ref={wrapRef}>
      <canvas
        ref={paperRef}
        className="burn-paper"
        role="img"
        aria-label={`Secret from ${fromName}: ${text}`}
      />
      <canvas ref={sparksRef} className="burn-sparks" aria-hidden="true" />
    </div>
  );
}

// Split text into lines that fit the width.
function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Give every pixel a burn time (0 = burns first, ~1 = burns last).
function makeBurnTimes(W, H, dpr) {
  const noise = [
    makeNoise(W, H, 110 * dpr),
    makeNoise(W, H, 45 * dpr),
    makeNoise(W, H, 16 * dpr),
  ];
  // fire starts somewhere along the bottom edge
  const sx = W * (0.6 + Math.random() * 0.35);
  const sy = H * 1.02;
  const maxDist = Math.hypot(Math.max(sx, W - sx), sy);

  const times = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dist = Math.hypot(x - sx, y - sy) / maxDist;
      const n = noise[0](x, y) * 0.55 + noise[1](x, y) * 0.3 + noise[2](x, y) * 0.15;
      times[y * W + x] = dist * 0.72 + n * 0.28;
    }
  }
  // stretch the values to exactly 0..1 so the burn uses the full duration
  let min = Infinity, max = -Infinity;
  for (const t of times) { if (t < min) min = t; if (t > max) max = t; }
  for (let i = 0; i < times.length; i++) times[i] = (times[i] - min) / (max - min);
  return times;
}

// Smooth random values, so the fire edge wobbles naturally.
function makeNoise(W, H, cellSize) {
  const gw = Math.ceil(W / cellSize) + 2;
  const gh = Math.ceil(H / cellSize) + 2;
  const grid = new Float32Array(gw * gh).map(() => Math.random());
  return (x, y) => {
    const fx = x / cellSize, fy = y / cellSize;
    const xi = Math.floor(fx), yi = Math.floor(fy);
    const u = smooth(fx - xi), v = smooth(fy - yi);
    const a = grid[yi * gw + xi], b = grid[yi * gw + xi + 1];
    const c = grid[(yi + 1) * gw + xi], d = grid[(yi + 1) * gw + xi + 1];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}
