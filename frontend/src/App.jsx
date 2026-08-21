import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import ChatHistoryPage from "./components/ChatHistoryPage";
import LoadingUserPage from "./components/LoadingUserPage";
import Login from "./components/Login";
import Signup from "./components/Signup";
import { getMe } from "./services/api";

import LandingPage from "./pages/LandingPage";
import Home from "./pages/Home";
import PDFPage from "./pages/PDFPage";
import ImagePage from "./pages/ImagePage";
import WebsitePage from "./pages/WebsitePage";
import ChatPage from "./pages/ChatPage";
import ProfileSettings from "./pages/ProfileSettings";

function App() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        setIsLoggedIn(false);
        setLoadingUser(false);
        return;
      }

      try {
        const currentUser = await getMe();
        setUser({ ...currentUser, _id: currentUser.id });
        setIsLoggedIn(true);
      } catch {
        localStorage.removeItem("token");
        setUser(null);
        setIsLoggedIn(false);
      } finally {
        setLoadingUser(false);
      }
    };

    loadUser();
  }, []);

  if (loadingUser)
    return (
      <LoadingUserPage setUser={setUser} setIsLoggedIn={setIsLoggedIn} />
    );

  return (
    <div className="App">
      <Navbar
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        user={user}
        setUser={setUser}
      />

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/user-loading"
          element={<LoadingUserPage setUser={setUser} setIsLoggedIn={setIsLoggedIn} />}
        />
        <Route
          path="/login"
          element={
            <Login
              onLoginSuccess={(userData) => {
                setUser(userData);
                setIsLoggedIn(true);
              }}
            />
          }
        />
        <Route
          path="/signup"
          element={
            <Signup
              onSignupSuccess={(userData) => {
                setUser(userData);
                setIsLoggedIn(true);
              }}
            />
          }
        />

        {/* Protected routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <Home user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pdf"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <PDFPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/image"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <ImagePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/website"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <WebsitePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <ProfileSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat-history/:chatId"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <ChatHistoryPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
