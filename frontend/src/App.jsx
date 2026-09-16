import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Watch from "./pages/Watch";
import Channel from "./pages/Channel";
import Search from "./pages/Search";
import Shorts from "./pages/Shorts";
import Saved from "./pages/Saved";
import LiveBackground from "./components/LiveBackground";
const secure = (C) => (
  <ProtectedRoute>
    <C />
  </ProtectedRoute>
);
export default function App() {
  return (
    <>
      <LiveBackground />
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/dashboard" element={secure(Dashboard)} />
        <Route path="/shorts" element={secure(Shorts)} />
        <Route path="/search" element={secure(Search)} />
        <Route path="/upload" element={secure(Upload)} />
        <Route path="/history" element={secure(History)} />
        <Route path="/saved" element={secure(Saved)} />
        <Route path="/profile" element={secure(Profile)} />
        <Route path="/watch/:id" element={secure(Watch)} />
        <Route path="/channel/:username" element={secure(Channel)} />
        {/* <Route
          path="/"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        /> */}
      </Routes>
    </>
  );
}
