import { useEffect, useMemo, useRef } from "react";

// ------------------------------------------------------------------
// The eyes in the dark.
//
// Each eye is an SVG. The visible part of the eyeball is cut out by an
// almond-shaped "opening" whose top and bottom curves we redraw every
// frame. Closing the eye = flattening those curves, so the lids always
// hug the eyeball (no gaps in the corners).
//
// Behaviour:
// - follow the mouse / finger, lean towards it in 3D
// - read along when you type
// - shut tight while you type the code, write a secret, or read one
// - mood="alarm": lids fly open, pupils turn into slits, a shake
// - mood="happy": a slow, pleased, slightly sinister squint
// - blink now and then; if you leave them alone they mutter "Still here."
// ------------------------------------------------------------------

const CY = 60;
const INNER = { x: 16, y: 66 }; // tear-duct corner, a little lower
const OUTER = { x: 204, y: 55 };

const topCtrl = (o) => CY - o * 64;
const botCtrl = (o) => CY + 6 + o * 44;

function topCurve(o) {
  const c = topCtrl(o);
  return `M${INNER.x},${INNER.y} C70,${c.toFixed(2)} 150,${(c - 4).toFixed(2)} ${OUTER.x},${OUTER.y}`;
}
function bottomCurve(o) {
  const c = botCtrl(o);
  return `M${OUTER.x},${OUTER.y} C150,${c.toFixed(2)} 70,${(c + 4).toFixed(2)} ${INNER.x},${INNER.y}`;
}
function opening(t, b) {
  const ct = topCtrl(t);
  const cb = botCtrl(b);
  return (
    `M${INNER.x},${INNER.y} C70,${ct.toFixed(2)} 150,${(ct - 4).toFixed(2)} ${OUTER.x},${OUTER.y} ` +
    `C150,${cb.toFixed(2)} 70,${(cb + 4).toFixed(2)} ${INNER.x},${INNER.y} Z`
  );
}
function crease(t) {
  const c = topCtrl(t) - 20 - t * 6;
  return `M${INNER.x + 8},${INNER.y - 12} C70,${c.toFixed(2)} 150,${(c - 4).toFixed(2)} ${OUTER.x - 6},${OUTER.y - 14}`;
}
function bag(b) {
  const c = botCtrl(b) + 16;
  return `M${OUTER.x - 14},${OUTER.y + 14} C150,${c.toFixed(2)} 70,${(c + 4).toFixed(2)} ${INNER.x + 14},${INNER.y + 10}`;
}

// little red veins creeping in from the corners
function makeVeins(seed) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const out = [];
  for (const side of [0, 1]) {
    for (let k = 0; k < 4; k++) {
      const dir = side ? -1 : 1;
      let x = side ? OUTER.x - 6 : INNER.x + 6;
      let y = (side ? OUTER.y : INNER.y) + (rnd() - 0.5) * 34;
      let d = `M${x.toFixed(1)},${y.toFixed(1)}`;
      const steps = 3 + Math.floor(rnd() * 3);
      for (let i = 0; i < steps; i++) {
        const nx = x + dir * (8 + rnd() * 13);
        const ny = y + (rnd() - 0.5) * 14;
        d += ` Q${((x + nx) / 2 + (rnd() - 0.5) * 6).toFixed(1)},${((y + ny) / 2 + (rnd() - 0.5) * 6).toFixed(1)} ${nx.toFixed(1)},${ny.toFixed(1)}`;
        if (rnd() < 0.4) {
          out.push({
            d: `M${nx.toFixed(1)},${ny.toFixed(1)} q${(dir * (4 + rnd() * 6)).toFixed(1)},${((rnd() - 0.5) * 10).toFixed(1)} ${(dir * (8 + rnd() * 8)).toFixed(1)},${((rnd() - 0.5) * 14).toFixed(1)}`,
            w: 0.5,
          });
        }
        x = nx;
        y = ny;
      }
      out.push({ d, w: 1 - k * 0.15 });
    }
  }
  return out;
}

const FIBERS = Array.from({ length: 30 }, (_, i) => {
  const a = (i / 30) * Math.PI * 2;
  const r1 = 11 + (i % 3);
  const r2 = 26 + (i % 2) * 2;
  return `M${(Math.cos(a) * r1).toFixed(2)},${(Math.sin(a) * r1).toFixed(2)} L${(Math.cos(a) * r2).toFixed(2)},${(Math.sin(a) * r2).toFixed(2)}`;
});

let eyeCount = 0;

