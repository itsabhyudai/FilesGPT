import React, { useState } from "react";
import { signup, login, getMe } from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import Prism from "../Prism";

const Signup = ({ onSignupSuccess = () => { } }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      if (avatar) formData.append("avatar", avatar);

      await signup(formData);

      // Auto login after successful signup
      await login(email, password);

      navigate("/user-loading");

      const userData = await getMe();
      onSignupSuccess(userData);
    } catch (err) {
      setError(err.response?.data?.detail || "Signup failed");
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

      {/* Signup Form */}
      <div className="flex items-center justify-center h-screen p-6 bg-black/20">
        <div className="bg-black/40 w-full max-w-md rounded-xl shadow-lg p-6 relative backdrop-blur-sm border border-gray-700">
          <button
            onClick={() => navigate("/")}
            className="absolute top-3 right-3 text-white hover:text-gray-400 text-2xl"
          >
            ✕
          </button>

          <h2 className="text-2xl font-bold mb-2 text-sky-500">Create Account</h2>
          <p className="text-gray-300 mb-4">
            Join us today — it’s quick and easy!
          </p>

          {error && (
            <p className="text-red-400 text-sm mb-3 text-center">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Full Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-4 py-2 rounded-lg bg-black/60 text-white border border-gray-600 focus:border-sky-500 outline-none"
            />

            <input
              type="email"
              placeholder="Email Address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-2 rounded-lg bg-black/60 text-white border border-gray-600 focus:border-sky-500 outline-none"
            />

            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-2 rounded-lg bg-black/60 text-white border border-gray-600 focus:border-sky-500 outline-none"
            />

            <div className="flex flex-col gap-1">
              <label className="text-gray-300 text-sm">Profile Picture (optional)</label>

              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatar(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="px-4 py-2 bg-black/50 text-gray-400 border border-gray-600 rounded-lg flex items-center justify-between cursor-pointer hover:border-sky-500 transition">
                  <span className="truncate">
                    {avatar ? avatar.name : "Choose a file..."}
                  </span>
                  <span className="text-gray-400 text-sm">Browse</span>
                </div>
              </div>
            </div>


            <button
              type="submit"
              className="w-full bg-sky-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition cursor-pointer"
            >
              Create Account
            </button>
          </form>

          <p className="text-sm text-center mt-4 text-gray-300">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-sky-400 hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
