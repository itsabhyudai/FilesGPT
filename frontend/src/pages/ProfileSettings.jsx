import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Prism from "../Prism";
import { deleteAccount, getMe, updateProfile } from "../services/api";

export default function ProfileSettings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    avatar: "",
    password: "",
    avatar_file: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getMe();
        setProfile({
          name: data.name,
          email: data.email,
          avatar: data.avatar_url || "",
          password: "",
          avatar_file: null,
        });
      } catch (err) {
        console.error(err);
        alert("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfile((prev) => ({ ...prev, avatar_file: file, avatar: URL.createObjectURL(file) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", profile.name);
      if (profile.password) formData.append("password", profile.password);
      if (profile.avatar_file) formData.append("new_avatar", profile.avatar_file);

      await updateProfile(formData);
      alert("Profile updated successfully!");
      setProfile((prev) => ({ ...prev, password: "" }));
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure? This will delete your account and all data permanently.")) return;

    try {
      await deleteAccount();

      // Clear local storage
      localStorage.removeItem("token");

      // Notify user
      alert("Account deleted successfully!");

      // Redirect to landing page ("/")
      navigate("/");

      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to delete account.");
    }
  };


  if (loading) return <div>Loading...</div>;

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-black">
        <Prism
          animationType="rotate"
          timeScale={0.5}
          height={3.5}
          baseWidth={5.5}
          scale={4.5}
          hueShift={0}
          colorFrequency={1}
          noise={0}
          glow={1}
        />
      </div>
      <div className="flex justify-center items-center min-h-screen">
        <div className="relative bg-black/40 shadow-lg rounded-2xl p-8 w-full max-w-md">
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 right-4 text-white hover:text-gray-400 text-2xl transition"
          >
            ✕
          </button>

          <h2 className="text-2xl font-semibold text-sky-500 mb-6 text-center">
            Profile Settings
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full mb-2"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white border-3 border-blue-500 font-semibold flex items-center justify-center text-blue-600 text-xl mb-2">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}

              <label className="mt-2 flex items-center px-4 py-2 bg-gradient-to-r from-purple-800 via-blue-900 to-sky-500 rounded-lg cursor-pointer shadow-sm hover:from-indigo-500 hover:to-purple-500 hover:shadow-md transition">
                <span className="text-white mr-2">Choose Profile</span>
                <span className="border-l border-gray-400 h-5 mx-2"></span>
                <span className="text-gray-300">
                  {profile.avatar_file ? profile.avatar_file.name : "No file chosen"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>



            {/* Name */}
            <div>
              <label className="block text-white text-sm mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg bg-black/60 text-white border border-gray-600 focus:border-sky-500 outline-none"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-white text-sm mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-black/60 border-gray-600 text-gray-500 cursor-not-allowed"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-white text-sm mb-1">New Password</label>
              <input
                type="password"
                name="password"
                value={profile.password}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg bg-black/60 text-white border border-gray-600 focus:border-sky-500 outline-none"
                placeholder="Enter new password"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-center mt-6">
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-black/60 text-blue-500 rounded-lg hover:text-white hover:bg-blue-700 border-2 border-blue-700 cursor-pointer"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-black/60 text-red-500 rounded-lg hover:bg-red-700 border-2 hover:text-white border-red-700 cursor-pointer"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
