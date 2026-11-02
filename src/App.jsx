import { useState } from "react";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Home from "./pages/Home.jsx";
import Atmosphere from "./components/Atmosphere.jsx";

// The logged-in user lives only in this state (memory).
// Refreshing the page clears it, so the user must log in again.
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("login"); // "login" or "register"

  let content;
  if (user) {
    content = <Home user={user} onLogout={() => setUser(null)} />;
  } else if (page === "register") {
    content = <Register onRegistered={setUser} goToLogin={() => setPage("login")} />;
  } else {
    content = <Login onLoggedIn={setUser} goToRegister={() => setPage("register")} />;
  }

  return (
    <>
      <div className="app-content">{content}</div>
      <Atmosphere />
    </>
  );
}
