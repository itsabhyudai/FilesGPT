import React, { useState } from "react";
import { login, getMe } from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import Prism from "../Prism";

const Login = ({ onLoginSuccess = () => {} }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);

      // Go to loading page to fetch user data
      navigate("/user-loading");

      const userData = await getMe();
      onLoginSuccess(userData);
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10 bg-black">
        <Prism
          animationType="rotate"
          timeScale={0.5}
          height={3.5}
          baseWidth={5.5}
          scale={4}
          hueShift={0}
          colorFrequency={1}
          noise={0}
          glow={1}
        />
      </div>

      {/* Login Form */}
      <div className="flex items-center justify-center h-screen p-6 bg-black/20">
        <div className="bg-black/40 w-full max-w-md rounded-xl shadow-lg p-6 relative backdrop-blur-sm border border-gray-700">
          <button
            onClick={() => navigate("/")}
            className="absolute top-3 right-3 text-white hover:text-gray-400 text-2xl"
          >
            ✕
          </button>

          <h2 className="text-2xl font-bold mb-2 text-sky-500">Sign In</h2>
          <p className="text-gray-300 mb-4">
            Welcome back! Please sign in to your account.
          </p>

          {error && (
            <p className="text-red-400 text-sm mb-3 text-center">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="px-4 py-2 rounded-lg bg-black/60 text-white border border-gray-600 focus:border-sky-500 outline-none"
            />
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="px-4 py-2 rounded-lg bg-black/60 text-white border border-gray-600 focus:border-sky-500 outline-none"
            />

            <button
              type="submit"
              className="w-full bg-sky-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition cursor-pointer"
            >
              Sign In
            </button>
          </form>

          <p className="text-sm text-center mt-4 text-gray-300">
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="text-sky-400 hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
