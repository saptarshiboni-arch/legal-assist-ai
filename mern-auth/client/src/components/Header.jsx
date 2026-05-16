import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";

const Header = () => {
  const navigate = useNavigate();
  const { userData } = useContext(AppContext);

  const handleGetStarted = () => {
    navigate("/legal-tech");
  };

  return (
    <div className="flex flex-col items-center justify-center text-center mb-20 px-4 text-gray-800">
      <div className="mb-6 transform hover:scale-105 transition-transform duration-300">
        <img
          src={assets.legal_logo}
          alt="Legal Tech Logo"
          className="w-36 h-36 rounded-full mb-6 shadow-2xl shadow-blue-500/40 border-4 border-white object-cover"
        />
      </div>
      <h1 className="flex items-center gap-2 text-xl sm:text-3xl font-medium mb-2 text-white">
        Hello {userData?.name || userData?.username || "Guest"}!
        <img src={assets.logo_icon} className="w-8 aspect-square" alt="" />
      </h1>
      <h2 className="text-2xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
        Welcome to LegalAssist-AI
      </h2>
      <p className="mb-8 max-w-md text-gray-200 leading-relaxed">
        Your contracts are safe and your privacy is our primary concern. Start
        analyzing legal documents with AI-powered insights.
      </p>
      <button
        onClick={handleGetStarted}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-4 rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-blue-500/50 transform hover:scale-105 active:scale-95">
        <i className="fas fa-rocket mr-2"></i>
        Get Started with LegalAssist-AI
      </button>
    </div>
  );
};

export default Header;
