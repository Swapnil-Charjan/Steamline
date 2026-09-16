import api from "../lib/api";

const subscriptions = "/subscriptions";

export const subscribeService = {
  subscribe: (channelId) => api.post(`${subscriptions}/subscribe/${channelId}`),
  unsubscribe: (channelId) =>
    api.post(`${subscriptions}/unsubscribe/${channelId}`),
};
