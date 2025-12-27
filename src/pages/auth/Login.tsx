import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../store/authStore";
import Dialog from "../../components/Dialog";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      const res = await api.post("/auth/login", { email, password });
      if (!res.data.success) {
        setError(res.data.message);
        return;
      }
      login(res.data.data);

      navigate("/homepage");
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng nhập thất bại");
    }
  };

  return (
    <>
      <div className="auth-tabs">
        <button className="tab-btn active">Đăng nhập</button>
        <button className="tab-btn" onClick={() => navigate("/register")}>
          Đăng ký
        </button>
      </div>

      <div className="input-group">
        <label>Email</label>
        <input
          type="email"
          placeholder="tet1@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="input-group">
        <label>Mật khẩu</label>
        <div className="input-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "👁️" : "🙈"}
          </button>
        </div>
      </div>

      <button className="main-auth-btn" onClick={handleLogin}>
        Đăng nhập
      </button>

      {error && (
        <Dialog
          title="Thông báo"
          message={error}
          onClose={() => setError(null)}
        />
      )}
    </>
  );
}
