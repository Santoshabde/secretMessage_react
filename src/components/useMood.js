import { useRef, useState } from "react";

// Lets a page make the eyes react for a moment, then go back to calm.
export default function useMood() {
  const [mood, setMood] = useState("calm");
  const timer = useRef();

  function flash(next, ms = 1300) {
    clearTimeout(timer.current);
    setMood(next);
    timer.current = setTimeout(() => setMood("calm"), ms);
  }

  return [mood, flash, setMood];
}
