import { useEffect, useState } from "react";
import { getInbox } from "../api.js";
import Compose from "./Compose.jsx";
import Inbox from "./Inbox.jsx";
import Watcher from "../components/Watcher.jsx";
import Tilt from "../components/Tilt.jsx";

// After login: choose to send a secret or read the ones waiting for you.
export default function Home({ user, onLogout }) {
  const [view, setView] = useState("choose"); // choose | send | receive
  const [waiting, setWaiting] = useState(null);

  useEffect(() => {
    if (view === "choose") getInbox(user.phone).then((list) => setWaiting(list.length));
  }, [view]);

  return (
    <div className="home">
      <header className="topbar">
        <div className="topbar-left">
          <button className="topbar-brand" onClick={() => setView("choose")}>SecretMessage</button>
          <Watcher size="small" />
        </div>
        <div className="topbar-user">
          <span>@{user.username}</span>
          <button className="link link-light" onClick={onLogout}>Log out</button>
        </div>
      </header>

      {view === "send" && <Compose user={user} onBack={() => setView("choose")} />}
      {view === "receive" && <Inbox user={user} onBack={() => setView("choose")} />}

      {view === "choose" && (
        <main className="page choose">
          <h1>Hi @{user.username}</h1>
          <p className="muted">Write a secret for someone, or open one meant for you.</p>

          <div className="doors">
            <Tilt as="button" className="door" max={9} onClick={() => setView("send")}>
              <span className="door-art desk" aria-hidden="true">
                <span className="desk-sheet under" />
                <span className="desk-sheet">
                  <i /><i /><i /><i />
                </span>
              </span>
              <span className="door-title">Send a secret</span>
              <span className="door-sub">Pick a username, write it, choose when it burns.</span>
            </Tilt>

            <Tilt as="button" className="door" max={9} onClick={() => setView("receive")}>
              <span className="door-art envelope3d" aria-hidden="true">
                <span className="env-back" />
                <span className="env-letter"><i /><i /></span>
                <span className="env-front" />
                <span className="env-flap">
                  <span className="seal env-seal">{waiting > 0 ? waiting : ""}</span>
                </span>
              </span>
              <span className="door-title">Read secrets</span>
              <span className="door-sub">
                {waiting === null && "Checking…"}
                {waiting === 0 && "Nothing waiting right now."}
                {waiting === 1 && "1 secret is waiting."}
                {waiting > 1 && `${waiting} secrets are waiting.`}
              </span>
            </Tilt>
          </div>
        </main>
      )}
    </div>
  );
}
