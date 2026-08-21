export default function ChatMessage({ sender, text }) {
  return (
    <div
      className={`p-3 rounded-2xl max-w-[70%] shadow-sm text-sm whitespace-pre-line my-2 ${
        sender === "user"
          ? "bg-blue-500 text-white ml-auto"
          : "bg-gray-200 text-gray-900"
      }`}
    >
      {text}
    </div>
  );
}
