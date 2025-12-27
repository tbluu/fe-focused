import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../index.css";

export default function AppLayout() {
  return (
    <div className="app-layout">
      {}
      <Navbar />
      
      {}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}