import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../../api/client.js";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.adminLogin(password);
      const redirectTo = location.state?.from || "/admin";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="admin-login">
      <form className="admin-login__card panel" onSubmit={handleSubmit}>
        <span className="eyebrow">TRISAK Admin</span>
        <h2>Sign In</h2>
        <label className="contact-form__field">
          <span>Password</span>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="contact-form__status contact-form__status--error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </section>
  );
}
