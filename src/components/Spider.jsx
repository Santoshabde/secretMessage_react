import { useEffect, useRef } from "react";

// ------------------------------------------------------------------
// A spider hanging on a thread from the top of the screen.
//
// - It swings like a pendulum.
// - If you leave the mouse still, it slowly lowers itself towards you.
// - Move the mouse near it and it flinches away and scurries back up.
// ------------------------------------------------------------------

export default function Spider({ anchor = 0.86 }) {
  const svgRef = useRef(null);
  const threadRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: -999, y: -999, t: -Infinity };
    const s = { len: 90, goal: 90, angle: 0.15, speed: 0, climbing: false };
    let frameId;
    let last = performance.now();

    const onPointer = (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.t = performance.now();
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });

    function tick(now) {
      const dt = Math.min(2, (now - last) / 16.7);
      last = now;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const ax = vw * anchor;
      const maxDrop = vw < 640 ? vh * 0.22 : vh * 0.5;

      let x = ax + Math.sin(s.angle) * s.len;
      let y = Math.cos(s.angle) * s.len;

      const dist = Math.hypot(pointer.x - x, pointer.y - y);
      const still = now - pointer.t > 2500;

      if (!calm) {
        if (dist < 150 && !still) {
          // flinch away and climb up fast
          s.speed += Math.sign(x - pointer.x || 1) * 0.0035 * dt;
          s.goal = 40;
        } else if (still) {
          // creep down while nobody is watching
          s.goal = Math.min(maxDrop, s.goal + 0.5 * dt);
        }
        // pendulum
        const g = 0.9 / Math.max(40, s.len);
        s.speed += -g * Math.sin(s.angle) * dt;
        s.speed *= Math.pow(0.992, dt);
        s.angle += s.speed * dt;
        // a faint breeze keeps it moving
        s.angle += Math.sin(now / 1700) * 0.0006 * dt;
      }

      const before = s.len;
      if (s.len > s.goal) s.len = Math.max(s.goal, s.len - 7 * dt);
      else s.len = Math.min(s.goal, s.len + 0.7 * dt);
      s.climbing = Math.abs(s.len - before) > 0.05;

      x = ax + Math.sin(s.angle) * s.len;
      y = Math.cos(s.angle) * s.len;

      threadRef.current.setAttribute("x1", ax.toFixed(1));
      threadRef.current.setAttribute("y1", "-4");
      threadRef.current.setAttribute("x2", x.toFixed(1));
      threadRef.current.setAttribute("y2", y.toFixed(1));
      bodyRef.current.setAttribute(
        "transform",
        `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(-s.angle * 57).toFixed(1)}) scale(1.5)`
      );
      svgRef.current.dataset.moving = s.climbing ? "true" : "false";

      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [anchor]);

  // legs: [hip x, hip y, knee x, knee y, foot x, foot y], mirrored for the other side
  const legs = [
    [4, 4, 20, -8, 30, 6],
    [5, 8, 24, 2, 34, 18],
    [5, 12, 22, 14, 30, 30],
    [4, 15, 16, 24, 20, 40],
  ];

  return (
    <svg className="spider" ref={svgRef} aria-hidden="true" data-moving="false">
      <line ref={threadRef} className="spider-thread" />
      <g ref={bodyRef}>
        <g transform="translate(0 6)">
          {legs.map((l, i) =>
            [1, -1].map((side) => (
              <path
                key={`${i}${side}`}
                className={`spider-leg leg-${i}`}
                style={{ transformOrigin: `${l[0] * side}px ${l[1]}px` }}
                d={`M${l[0] * side},${l[1]} Q${l[2] * side},${l[3] - 6} ${l[2] * side},${l[3]} L${l[4] * side},${l[5]}`}
              />
            ))
          )}
          {/* head and body */}
          <ellipse cx="0" cy="2" rx="6" ry="5.5" fill="#0e0a0a" />
          <ellipse cx="0" cy="17" rx="11" ry="13" fill="url(#spider-body)" />
          <path d="M-3,12 L3,12 L0,17 L3,22 L-3,22 L0,17 Z" fill="#b3201a" />
          <circle cx="-2.2" cy="0" r="1.1" fill="#ff4a2a" />
          <circle cx="2.2" cy="0" r="1.1" fill="#ff4a2a" />
        </g>
      </g>
      <defs>
        <radialGradient id="spider-body" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#3a2e2c" />
          <stop offset="0.5" stopColor="#140e0d" />
          <stop offset="1" stopColor="#050303" />
        </radialGradient>
      </defs>
    </svg>
  );
}
