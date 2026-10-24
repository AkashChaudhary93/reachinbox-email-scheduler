import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api, User } from "../api";
import { MailIcon, SendIcon, LogoutIcon, PlusIcon } from "./Icons";

export default function Shell({ user, children }: { user: User; children: ReactNode }) {
  const location = useLocation();
  const nav = useNavigate();

  const logout = async () => {
    await api.post("/auth/logout");
    window.location.href = "/login";
  };

  const initials = (user.displayName || user.email || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/" className="brand">
          <span className="brand-mark"><MailIcon size={20} /></span>
          <span className="brand-text">Reach<span>Inbox</span></span>
        </Link>

        <nav className="nav">
          <Link className={`nav-item ${location.pathname === "/" ? "active" : ""}`} to="/">
            <MailIcon size={18} /> <span>Outbox</span>
          </Link>
          <Link className={`nav-item ${location.pathname === "/compose" ? "active" : ""}`} to="/compose">
            <SendIcon size={18} /> <span>Compose</span>
          </Link>
        </nav>

        <div className="sidebar-cta">
          <p>Ready to send?</p>
          <button className="btn btn-primary btn-block" onClick={() => nav("/compose")}>
            <PlusIcon size={16} /> New email
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="user-chip">
            {user.photo ? <img src={user.photo} alt="" className="avatar" /> : <div className="avatar fallback">{initials}</div>}
            <div className="user-meta">
              <strong>{user.displayName || "Signed in"}</strong>
              <span>{user.email}</span>
            </div>
          </div>
          <button className="icon-btn" title="Sign out" onClick={logout}><LogoutIcon size={18} /></button>
        </div>
      </aside>

      <main className="main">{children}</main>

      <nav className="mobile-nav">
        <Link className={location.pathname === "/" ? "active" : ""} to="/"><MailIcon size={20} /><span>Outbox</span></Link>
        <Link className={location.pathname === "/compose" ? "active" : ""} to="/compose"><SendIcon size={20} /><span>Compose</span></Link>
        <button onClick={logout}><LogoutIcon size={20} /><span>Exit</span></button>
      </nav>
    </div>
  );
}
