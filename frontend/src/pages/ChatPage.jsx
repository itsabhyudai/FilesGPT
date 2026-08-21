import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ChatMessage from "../components/ChatMessage";
import Prism from '../Prism';
import { queryDocument, saveChat } from "../services/api";

export default function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const pdfName = location.state?.pdfName || "your PDF";
  const documentId = location.state?.documentId;

  const [messages, setMessages] = useState([
    { sender: "bot", text: `Ask your query related to "${pdfName}".` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const [chatHistory, setChatHistory] = useState([]);


  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const response = await queryDocument({
        question: userMessage,
        chatHistory,
        documentId,
      });

      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: response.answer },
      ]);
      setChatHistory(response.chat_history);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Error: " + (error?.response?.data?.detail || error.message),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Save chat to DB with PDF metadata
  const saveAndGoHome = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await saveChat({ pdfName, documentId, messages });
    } catch (error) {
      console.error("Failed to save chat:", error);
    } finally {
      navigate("/home");
    }
  };

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
      <div className="flex flex-col h-screen p-6 pt-[100px]">
        {/* Chat Box */}
        <div className="flex-1 bg-black/75 rounded-xl shadow flex flex-col p-4 overflow-y-auto max-h-[70vh]">
          {messages.map((m, idx) => (
            <ChatMessage key={idx} sender={m.sender} text={m.text} />
          ))}
          <div ref={chatEndRef}></div>
        </div>

        {/* Input Area */}
        <div className="mt-4 flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-black/75 text-white"
            placeholder="Ask something..."
            rows={2}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            className={`cursor-pointer px-6 py-2 rounded-xl text-white transition ${loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-500 hover:bg-indigo-600"
              }`}
            disabled={loading}
          >
            {loading ? "Thinking..." : "Send"}
          </button>
        </div>

        {/* Go Home Button */}
        <button
          onClick={saveAndGoHome}
          className="mt-4 w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 transition cursor-pointer"
        >
          Save and Go to Home Page
        </button>
      </div>
    </div>
  );
}
