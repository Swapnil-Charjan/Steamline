import api from "../lib/api";

const videos = "/videos";

export const videoService = {
  mine: (params) => api.get(`${videos}/my-videos`, { params }),
  upload: (data) => api.post(`${videos}/uploadVideo`, data),
  details: (id) => api.get(`${videos}/getVideoDetails/${id}`),
  channel: (userId, params) =>
    api.get(`${videos}/channel/${userId}/videos`, { params }),
  shorts: () => api.get(`${videos}/shorts`),
};
