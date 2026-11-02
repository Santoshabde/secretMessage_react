import { useEffect, useState } from "react";
import { cleanUsername, findUser, sendMessage } from "../api.js";
import { burnLabel } from "./Inbox.jsx";

const BURN_TIMES = [5, 10, 30, 60];
const MAX_LENGTH = 500;

// "Send": write a secret, choose how long it lives, seal it, send it.
export default function Compose({ user, onBack }) {
  const [to, setTo] = useState("");
  const [recipient, setRecipient] = useState(undefined); // undefined = not checked, null = nobody
  const [text, setText] = useState("");
  const [burn, setBurn] = useState(10);
  const [phase, setPhase] = useState("writing"); // writing -> sealing -> sent
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // check the username a moment after typing stops
  useEffect(() => {
    setRecipient(undefined);
    if (to.length < 3) return;
    let stale = false;
    const t = setTimeout(async () => {
      const found = await findUser(to);
      if (!stale) setRecipient(found);
    }, 350);
    return () => { stale = true; clearTimeout(t); };
  }, [to]);

  async function handleSend(e) {
    e.preventDefault();
    setError("");
    if (to.length < 3) return setError("Enter the username you're sending to.");
    if (!text.trim()) return setError("Write something before sending.");
    setBusy(true);
    try {
      await sendMessage(user, to, text, burn);
      const quick = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setPhase("sealing");
      setTimeout(() => setPhase("sent"), quick ? 300 : 1700);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function writeAnother() {
    setText("");
    setTo("");
    setPhase("writing");
  }

  if (phase === "sent") {
    return (
      <main className="screen">
        <div className="ashes">
          <h2>Sent</h2>
          <p>
            @{to} can open it once. It burns {burnLabel(burn)} after they do, and then
            nobody can read it again.
          </p>
          <div className="button-row">
            <button className="btn" onClick={writeAnother}>Write another</button>
            <button className="btn btn-ghost" onClick={onBack}>Back to home</button>
          </div>
        </div>
      </main>
    );
  }

  const isSelf = recipient && recipient.username === user.username;

  return (
    <main className="page">
      <button className="link link-light back" onClick={onBack} disabled={phase !== "writing"}>
        Back
      </button>
      <h1>Send a secret</h1>

      <form onSubmit={handleSend} className={`compose ${phase === "sealing" ? "sealing" : ""}`}>
        <div className="compose-sheet">
          <div className="compose-paper">
            <label className="field">
              <span className="field-label">To</span>
              <div className="prefixed">
                <span className="prefix">@</span>
                <input
                  type="text"
                  placeholder="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  autoFocus
                  value={to}
                  disabled={busy}
                  onChange={(e) => setTo(cleanUsername(e.target.value))}
                />
              </div>
              <span className="field-help" aria-live="polite">
                {to.length < 3 && "Their username, without the @."}
                {to.length >= 3 && recipient === undefined && "Checking…"}
                {recipient === null && <span className="nope">No one has this username.</span>}
                {recipient && !isSelf && <span className="yes">Found @{recipient.username}.</span>}
                {isSelf && <span className="yes">That's you. Handy for testing.</span>}
              </span>
            </label>

            <label className="field">
              <span className="field-label">Message</span>
              <textarea
                className="letter private"
                rows={6}
                maxLength={MAX_LENGTH}
                placeholder="Write the thing you only want to say once."
                value={text}
                disabled={busy}
                onChange={(e) => setText(e.target.value)}
              />
              {text.length > MAX_LENGTH - 80 && (
                <span className="field-help">{MAX_LENGTH - text.length} characters left</span>
              )}
            </label>

            <fieldset className="burn-pick">
              <legend className="field-label">Burns after opening</legend>
              <div className="burn-options">
                {BURN_TIMES.map((s) => (
                  <label key={s} className={`burn-option ${burn === s ? "picked" : ""}`}>
                    <input
                      type="radio"
                      name="burn"
                      value={s}
                      checked={burn === s}
                      onChange={() => setBurn(s)}
                    />
                    <span className="burn-fuse" style={{ width: `${18 + (BURN_TIMES.indexOf(s) + 1) * 14}%` }} />
                    <span>{s >= 60 ? "1 min" : `${s} sec`}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <button className="btn" disabled={busy || phase !== "writing"}>
              {busy ? "Sealing…" : "Seal and send"}
            </button>

            {error && <p className="error" role="alert">{error}</p>}
          </div>
        </div>
        <div className="compose-seal" aria-hidden="true" />
      </form>
    </main>
  );
}
