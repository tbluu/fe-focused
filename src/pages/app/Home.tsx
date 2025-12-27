import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../store/authStore";
import api from "../../api/axios";
import SubjectManagerModal from "../../components/SubjectManagerModal";
import Dialog from "../../components/Dialog";

export default function Home() {
  const { user, login } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);

  // Leaderboard states
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [lbPage, setLbPage] = useState(0);

  // Store states
  const [storeItems, setStoreItems] = useState<any[]>([]);
  const [ownedItemIds, setOwnedItemIds] = useState<number[]>([]);
  const [activeStoreTab, setActiveStoreTab] = useState<"THEME" | "AVATAR">(
    "THEME"
  );

  // Timer states
  const [minutes, setMinutes] = useState(25);
  const [isCustom, setIsCustom] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);

  // Task states
  const [dailyTasks, setDailyTasks] = useState<any[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Common states
  const [isWarning, setIsWarning] = useState(false);
  const [warningCount, setWarningCount] = useState(10);
  const [secondsFocused, setSecondsFocused] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const timerRef = useRef<any>(null);
  const warningRef = useRef<any>(null);

  const fetchDashboardData = async () => {
    try {
      const [subRes, taskRes, lbRes, storeRes, ownedRes] = await Promise.all([
        api.get(`/subjects/${user?.id}`),
        api.get(`/tasks/today/${user?.id}`),
        api.get(`/leaderboard`),
        api.get(`/store/items`),
        api.get(`/store/owned/${user?.id}`),
      ]);
      setSubjects(subRes.data.data);
      setDailyTasks(taskRes.data.data);
      setStoreItems(storeRes.data.data);
      setOwnedItemIds(ownedRes.data.data);

      const sortedLeaderboard = lbRes.data.data.sort(
        (a: any, b: any) => (b.totalPoint || 0) - (a.totalPoint || 0)
      );
      setLeaderboard(sortedLeaderboard);

      if (subRes.data.data.length > 0 && !selectedSubject) {
        setSelectedSubject(subRes.data.data[0].id);
      }
    } catch (err) {
      console.error("Lỗi tải dữ liệu");
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // --- Logic Store ---
  const handleBuyItem = async (item: any) => {
    if ((user?.point || 0) < item.price) {
      setMessage(`Bạn cần ${item.price} điểm để đổi vật phẩm này.`);
      return;
    }

    try {
      const res = await api.post(
        `/store/buy?userId=${user?.id}&itemId=${item.id}`
      );

      if (res.data.success) {
        const updatedUser = res.data.data;
        login(updatedUser);
        fetchDashboardData();

        setMessage(`Đổi thành công vật phẩm ${item.name}!`);
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Giao dịch thất bại");
    }
  };

  // Validation
  const handleStartSession = () => {
    if (!selectedSubject) {
      setMessage("Vui lòng chọn môn học trước khi bắt đầu.");
      return;
    }
    if (minutes < 5) {
      setMessage("Thời lượng tập trung tối thiểu là 5 phút.");
      return;
    }
    setShowStartDialog(true);
  };

  // Timer logic
  useEffect(() => {
    if (!isActive && !isFocusMode) {
      setTimeLeft(minutes * 60);
      setSecondsFocused(0);
    }
  }, [minutes, isActive, isFocusMode]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        setSecondsFocused((prevSec) => {
          const newSec = prevSec + 1;
          if (newSec > 0 && newSec % 600 === 0) handleAddPoints(5);
          return newSec;
        });
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleEndSession("Chúc mừng! Bạn đã hoàn thành phiên tập trung.");
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, timeLeft]);

  const handleAddPoints = async (amount: number) => {
    try {
      const res = await api.post(
        `/users/${user?.id}/add-points?amount=${amount}`
      );
      if (res.data.success) {
        login(res.data.data);
        fetchDashboardData();
      }
    } catch (err) {
      console.error("Lỗi cộng điểm");
    }
  };

  // Anti-cheat
  const handleReturn = () => {
    setIsWarning(false);
    setIsActive(true);
    clearInterval(warningRef.current);
    if (!document.fullscreenElement)
      document.documentElement.requestFullscreen().catch(() => {});
  };

  const triggerWarning = () => {
    setIsWarning(true);
    setIsActive(false);
    setWarningCount(10);
    if (warningRef.current) clearInterval(warningRef.current);
    warningRef.current = setInterval(() => {
      setWarningCount((prev) => {
        if (prev <= 1) {
          clearInterval(warningRef.current);
          handleEndSession("Phiên bị hủy vì rời tab quá lâu!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== "visible" && isFocusMode)
        triggerWarning();
    };
    const handleBlur = () => {
      if (isFocusMode) triggerWarning();
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFocusMode && !isWarning)
        triggerWarning();
    };
    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isFocusMode, isWarning]);

  const handleEndSession = (msg: string) => {
    setIsActive(false);
    setIsFocusMode(false);
    setIsWarning(false);
    if (document.fullscreenElement) document.exitFullscreen();
    setMessage(msg);
  };

  // Task Handlers
  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      await api.post(`/tasks/today/${user?.id}?title=${newTaskTitle}`);
      setNewTaskTitle("");
      fetchDashboardData();
    } catch (err: any) {
      setMessage(err.response?.data?.message);
    }
  };

  const handleCheckTask = async (taskId: number) => {
    try {
      const res = await api.patch(`/tasks/complete/${taskId}`);
      if (res.data.success) {
        login(res.data.data);
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helpers
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const percentage = Math.round(
    ((minutes * 60 - timeLeft) / (minutes * 60)) * 100
  );
  const milestoneSeconds = secondsFocused % 600;
  const milestoneProgress = (milestoneSeconds / 600) * 100;
  const milestoneMinutes = Math.floor(milestoneSeconds / 60);

  const MilestoneBar = () => (
    <div className="milestone-container">
      <p className="milestone-title">
        Tiến tới mốc 10 phút tiếp theo (+5 điểm)
        <span className="info-icon" title="5 phút, +3 điểm">
          i
        </span>
      </p>
      <div className="milestone-bar-bg">
        <div
          className="milestone-bar-fill"
          style={{ width: `${milestoneProgress}%` }}
        ></div>
      </div>
      <p className="milestone-text">{milestoneMinutes} / 10 phút</p>
    </div>
  );

  return (
    <div className="home">
      {!isFocusMode && (
        <div className="dashboard-layout">
          <div className="left-column">
            {/* BẢNG XẾP HẠNG */}
            <div className="leaderboard-card">
              <div className="leaderboard-header">
                <h3>Bảng xếp hạng</h3>
                <p>Top 50</p>
              </div>
              <table className="lb-table">
                <thead>
                  <tr>
                    <th className="col-stt">STT</th>
                    <th>Tên</th>
                    <th className="col-score">Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard
                    .slice(lbPage * 10, (lbPage + 1) * 10)
                    .map((u, idx) => (
                      <tr
                        key={u.id}
                        style={
                          u.id === user?.id
                            ? { background: "rgba(56, 189, 248, 0.1)" }
                            : {}
                        }
                      >
                        <td className="col-stt">{lbPage * 10 + idx + 1}</td>
                        <td>
                          {u.username} {u.id === user?.id && "(Bạn)"}
                        </td>
                        <td className="col-score">
                          {(u.totalPoint || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="pagination">
                <button
                  className="page-btn"
                  disabled={lbPage === 0}
                  onClick={() => setLbPage(lbPage - 1)}
                >
                  Trước
                </button>
                <span>Trang {lbPage + 1} / 5</span>
                <button
                  className="page-btn"
                  disabled={
                    lbPage === 4 || leaderboard.length <= (lbPage + 1) * 10
                  }
                  onClick={() => setLbPage(lbPage + 1)}
                >
                  Sau
                </button>
              </div>
            </div>

            {/* CARD TASK */}
            <div className="task-card">
              <div className="task-header">
                <h3>Task hôm nay (tối đa 5 task)</h3>
                <p className="task-reward-hint">
                  Hoàn thành để nhận điểm thưởng
                </p>
              </div>
              <div className="task-list-area">
                {dailyTasks.map((t) => (
                  <div
                    key={t.id}
                    className={`task-item-row ${
                      t.completed ? "task-completed-state" : ""
                    }`}
                  >
                    <button
                      className={`task-checkbox ${
                        t.completed ? "checked" : ""
                      }`}
                      onClick={() => handleCheckTask(t.id)}
                      disabled={t.completed}
                    >
                      {t.completed ? "✓" : ""}
                    </button>
                    <span className="task-title-text">{t.title}</span>
                  </div>
                ))}
              </div>
              <div className="task-footer-input">
                <div className="task-add-group">
                  <input
                    placeholder="Hôm nay bạn cần làm gì?"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    disabled={dailyTasks.length >= 5}
                  />
                  <button
                    onClick={handleAddTask}
                    disabled={dailyTasks.length >= 5 || !newTaskTitle}
                  >
                    Thêm
                  </button>
                </div>
                <p className="task-limit-info">{dailyTasks.length} / 5 task</p>
              </div>
            </div>
          </div>

          <div className="right-column">
            {/* POMODORO CARD */}
            <div className="pomodoro-card">
              <div className="timer-section">
                <div className="timer-circle">
                  <svg width="200" height="200">
                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      stroke="#374151"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      stroke="#38bdf8"
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 90}
                      strokeDashoffset={
                        2 * Math.PI * 90 * (1 - percentage / 100)
                      }
                      strokeLinecap="round"
                      style={{ transition: "stroke-dashoffset 1s linear" }}
                    />
                  </svg>
                  <div className="timer-text">
                    <h2>{formatTime(timeLeft)}</h2>
                    <p>{percentage}%</p>
                  </div>
                </div>
                <div className="controls-section">
                  <div className="input-group">
                    <label>Môn học</label>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                      >
                        <option value="">-- Chọn môn học --</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <button
                        className="subject-btn"
                        onClick={() => setIsSubModalOpen(true)}
                      >
                        Quản lý
                      </button>
                    </div>
                  </div>
                  <div className="input-group">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <label>Thời lượng (phút)</label>
                      <button
                        onClick={() => setIsCustom(!isCustom)}
                        className="toggle-custom-btn"
                      >
                        {isCustom ? "Chọn nhanh" : "Tùy chỉnh"}
                      </button>
                    </div>
                    {isCustom ? (
                      <input
                        type="number"
                        placeholder="Số phút..."
                        onChange={(e) =>
                          setMinutes(Math.max(1, Number(e.target.value)))
                        }
                      />
                    ) : (
                      <select
                        value={minutes}
                        onChange={(e) => setMinutes(Number(e.target.value))}
                      >
                        <option value={15}>15 phút</option>
                        <option value={25}>25 phút</option>
                        <option value={50}>50 phút</option>
                      </select>
                    )}
                  </div>
                  <MilestoneBar />
                  <div className="button-group">
                    <button className="start-btn" onClick={handleStartSession}>
                      Bắt đầu
                    </button>
                    <button
                      className="end-btn"
                      onClick={() =>
                        handleEndSession("Phiên tập trung kết thúc sớm.")
                      }
                    >
                      Kết thúc phiên
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD STORE MỚI */}
            <div className="store-card">
              <div className="task-header">
                <h3>Cửa hàng đổi điểm</h3>
                <p className="task-reward-hint">
                  Dùng Point tích lũy để đổi quà
                </p>
              </div>
              <div className="store-tabs">
                <button
                  className={`store-tab-btn ${
                    activeStoreTab === "THEME" ? "active" : ""
                  }`}
                  onClick={() => setActiveStoreTab("THEME")}
                >
                  Giao diện
                </button>
                <button
                  className={`store-tab-btn ${
                    activeStoreTab === "AVATAR" ? "active" : ""
                  }`}
                  onClick={() => setActiveStoreTab("AVATAR")}
                >
                  Ảnh đại diện
                </button>
              </div>
              <div className="store-grid">
                {storeItems
                  .filter((i) => i.type === activeStoreTab)
                  .map((item) => {
                    const isOwned = ownedItemIds.includes(item.id);
                    return (
                      <div key={item.id} className="store-item">
                        <div className="item-preview">
                          {item.type === "THEME" ? (
                            <div
                              className="color-circle"
                              style={{ background: item.preview }}
                            ></div>
                          ) : (
                            item.preview
                          )}
                        </div>
                        <p className="item-price">
                          {isOwned ? "Đã sở hữu" : `${item.price} Point`}
                        </p>
                        <button
                          className="buy-btn"
                          disabled={isOwned || (user?.point || 0) < item.price}
                          onClick={() => handleBuyItem(item)}
                        >
                          {isOwned ? "Xong" : "Đổi"}
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN & OVERLAYS GIỮ NGUYÊN */}
      {isFocusMode && !isWarning && (
        <div className="fullscreen-timer">
          <div className="timer-display" style={{ textAlign: "center" }}>
            <h1>{formatTime(timeLeft)}</h1>
            <div className="focus-info">
              <span>{percentage}%</span>
              <span style={{ opacity: 0.3 }}>|</span>
              <span>
                Đang tập trung:{" "}
                {subjects.find((s) => s.id == selectedSubject)?.name}
              </span>
            </div>
            <div style={{ width: "350px", margin: "40px auto 0" }}>
              <MilestoneBar />
            </div>
          </div>
          <button
            className="abort-session-btn"
            onClick={() => handleEndSession("Phiên bị hủy bởi người dùng.")}
          >
            Kết thúc phiên ngay (hạn chế 🥺)
          </button>
        </div>
      )}

      {isWarning && (
        <div className="cheat-warning-overlay">
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: "4rem" }}>CẢNH BÁO!</h1>
            <p style={{ fontSize: "1.5rem", margin: "20px 0" }}>
              Vui lòng quay lại tab hoặc chế độ toàn màn hình ngay.
            </p>
            <h2 style={{ fontSize: "6rem", color: "#f87171" }}>
              {warningCount}
            </h2>
            <button
              className="main-auth-btn"
              style={{ width: "260px", marginTop: "40px" }}
              onClick={handleReturn}
            >
              Quay lại ngay
            </button>
          </div>
        </div>
      )}

      {showStartDialog && (
        <Dialog
          title="Thông báo"
          message={
            "Đang trong phiên tập trung. \nĐừng rời tab hoặc thoát fullscreen. Nếu thoát ra ngoài, phiên sẽ bị huỷ."
          }
          onClose={() => {
            setShowStartDialog(false);
            setIsFocusMode(true);
            setIsActive(true);
            document.documentElement.requestFullscreen().catch(() => {});
          }}
        />
      )}
      {message && (
        <Dialog
          title="Thông báo"
          message={message}
          onClose={() => setMessage(null)}
        />
      )}
      {isSubModalOpen && (
        <SubjectManagerModal
          onClose={() => setIsSubModalOpen(false)}
          onRefresh={fetchDashboardData}
        />
      )}
    </div>
  );
}
