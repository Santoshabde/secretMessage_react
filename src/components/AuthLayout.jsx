import Watcher from "./Watcher.jsx";
import PaperCard from "./PaperCard.jsx";

// Shared frame for Login and Register: the eyes, the name, the paper form.
export default function AuthLayout({ mood, children, footer }) {
  return (
    <main className="screen auth">
      <Watcher mood={mood} />
      <header className="brand">
        <h1>SecretMessage</h1>
        <p>Messages that burn after reading.</p>
      </header>
      <PaperCard>{children}</PaperCard>
      <p className="switch">{footer}</p>
    </main>
  );
}
