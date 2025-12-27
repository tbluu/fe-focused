import { Outlet } from "react-router-dom";
import "../index.css";

export default function AuthLayout() {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <header className="auth-header">
          <h1 className="auth-logo">FocusED</h1>
          <p className="auth-subtitle">
            Đăng nhập để lưu FP, streak và bảng xếp hạng chung.
          </p>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}