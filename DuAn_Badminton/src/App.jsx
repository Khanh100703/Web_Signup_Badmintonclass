import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthProvider from "./contexts/AuthProvider.jsx";
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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-white">
          <Navbar />
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
