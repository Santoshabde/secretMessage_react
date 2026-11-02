import { useEffect, useRef } from "react";
import Spider from "./Spider.jsx";

// ------------------------------------------------------------------
// The haunted room every page sits in:
// - drifting fog low on the floor
// - cobwebs in the top corners
// - a spider on a thread
// - darkness everywhere except a flickering candle-light that follows
//   your cursor (or the field you're typing in)
// ------------------------------------------------------------------

function Cobweb({ className }) {
  const spokes = [0, 14, 29, 45, 60, 75, 90].map((deg, i) => {
    const a = (deg * Math.PI) / 180;
    const len = 230 - (i % 2) * 30;
    return { a, len };
  });
  const rings = [28, 52, 80, 112, 150, 192];
  const point = (a, r) => [Math.cos(a) * r, Math.sin(a) * r];

  let d = "";
  spokes.forEach(({ a, len }) => {
    const [x, y] = point(a, len);
    d += `M0,0 L${x.toFixed(1)},${y.toFixed(1)} `;
  });
  rings.forEach((r) => {
    for (let i = 0; i < spokes.length - 1; i++) {
      const a1 = spokes[i].a, a2 = spokes[i + 1].a;
      if (r > spokes[i].len || r > spokes[i + 1].len) continue;
      const [x1, y1] = point(a1, r);
      const [x2, y2] = point(a2, r);
      const [cx, cy] = point((a1 + a2) / 2, r * 0.82); // sag towards the corner
      d += `M${x1.toFixed(1)},${y1.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} `;
    }
  });

  return (
    <svg className={`cobweb ${className}`} viewBox="0 0 240 240" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default function Atmosphere() {
  const darkRef = useRef(null);

  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const light = { x: window.innerWidth / 2, y: window.innerHeight * 0.45 };
    const goal = { ...light };
    let pointerT = -Infinity;
    let frameId;

    const onPointer = (e) => {
      goal.x = e.clientX;
      goal.y = e.clientY;
      pointerT = performance.now();
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });

    function tick(now) {
      const el = document.activeElement;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
      if (typing && now - pointerT > 1500) {
        const r = el.getBoundingClientRect();
        goal.x = r.left + r.width / 2;
        goal.y = r.top + r.height / 2;
      }
      light.x += (goal.x - light.x) * 0.12;
      light.y += (goal.y - light.y) * 0.12;

      // candle flicker: a few overlapping wobbles
      const flicker = calm
        ? 0
        : Math.sin(now / 90) * 6 + Math.sin(now / 237) * 10 + Math.sin(now / 53) * 3;
      const inner = 170 + flicker;
      const outer = 560 + flicker * 2;

      darkRef.current.style.background =
        `radial-gradient(circle at ${light.x.toFixed(0)}px ${light.y.toFixed(0)}px, ` +
        `rgba(255,160,80,0.06) 0, transparent ${inner.toFixed(0)}px, rgba(2,3,8,0.58) ${outer.toFixed(0)}px)`;

      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, []);

  return (
    <>
      <div className="fog" aria-hidden="true">
        <span /><span /><span />
      </div>
      <Cobweb className="cobweb-left" />
      <Cobweb className="cobweb-right" />
      <Spider />
      <div className="darkness" ref={darkRef} aria-hidden="true" />
    </>
  );
}
