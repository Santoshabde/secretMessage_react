import { useState } from "react";
import AuthLayout from "../components/AuthLayout.jsx";
import PhoneInput from "../components/PhoneInput.jsx";
import CodeStep from "../components/CodeStep.jsx";
import useMood from "../components/useMood.js";
import { cleanUsername, requestRegisterCode, verifyRegisterCode } from "../api.js";

export default function Register({ onRegistered, goToLogin }) {
  const [step, setStep] = useState("details"); // "details" then "code"
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mood, flash, setMood] = useMood();

  function fail(message) {
    setError(message);
    flash("alarm");
  }

  async function sendCode(e) {
    e?.preventDefault();
    setError("");
    if (username.length < 3) return fail("Pick a username with at least 3 characters.");
    if (phone.length !== 10) return fail("Enter your 10-digit phone number.");
    setBusy(true);
    try {
      const res = await requestRegisterCode(username, phone);
      setDevCode(res.devCode);
      setCode("");
      setStep("code");
    } catch (err) {
      fail(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function checkCode(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await verifyRegisterCode(phone, code);
      document.activeElement?.blur();
      setMood("happy");
      setTimeout(() => onRegistered(user), 900);
    } catch (err) {
      fail(err.message);
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      mood={mood}
      footer={
        <>
          Already have an account?{" "}
          <button className="link link-light" onClick={goToLogin}>Log in</button>
        </>
      }
    >
      <h2>Create account</h2>
      {step === "details" ? (
        <form onSubmit={sendCode} className="form">
          <label className="field">
            <span className="field-label">Username</span>
            <div className="prefixed">
              <span className="prefix">@</span>
              <input
                type="text"
                placeholder="santosh"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                value={username}
                disabled={busy}
                autoFocus
                onChange={(e) => setUsername(cleanUsername(e.target.value))}
              />
            </div>
            <span className="field-help">People send you secrets using this name.</span>
          </label>
          <PhoneInput value={phone} onChange={setPhone} disabled={busy} autoFocus={false} />
          <button className="btn" disabled={busy}>{busy ? "Sending…" : "Send code"}</button>
        </form>
      ) : (
        <CodeStep
          phone={phone}
          code={code}
          setCode={setCode}
          devCode={devCode}
          busy={busy}
          submitLabel="Create account"
          onSubmit={checkCode}
          onResend={sendCode}
          onChangeNumber={() => { setStep("details"); setError(""); }}
        />
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </AuthLayout>
  );
}
