import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../store/authStore";

export default function StoreCard({ onPurchase }: { onPurchase: () => void }) {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState<"theme" | "avatar">("theme");
  const [themes, setThemes] = useState<any[]>([]);
  const [avatars, setAvatars] = useState<any[]>([]);
  const [ownedThemes, setOwnedThemes] = useState<number[]>([]);
  const [ownedAvatars, setOwnedAvatars] = useState<number[]>([]);

  const fetchStore = async () => {
    const [tRes, aRes, utRes, uaRes] = await Promise.all([
      api.get("/themes"),
      api.get("/store/avatars"),
      api.get(`/themes/user/${user?.id}`),
      api.get(`/store/avatars/user/${user?.id}`)
    ]);
    setThemes(tRes.data.data.filter((t: any) => t.price > 0));
    setAvatars(aRes.data.data);
    setOwnedThemes(utRes.data.data.map((ut: any) => ut.theme.id));
    setOwnedAvatars(uaRes.data.data.map((ua: any) => ua.avatar.id));
  };

  useEffect(() => { fetchStore(); }, [user?.point]);

  const handleBuy = async (type: string, id: number) => {
    try {
      const endpoint = type === "theme" ? "/store/buy-theme" : "/store/buy-avatar";
      const paramName = type === "theme" ? "themeId" : "avatarId";
      const res = await api.post(`${endpoint}?userId=${user?.id}&${paramName}=${id}`);
      if (res.data.success) {
        login(res.data.data);
        alert("Mua hàng thành công!");
        onPurchase();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi mua hàng");
    }
  };

  return (
    <div className="task-card store-card">
      <div className="task-header">
        <h3>Cửa hàng vật phẩm</h3>
        <p className="task-reward-hint">Dùng Point để đổi diện mạo mới</p>
      </div>

      <div className="auth-tabs store-tabs">
        <button className={`tab-btn ${activeTab === 'theme' ? 'active' : ''}`} onClick={() => setActiveTab('theme')}>Themes</button>
        <button className={`tab-btn ${activeTab === 'avatar' ? 'active' : ''}`} onClick={() => setActiveTab('avatar')}>Avatars</button>
      </div>

      <div className="store-grid">
        {activeTab === 'theme' ? (
          themes.map(t => (
            <div key={t.id} className="store-item">
              <div className={`theme-preview color-${t.name}`}></div>
              <p>{t.name.toUpperCase()}</p>
              <button 
                disabled={ownedThemes.includes(t.id)}
                onClick={() => handleBuy("theme", t.id)}
              >
                {ownedThemes.includes(t.id) ? "Đã sở hữu" : `50 Point`}
              </button>
            </div>
          ))
        ) : (
          avatars.map(a => (
            <div key={a.id} className="store-item">
              <span className="store-avatar-icon">{a.icon}</span>
              <p>{a.name}</p>
              <button 
                disabled={ownedAvatars.includes(a.id)}
                onClick={() => handleBuy("avatar", a.id)}
              >
                {ownedAvatars.includes(a.id) ? "Đã sở hữu" : `65 Point`}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}