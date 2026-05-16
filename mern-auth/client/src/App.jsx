import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import EmailVerify from "./pages/EmailVerify";
import ResetPassword from "./pages/ResetPassword";
import LegalTech from "./pages/LegalTech";
import FloatingChatbot from "./components/FloatingChatbot";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const location = useLocation();

  // Only show floating chatbot on the legal-tech page
  const showChatbot = location.pathname === "/legal-tech";

  return (
    <div>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/email-verify" element={<EmailVerify />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/legal-tech" element={<LegalTech />} />
      </Routes>
      {showChatbot && <FloatingChatbot />}
    </div>
  );
};

export default App;
