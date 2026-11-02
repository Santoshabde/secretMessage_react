// Phone number field with a fixed +91 prefix. Keeps only digits, max 10.
export default function PhoneInput({ value, onChange, disabled, autoFocus = true }) {
  return (
    <label className="field">
      <span className="field-label">Phone number</span>
      <div className="prefixed">
        <span className="prefix">+91</span>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="98765 43210"
          value={value}
          disabled={disabled}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
        />
      </div>
    </label>
  );
}
