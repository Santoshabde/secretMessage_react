import Tilt from "./Tilt.jsx";

// The sheet of paper every form sits on. Its bottom edge is charred,
// and it tilts towards your cursor like a real sheet held in the dark.
export default function PaperCard({ children }) {
  return (
    <Tilt className="paper-wrap" max={5}>
      <div className="paper">{children}</div>
      <div className="ember-glow" aria-hidden="true" />
    </Tilt>
  );
}
