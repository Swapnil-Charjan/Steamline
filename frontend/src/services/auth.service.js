import api from "../lib/api";
const auth = "/auth";
export const authService = {
  register: (form) => api.post(`${auth}/register`, form),
  login: (credentials) => api.post(`${auth}/login`, credentials),
  logout: () => api.post(`${auth}/logout`),
  currentUser: () => api.get(`${auth}/current-user`, { skipToast: true }),
  changePassword: (data) => api.post(`${auth}/change-password`, data),
};
