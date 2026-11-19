import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { api } from "../../api/client.js";
import { useSiteSettings } from "../../contexts/SiteSettingsContext.jsx";
import LoginRobotScene from "../../components/LoginRobotScene.jsx";

const LOCK_MINUTES = 15;

const Icon = {
  user: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c.8-3.8 4-6 8-6s7.2 2.2 8 6" />
    </svg>
  ),
  lock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  eye: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 3l18 18M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.8M6.3 6.8C3.9 8.4 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  ),
  arrowRight: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  arrowLeft: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  ),
  alert: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5v.01" />
    </svg>
  ),
  shield: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.2 7.5 9.5 4.4-1.3 7.5-4.9 7.5-9.5V6z" />
    </svg>
  ),
};

/** Admin sign-in: one centred card over a full-screen navy background with animated robot arms. */
export default function AdminLogin() {
  const siteSettings = useSiteSettings();
  const logo = siteSettings?.header_logo_url;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null); // { message, detail, field }
  const [showForgot, setShowForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError({ message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน", field: !username.trim() ? "username" : "password" });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.adminLogin({ username: username.trim(), password, remember });
      navigate(location.state?.from || "/admin", { replace: true });
    } catch (err) {
      let detail = "";
      if (err.code === "invalid" && err.remaining > 0 && err.remaining <= 3) {
        detail = `เหลือโอกาสอีก ${err.remaining} ครั้ง ก่อนระบบล็อก ${LOCK_MINUTES} นาที`;
      } else if (err.code === "server") {
        detail = `เซิร์ฟเวอร์ขัดข้อง (รหัส ${err.status}) หากยังเป็นอยู่ แจ้งผู้ดูแลระบบให้ตรวจสอบ log ของเซิร์ฟเวอร์`;
      } else if (!err.code && err.status) {
        detail = `ไม่ได้รับคำตอบจากเซิร์ฟเวอร์ (รหัส ${err.status})`;
      }
      setError({
        message: err.code ? err.message : "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่",
        detail,
        field: err.code === "invalid" ? "password" : null,
      });
      if (err.code === "invalid") setPassword("");
    } finally {
      setLoading(false);
    }
  };

  const logoImg = (className) =>
    logo ? (
      <img className={className} src={logo} alt="TRISAK" />
    ) : (
      <span className={`${className} login__wordmark`}>TRISAK</span>
    );

  return (
    <div className="login">
      <LoginRobotScene />
      <div className="login__lines" aria-hidden="true" />
      <div className="login__glow" aria-hidden="true" />

      <header className="login__top">
        {logoImg("login__logo")}
        <Link className="login__back" to="/">
          {Icon.arrowLeft}
          <span>กลับไปหน้าเว็บไซต์</span>
        </Link>
      </header>

      <main className="login__center">
        <div className="login__intro">
          <span className="login__tag">TRISAK Admin</span>
          <p>ระบบจัดการเนื้อหาเว็บไซต์</p>
        </div>

        <form className="login__card" onSubmit={handleSubmit} noValidate>
          <h1>เข้าสู่ระบบหลังบ้าน</h1>
          <p className="login__sub">กรอกชื่อผู้ใช้และรหัสผ่านของคุณเพื่อเข้าใช้งาน</p>

          {error && (
            <div className="login__alert" role="alert">
              {Icon.alert}
              <span>
                {error.message}
                {error.detail && <small>{error.detail}</small>}
              </span>
            </div>
          )}

          <label className="login__field">
            <span className="login__label">ชื่อผู้ใช้หรืออีเมล</span>
            <span className={`login__input${error?.field === "username" ? " is-bad" : ""}`}>
              <span className="login__lead">{Icon.user}</span>
              <input
                type="text"
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck="false"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </span>
          </label>

          <label className="login__field">
            <span className="login__label">รหัสผ่าน</span>
            <span className={`login__input${error?.field === "password" ? " is-bad" : ""}`}>
              <span className="login__lead">{Icon.lock}</span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="login__eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                {showPassword ? Icon.eyeOff : Icon.eye}
              </button>
            </span>
          </label>

          <div className="login__row">
            <label className="login__check">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span className="login__box" aria-hidden="true" />
              จดจำการเข้าสู่ระบบ 30 วัน
            </label>
            <button type="button" className="login__link" onClick={() => setShowForgot((v) => !v)} aria-expanded={showForgot}>
              ลืมรหัสผ่าน?
            </button>
          </div>
          {showForgot && (
            <p className="login__forgot">
              ติดต่อผู้ดูแลระบบ (Superadmin) ของบริษัท เพื่อตั้งรหัสผ่านใหม่ให้ที่เมนู ตั้งค่า &gt; ผู้ใช้งาน
            </p>
          )}

          <button type="submit" className="login__submit" disabled={loading}>
            {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
            {!loading && Icon.arrowRight}
          </button>

          <p className="login__note">
            {Icon.shield}
            การเข้าสู่ระบบทุกครั้งถูกบันทึกเพื่อความปลอดภัย
          </p>
        </form>

      </main>

      <footer className="login__foot">
        <span>© {new Date().getFullYear()} TRISAK GROUP</span>
        <span>ใช้สำหรับเจ้าหน้าที่เท่านั้น</span>
      </footer>
    </div>
  );
}
