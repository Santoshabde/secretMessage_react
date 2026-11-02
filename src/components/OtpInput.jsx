import { useRef } from "react";

// Six separate boxes for the 6-digit code.
// Typing moves to the next box, Backspace moves back, paste fills all.
export default function OtpInput({ value, onChange, disabled }) {
  const boxes = useRef([]);
  const digits = value.padEnd(6, " ").split("").slice(0, 6);

  function setDigit(index, digit) {
    const next = digits.slice();
    next[index] = digit || " ";
    onChange(next.join("").trimEnd());
  }

  function handleChange(index, e) {
    const digit = e.target.value.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    setDigit(index, digit);
    if (index < 5) boxes.current[index + 1]?.focus();
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[index].trim()) {
        setDigit(index, "");
      } else if (index > 0) {
        setDigit(index - 1, "");
        boxes.current[index - 1]?.focus();
      }
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    boxes.current[Math.min(pasted.length, 5)]?.focus();
  }

  return (
    <div className="otp" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (boxes.current[i] = el)}
          className="otp-box"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1}`}
          value={d.trim()}
          disabled={disabled}
          autoFocus={i === 0}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
        />
      ))}
    </div>
  );
}
