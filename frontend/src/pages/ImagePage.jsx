import { Image, FileText } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Prism from "../Prism";
import { uploadImage } from "../services/api";

export default function ImagePage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const [documentId, setDocumentId] = useState(null);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleSubmit = async () => {
    if (!file) return alert("Please select an image or PDF first.");

    setLoading(true);
    setMessage("Model is processing your image file...");

    try {
      const response = await uploadImage(file);

      setLoading(false);
      setMessage("Image file processed successfully!");
      setDocumentId(response.document_id);
      setDone(true);
    } catch (error) {
      setLoading(false);
      setMessage("Error processing file: " + (error?.response?.data?.detail || error.message));
    }
  };

  const handleChatNow = () => {
    if (!file || !documentId) {
      alert("File not processed yet!");
      return;
    }
    navigate("/chat", { state: { pdfName: file.name, documentId } });
  };

  const goHome = () => navigate("/home");

  // Determine icon based on file type
  const fileIcon = file?.name?.endsWith(".pdf")
    ? <FileText className="w-4 h-4 mr-2" />
    : <Image className="w-4 h-4 mr-2" />;

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
            Upload Image or Image PDF
          </h2>

          {/* Upload File */}
          <label className="w-full flex items-center justify-center bg-pink-500 text-white py-2 rounded-lg mb-4 hover:bg-pink-600 cursor-pointer transition">
            {fileIcon}
            <span>{file ? file.name : "Upload Image or PDF"}</span>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {/* Submit */}
          {!done && (
            <button
              onClick={handleSubmit}
              className="w-full flex items-center justify-center bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition cursor-pointer"
              disabled={loading}
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
            className="w-full mt-2 text-white border border-pink-500 px-4 py-2 rounded-lg hover:bg-pink-700 transition cursor-pointer"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
