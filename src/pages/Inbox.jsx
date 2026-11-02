import { useEffect, useState } from "react";
import { getInbox, openMessage } from "../api.js";
import ReadMessage from "./ReadMessage.jsx";
import Tilt from "../components/Tilt.jsx";

// "Receive": the list of sealed secrets waiting for you.
export default function Inbox({ user, onBack }) {
  const [inbox, setInbox] = useState(null); // null while loading
  const [reading, setReading] = useState(null); // the opened message
  const [openingId, setOpeningId] = useState(null);
  const [error, setError] = useState("");

  async function loadInbox() {
    setInbox(null);
    setInbox(await getInbox(user.phone));
  }

  useEffect(() => {
    loadInbox();
  }, []);

  async function handleOpen(id) {
    setError("");
    setOpeningId(id);
    try {
      setReading(await openMessage(user.phone, id));
    } catch (err) {
      setError(err.message);
      loadInbox();
    } finally {
      setOpeningId(null);
    }
  }

  if (reading) {
    return <ReadMessage message={reading} onDone={() => { setReading(null); loadInbox(); }} />;
  }

  return (
    <main className="page">
      <button className="link link-light back" onClick={onBack}>Back</button>
      <h1>Your secrets</h1>

      {inbox === null && <p className="muted">Loading…</p>}

      {inbox && inbox.length === 0 && (
        <div className="empty">
          <p>No secrets waiting.</p>
          <p className="muted">When someone sends you one, it will show up here.</p>
        </div>
      )}

      {inbox && inbox.length > 0 && (
        <ul className="secret-list">
          {inbox.map((m) => (
            <Tilt as="li" key={m.id} className="secret" max={4}>
              <div className="seal" aria-hidden="true" />
              <div className="secret-info">
                <p className="secret-from">From {m.fromName}</p>
                <p className="muted">
                  Arrived {timeAgo(m.sentAt)}. Burns {burnLabel(m.burnAfterSeconds)} after you open it.
                </p>
              </div>
              <button className="btn" onClick={() => handleOpen(m.id)} disabled={openingId !== null}>
                {openingId === m.id ? "Opening…" : "Open"}
              </button>
            </Tilt>
          ))}
        </ul>
      )}

      {error && <p className="error" role="alert">{error}</p>}
    </main>
  );
}

export function burnLabel(seconds) {
  if (seconds >= 60) return seconds === 60 ? "1 minute" : `${seconds / 60} minutes`;
  return `${seconds} seconds`;
}

function timeAgo(time) {
  const minutes = Math.round((Date.now() - time) / 60000);
  if (minutes < 1) return "just now";
  if (minutes === 1) return "1 minute ago";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
}
