import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import { assets } from "../assets/assets";
import { AppContext } from "../context/AppContext";

const Home = () => {
  const navigate = useNavigate();
  const { isLoggedin } = useContext(AppContext);

  // Removed auto-redirect to allow landing page to show first
  /*
  useEffect(() => {
    if (isLoggedin) {
      navigate("/legal-tech");
    }
  }, [isLoggedin, navigate]);
  */

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-cover bg-center px-6 sm:px-24"
      style={{ backgroundImage: `url(${assets.backgroundImage})` }}>
      <Navbar />
      <Header />
    </div>
  );
};

export default Home;
