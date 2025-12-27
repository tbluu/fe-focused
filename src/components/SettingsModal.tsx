import { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../store/authStore";

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { user, login } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");

  const handleSave = async () => {
    try {
      const res = await api.patch(`/users/${user?.id}/settings`, {
        newUsername: username,
        newPassword: password || null
      });
      if (res.data.success) {
        login(res.data.data);
        alert("Cập nhật thành công!");
        onClose();
      }
    } catch (err) { alert("Cập nhật thất bại"); }
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()} style={{ width: "380px" }}>
        <h2>Cài đặt tài khoản</h2>
        <div className="input-group" style={{ marginTop: "20px" }}>
          <label>Tên hiển thị mới</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Mật khẩu mới (Để trống nếu không đổi)</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>Hủy</button>
          <button className="main-auth-btn" onClick={handleSave}>Lưu</button>
        </div>
      </div>
    </div>
  );
}