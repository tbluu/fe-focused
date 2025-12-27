import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../store/authStore";

export default function SubjectManagerModal({ onClose, onRefresh }: { onClose: () => void, onRefresh: () => void }) {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [newName, setNewName] = useState("");

  const fetchSubjects = async () => {
    const res = await api.get(`/subjects/${user?.id}`);
    setSubjects(res.data.data);
  };

  useEffect(() => { fetchSubjects(); }, []);

  const handleAdd = async () => {
    if (!newName) return;
    await api.post(`/subjects/${user?.id}`, { name: newName });
    setNewName("");
    fetchSubjects();
    onRefresh();
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/subjects/${id}`); 
    fetchSubjects();
    onRefresh();
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()} style={{width: '400px'}}>
        <h2>Quản lý môn học</h2>
        <div className="input-group" style={{flexDirection: 'row', gap: '10px', marginTop: '20px'}}>
          <input 
            placeholder="Tên môn mới..." 
            value={newName} 
            onChange={e => setNewName(e.target.value)} 
          />
          <button className="main-auth-btn" style={{width: '80px', marginTop: 0}} onClick={handleAdd}>Thêm</button>
        </div>
        <div className="subject-list" style={{marginTop: '20px', maxHeight: '300px', overflowY: 'auto'}}>
          {subjects.map(s => (
            <div key={s.id} className="subject-item" style={{display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #374151'}}>
              <span>{s.name}</span>
              <button onClick={() => handleDelete(s.id)} style={{background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer'}}>Xóa</button>
            </div>
          ))}
        </div>
        <button className="cancel-btn" style={{marginTop: '20px'}} onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}