import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Home from "./pages/app/Home";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthLayout from "./layouts/AuthLayout";
import AppLayout from "./layouts/AppLayout";

export default function App() {
  return (
    <Routes>
      {}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {}
        <Route path="/homepage" element={<Home />} />
      </Route>

      {}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}