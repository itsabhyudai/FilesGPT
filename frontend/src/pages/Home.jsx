import { FileText, Image, Link, MoreHorizontal, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Prism from "../Prism";
import { deleteChat, fetchChats } from "../services/api";

export default function Home({ user }) {
  const navigate = useNavigate();
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);

  // Fetch chat history
  useEffect(() => {
    if (!user) return;
    const fetchChatHistory = async () => {
      try {
        const response = await fetchChats();
        setChatHistory(response);
      } catch (err) {
        console.error("Error fetching chat history:", err);
        setError("Failed to fetch chat history");
      } finally {
        setLoading(false);
      }
    };
    fetchChatHistory();
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = () => setOpenMenu(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Delete chat
  const handleDeleteChat = async (chatId) => {
    if (!window.confirm("Delete this chat permanently?")) return;

    try {
      await deleteChat(chatId);
      setChatHistory((prev) => prev.filter((c) => c.id !== chatId));
      setOpenMenu(null);
      alert("Chat deleted successfully!");
    } catch (err) {
      console.error("Delete error:", err.response || err);
      alert("Failed to delete chat. Check console for details.");
    }
  };

  return (
    <div className="h-screen pt-[100px] px-6 pb-6 relative">
      {/* Background */}
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

      <div className="flex h-full gap-6">
        {/* Sidebar */}
        <div className="w-1/4 bg-black/50 rounded-3xl shadow flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-gray-500 sticky top-0 text-blue-500 z-10 text-center">
            <h2 className="font-bold text-lg">Chat History</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            {loading ? (
              <p className="text-gray-500 text-sm">Loading chat history...</p>
            ) : error ? (
              <p className="text-red-500 text-sm">{error}</p>
            ) : chatHistory.length === 0 ? (
              <p className="text-gray-500 text-sm">No previous chats</p>
            ) : (
              chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  className="relative group bg-black/50 p-3 rounded-lg border hover:border-x-purple-500 hover:border-y-blue-500 transition"
                >
                  {/* Chat Entry */}
                  <div
                    onClick={() => navigate(`/chat-history/${chat.id}`)}
                    className="cursor-pointer flex flex-col pr-6"
                  >
                    <p className="font-medium text-white truncate">
                      {chat.pdf_name || "Untitled Chat"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {chat.created_at
                        ? new Date(chat.created_at).toLocaleString()
                        : "Unknown date"}
                    </p>
                  </div>

                  {/* 3-dot menu */}
                  <div className="absolute top-2 right-2 z-50">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenu(openMenu === chat.id ? null : chat.id);
                      }}
                      className="text-gray-400 hover:text-white transition cursor-pointer"
                    >
                      <MoreHorizontal size={16} />
                    </button>

                    {openMenu === chat.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 mt-2 w-28 bg-gray-900 text-white rounded-md shadow-lg origin-top-right animate-dropdown"
                      >
                        <button
                          onClick={() => handleDeleteChat(chat.id)}
                          className="flex items-center w-full px-3 py-2 text-sm hover:bg-red-600 rounded-md cursor-pointer"
                        >
                          <Trash2 size={14} className="mr-2" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Section */}
        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            <div
              onClick={() => navigate("/pdf")}
              className="cursor-pointer bg-black/50 rounded-3xl shadow p-6 flex flex-col items-center justify-center hover:shadow-lg transition"
            >
              <FileText className="w-10 h-10 mb-4 text-indigo-600" />
              <h2 className="font-semibold text-white">Ask about PDFs</h2>
            </div>

            <div
              onClick={() => navigate("/image")}
              className="cursor-pointer bg-black/50 rounded-3xl shadow p-6 flex flex-col items-center justify-center hover:shadow-lg transition"
            >
              <Image className="w-10 h-10 mb-4 text-pink-600" />
              <h2 className="font-semibold text-white">Ask about Images</h2>
            </div>

            <div
              onClick={() => navigate("/website")}
              className="cursor-pointer bg-black/50 rounded-3xl shadow p-6 flex flex-col items-center justify-center hover:shadow-lg transition"
            >
              <Link className="w-10 h-10 mb-4 text-green-600" />
              <h2 className="font-semibold text-white">Ask about Websites</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Tailwind animation */}
      <style>
        {`
          @keyframes dropdown {
            0% { opacity: 0; transform: translateY(-5px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-dropdown {
            animation: dropdown 0.15s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
}