function Eye({ index, refs }) {
  const uid = useRef("eye" + ++eyeCount).current;
  const veins = useMemo(() => makeVeins(7 + index * 131), [index]);
  const set = (key) => (el) => {
    refs.current[index] = refs.current[index] || {};
    refs.current[index][key] = el;
  };

  return (
    <svg
      className={`eye ${index === 0 ? "eye-mirror" : ""}`}
      viewBox="-10 -14 240 150"
      ref={set("svg")}
    >
      <defs>
        <clipPath id={`${uid}-open`}>
          <path ref={set("clip")} d={opening(0.8, 0.6)} />
        </clipPath>
        <radialGradient id={`${uid}-sclera`} cx="52%" cy="46%" r="62%">
          <stop offset="0" stopColor="#f1e8d2" />
          <stop offset="0.55" stopColor="#dccdab" />
          <stop offset="0.85" stopColor="#a68f66" />
          <stop offset="1" stopColor="#5d4a2e" />
        </radialGradient>
        <radialGradient id={`${uid}-iris`}>
          <stop offset="0" stopColor="#1c0c04" />
          <stop offset="0.3" stopColor="#4a1d08" />
          <stop offset="0.36" stopColor="#c9581d" />
          <stop offset="0.62" stopColor="#e88a36" />
          <stop offset="0.82" stopColor="#c99a3a" />
          <stop offset="0.94" stopColor="#5e240b" />
          <stop offset="1" stopColor="#140803" />
        </radialGradient>
        <radialGradient id={`${uid}-socket`}>
          <stop offset="0.35" stopColor="#030308" stopOpacity="0.95" />
          <stop offset="0.7" stopColor="#05060d" stopOpacity="0.6" />
          <stop offset="1" stopColor="#05060d" stopOpacity="0" />
        </radialGradient>
        <filter id={`${uid}-soft`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>

      {/* sunken socket */}
      <ellipse cx="110" cy="62" rx="122" ry="76" fill={`url(#${uid}-socket)`} />
      <path ref={set("crease")} className="eye-crease" d={crease(0.8)} />
      <path ref={set("bag")} className="eye-bag" d={bag(0.6)} />

      <g clipPath={`url(#${uid}-open)`}>
        <rect x="0" y="-10" width="220" height="140" fill={`url(#${uid}-sclera)`} />
        <g ref={set("veins")} className="eye-veins">
          {veins.map((v, i) => (
            <path key={i} d={v.d} strokeWidth={v.w} />
          ))}
        </g>
        <g ref={set("iris")} transform="translate(110 62)">
          <circle r="30" fill={`url(#${uid}-iris)`} />
          <g className="eye-fibers">
            {FIBERS.map((d, i) => <path key={i} d={d} />)}
          </g>
          <circle r="29.5" fill="none" stroke="#120702" strokeWidth="3.5" />
          <ellipse ref={set("pupil")} rx="10" ry="10" fill="#040201" />
          <ellipse cx="-10" cy="-11" rx="4.5" ry="3.5" fill="#fff8e8" opacity="0.85" />
          <circle cx="9" cy="9" r="1.6" fill="#fff8e8" opacity="0.45" />
        </g>
        {/* shadow the lid casts onto the eyeball: makes it round */}
        <path
          ref={set("shade")}
          d={topCurve(0.8)}
          fill="none"
          stroke="#120a04"
          strokeOpacity="0.75"
          strokeWidth="18"
          filter={`url(#${uid}-soft)`}
        />
      </g>

      <path ref={set("rim")} className="eye-rim" d={bottomCurve(0.6)} />
      <path ref={set("lash")} className="eye-lash" d={topCurve(0.8)} />
    </svg>
  );
}

const TARGETS = {
  calm: { t: 0.74, b: 0.6, p: 10, slit: 1 },
  near: { t: 0.95, b: 0.66, p: 13, slit: 1 },
  alarm: { t: 1.18, b: 0.98, p: 3, slit: 5.2 },
  happy: { t: 0.5, b: 0.14, p: 11, slit: 1 },
  shut: { t: 0, b: 0, p: 10, slit: 1 },
};

export default function Watcher({ mood = "calm", size = "large" }) {
  const rootRef = useRef(null);
  const faceRef = useRef(null);
  const whisperRef = useRef(null);
  const eyes = useRef([]);
  const moodRef = useRef(mood);
  moodRef.current = mood;

  useEffect(() => {
    const root = rootRef.current;
    const face = faceRef.current;
    const calmMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const pointer = { x: window.innerWidth / 2, y: window.innerHeight * 0.7, t: -Infinity };
    let lastTyped = -Infinity;
    let lastActivity = performance.now();
    let blinking = false;
    let frameId, blinkTimer;
    let lastWhisper = null;
    const state = [0, 1].map(() => ({ t: 0.74, b: 0.6, p: 10, slit: 1, x: 0, y: 0 }));
    const lean = { x: 0, y: 0 };

    const onPointer = (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.t = lastActivity = performance.now();
    };
    const onType = () => { lastTyped = lastActivity = performance.now(); };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });
    window.addEventListener("input", onType, true);

    function whereToLook(now) {
      const el = document.activeElement;
      const field = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
      if (field && (now - lastTyped < 1800 || now - pointer.t > 1200)) {
        const r = el.getBoundingClientRect();
        const len = (el.value || "").length;
        return { x: r.left + Math.min(r.width - 8, 16 + len * 10), y: r.top + r.height / 2 };
      }
      if (now - pointer.t < 5000) return pointer;
      const s = now / 1000;
      const f = root.getBoundingClientRect();
      return {
        x: f.left + f.width / 2 + Math.sin(s * 0.5) * 320,
        y: f.top + f.height / 2 + 160 + Math.sin(s * 1.2) * 100,
      };
    }

    function tick(now) {
      const el = document.activeElement;
      const codeShut = el?.classList?.contains("otp-box");
      const privateShut =
        el?.classList?.contains("private") || !!document.querySelector("[data-eyes-shut]");
      const m = moodRef.current;
      const look = whereToLook(now);

      let near = Infinity;
      eyes.current.forEach((e) => {
        if (!e?.svg) return;
        const r = e.svg.getBoundingClientRect();
        near = Math.min(near, Math.hypot(pointer.x - (r.left + r.width / 2), pointer.y - (r.top + r.height / 2)));
      });
      const recent = now - pointer.t < 3000;

      let key = "calm";
      if (m === "alarm") key = "alarm";
      else if (codeShut || privateShut || blinking) key = "shut";
      else if (m === "happy") key = "happy";
      else if (recent && near < 200) key = "near";
      const goal = TARGETS[key];
      const lidSpeed = blinking ? 0.5 : key === "alarm" ? 0.35 : 0.13;

      eyes.current.forEach((e, i) => {
        if (!e?.svg) return;
        const s = state[i];
        s.t += (goal.t - s.t) * lidSpeed;
        s.b += (goal.b - s.b) * lidSpeed;
        s.p += (goal.p - s.p) * 0.15;
        s.slit += (goal.slit - s.slit) * 0.2;

        const r = e.svg.getBoundingClientRect();
        const scale = 240 / r.width;
        let dx = (look.x - (r.left + r.width / 2)) * scale;
        const dy = (look.y - (r.top + r.height / 2)) * scale;
        if (i === 0) dx = -dx; // this eye is drawn mirrored
        const dist = Math.hypot(dx, dy) || 1;
        const reach = Math.min(1, dist / 260);
        const gx = (dx / dist) * 52 * reach;
        const gy = (dy / dist) * (8 + 14 * Math.min(1, s.t)) * reach;
        s.x += (gx - s.x) * 0.2;
        s.y += (gy - s.y) * 0.2;

        e.clip.setAttribute("d", opening(s.t, s.b));
        e.lash.setAttribute("d", topCurve(s.t));
        e.shade.setAttribute("d", topCurve(s.t));
        e.rim.setAttribute("d", bottomCurve(s.b));
        e.crease.setAttribute("d", crease(s.t));
        e.bag.setAttribute("d", bag(s.b));
        e.iris.setAttribute("transform", `translate(${(110 + s.x).toFixed(2)} ${(62 + s.y).toFixed(2)})`);
        e.pupil.setAttribute("rx", (s.p / s.slit).toFixed(2));
        e.pupil.setAttribute("ry", (s.p * (s.slit > 1.5 ? 1.5 : 1)).toFixed(2));
        e.veins.style.opacity = key === "alarm" ? 0.95 : 0.45;
      });

      // the face turns towards what it's looking at, in 3D
      if (!calmMotion) {
        const f = root.getBoundingClientRect();
        const gx = Math.max(-1, Math.min(1, (look.x - (f.left + f.width / 2)) / 600));
        const gy = Math.max(-1, Math.min(1, (look.y - (f.top + f.height / 2)) / 500));
        lean.x += (gx - lean.x) * 0.06;
        lean.y += (gy - lean.y) * 0.06;
        face.style.transform =
          `perspective(700px) rotateY(${(lean.x * 16).toFixed(2)}deg) rotateX(${(-lean.y * 12).toFixed(2)}deg) ` +
          `translate(${(lean.x * 8).toFixed(1)}px, ${(lean.y * 5).toFixed(1)}px)`;
      }

      // what they mutter
      let words = "";
      if (m === "alarm") words = "Wrong.";
      else if (m === "happy") words = "Come in.";
      else if (codeShut) words = "I'm not looking…";
      else if (privateShut) words = "I won't read it.";
      else if (now - lastActivity > 9000) words = "Still here.";
      if (words !== lastWhisper && whisperRef.current) {
        lastWhisper = words;
        whisperRef.current.textContent = words;
        whisperRef.current.dataset.on = words ? "true" : "false";
      }
      root.dataset.state = key;

      frameId = requestAnimationFrame(tick);
    }

    function scheduleBlink() {
      blinkTimer = setTimeout(() => {
        blinking = true;
        setTimeout(() => {
          blinking = false;
          if (Math.random() < 0.25) {
            setTimeout(() => {
              blinking = true;
              setTimeout(() => (blinking = false), 120);
            }, 180);
          }
        }, 140);
        scheduleBlink();
      }, 2600 + Math.random() * 4800);
    }

    frameId = requestAnimationFrame(tick);
    scheduleBlink();
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(blinkTimer);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("input", onType, true);
    };
  }, []);

  return (
    <div className={`watcher watcher-${size}`} ref={rootRef} data-mood={mood}>
      <div className="watcher-face" ref={faceRef} aria-hidden="true">
        <Eye index={0} refs={eyes} />
        <Eye index={1} refs={eyes} />
      </div>
      <p className="watcher-whisper" ref={whisperRef} data-on="false" aria-live="polite" />
    </div>
  );
}
