import { FileText } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Prism from "../Prism";
import { uploadPDF } from "../services/api";

export default function PDFPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const [documentId, setDocumentId] = useState(null);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleSubmit = async () => {
    if (!file) return alert("Please select a PDF first.");

    setLoading(true);
    setMessage("Model is processing your PDF...");

    try {
      const response = await uploadPDF(file);

      setLoading(false);
      setMessage("PDF processed successfully!");
      setDocumentId(response.document_id);
      setDone(true);
    } catch (error) {
      setLoading(false);
      setMessage("Error processing PDF: " + (error?.response?.data?.detail || error.message));
    }
  };

  const handleChatNow = () => {
    if (!file || !documentId) {
      alert("PDF not processed yet!");
      return;
    }
    navigate("/chat", { state: { pdfName: file.name, documentId } });
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
            Upload or Link a PDF
          </h2>

          {/* Upload PDF */}
          <label className="w-full flex items-center justify-center bg-sky-600 text-white py-2 rounded-lg mb-4 hover:bg-blue-600 cursor-pointer transition">
            <FileText className="w-4 h-4 mr-2" />
            <span>{file ? file.name : "Upload PDF"}</span>
            <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
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
            className="w-full mt-2 text-white border border-sky-600 px-4 py-2 rounded-lg hover:bg-sky-700 transition cursor-pointer"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
