import OtpInput from "./OtpInput.jsx";

// The "enter the 6-digit code" step, shared by Login and Register.
export default function CodeStep({
  phone, code, setCode, devCode, busy, submitLabel,
  onSubmit, onResend, onChangeNumber,
}) {
  return (
    <form onSubmit={onSubmit} className="form">
      <p className="hint">
        Enter the 6-digit code sent to <strong>+91 {phone}</strong>
      </p>

      <OtpInput value={code} onChange={setCode} disabled={busy} />

      {devCode && (
        <p className="dev-note">
          Test mode: no real SMS yet. Your code is <strong>{devCode}</strong>
        </p>
      )}

      <button className="btn" disabled={busy || code.length !== 6}>
        {busy ? "Checking…" : submitLabel}
      </button>

      <div className="row-links">
        <button type="button" className="link" onClick={onChangeNumber} disabled={busy}>
          Change number
        </button>
        <button type="button" className="link" onClick={onResend} disabled={busy}>
          Resend code
        </button>
      </div>
    </form>
  );
}
