import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../store/authStore";

const DEFAULT_ZODIACS = [
  { key: "mouse", icon: "🐭" }, { key: "buffalo", icon: "🐮" },
  { key: "tiger", icon: "🐯" }, { key: "cat", icon: "🐱" },
  { key: "dragon", icon: "🐲" }, { key: "snake", icon: "🐍" },
  { key: "horse", icon: "🐴" }, { key: "goat", icon: "🐐" },
  { key: "monkey", icon: "🐵" }, { key: "rooster", icon: "🐔" },
  { key: "dog", icon: "🐶" }, { key: "pig", icon: "🐷" }
];

interface Props { onClose: () => void; }

export default function AvatarModal({ onClose }: Props) {
  const { user, login } = useAuth();
  const [selected, setSelected] = useState(user?.avatar || "dog");
  const [availableAvatars, setAvailableAvatars] = useState<any[]>(DEFAULT_ZODIACS);

  useEffect(() => {
    const fetchOwnedAvatars = async () => {
      try {
        // Lấy tất cả vật phẩm store và danh sách ID đã sở hữu
        const [itemsRes, ownedRes] = await Promise.all([
          api.get("/store/items"),
          api.get(`/store/owned/${user?.id}`)
        ]);
        
        const ownedIds = ownedRes.data.data;
        const ownedAvatars = itemsRes.data.data
          .filter((item: any) => item.type === "AVATAR" && ownedIds.includes(item.id))
          .map((item: any) => ({ key: item.name, icon: item.preview }));

        setAvailableAvatars([...DEFAULT_ZODIACS, ...ownedAvatars]);
      } catch (err) { console.error("Lỗi tải avatar đã mua"); }
    };
    fetchOwnedAvatars();
  }, [user?.id]);

  const handleConfirm = async () => {
    try {
      const res = await api.patch(`/users/${user?.id}/avatar?avatar=${selected}`);
      if (res.data.success) {
        login(res.data.data);
        onClose();
      }
    } catch (err) { alert("Lỗi khi cập nhật avatar"); }
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog avatar-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Chọn ảnh đại diện</h2>
        <div className="avatar-grid">
          {availableAvatars.map((z) => (
            <div 
              key={z.key} 
              className={`avatar-item ${selected === z.key ? "selected-active" : ""}`} 
              onClick={() => setSelected(z.key)}
            >
              <span style={{ fontSize: "2.5rem" }}>{z.icon}</span>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>Hủy</button>
          <button className="main-auth-btn" onClick={handleConfirm}>Xác nhận</button>
        </div>
      </div>
    </div>
  );
}