import api from "../lib/api";

const likes = "/likes";

export const likeService = {
  toggleLike: (videoId) => api.post(`${likes}/${videoId}`),
};
