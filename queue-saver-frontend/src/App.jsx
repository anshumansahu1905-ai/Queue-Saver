
import { io } from "socket.io-client";
import { useState, useEffect, useRef, useCallback } from "react";

const API = "https://queue-saver.onrender.com/api";

const api = {
  post: async (path, body, token) => {
    const res = await fetch(API + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
    return res.json();
  },
  get: async (path, token) => {
    const res = await fetch(API + path, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    return res.json();
  },
  patch: async (path, body, token) => {
    const res = await fetch(API + path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    return res.json();
  },
  delete: async (path, token) => {
    const res = await fetch(API + path, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },
};

function QRDisplay({ url, size = 160 }) {
 
  const cells = 21;
  const cell = size / cells;
  const hash = url.split("").reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
  const grid = Array.from({ length: cells * cells }, (_, i) => {
    const row = Math.floor(i / cells);
    const col = i % cells;
    const inFinder =
      (row < 7 && col < 7) || (row < 7 && col >= cells - 7) || (row >= cells - 7 && col < 7);
    if (inFinder) {
      const r = row % 7, c = col % 7;
      return r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
    }
    return ((hash + i * 7 + row * 3 + col * 11) & 1) === 1;
  });

  return (
    <div style={{ background: "#fff", padding: 12, borderRadius: 8, display: "inline-block" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {grid.map((on, i) =>
          on ? (
            <rect
              key={i}
              x={(i % cells) * cell}
              y={Math.floor(i / cells) * cell}
              width={cell}
              height={cell}
              fill="#1a1a2e"
            />
          ) : null
        )}
      </svg>
      <div style={{ fontSize: 9, color: "#888", textAlign: "center", marginTop: 4, maxWidth: size, wordBreak: "break-all" }}>
        {url}
      </div>
    </div>
  );
}

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0d0f1a;
      --surface: #161929;
      --surface2: #1e2235;
      --border: rgba(255,255,255,0.07);
      --accent: #f59e0b;
      --accent2: #fb923c;
      --accent-dim: rgba(245,158,11,0.12);
      --text: #f1f5f9;
      --muted: #64748b;
      --success: #10b981;
      --danger: #ef4444;
      --info: #38bdf8;
      --radius: 14px;
      --radius-sm: 8px;
      --shadow: 0 4px 24px rgba(0,0,0,0.4);
    }

    html, body, #root { height: 100%; }

    body {
      font-family: 'DM Sans', sans-serif;
      background: var(--bg);
      color: var(--text);
      -webkit-font-smoothing: antialiased;
      min-height: 100vh;
    }

    h1, h2, h3, h4 { font-family: 'Syne', sans-serif; }

    input, textarea, select {
      font-family: 'DM Sans', sans-serif;
      background: var(--surface2);
      border: 1.5px solid var(--border);
      color: var(--text);
      border-radius: var(--radius-sm);
      padding: 12px 16px;
      font-size: 15px;
      width: 100%;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus, select:focus { border-color: var(--accent); }
    input::placeholder { color: var(--muted); }

    button {
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 15px;
      font-weight: 600;
      padding: 12px 24px;
      transition: all 0.18s;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      color: #0d0f1a;
      width: 100%;
    }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(245,158,11,0.35); }
    .btn-primary:active { transform: translateY(0); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    .btn-ghost {
      background: transparent;
      color: var(--muted);
      border: 1.5px solid var(--border);
    }
    .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }

    .btn-danger {
      background: rgba(239,68,68,0.15);
      color: var(--danger);
      border: 1px solid rgba(239,68,68,0.3);
      padding: 8px 16px;
      font-size: 13px;
    }
    .btn-danger:hover { background: rgba(239,68,68,0.25); }

    .btn-success {
      background: rgba(16,185,129,0.15);
      color: var(--success);
      border: 1px solid rgba(16,185,129,0.3);
      padding: 8px 16px;
      font-size: 13px;
    }
    .btn-success:hover { background: rgba(16,185,129,0.25); }

    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 24px;
    }

    .tag {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 3px 10px; border-radius: 99px; font-size: 12px; font-weight: 600;
    }
    .tag-waiting { background: rgba(245,158,11,0.15); color: var(--accent); }
    .tag-in-progress { background: rgba(56,189,248,0.15); color: var(--info); }
    .tag-completed { background: rgba(16,185,129,0.15); color: var(--success); }
    .tag-cancelled { background: rgba(239,68,68,0.15); color: var(--danger); }

    .label { font-size: 13px; font-weight: 500; color: var(--muted); margin-bottom: 6px; display: block; }

    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes ping {
      0% { transform: scale(1); opacity: 1; }
      75%, 100% { transform: scale(2); opacity: 0; }
    }

    .fade-in { animation: fadeSlideUp 0.4s ease both; }
    .loading-dot { animation: pulse 1.2s ease infinite; }

    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--surface2); border-radius: 99px; }
  `}</style>
);

function Toast({ toasts, remove }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => remove(t.id)}
          style={{
            background: t.type === "error" ? "#1a0a0a" : t.type === "success" ? "#0a1a12" : "#111827",
            border: `1px solid ${t.type === "error" ? "rgba(239,68,68,0.4)" : t.type === "success" ? "rgba(16,185,129,0.4)" : "rgba(56,189,248,0.4)"}`,
            color: t.type === "error" ? "#fca5a5" : t.type === "success" ? "#6ee7b7" : "#7dd3fc",
            padding: "12px 18px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            animation: "fadeSlideUp 0.3s ease",
            maxWidth: 320,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  const remove = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  return { toasts, add, remove };
}

function Spinner({ size = 20 }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size,
      border: `2px solid rgba(245,158,11,0.2)`,
      borderTopColor: "var(--accent)",
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
    }} />
  );
}

function Navbar({ user, onLogout, onNavigate, currentPage }) {
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(13,15,26,0.9)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--border)",
      padding: "0 24px",
      height: 60,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
        onClick={() => onNavigate("home")}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "linear-gradient(135deg, var(--accent), var(--accent2))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16,
        }}>⏱</div>
        <span style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 18, letterSpacing: "-0.5px" }}>
          Queue<span style={{ color: "var(--accent)" }}>Saver</span>
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {user ? (
          <>
            <span style={{
              fontSize: 13, color: "var(--muted)",
              background: "var(--surface)", padding: "5px 12px",
              borderRadius: 99, border: "1px solid var(--border)",
            }}>
              {user.role === "admin" ? "🏥" : "👤"} {user.name}
            </span>
            {user.role === "admin" && (
              <button className="btn-ghost" style={{ padding: "7px 14px", fontSize: 13 }}
                onClick={() => onNavigate("dashboard")}>
                Dashboard
              </button>
            )}
            <button className="btn-ghost" style={{ padding: "7px 14px", fontSize: 13 }} onClick={onLogout}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <button className="btn-ghost" style={{ padding: "7px 14px", fontSize: 13 }}
              onClick={() => onNavigate("login")}>Login</button>
            <button className="btn-primary" style={{ padding: "7px 18px", fontSize: 13, width: "auto" }}
              onClick={() => onNavigate("register")}>Sign up</button>
          </>
        )}
      </div>
    </nav>
  );
}

function HomePage({ onNavigate, user, toast }) {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/queue/shops").then((d) => {
      setShops(d.shops || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
      {/* Hero */}
      <div className="fade-in" style={{ textAlign: "center", marginBottom: 64 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "var(--accent-dim)", border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: 99, padding: "6px 16px", marginBottom: 24, fontSize: 13, color: "var(--accent)",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
          No more waiting in lines
        </div>
        <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-2px", marginBottom: 20 }}>
          Skip the queue,<br />
          <span style={{ background: "linear-gradient(135deg, var(--accent), var(--accent2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            save your time
          </span>
        </h1>
        <p style={{ fontSize: 18, color: "var(--muted)", maxWidth: 520, margin: "0 auto 32px", lineHeight: 1.6 }}>
          Join queues online at clinics, salons & shops. Get live updates. Show up only when it's your turn.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {!user && (
            <button className="btn-primary" style={{ width: "auto", padding: "14px 28px", fontSize: 16 }}
              onClick={() => onNavigate("register")}>
              Get started free →
            </button>
          )}
          {user?.role === "admin" && (
            <button className="btn-primary" style={{ width: "auto", padding: "14px 28px", fontSize: 16 }}
              onClick={() => onNavigate("dashboard")}>
              Open Dashboard →
            </button>
          )}
          <button className="btn-ghost" style={{ padding: "14px 28px", fontSize: 16 }}
            onClick={() => document.getElementById("shops").scrollIntoView({ behavior: "smooth" })}>
            Browse shops ↓
          </button>
        </div>
      </div>

      {/* Features */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 64 }}>
        {[
          { icon: "📱", title: "QR Scan to Join", desc: "Scan, enter your name, done. No app needed." },
          { icon: "📍", title: "Live Position", desc: "See exactly where you are in the queue, live." },
          { icon: "🔔", title: "Turn Alerts", desc: "Get notified when your turn is approaching." },
          { icon: "🖥️", title: "Admin Dashboard", desc: "Manage queues, track patients, generate QR." },
        ].map((f, i) => (
          <div key={i} className="card fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
            <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{f.title}</div>
            <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Shops */}
      <div id="shops">
        <h2 style={{ fontFamily: "Syne", fontSize: 24, fontWeight: 700, marginBottom: 20 }}>
          Active Shops & Clinics
        </h2>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}><Spinner size={28} /></div>
        ) : shops.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏥</div>
            No shops registered yet.{" "}
            <span style={{ color: "var(--accent)", cursor: "pointer" }} onClick={() => onNavigate("register")}>
              Register yours →
            </span>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {shops.map((s) => (
              <div key={s._id} className="card" style={{ cursor: "pointer", transition: "border-color 0.2s", borderColor: "var(--border)" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                onClick={() => onNavigate("join", { shopId: s._id, shopName: s.name })}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: "linear-gradient(135deg, var(--accent-dim), rgba(251,146,60,0.1))",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                  }}>🏥</div>
                  <div>
                    <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 16 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{s.email}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>Join Queue →</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AuthPage({ mode, onAuth, onNavigate, toast }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [loading, setLoading] = useState(false);
  const isLogin = mode === "login";

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const path = isLogin ? "/auth/user/login" : "/auth/user/register";
      const body = isLogin ? { email: form.email, password: form.password } : form;
      const data = await api.post(path, body);
      if (data.token) {
        onAuth(data.token, data.user);
        toast(isLogin ? "Welcome back! 👋" : "Account created! 🎉", "success");
      } else {
        toast(data.message || "Something went wrong", "error");
      }
    } catch {
      toast("Network error", "error");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "calc(100vh - 60px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card fade-in" style={{ width: "100%", maxWidth: 420, padding: 36 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>{isLogin ? "👋" : "✨"}</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
            {isLogin ? "Welcome back" : "Create account"}
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            {isLogin ? "Sign in to your QueueSaver account" : "Start managing queues for free"}
          </p>
        </div>

        <form onSubmit={handle} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {!isLogin && (
            <>
              <div>
                <label className="label">Full Name</label>
                <input placeholder="Dr. Arjun Sharma" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Role</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  <option value="admin">🏥 Shop / Clinic Owner (Admin)</option>
                  <option value="user">👤 Patient / Customer</option>
                </select>
              </div>
            </>
          )}
          <div>
            <label className="label">Email</label>
            <input type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
          </div>
          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? <Spinner size={18} /> : isLogin ? "Sign in" : "Create account"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--muted)" }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <span style={{ color: "var(--accent)", cursor: "pointer", fontWeight: 600 }}
            onClick={() => onNavigate(isLogin ? "register" : "login")}>
            {isLogin ? "Sign up" : "Sign in"}
          </span>
        </p>
      </div>
    </div>
  );
}

function JoinPage({ shopId, shopName, toast, onNavigate }) {
  const [form, setForm] = useState({ patientName: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [position, setPosition] = useState(null);
  const [liveStatus, setLiveStatus] = useState("waiting");
  const [acknowledged, setAcknowledged] = useState(false);

  const pollRef = useRef(null);
  const socketRef = useRef(null);

const connectSocket = (entryId) => {
  const socket = io("http://localhost:3000");
  socketRef.current = socket;

  socket.on("connect", () => {
    socket.emit("join_entry", entryId);
  });

  socket.on("status_updated", ({ status }) => {
    setLiveStatus(status);
    setPosition(prev => ({ ...prev, status }));

    if (status === "in-progress") {
      if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300]);
      toast("🔔 It's your turn! Please come in.", "success");
    } else if (status === "completed") {
      toast("✅ Your visit is complete. Thank you!", "success");
    } else if (status === "cancelled") {
      toast("❌ Your token was cancelled.", "error");
    }
  });
};

  const startPolling = (entryId) => {
    const poll = async () => {
      try {
        const data = await api.get(`/queue/position/${entryId}`);
        setPosition(data);
        if (data.status) setLiveStatus(data.status);
      } catch {}
    };
    poll();
    pollRef.current = setInterval(poll, 6000);
  };

  const join = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post("/queue/join", {
        shopId,
        patientName: form.patientName,
        phone: form.phone,
      });
      if (data.entry) {
        setResult(data.entry);
        setLiveStatus("waiting");
        toast(`Joined! Token #${data.entry.tokenNumber} 🎫`, "success");
        connectSocket(data.entry._id);
        startPolling(data.entry._id);
      } else {
        toast(data.message || "Failed to join", "error");
      }
    } catch {
      toast("Network error — is the server running?", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    return () => {
      clearInterval(pollRef.current);
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  if (result && liveStatus === "in-progress" && !acknowledged) {
    return (
      <div style={{
        minHeight: "calc(100vh - 60px)", display: "flex", alignItems: "center",
        justifyContent: "center", padding: 24,
        background: "radial-gradient(circle at 50% 40%, rgba(16,185,129,0.12) 0%, var(--bg) 70%)",
      }}>
        <div className="fade-in" style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
          {/* Pulsing ring */}
          <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto 28px" }}>
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              border: "3px solid var(--success)", opacity: 0.3,
              animation: "ping 1.2s ease-out infinite",
            }} />
            <div style={{
              position: "absolute", inset: 8, borderRadius: "50%",
              border: "3px solid var(--success)", opacity: 0.5,
              animation: "ping 1.2s ease-out 0.4s infinite",
            }} />
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "rgba(16,185,129,0.15)",
              border: "2px solid var(--success)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 42,
            }}>🔔</div>
          </div>

          <h1 style={{
            fontFamily: "Syne", fontSize: 32, fontWeight: 800, marginBottom: 8,
            color: "var(--success)",
          }}>
            It's your turn!
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 15, marginBottom: 28, lineHeight: 1.5 }}>
            The doctor is ready for you.<br />Please proceed inside now.
          </p>

          <div style={{
            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: 14, padding: "20px 24px", marginBottom: 24,
          }}>
            <div style={{ fontSize: 12, color: "var(--success)", marginBottom: 4, opacity: 0.8 }}>Your Token</div>
            <div style={{ fontFamily: "Syne", fontSize: 48, fontWeight: 800, color: "var(--success)", lineHeight: 1 }}>
              #{result.tokenNumber}
            </div>
            <div style={{ fontSize: 13, color: "var(--success)", marginTop: 4, opacity: 0.8 }}>
              {result.patientName}
            </div>
          </div>

          <button
            className="btn-primary"
            style={{ fontSize: 15, padding: "14px 28px" }}
            onClick={() => setAcknowledged(true)}
          >
            I'm going in ✓
          </button>
        </div>
      </div>
    );
  }

  if (result && liveStatus === "completed") {
    return (
      <div style={{ minHeight: "calc(100vh - 60px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="card fade-in" style={{ maxWidth: 400, width: "100%", textAlign: "center", padding: 36 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontFamily: "Syne", fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Visit complete!</h2>
          <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            Thank you for visiting {shopName}.<br />We hope you feel better soon.
          </p>
          <button className="btn-primary" onClick={() => onNavigate("home")}>Back to home</button>
        </div>
      </div>
    );
  }

  if (result && liveStatus === "cancelled") {
    return (
      <div style={{ minHeight: "calc(100vh - 60px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="card fade-in" style={{ maxWidth: 400, width: "100%", textAlign: "center", padding: 36 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>❌</div>
          <h2 style={{ fontFamily: "Syne", fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Token cancelled</h2>
          <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>
            Your token was removed from the queue. Please contact the front desk.
          </p>
          <button className="btn-primary" onClick={() => { setResult(null); setLiveStatus("waiting"); }}>
            Join again
          </button>
        </div>
      </div>
    );
  }

  if (result) {
    const isBeingCalled = liveStatus === "in-progress";
    return (
      <div style={{ minHeight: "calc(100vh - 60px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="card fade-in" style={{ maxWidth: 400, width: "100%", textAlign: "center", padding: 36 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎫</div>
          <h2 style={{ fontFamily: "Syne", fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
            {isBeingCalled ? "You've been called!" : "You're in the queue!"}
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 28 }}>{shopName}</p>

          {/* Token number */}
          <div style={{
            background: isBeingCalled
              ? "rgba(16,185,129,0.1)"
              : "linear-gradient(135deg, var(--accent-dim), rgba(251,146,60,0.08))",
            border: `1px solid ${isBeingCalled ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.2)"}`,
            borderRadius: 14, padding: "24px 20px", marginBottom: 20,
          }}>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>Your Token Number</div>
            <div style={{
              fontFamily: "Syne", fontSize: 56, fontWeight: 800, lineHeight: 1,
              color: isBeingCalled ? "var(--success)" : "var(--accent)",
            }}>
              #{result.tokenNumber}
            </div>
          </div>

          {/* Live position */}
          {liveStatus === "waiting" && position?.position && (
            <div className="card" style={{ marginBottom: 16, padding: 16 }}>
              <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>Your Position</div>
              <div style={{
                fontFamily: "Syne", fontSize: 32, fontWeight: 700,
                color: position.position === 1 ? "var(--success)" : "var(--text)",
              }}>
                {position.position === 1 ? "🎉 You're next!" : `#${position.position} in line`}
              </div>
              {position.position > 1 && (
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                  ≈ {(position.position - 1) * 5} min estimated wait
                </div>
              )}
            </div>
          )}

          {/* Status indicator */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            fontSize: 12, color: "var(--muted)",
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: isBeingCalled ? "var(--success)" : "var(--accent)",
              display: "inline-block",
              animation: "pulse 1.5s ease infinite",
            }} />
            {isBeingCalled
              ? "Doctor is ready for you — please go in"
              : "Live updates via Socket.IO · Keep this page open"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "calc(100vh - 60px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card fade-in" style={{ maxWidth: 400, width: "100%", padding: 36 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏥</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{shopName}</h2>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Enter your details to join the queue</p>
        </div>
        <form onSubmit={join} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="label">Your Name *</label>
            <input placeholder="Rahul Sharma" value={form.patientName}
              onChange={e => setForm(p => ({ ...p, patientName: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Phone (optional)</label>
            <input placeholder="9876543210" value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? <Spinner size={18} /> : "Join Queue →"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Dashboard({ user, token, toast }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [tab, setTab] = useState("queue");
  const pollRef = useRef(null);

  const fetchQueue = useCallback(async () => {
    try {
      const data = await api.get(`/queue/${user._id}`, token);
      setQueue(data.queue || []);
      setLoading(false);
    } catch { setLoading(false); }
  }, [user._id, token]);

  const fetchQR = async () => {
    try {
      const data = await api.get(`/queue/qr/${user._id}`, token);
      setQrData(data);
      setShowQR(true);
    } catch { toast("Failed to load QR", "error"); }
  };

  useEffect(() => {
    fetchQueue();
    pollRef.current = setInterval(fetchQueue, 6000);
    return () => clearInterval(pollRef.current);
  }, [fetchQueue]);

  const updateStatus = async (entryId, status) => {
    try {
      await api.patch(`/queue/status/${entryId}`, { status }, token);
      toast(`Status updated to ${status}`, "success");
      fetchQueue();
    } catch { toast("Failed to update", "error"); }
  };

  const remove = async (entryId) => {
    try {
      await api.delete(`/queue/${entryId}`, token);
      toast("Removed from queue", "success");
      fetchQueue();
    } catch { toast("Failed to remove", "error"); }
  };

  const stats = {
    waiting: queue.filter(q => q.status === "waiting").length,
    inProgress: queue.filter(q => q.status === "in-progress").length,
    total: queue.length,
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 4 }}>Dashboard</h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            {user.name} · Managing queue
            <span style={{
              marginLeft: 10, display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 12, color: "var(--success)",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", display: "inline-block" }} />
              Live
            </span>
          </p>
        </div>
        <button onClick={fetchQR} style={{
          background: "linear-gradient(135deg, var(--accent), var(--accent2))",
          color: "#0d0f1a", border: "none", borderRadius: 10, padding: "10px 20px",
          fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
        }}>
          📱 Get QR Code
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Waiting", value: stats.waiting, color: "var(--accent)", icon: "⏳" },
          { label: "In Progress", value: stats.inProgress, color: "var(--info)", icon: "▶️" },
          { label: "Total Today", value: stats.total, color: "var(--muted)", icon: "📊" },
        ].map((s, i) => (
          <div key={i} className="card" style={{ textAlign: "center", padding: "20px 16px" }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontFamily: "Syne", fontSize: 36, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Queue Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 18 }}>Live Queue</h3>
          <button onClick={fetchQueue} style={{
            background: "transparent", border: "1px solid var(--border)", color: "var(--muted)",
            borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer",
          }}>↻ Refresh</button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 48 }}><Spinner size={32} /></div>
        ) : queue.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
            Queue is empty! Share your QR code to get started.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["#", "Token", "Patient", "Phone", "Status", "Waited", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {queue.map((entry, i) => {
                  const waited = Math.floor((Date.now() - new Date(entry.createdAt)) / 60000);
                  return (
                    <tr key={entry._id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "14px 20px", color: "var(--muted)", fontSize: 14 }}>{i + 1}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{
                          fontFamily: "Syne", fontWeight: 700, fontSize: 16,
                          color: "var(--accent)",
                        }}>#{entry.tokenNumber}</span>
                      </td>
                      <td style={{ padding: "14px 20px", fontWeight: 600, fontSize: 15 }}>{entry.patientName}</td>
                      <td style={{ padding: "14px 20px", color: "var(--muted)", fontSize: 14 }}>{entry.phone || "—"}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span className={`tag tag-${entry.status === "in-progress" ? "in-progress" : entry.status}`}>
                          {entry.status === "waiting" ? "⏳ Waiting" : entry.status === "in-progress" ? "▶ In Progress" : entry.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: waited > 15 ? "var(--danger)" : "var(--muted)" }}>
                        {waited}m
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {entry.status === "waiting" && (
                            <button className="btn-success" onClick={() => updateStatus(entry._id, "in-progress")}>
                              ▶ Call
                            </button>
                          )}
                          {entry.status === "in-progress" && (
                            <button className="btn-success" onClick={() => updateStatus(entry._id, "completed")}>
                              ✓ Done
                            </button>
                          )}
                          <button className="btn-danger" onClick={() => remove(entry._id)}>Remove</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQR && qrData && (
        <div
          onClick={() => setShowQR(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24,
          }}>
          <div className="card fade-in" style={{ maxWidth: 380, width: "100%", textAlign: "center", padding: 36 }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Your Queue QR Code</h3>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 24 }}>
              Display this at your shop. Patients scan to join instantly.
            </p>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <QRDisplay url={qrData.qrUrl} size={180} />
            </div>
            <div style={{
              background: "var(--surface2)", borderRadius: 8, padding: "10px 14px",
              fontSize: 12, color: "var(--muted)", wordBreak: "break-all", marginBottom: 20,
            }}>
              {qrData.qrUrl}
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
              💡 In production, use <code style={{ color: "var(--accent)" }}>react-qr-code</code> for a real scannable QR.
            </p>
            <button className="btn-ghost" style={{ width: "100%" }} onClick={() => setShowQR(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState({ name: "home", props: {} });
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("qs_user")); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem("qs_token") || null);
  const { toasts, add: toast, remove } = useToast();

  const navigate = (name, props = {}) => setPage({ name, props });

  const handleAuth = (tok, usr) => {
    setToken(tok);
    setUser(usr);
    localStorage.setItem("qs_token", tok);
    localStorage.setItem("qs_user", JSON.stringify(usr));
    navigate(usr.role === "admin" ? "dashboard" : "home");
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("qs_token");
    localStorage.removeItem("qs_user");
    navigate("home");
    toast("Signed out", "info");
  };

  const renderPage = () => {
    switch (page.name) {
      case "home": return <HomePage onNavigate={navigate} user={user} toast={toast} />;
      case "login": return <AuthPage mode="login" onAuth={handleAuth} onNavigate={navigate} toast={toast} />;
      case "register": return <AuthPage mode="register" onAuth={handleAuth} onNavigate={navigate} toast={toast} />;
      case "join": return <JoinPage shopId={page.props.shopId} shopName={page.props.shopName || "Queue"} toast={toast} onNavigate={navigate} />;
      case "dashboard":
        return user?.role === "admin"
          ? <Dashboard user={user} token={token} toast={toast} />
          : <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Access denied</div>;
      default: return <HomePage onNavigate={navigate} user={user} toast={toast} />;
    }
  };

  return (
    <>
      <GlobalStyle />
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar user={user} onLogout={logout} onNavigate={navigate} currentPage={page.name} />
        <main style={{ flex: 1 }}>{renderPage()}</main>
        <footer style={{ borderTop: "1px solid var(--border)", padding: "16px 24px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
          QueueSaver · Built with ♥ · No more waiting in lines
        </footer>
      </div>
      <Toast toasts={toasts} remove={remove} />
    </>
  );
}
