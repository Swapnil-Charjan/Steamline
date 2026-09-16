import api from "../lib/api";

const users = "/users";

export const userService = {
  updateAccount: (data) => api.patch(`${users}/update-account`, data),
  updateAvatar: (data) => api.patch(`${users}/update-avatar`, data),
  updateCover: (data) => api.patch(`${users}/update-cover-image`, data),
  history: (params) => api.get(`${users}/watchHistory`, { params }),
  savedVideos: () => api.get(`${users}/saved-videos`),
  toggleSaveVideo: (videoId) => api.post(`${users}/save-video/${videoId}`),
  channelProfile: (username) => api.get(`${users}/c/${username}`),
  search: (query, params = {}) =>
    api.get(`search/search`, { params: { q: query, ...params } }),
};
