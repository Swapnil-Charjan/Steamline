import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      "Something went wrong. Please try again.";
    if (error.response?.status === 401) localStorage.removeItem("accessToken");
    if (!error.config?.skipToast) toast.error(message);
    return Promise.reject(Object.assign(error, { friendlyMessage: message }));
  },
);

export default api;
