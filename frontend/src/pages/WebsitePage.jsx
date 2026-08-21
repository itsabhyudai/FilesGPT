import { Link } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Prism from "../Prism";
import { uploadWebsite } from "../services/api";

export default function WebsitePage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const [documentId, setDocumentId] = useState(null);

  const handleSubmit = async () => {
    if (!url.trim()) {
      alert("Please enter a website URL.");
      return;
    }

    setLoading(true);
    setMessage("Model is processing your url...");
    setDone(false);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Session expired or not authenticated. Please log in again.");
        navigate("/login");
        return;
      }

      const response = await uploadWebsite(url);

      setLoading(false);
      setMessage("URL processed successfully!");
      setDocumentId(response.document_id);
      setDone(true);
    } catch (error) {
      setLoading(false);
      setMessage("Error processing website: " + (error?.response?.data?.detail || error.message));
    }
  };

  const handleChatNow = () => {
    if (!url || !documentId) {
      alert("Website not processed yet!");
      return;
    }
    navigate("/chat", { state: { pdfName: url, documentId } });
  };

  const goHome = () => navigate("/home");

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background Animation */}
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

      <div className="flex items-center justify-center h-screen p-6">
        <div className="bg-black/50 rounded-3xl shadow p-6 w-full max-w-md flex flex-col gap-4">
          <h2 className="font-bold mb-4 text-center text-lg text-white">
            Upload or Link a Website
          </h2>

          {/* URL Input Field */}
          <input
            type="text"
            placeholder="Enter website URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-black/30 text-white placeholder-gray-400 border border-sky-600 focus:border-green-500 outline-none transition"
          />

          {/* Submit Button */}
          {!done && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full flex items-center justify-center bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition cursor-pointer"
            >
              {loading ? "Processing..." : "Submit"}
            </button>
          )}

          {/* Status Message */}
          {message && (
            <div className="bg-gray-100 p-3 rounded-lg text-center text-gray-700">
              {message}
            </div>
          )}

          {/* Chat Now Button */}
          {done && (
            <button
              onClick={handleChatNow}
              className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition cursor-pointer"
            >
              Chat Now
            </button>
          )}

          {/* Back Button */}
          <button
            onClick={goHome}
            className="w-full mt-2 text-white border border-sky-600 px-4 py-2 rounded-lg hover:bg-sky-700 transition cursor-pointer"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
