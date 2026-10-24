import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { api, User } from "./api";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Compose from "./pages/Compose";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((r) => setUser(r.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="boot">
        <div className="boot-mark"><span className="spinner" /></div>
        <p>Warming the scheduler…</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
      <Route path="/compose" element={user ? <Compose user={user} /> : <Navigate to="/login" />} />
    </Routes>
  );
}
