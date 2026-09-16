import api from "../lib/api";

const comments = "/comments";

export const commentService = {
  getComments: (videoId) => api.get(`${comments}/${videoId}`),
  addComment: (videoId, content) =>
    api.post(`${comments}/${videoId}`, { content }),
  replyToComment: (videoId, commentId, content) =>
    api.post(`${comments}/${videoId}/${commentId}/reply`, { content }),
  updateComment: (videoId, commentId, content) =>
    api.patch(`${comments}/${videoId}/${commentId}`, { content }),
  deleteComment: (videoId, commentId) =>
    api.delete(`${comments}/${videoId}/${commentId}`),
};
