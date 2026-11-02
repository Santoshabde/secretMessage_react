import { useRef } from "react";

// Tilts its contents in 3D towards the cursor, with a glint of light.
// Only on devices with a mouse, and never when motion is reduced.
const canTilt =
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function Tilt({ children, max = 7, className = "", as: Tag = "div", ...rest }) {
  const ref = useRef(null);

  function move(e) {
    if (!canTilt) return;
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.transition = "transform 0.08s linear";
    el.style.transform = `perspective(900px) rotateX(${((0.5 - py) * max * 2).toFixed(2)}deg) rotateY(${((px - 0.5) * max * 2).toFixed(2)}deg)`;
    el.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
    el.style.setProperty("--glint", "1");
  }

  function leave() {
    if (!canTilt) return;
    const el = ref.current;
    el.style.transition = "transform 0.6s cubic-bezier(.2,.8,.2,1)";
    el.style.transform = "perspective(900px) rotateX(0) rotateY(0)";
    el.style.setProperty("--glint", "0");
  }

  return (
    <Tag ref={ref} className={`tilt ${className}`} onPointerMove={move} onPointerLeave={leave} {...rest}>
      {children}
    </Tag>
  );
}
