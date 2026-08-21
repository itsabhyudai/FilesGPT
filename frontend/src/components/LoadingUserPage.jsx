import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMe } from "../services/api";

export default function LoadingUserPage({ setUser, setIsLoggedIn }) {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoggedIn(false);
        navigate("/"); // go to landing page if no token
        return;
      }

      try {
        const u = await getMe();
        setUser({ ...u, _id: u.id });
        setIsLoggedIn(true);
        navigate("/home"); // go to home only when user is ready
      } catch (err) {
        console.error("[ERROR] Fetching user:", err);
        localStorage.removeItem("token");
        setUser(null);
        setIsLoggedIn(false);
        navigate("/");
      }
    };

    fetchUser();
  }, [setUser, setIsLoggedIn, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200 p-6 text-center relative">
      <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
