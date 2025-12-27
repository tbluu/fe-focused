import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Dialog from "../../components/Dialog";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    rePassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    if (form.password !== form.rePassword) {
      setError("Mật khẩu không khớp!");
      return;
    }
    try {
      const res = await api.post("/auth/register", form);
      if (res.data && !res.data.success) {
        setError(res.data.message);
        return;
      }
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng ký thất bại");
    }
  };

  return (
    <>
      <div className="auth-tabs">
        <button className="tab-btn" onClick={() => navigate("/login")}>
          Đăng nhập
        </button>
        <button className="tab-btn active">Đăng ký</button>
      </div>

      <div className="input-group">
        <label>Email</label>
        <input name="email" placeholder="Email" onChange={handleChange} />
      </div>

      <div className="input-group">
        <label>Mật khẩu</label>
        <div className="input-wrapper">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Mật khẩu"
            onChange={handleChange}
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

      <div className="input-group">
        <label>Nhập lại mật khẩu</label>
        <div className="input-wrapper">
          <input
            name="rePassword"
            type={showConfirm ? "text" : "password"}
            placeholder="Nhập lại mật khẩu"
            onChange={handleChange}
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowConfirm(!showConfirm)}
          >
            {showConfirm ? "👁️" : "🙈"}
          </button>
        </div>
      </div>

      <div className="input-group">
        <label>Tên hiển thị</label>
        <input
          name="username"
          placeholder="Tên hiển thị"
          onChange={handleChange}
        />
      </div>

      <button className="main-auth-btn" onClick={handleRegister}>
        Tạo tài khoản
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
