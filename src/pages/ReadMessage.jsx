import { useEffect, useState } from "react";
import BurningPaper from "../components/BurningPaper.jsx";

// Shows one opened secret, counts down, then burns it.
// By the time this page shows, the message is already deleted
// from the server, so leaving or refreshing can't bring it back.
export default function ReadMessage({ message, onDone }) {
  const total = message.burnAfterSeconds;
  const [secondsLeft, setSecondsLeft] = useState(total);
  const [phase, setPhase] = useState("reading"); // reading -> burning -> burnt

  useEffect(() => {
    if (phase !== "reading") return;
    if (secondsLeft <= 0) {
      setPhase("burning");
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, secondsLeft]);

  return (
    <main className="screen read-screen" data-eyes-shut={phase !== "burnt" ? "" : undefined}>
      {phase !== "burnt" ? (
        <>
          <div className="countdown" aria-live="polite">
            <span>
              {phase === "reading" ? (
                <>
                  Burns in <strong>{secondsLeft}</strong>{" "}
                  {secondsLeft === 1 ? "second" : "seconds"}
                </>
              ) : (
                "Burning…"
              )}
            </span>
            <div className="fuse">
              <div
                className="fuse-left"
                style={{ width: phase === "reading" ? `${(secondsLeft / total) * 100}%` : "0%" }}
              />
            </div>
          </div>

          <BurningPaper
            fromName={message.fromName}
            text={message.text}
            burning={phase === "burning"}
            onBurnt={() => setPhase("burnt")}
          />

          {/* stays in place while burning (just hidden) so nothing jumps */}
          <button
            className="btn"
            onClick={() => setPhase("burning")}
            style={{ visibility: phase === "reading" ? "visible" : "hidden" }}
          >
            Burn now
          </button>
        </>
      ) : (
        <div className="ashes">
          <h2>Burned</h2>
          <p>
            The secret from {message.fromName} is gone. It can't be opened again,
            by you or anyone else.
          </p>
          <button className="btn" onClick={onDone}>Back to inbox</button>
        </div>
      )}
    </main>
  );
}
