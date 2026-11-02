import { useState } from "react";
import AuthLayout from "../components/AuthLayout.jsx";
import PhoneInput from "../components/PhoneInput.jsx";
import CodeStep from "../components/CodeStep.jsx";
import useMood from "../components/useMood.js";
import { requestLoginCode, verifyLoginCode } from "../api.js";

export default function Login({ onLoggedIn, goToRegister }) {
  const [step, setStep] = useState("phone"); // "phone" then "code"
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
    if (phone.length !== 10) return fail("Enter your 10-digit phone number.");
    setBusy(true);
    try {
      const res = await requestLoginCode(phone);
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
      const user = await verifyLoginCode(phone, code);
      document.activeElement?.blur(); // eyes open again for the happy squint
      setMood("happy");
      setTimeout(() => onLoggedIn(user), 900);
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
          New here?{" "}
          <button className="link link-light" onClick={goToRegister}>Create an account</button>
        </>
      }
    >
      <h2>Log in</h2>
      {step === "phone" ? (
        <form onSubmit={sendCode} className="form">
          <PhoneInput value={phone} onChange={setPhone} disabled={busy} />
          <button className="btn" disabled={busy}>{busy ? "Sending…" : "Send code"}</button>
        </form>
      ) : (
        <CodeStep
          phone={phone}
          code={code}
          setCode={setCode}
          devCode={devCode}
          busy={busy}
          submitLabel="Log in"
          onSubmit={checkCode}
          onResend={sendCode}
          onChangeNumber={() => { setStep("phone"); setError(""); }}
        />
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </AuthLayout>
  );
}
