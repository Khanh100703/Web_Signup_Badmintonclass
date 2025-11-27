// src/App.jsx
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import AuthProvider from "./contexts/AuthProvider.jsx";
import { NotificationProvider } from "./contexts/NotificationContext.jsx";
import RequireAuth from "./components/RequireAuth.jsx";

import Home from "./pages/Home.jsx";
import Classes from "./pages/Classes.jsx";
import ClassDetail from "./pages/ClassDetail.jsx";
import MySchedule from "./pages/MySchedule.jsx";
import Login from "./pages/Login.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Coaches from "./pages/Coaches.jsx";
import Contact from "./pages/Contact.jsx";
import VerifyRegister from "./pages/VerifyRegister.jsx";
import CoachClasses from "./pages/CoachClasses.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import ChangePasswordPage from "./pages/ChangePasswordPage.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import PaymentHistoryPage from "./pages/PaymentHistoryPage.jsx";

function AppShell() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col bg-slate-950/5">
      {!isAdminRoute && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/classes/:id" element={<ClassDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/coaches" element={<Coaches />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify" element={<VerifyRegister />} />

          <Route
            path="/me/schedule"
            element={
              <RequireAuth>
                <MySchedule />
              </RequireAuth>
            }
          />

          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />

          <Route
            path="/change-password"
            element={
              <RequireAuth>
                <ChangePasswordPage />
              </RequireAuth>
            }
          />

          <Route
            path="/payments/:enrollmentId"
            element={
              <RequireAuth>
                <PaymentPage />
              </RequireAuth>
            }
          />

          <Route
            path="/coach/classes"
            element={
              <RequireAuth roles={["COACH", "ADMIN"]}>
                <CoachClasses />
              </RequireAuth>
            }
          />

          {/* CHỈ MỘT route /admin, yêu cầu role ADMIN */}
          <Route
            path="/admin"
            element={
              <RequireAuth roles={["ADMIN"]}>
                <AdminDashboard />
              </RequireAuth>
            }
          />

          <Route
            path="/payment-history"
            element={
              <RequireAuth>
                <PaymentHistoryPage />
              </RequireAuth>
            }
          />

          {/* fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}
