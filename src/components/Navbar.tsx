import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/authStore";
import AvatarModal from "./AvatarModal";
import SettingsModal from "./SettingsModal";
import api from "../api/axios";

const getAvatarIcon = (key: string) => {
  const map: Record<string, string> = {
    mouse: "🐭", buffalo: "🐮", tiger: "🐯", cat: "🐱",
    dragon: "🐲", snake: "🐍", horse: "🐴", goat: "🐐",
    monkey: "🐵", rooster: "🐔", dog: "🐶", pig: "🐷",
    panda: "🐼", koala: "🐨", rabbit: "🐰"
  };
  return map[key] || "🐶";
};

export default function Navbar() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [themes, setThemes] = useState<string[]>(["ocean", "dark", "light"]);

  useEffect(() => {
    if (user?.currentTheme) {
      document.body.className = `theme-${user.currentTheme}`;
    }

    const fetchOwnedThemes = async () => {
      if (!user) return;
      try {
        const [itemsRes, ownedRes] = await Promise.all([
          api.get("/store/items"),
          api.get(`/store/owned/${user.id}`)
        ]);
        const ownedIds = ownedRes.data.data;
        const ownedThemes = itemsRes.data.data
          .filter((item: any) => item.type === "THEME" && ownedIds.includes(item.id))
          .map((item: any) => item.name);
        
        setThemes(["ocean", "dark", "light", ...ownedThemes]);
      } catch (err) { console.error("Lỗi tải danh sách theme"); }
    };
    fetchOwnedThemes();
  }, [user?.currentTheme, user?.id]);

  const handleThemeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value;
    try {
      const res = await api.patch(`/users/${user?.id}/theme?theme=${newTheme}`);
      if (res.data.success) {
        login(res.data.data);
      }
    } catch (err) { console.error("Lỗi chuyển theme"); }
  };

  const handleLogout = () => {
    logout();
    document.body.className = "";
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="avatar-container" onClick={() => setIsModalOpen(true)}>
          <div className="user-avatar-circle">
            {getAvatarIcon(user?.avatar || "dog")}
          </div>
        </div>
        <div className="user-info-group">
          <div className="username-display">{user?.username || "Guest"}</div>
          <div className="stats-row">
            <span>Tổng tích lũy: {user?.totalPoint || 0}</span>
            <span className="divider">-</span>
            <span>Streak: {user?.streak || 0} 🔥</span>
          </div>
          <div className="fp-display">Điểm hiện có: {user?.point || 0}</div>
        </div>
      </div>

      <div className="navbar-right">
        <button className="settings-icon-btn" onClick={() => setIsSettingsOpen(true)}>⚙️</button>
        <div className="theme-selector">
          <span>Theme</span>
          <select className="theme-dropdown" value={user?.currentTheme || "ocean"} onChange={handleThemeChange}>
            {themes.map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Đăng xuất</button>
      </div>

      {isModalOpen && <AvatarModal onClose={() => setIsModalOpen(false)} />}
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </nav>
  );
}