import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000",
});

// Every authenticated request carries the JWT from localStorage.
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const form = (fields) => {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) data.append(key, value);
  });
  return data;
};

// ---------- Auth ----------

export const signup = (formData) =>
  API.post("/auth/signup", formData).then((r) => r.data);

export const login = async (email, password) => {
  const body = new URLSearchParams({ username: email, password });
  const { data } = await API.post("/auth/login", body);
  localStorage.setItem("token", data.access_token);
  return data;
};

export const getMe = () => API.get("/auth/me").then((r) => r.data);

export const updateProfile = (formData) =>
  API.put("/auth/me", formData).then((r) => r.data);

export const deleteAccount = async () => {
  await API.delete("/auth/me");
  localStorage.removeItem("token");
};

// ---------- Documents ----------

export const uploadPDF = (file, url) =>
  API.post("/documents/pdf", form({ file, url })).then((r) => r.data);

export const uploadImage = (file) =>
  API.post("/documents/image", form({ file })).then((r) => r.data);

export const uploadWebsite = (url) =>
  API.post("/documents/website", form({ url })).then((r) => r.data);

// ---------- Chats ----------

export const queryDocument = ({ question, documentId, chatHistory = [] }) =>
  API.post("/chats/query", {
    question,
    document_id: documentId,
    chat_history: chatHistory,
  }).then((r) => r.data);

export const fetchChats = () => API.get("/chats").then((r) => r.data);

export const fetchChat = (chatId) => API.get(`/chats/${chatId}`).then((r) => r.data);

export const saveChat = ({ pdfName, documentId, messages }) =>
  API.post("/chats", {
    pdf_name: pdfName,
    document_id: documentId,
    messages,
  }).then((r) => r.data);

export const deleteChat = (chatId) => API.delete(`/chats/${chatId}`);

export default API;
