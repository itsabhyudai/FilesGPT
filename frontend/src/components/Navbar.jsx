import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../assets/logo.png";

const Navbar = ({ isLoggedIn, setIsLoggedIn, user, setUser }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUser(null);
    setShowDropdown(false);
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-20 bg-transparent flex justify-between items-center px-4 md:px-8 py-3">
      {/* Logo */}
      <div className="flex items-center">
        <img
          src={Logo}
          alt="FilesGPT"
          className="w-28 md:w-36 cursor-pointer"
          onClick={() => navigate("/")}
        />
      </div>

      {/* Right side items */}
      <div className="flex items-center space-x-4 md:space-x-6">
        {!isLoggedIn ? (
          <button
            onClick={() => navigate("/login")}
            className="bg-gradient-to-r from-purple-800 via-blue-900 to-sky-500 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2 rounded-2xl shadow-md transition text-sm md:text-base cursor-pointer"
          >
            Login / Sign Up
          </button>
        ) : (
          <div className="flex items-center space-x-4 md:space-x-6 relative">
            <Link
              to="/home"
              className="text-white font-medium text-sm md:text-base relative transition duration-300 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-blue-500 after:transition-all after:duration-300 hover:after:w-full cursor-pointer"
            >
              Dashboard
            </Link>

            {/* Avatar & Dropdown */}
            <div className="relative">
              <div
                className="w-8 md:w-10 h-8 md:h-10 rounded-full bg-white text-blue-600 flex items-center justify-center cursor-pointer font-semibold border border-blue-500 hover:bg-blue-600 hover:text-white transition-all duration-200 shadow-sm hover:shadow-md"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Profile"
                    className="w-8 md:w-10 h-8 md:h-10 rounded-full object-cover border border-blue-500"
                  />
                ) : (
                  <span className="text-sm md:text-base">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {showDropdown && (
                <div className="absolute right-0 mt-3 w-40 md:w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  <span
                    onClick={() => {
                      navigate("/profile");
                      setShowDropdown(false);
                    }}
                    className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer rounded-md"
                  >
                    Profile Settings
                  </span>
                  <span
                    onClick={handleLogout}
                    className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer rounded-md"
                  >
                    Sign Out
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
